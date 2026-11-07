import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CardDisplay } from './components/CardDisplay';
import { CarouselItem, GeneratedCarousel, ImageConfig, ImageStyleId, AspectRatioType } from './types';
import { generateCarouselImage, parseRawList, getSenha, setSenha, limparSenha, ErroServidor, prepararReferencia } from './services/geminiService';
import { STYLES, AI_INSTRUCTION_MODEL } from './constants';
import { criarZip, dataUrlParaBytes, extensaoDoMime } from './services/zip';
import { salvarLote, carregarLote } from './services/armazenamento';
import { PRECO_USD, textoCusto, custoDeItens } from './services/custo';

// Paralelismo: começa em 4 e cai pela metade quando o Google limita o uso.
const PARALELO_INICIAL = 4;
const PAUSA_LIMITE_MS = 20_000;
const CHAVE_CONFIG = 'config-lote';
const CHAVE_TEMA = 'tema';

const proporcoes: { id: AspectRatioType; label: string; w: number; h: number }[] = [
  { id: '4:5', label: 'Retrato 4:5 (feed)', w: 4, h: 5 },
  { id: '1:1', label: 'Quadrado 1:1', w: 1, h: 1 },
  { id: '9:16', label: 'Stories 9:16', w: 9, h: 16 },
  { id: '16:9', label: 'Paisagem 16:9', w: 16, h: 9 },
];

const qualidades: { id: ImageConfig['resolution']; label: string; descricao: string }[] = [
  { id: 'Flash', label: 'Rápida', descricao: 'US$ 0.04 por imagem' },
  { id: '1K', label: 'Pro 1K', descricao: 'US$ 0.13 por imagem' },
  { id: '2K', label: 'Pro 2K', descricao: 'US$ 0.13, mais detalhe' },
];

const lerJSON = <T,>(chave: string, padrao: T): T => {
  try { const v = localStorage.getItem(chave); return v ? { ...padrao, ...JSON.parse(v) } : padrao; } catch { return padrao; }
};
const gravar = (chave: string, valor: unknown) => { try { localStorage.setItem(chave, typeof valor === 'string' ? valor : JSON.stringify(valor)); } catch { /* sem armazenamento */ } };

const App: React.FC = () => {
  // Libera o app se já houver senha guardada neste navegador
  const [hasKey, setHasKey] = useState<boolean>(() => getSenha() !== "");
  const [authError, setAuthError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [erroRoteiro, setErroRoteiro] = useState<string | null>(null);
  const [carouselData, setCarouselData] = useState<GeneratedCarousel | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [interrompidas, setInterrompidas] = useState(0);
  const [showModelModal, setShowModelModal] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroRef, setErroRef] = useState<string | null>(null);
  const [zipando, setZipando] = useState(false);

  const [imageConfig, setImageConfig] = useState<ImageConfig>(() => {
    const c = lerJSON<ImageConfig>(CHAVE_CONFIG, { aspectRatio: '4:5', resolution: '1K', style: '3d-render' });
    return { ...c, referencia: undefined, style: (STYLES[c.style] ? c.style : '3d-render') as ImageStyleId };
  });
  const [tema, setTema] = useState<string>(() => document.documentElement.dataset.theme || 'dark');

  // Fila
  // Limite e pausa em refs: a fila precisa do valor na hora, não no próximo desenho da tela.
  const limiteParalelo = useRef(PARALELO_INICIAL);
  const pausadoAte = useRef(0);
  const timerPausa = useRef<number | null>(null);
  const controladores = useRef(new Map<string, AbortController>());
  const emAndamento = useRef(new Set<string>());
  const [, forcar] = useState(0);

  // ---- Tema
  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    gravar(CHAVE_TEMA, tema);
  }, [tema]);

  // ---- Configuração lembrada entre visitas (sem a imagem de referência)
  useEffect(() => {
    const { referencia, ...resto } = imageConfig;
    gravar(CHAVE_CONFIG, resto);
  }, [imageConfig]);

  // ---- Recupera o lote salvo neste navegador
  useEffect(() => {
    carregarLote().then(lote => {
      if (lote && lote.items?.length) {
        let n = 0;
        const items = lote.items.map(i => {
          if (i.status === 'pending' || i.status === 'generating') { n++; return { ...i, status: 'cancelled' as const }; }
          return i;
        });
        setCarouselData({ ...lote, items });
        setInterrompidas(n);
      }
      setCarregado(true);
    });
  }, []);

  // ---- Salva o lote a cada mudança (com pequeno atraso)
  useEffect(() => {
    if (!carregado) return;
    const t = setTimeout(() => salvarLote(carouselData), 400);
    return () => clearTimeout(t);
  }, [carouselData, carregado]);

  const atualizarItem = useCallback((id: string, mudanca: Partial<CarouselItem>) => {
    setCarouselData(prev => prev ? { ...prev, items: prev.items.map(i => i.id === id ? { ...i, ...mudanca } : i) } : prev);
  }, []);

  const handleSenha = (senha: string) => {
    setSenha(senha);
    setAuthError(null);
    setHasKey(true);
  };

  // Senha errada: volta para a tela de acesso. Outros erros aparecem no próprio card.
  const handleAuthError = (error: any) => {
    if (error instanceof ErroServidor && error.codigo === "SENHA") {
      cancelarTudo();
      limparSenha();
      setHasKey(false);
      setAuthError(error.message);
      return true;
    }
    return false;
  };

  const processItem = async (item: CarouselItem) => {
    const ctrl = new AbortController();
    controladores.current.set(item.id, ctrl);
    emAndamento.current.add(item.id);
    atualizarItem(item.id, { status: 'generating', errorMsg: undefined });
    try {
      const imageUrl = await generateCarouselImage(item, item.config, ctrl.signal);
      atualizarItem(item.id, { status: 'completed', imageUrl, errorMsg: undefined });
    } catch (err: any) {
      if (handleAuthError(err)) return;
      if (err instanceof ErroServidor && err.codigo === 'CANCELADO') {
        atualizarItem(item.id, { status: 'cancelled' });
      } else if (err instanceof ErroServidor && err.codigo === 'LIMITE') {
        // O Google limitou: devolve à fila, reduz o paralelismo e espera um pouco.
        atualizarItem(item.id, { status: 'pending' });
        limiteParalelo.current = Math.max(1, Math.floor(limiteParalelo.current / 2));
        pausadoAte.current = Date.now() + PAUSA_LIMITE_MS;
        setAviso('O Google limitou o uso. O lote continua mais devagar, sozinho.');
      } else {
        atualizarItem(item.id, { status: 'error', errorMsg: err?.message || 'Não foi possível gerar esta imagem.' });
      }
    } finally {
      controladores.current.delete(item.id);
      emAndamento.current.delete(item.id);
      forcar(x => x + 1);
    }
  };

  // ---- Despacha a fila
  useEffect(() => {
    if (!carouselData) return;
    const agora = Date.now();
    if (pausadoAte.current > agora) {
      if (timerPausa.current === null) {
        timerPausa.current = window.setTimeout(() => { timerPausa.current = null; forcar(x => x + 1); }, pausadoAte.current - agora + 50);
      }
      return;
    }
    const livres = limiteParalelo.current - emAndamento.current.size;
    if (livres <= 0) return;
    carouselData.items
      .filter(i => i.status === 'pending' && !emAndamento.current.has(i.id))
      .slice(0, livres)
      .forEach(processItem);
  });

  const cancelarTudo = () => {
    controladores.current.forEach(c => c.abort());
    setCarouselData(prev => prev ? { ...prev, items: prev.items.map(i => i.status === 'pending' || i.status === 'generating' ? { ...i, status: 'cancelled' } : i) } : prev);
  };

  const handleMainAction = () => {
    if (!inputValue.trim()) return;
    setErroRoteiro(null);
    try {
      const parsed = parseRawList(inputValue);
      const novos: CarouselItem[] = parsed.items.map(item => ({ ...item, status: 'pending', config: { ...imageConfig } } as CarouselItem));
      setCarouselData(prev => {
        const items = prev ? [...prev.items, ...novos] : novos;
        return { title: `${items.length} ${items.length === 1 ? 'ilustração' : 'ilustrações'}`, items };
      });
      setInputValue('');
      setInterrompidas(0);
      limiteParalelo.current = PARALELO_INICIAL;
    } catch (e: any) {
      setErroRoteiro(e.message);
    }
  };

  const tituloDo = (items: CarouselItem[]) => `${items.length} ${items.length === 1 ? 'ilustração' : 'ilustrações'}`;

  // Mantém a imagem anterior até a nova ficar pronta: se a nova falhar, nada se perde.
  const regenerar = (item: CarouselItem, prompt?: string) => atualizarItem(item.id, { status: 'pending', errorMsg: undefined, prompt: prompt ?? item.prompt });

  const variacao = (item: CarouselItem) => {
    setCarouselData(prev => {
      if (!prev) return prev;
      const idx = prev.items.findIndex(i => i.id === item.id);
      const base = item.pageLabel.replace(/ · v\d+$/, '');
      const n = prev.items.filter(i => i.pageLabel === base || i.pageLabel.startsWith(base + ' · v')).length + 1;
      const novo: CarouselItem = { ...item, id: crypto.randomUUID(), pageLabel: `${base} · v${n}`, status: 'pending', imageUrl: undefined, errorMsg: undefined };
      const items = [...prev.items.slice(0, idx + 1), novo, ...prev.items.slice(idx + 1)];
      return { title: tituloDo(items), items };
    });
  };

  const remover = (item: CarouselItem) => {
    controladores.current.get(item.id)?.abort();
    setCarouselData(prev => {
      if (!prev) return prev;
      const items = prev.items.filter(i => i.id !== item.id);
      return items.length ? { title: tituloDo(items), items } : null;
    });
  };

  const repetirFalhas = () => setCarouselData(prev => prev ? { ...prev, items: prev.items.map(i => i.status === 'error' || i.status === 'cancelled' ? { ...i, status: 'pending', errorMsg: undefined } : i) } : prev);

  const limparTudo = () => {
    if (!window.confirm('Apagar todas as ilustrações deste lote? Baixe antes as que quiser guardar.')) return;
    cancelarTudo();
    setCarouselData(null);
    setInterrompidas(0);
  };

  const baixarZip = async () => {
    if (!carouselData) return;
    setZipando(true);
    try {
      const usados = new Map<string, number>();
      const arquivos = carouselData.items.filter(i => i.status === 'completed' && i.imageUrl).map((item, n) => {
        const { bytes, mime } = dataUrlParaBytes(item.imageUrl!);
        const base = `${String(n + 1).padStart(2, '0')}_${item.pageLabel.replace(/[^\p{L}\p{N}]+/gu, '_')}_${item.config.style}`;
        const k = (usados.get(base) || 0) + 1; usados.set(base, k);
        return { nome: `${base}${k > 1 ? '_' + k : ''}.${extensaoDoMime(mime)}`, bytes };
      });
      const blob = criarZip(arquivos);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ilustracoes_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setZipando(false);
    }
  };

  const escolherReferencia = async (arquivo?: File) => {
    setErroRef(null);
    if (!arquivo) return;
    try {
      const referencia = await prepararReferencia(arquivo);
      setImageConfig(c => ({ ...c, referencia }));
    } catch (e: any) {
      setErroRef(e.message);
    }
  };

  const copiarModelo = async () => {
    try { await navigator.clipboard.writeText(AI_INSTRUCTION_MODEL); setAviso('Instrução copiada. Cole no ChatGPT ou no Gemini.'); }
    catch { setAviso('Não foi possível copiar. Selecione o texto e copie à mão.'); }
  };

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const contagem = useMemo(() => {
    const items = carouselData?.items || [];
    const c = { total: items.length, prontas: 0, gerando: 0, fila: 0, falhas: 0, paradas: 0 };
    items.forEach(i => {
      if (i.status === 'completed') c.prontas++;
      else if (i.status === 'generating') c.gerando++;
      else if (i.status === 'pending') c.fila++;
      else if (i.status === 'error') c.falhas++;
      else if (i.status === 'cancelled') c.paradas++;
    });
    return c;
  }, [carouselData]);

  const progresso = contagem.total ? Math.round(((contagem.prontas + contagem.falhas + contagem.paradas) / contagem.total) * 100) : 0;
  const ativo = contagem.gerando + contagem.fila > 0;
  const blocosNoRoteiro = useMemo(() => {
    if (!inputValue.trim()) return 0;
    try { return parseRawList(inputValue).items.length; } catch { return 0; }
  }, [inputValue]);

  if (!hasKey) {
    return <ApiKeyModal onSubmit={handleSenha} error={authError} />;
  }

  const estiloAtual = STYLES[imageConfig.style];
  const grupos: { id: 'estudo' | 'geral'; titulo: string }[] = [
    { id: 'estudo', titulo: 'Para estudo (testados)' },
    { id: 'geral', titulo: 'Gerais' },
  ];

  const opcao = (sel: boolean) =>
    `w-full text-left rounded-p border px-3 py-2 min-h-alvo transition-colors ${sel ? 'border-primaria bg-primaria-suave' : 'border-linha bg-superficie hover:border-linha-forte'}`;

  return (
    <div className="min-h-screen bg-fundo text-texto">
      <a className="av-pular" href="#roteiro">Pular para o roteiro</a>
      <header className="av-cabecalho">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 min-h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="av-marca-simbolo" aria-hidden="true"></span>
            <h1 className="font-bold text-base sm:text-lg leading-tight">Criador de Ilustrações</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-2 text-sm text-texto-suave" aria-live="polite">
              <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-primaria' : 'bg-sucesso'}`} aria-hidden="true"></span>
              {ativo ? `Gerando ${contagem.gerando} de ${contagem.gerando + contagem.fila}` : 'Pronto'}
            </span>
            <button type="button" onClick={() => setShowModelModal(true)} className="av-btn av-btn--fantasma av-btn--pequeno">
              <span className="sm:hidden">Instrução</span><span className="hidden sm:inline">Instrução para a IA</span>
            </button>
            <button type="button" onClick={() => setTema(t => t === 'dark' ? 'light' : 'dark')} aria-pressed={tema === 'light'} className="av-btn av-btn--fantasma av-btn--pequeno">
              <span className="sm:hidden">{tema === 'dark' ? 'Claro' : 'Escuro'}</span>
              <span className="hidden sm:inline">{tema === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 lg:py-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] items-start">
        {/* Configurações: sempre visíveis */}
        <aside className="order-2 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 bg-superficie border border-linha rounded-m p-4 sm:p-5 space-y-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto" aria-labelledby="config-titulo">
          <h2 id="config-titulo" className="text-lg font-bold">Configurações do lote</h2>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold mb-2">Estilo</legend>
            {grupos.map(g => (
              <div key={g.id}>
                <p className="text-xs text-texto-suave pt-1 mb-2">{g.titulo}</p>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {Object.entries(STYLES).filter(([, s]) => s.grupo === g.id).map(([key, s]) => (
                  <button key={key} type="button" aria-pressed={imageConfig.style === key}
                    onClick={() => setImageConfig({ ...imageConfig, style: key as ImageStyleId })} className={`${opcao(imageConfig.style === key)} flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3`}>
                    {/* Miniatura: a mesma cena gerada neste estilo (public/estilos) */}
                    <img src={`/estilos/${key}.webp`} alt="" width={256} height={256} loading="lazy" className="w-full lg:w-14 aspect-square lg:h-14 rounded-p object-cover shrink-0 bg-superficie-2" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{s.label}</span>
                      <span className="block text-xs text-texto-suave">{s.descricao}</span>
                    </span>
                  </button>
                ))}
                </div>
              </div>
            ))}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold mb-2">Proporção</legend>
            <div className="grid grid-cols-2 gap-2">
              {proporcoes.map(p => (
                <button key={p.id} type="button" aria-pressed={imageConfig.aspectRatio === p.id}
                  onClick={() => setImageConfig({ ...imageConfig, aspectRatio: p.id })} className={`${opcao(imageConfig.aspectRatio === p.id)} flex items-center gap-2`}>
                  <span aria-hidden="true" className="border-2 border-current rounded-sm shrink-0 text-primaria" style={{ width: 18 * p.w / Math.max(p.w, p.h), height: 18 * p.h / Math.max(p.w, p.h) }}></span>
                  <span className="text-sm font-semibold leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold mb-2">Qualidade</legend>
            <div className="grid grid-cols-3 gap-2">
              {qualidades.map(q => (
                <button key={q.id} type="button" aria-pressed={imageConfig.resolution === q.id}
                  onClick={() => setImageConfig({ ...imageConfig, resolution: q.id })} className={opcao(imageConfig.resolution === q.id)}>
                  <span className="block text-sm font-semibold">{q.label}</span>
                  <span className="block text-xs text-texto-suave">{q.descricao}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold mb-1">Imagem de referência</legend>
            <p className="text-xs text-texto-suave mb-2">Opcional. Um personagem ou uma arte para manter o mesmo visual em todo o lote.</p>
            {imageConfig.referencia ? (
              <div className="flex items-center gap-3">
                <img src={imageConfig.referencia} alt="Imagem de referência escolhida" className="w-16 h-16 object-cover rounded-p border border-linha" />
                <button type="button" className="av-btn av-btn--fantasma av-btn--pequeno" onClick={() => setImageConfig(c => ({ ...c, referencia: undefined }))}>Remover referência</button>
              </div>
            ) : (
              <label className="av-btn av-btn--fantasma av-btn--pequeno cursor-pointer w-full">
                Escolher imagem
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => { escolherReferencia(e.target.files?.[0]); e.currentTarget.value = ''; }} />
              </label>
            )}
            {erroRef && <p className="text-sm text-erro font-semibold mt-2">{erroRef}</p>}
          </fieldset>
        </aside>

          {/* Roteiro */}
          <section className="order-1 lg:order-none lg:col-start-2 lg:row-start-1 min-w-0 bg-superficie border border-linha rounded-m p-4 sm:p-5" aria-labelledby="roteiro-titulo">
            <h2 id="roteiro-titulo" className="text-lg font-bold mb-1">Roteiro</h2>
            <p className="text-sm text-texto-suave mb-3">Cada bloco vira uma imagem. Marque os blocos com **P1**, **P2** e separe com ---.</p>
            <label htmlFor="roteiro" className="sr-only">Roteiro em Markdown</label>
            <textarea
              id="roteiro"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setErroRoteiro(null); }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleMainAction(); }}
              aria-invalid={!!erroRoteiro}
              aria-describedby="roteiro-ajuda"
              placeholder={'**P1**\nServidor lendo um ofício com uma lupa\n---\n**P2**\nMapa mental da Lei 8.112 numa lousa'}
              className="w-full min-h-[180px] rounded-p border-2 border-linha-forte bg-fundo text-texto p-3 text-base resize-y focus:border-primaria"
            />
            {erroRoteiro && <p className="text-sm text-erro font-semibold mt-2" role="alert">{erroRoteiro}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
              <p id="roteiro-ajuda" className="text-sm text-texto-suave">
                {estiloAtual.label} · {proporcoes.find(p => p.id === imageConfig.aspectRatio)?.label} · {qualidades.find(q => q.id === imageConfig.resolution)?.label}
                {imageConfig.referencia ? ' · com referência' : ''}. Ctrl + Enter também gera.
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {blocosNoRoteiro > 0 && (
                  <span className="text-sm font-semibold text-texto-suave whitespace-nowrap cursor-help" style={{ fontVariantNumeric: 'tabular-nums' }}
                    title={textoCusto(blocosNoRoteiro, PRECO_USD[imageConfig.resolution]).detalhe}>
                    {textoCusto(blocosNoRoteiro, PRECO_USD[imageConfig.resolution]).curto}
                  </span>
                )}
                <button type="button" onClick={handleMainAction} disabled={!blocosNoRoteiro} className="av-btn av-btn--primario flex-1 sm:flex-none">
                  {blocosNoRoteiro ? `Gerar ${blocosNoRoteiro} ${blocosNoRoteiro === 1 ? 'ilustração' : 'ilustrações'}` : 'Gerar ilustrações'}
                </button>
              </div>
            </div>
          </section>

        <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-2 space-y-6 min-w-0">
          {interrompidas > 0 && (
            <div className="av-aviso av-aviso--atencao" role="status">
              <span className="av-aviso-icone" aria-hidden="true">!</span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><strong>{interrompidas} {interrompidas === 1 ? 'imagem não terminou' : 'imagens não terminaram'}</strong>A página foi recarregada no meio do lote.</div>
                <button type="button" className="av-btn av-btn--secundario av-btn--pequeno" onClick={() => { repetirFalhas(); setInterrompidas(0); }}>Retomar o lote</button>
              </div>
            </div>
          )}

          {carouselData ? (
            <section className="space-y-5" aria-labelledby="lote-titulo">
              <div className="bg-superficie border border-linha rounded-m p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 id="lote-titulo" className="text-xl font-bold mb-2">{carouselData.title}</h2>
                  <div className="av-progresso max-w-md">
                    <div className="av-progresso-trilho"><div className="av-progresso-barra" style={{ width: `${progresso}%` }}></div></div>
                    <span className="av-progresso-rotulo">{contagem.prontas} prontas{contagem.falhas ? ` · ${contagem.falhas} com erro` : ''}{contagem.paradas ? ` · ${contagem.paradas} ${contagem.paradas === 1 ? 'parada' : 'paradas'}` : ''}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ativo && <button type="button" onClick={cancelarTudo} className="av-btn av-btn--secundario av-btn--pequeno">Parar o lote</button>}
                  {!ativo && (contagem.falhas + contagem.paradas > 0) && <button type="button" onClick={repetirFalhas} className="av-btn av-btn--secundario av-btn--pequeno">Repetir as {contagem.falhas + contagem.paradas} que faltam <span className="font-semibold opacity-80">≈ US$ {custoDeItens(carouselData.items.filter(i => i.status === 'error' || i.status === 'cancelled')).toFixed(2)}</span></button>}
                  <button type="button" onClick={baixarZip} disabled={!contagem.prontas || zipando} className="av-btn av-btn--primario av-btn--pequeno">
                    {zipando ? 'Preparando o .zip…' : `Baixar ${contagem.prontas} em .zip`}
                  </button>
                  <button type="button" onClick={limparTudo} className="av-btn av-btn--fantasma av-btn--pequeno">Apagar o lote</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5">
                {carouselData.items.map(item => (
                  <CardDisplay key={item.id} item={item} onRetry={i => regenerar(i)} onEdit={(i, p) => regenerar(i, p)} onVariation={variacao} onRemove={remover} />
                ))}
              </div>
            </section>
          ) : carregado && (
            <section className="border-2 border-dashed border-linha rounded-m p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-2">Nenhuma ilustração ainda</h2>
              <p className="text-texto-suave max-w-prose">Cole o roteiro acima e escolha o estilo ao lado. Se ainda não tem roteiro, copie a instrução para a IA e peça ao ChatGPT ou ao Gemini para montar um sobre o seu tema.</p>
              <button type="button" className="av-btn av-btn--secundario av-btn--pequeno mt-4" onClick={() => setShowModelModal(true)}>Ver a instrução para a IA</button>
            </section>
          )}
        </div>
      </main>

      {aviso && (
        <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-superficie-2 text-texto border border-linha rounded-m shadow-2 px-4 py-3 text-sm font-semibold max-w-[90vw]">
          {aviso}
        </div>
      )}

      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowModelModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="modelo-titulo" className="bg-superficie border border-linha rounded-g p-6 max-w-lg w-full shadow-2"
            onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') setShowModelModal(false); }}>
            <h3 id="modelo-titulo" className="text-xl font-bold mb-2">Instrução para a sua IA</h3>
            <p className="text-texto-suave text-sm mb-4">Cole no ChatGPT ou no Gemini junto com o tema. A resposta já vem no formato do roteiro.</p>
            <pre className="bg-fundo rounded-m p-4 text-sm text-texto border border-linha mb-5 max-h-[300px] overflow-y-auto whitespace-pre-wrap font-sans">{AI_INSTRUCTION_MODEL.trim()}</pre>
            <div className="flex gap-3">
              <button type="button" autoFocus onClick={copiarModelo} className="av-btn av-btn--primario flex-1">Copiar a instrução</button>
              <button type="button" onClick={() => setShowModelModal(false)} className="av-btn av-btn--fantasma">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
