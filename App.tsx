
import React, { useState, useEffect, useMemo } from 'react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CardDisplay } from './components/CardDisplay';
import { CarouselItem, GeneratedCarousel, ImageConfig, ImageStyleId, AspectRatioType } from './types';
import { generateCarouselImage, parseRawList } from './services/geminiService';
import { STYLES, AI_INSTRUCTION_MODEL } from './constants';

const App: React.FC = () => {
  // Inicializa hasKey como true se a variável de ambiente existir, evitando a tela de bloqueio
  const [hasKey, setHasKey] = useState<boolean>(() => {
    return !!process.env.API_KEY && process.env.API_KEY !== "";
  });
  
  const [loadingKey, setLoadingKey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [carouselData, setCarouselData] = useState<GeneratedCarousel | null>(null);
  const [generatingCount, setGeneratingCount] = useState(0);
  const [showModelModal, setShowModelModal] = useState(false);
  
  const [imageConfig, setImageConfig] = useState<ImageConfig>({
    aspectRatio: "4:5", 
    resolution: "1K",
    style: "3d-render"
  });
  const [showSettings, setShowSettings] = useState(false);

  const MAX_CONCURRENT = 10; 

  useEffect(() => {
    const checkKey = async () => {
      // Se já temos a chave pela Env Var, não precisamos fazer nada
      if (hasKey) return;

      const isAiStudioEnv = typeof window !== 'undefined' && !!window.aistudio;
      if (isAiStudioEnv) {
        try {
          const valid = await window.aistudio!.hasSelectedApiKey();
          if (valid) setHasKey(true);
        } catch(e) {
          console.error("Erro na verificação automática", e);
        }
      }
    };
    checkKey();
  }, [hasKey]);

  const handleSelectKey = async () => {
    setLoadingKey(true);
    setAuthError(null);
    try {
      if (typeof window !== 'undefined' && window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasKey(true);
      } else {
        setAuthError("API_KEY não detectada. No Vercel, configure a variável 'API_KEY' nas Settings > Environment Variables e faça um novo deploy.");
      }
    } catch (e) {
      setAuthError("Falha ao tentar conectar com o Google Cloud.");
    } finally {
      setLoadingKey(false);
    }
  };

  const handleAuthError = (error: any) => {
    const msg = error?.message || String(error);
    if (msg.includes("UNAUTHENTICATED") || msg.includes("401") || msg.includes("403") || msg.includes("not found")) {
      setHasKey(false);
      setAuthError("Sua chave de API parece inválida ou o faturamento não está ativo no Google Cloud Console.");
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!carouselData) return;
    const pendingItems = carouselData.items.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) return;
    const availableSlots = MAX_CONCURRENT - generatingCount;
    if (availableSlots <= 0) return;
    const itemsToStart = pendingItems.slice(0, availableSlots);
    itemsToStart.forEach(item => processItem(item));
  }, [carouselData, generatingCount]);

  const processItem = async (item: CarouselItem) => {
    setGeneratingCount(c => c + 1);
    setCarouselData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, status: 'generating' } : i)
      };
    });

    try {
      const imageUrl = await generateCarouselImage(item, item.config);
      setCarouselData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(i => i.id === item.id ? { ...i, status: 'completed', imageUrl, errorMsg: undefined } : i)
        };
      });
    } catch (err: any) {
      if (handleAuthError(err)) return;
      const errorMsg = err.message || 'Erro de geração';
      setCarouselData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(i => i.id === item.id ? { ...i, status: 'error', errorMsg } : i)
        };
      });
    } finally {
      setGeneratingCount(c => c - 1);
    }
  };

  const handleMainAction = async () => {
    if (!inputValue.trim()) return;
    setIsProcessing(true);
    setAuthError(null);
    try {
      const parsed = parseRawList(inputValue);
      const enrichedItems: CarouselItem[] = parsed.items.map(item => ({
        ...item,
        status: 'pending',
        config: { ...imageConfig } 
      } as CarouselItem));

      setCarouselData(prev => {
        if (!prev) {
          return {
            title: `Pack de ${enrichedItems.length} Imagens`,
            items: enrichedItems
          };
        }
        return {
          ...prev,
          title: `Pack de ${prev.items.length + enrichedItems.length} Imagens`,
          items: [...prev.items, ...enrichedItems]
        };
      });
      setInputValue('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = (item: CarouselItem) => {
    setCarouselData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(i => i.id === item.id ? { ...i, status: 'pending', errorMsg: undefined } : i)
        };
    });
  };

  const handleDownloadAll = () => {
    if (!carouselData) return;
    const completed = carouselData.items.filter(i => i.status === 'completed');
    completed.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.imageUrl!;
        const safeLabel = item.pageLabel.replace(/\s+/g, '_').replace(/[()]/g, '');
        link.download = `${safeLabel}_${item.config.style}_${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 800);
    });
  };

  const progress = useMemo(() => {
    if (!carouselData) return 0;
    const total = carouselData.items.length;
    const done = carouselData.items.filter(i => i.status === 'completed' || i.status === 'error').length;
    return Math.round((done / total) * 100);
  }, [carouselData]);

  const aspectRatios: { id: AspectRatioType; label: string; icon: string }[] = [
    { id: "1:1", label: "Quadrado (Feed)", icon: "M5 5h14v14H5z" },
    { id: "4:5", label: "Retrato (Feed)", icon: "M6 4h12v16H6z" },
    { id: "9:16", label: "Stories / Reels", icon: "M8 2h8v20H8z" },
    { id: "16:9", label: "Widescreen", icon: "M2 7h20v10H2z" }
  ];

  const handleCopyModel = () => {
    navigator.clipboard.writeText(AI_INSTRUCTION_MODEL);
    alert("Instrução copiada!");
  };

  // Renderiza a tela de bloqueio apenas se NÃO houver chave detectada
  if (!hasKey) {
    return <ApiKeyModal onSelect={handleSelectKey} isLoading={loadingKey} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-white pb-20 font-inter selection:bg-brand-blue/30">
      <header className="sticky top-0 z-30 bg-[#0F1115]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCarouselData(null)}>
             <div className="w-9 h-9 bg-gradient-to-br from-brand-orange to-brand-blue rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-blue/20">
               L
             </div>
             <h1 className="font-bold text-xl tracking-tight">
               <span className="text-white">Lote</span>
               <span className="text-brand-blue">Markdown</span>
             </h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowModelModal(true)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-blue transition-colors px-3 py-1.5 border border-gray-800 rounded-full hover:border-brand-blue/40">
               Modelo para IA
             </button>
             <div className="px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-bold text-gray-400 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${imageConfig.resolution === 'Flash' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                {generatingCount > 0 ? `GERANDO ${generatingCount} EM PARALELO` : (imageConfig.resolution === 'Flash' ? 'PRONTO (FLASH)' : 'PRONTO (PRO)')}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!carouselData && (
          <div className="text-center mb-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Criação Simultânea <br/>por Roteiro
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              O sistema gera todas as imagens de uma vez. Adicione seus blocos e veja a mágica acontecer em paralelo.
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto w-full mb-12">
          <div className="bg-[#1A1D24] p-4 rounded-3xl border border-gray-800 shadow-2xl transition-all hover:border-brand-blue/30 relative">
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Cole seu roteiro Markdown aqui...&#10;&#10;**P1**&#10;Descrição 1...&#10;---&#10;**P2**&#10;Descrição 2..."
              className="w-full bg-transparent text-gray-200 p-4 min-h-[150px] outline-none resize-none text-base font-medium placeholder:text-gray-600 custom-scrollbar"
            />
            
            <div className="flex flex-wrap justify-between items-center px-4 py-3 border-t border-gray-800/50 mt-4 gap-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${showSettings ? 'bg-brand-blue border-brand-blue text-white' : 'bg-gray-900/50 hover:bg-gray-800 border-gray-800 text-gray-300'}`}
                >
                  ⚙️ Configurações do Lote
                </button>
              </div>

              <button 
                onClick={handleMainAction} 
                disabled={isProcessing || !inputValue.trim()} 
                className="bg-brand-blue hover:bg-blue-500 text-white font-black px-8 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-brand-blue/20 disabled:opacity-50 active:scale-95"
              >
                {isProcessing ? 'Adicionando...' : 'Adicionar e Gerar em Lote'}
              </button>
            </div>

            {showSettings && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-[#1A1D24] border border-gray-700 rounded-3xl p-6 z-40 shadow-2xl animate-in fade-in zoom-in-95 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Estilo</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(STYLES).map(([key, s]) => (
                      <button 
                        key={key} 
                        onClick={() => setImageConfig({...imageConfig, style: key as ImageStyleId})}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${imageConfig.style === key ? 'bg-brand-blue/20 border-brand-blue/40' : 'hover:bg-gray-800 border-transparent'} border`}
                      >
                        <img src={s.thumbnail} className="w-8 h-8 rounded-md object-cover" />
                        <span className="text-xs font-bold truncate">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Proporção</h4>
                  <div className="space-y-1">
                    {aspectRatios.map(ratio => (
                      <button 
                        key={ratio.id} 
                        onClick={() => setImageConfig({...imageConfig, aspectRatio: ratio.id})}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${imageConfig.aspectRatio === ratio.id ? 'bg-brand-blue/20 border-brand-blue/40' : 'hover:bg-gray-800 border-transparent'} border`}
                      >
                        <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={ratio.icon} />
                        </svg>
                        <p className="text-xs font-bold">{ratio.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Qualidade</h4>
                  <div className="space-y-2">
                    {[
                      {id: 'Flash', label: 'Flash (Instantâneo)'},
                      {id: '1K', label: 'Pro 1K (Padrão)'},
                      {id: '2K', label: 'Pro 2K (Ultra)'}
                    ].map(res => (
                      <button 
                        key={res.id} 
                        onClick={() => setImageConfig({...imageConfig, resolution: res.id as any})}
                        className={`w-full p-3 rounded-lg text-left transition-all ${imageConfig.resolution === res.id ? 'bg-brand-blue/20 border-brand-blue/40' : 'hover:bg-gray-800 border-transparent'} border`}
                      >
                        <p className="text-xs font-bold">{res.label}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-full mt-6 bg-white text-black py-2.5 text-xs font-black rounded-xl hover:bg-gray-200 transition-colors">Fechar</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {carouselData && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-[#1A1D24] border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-1">{carouselData.title}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-md h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                    <div className="h-full bg-gradient-to-r from-brand-orange to-brand-blue transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{progress}% concluído</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadAll} 
                  disabled={!carouselData.items.some(i => i.status === 'completed')} 
                  className="px-6 py-3 bg-white text-black text-sm font-black rounded-2xl hover:bg-gray-200 disabled:opacity-30 active:scale-95 transition-all shadow-lg"
                >
                  Baixar Pack Completo
                </button>
                <button 
                  onClick={() => setCarouselData(null)} 
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-2xl border border-gray-700 transition-colors"
                >
                  Limpar Tudo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {carouselData.items.map(item => (
                <CardDisplay key={item.id} item={item} onRetry={handleRetry} />
              ))}
            </div>
          </div>
        )}
      </main>

      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#1A1D24] border border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-black mb-4">Instrução para sua IA</h3>
            <p className="text-gray-400 text-xs mb-4">Copie e cole este prompt no ChatGPT ou Gemini para gerar o roteiro compatível com este sistema.</p>
            <div className="bg-black/40 rounded-2xl p-4 text-[11px] font-mono text-gray-300 border border-white/5 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
              {AI_INSTRUCTION_MODEL}
            </div>
            <div className="flex gap-4">
              <button onClick={handleCopyModel} className="flex-1 bg-brand-blue py-3 rounded-xl font-black text-sm hover:bg-blue-500 transition-colors shadow-lg shadow-brand-blue/20">Copiar Prompt</button>
              <button onClick={() => setShowModelModal(false)} className="px-6 bg-gray-800 py-3 rounded-xl font-black text-sm hover:bg-gray-700 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
