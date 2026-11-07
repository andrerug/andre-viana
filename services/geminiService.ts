
import { STYLES } from "../constants";
import { CarouselItem, ImageConfig } from "../types";

// A chave do Gemini fica no servidor (api/gerar-imagem.ts).
// O navegador só guarda a senha de acesso ao app.
const CHAVE_SENHA = "senha-app";

export const getSenha = (): string => {
  try { return localStorage.getItem(CHAVE_SENHA) || ""; } catch { return ""; }
};
export const setSenha = (senha: string) => {
  try { localStorage.setItem(CHAVE_SENHA, senha); } catch { /* navegador sem armazenamento */ }
};
export const limparSenha = () => {
  try { localStorage.removeItem(CHAVE_SENHA); } catch { /* idem */ }
};

export class ErroServidor extends Error {
  codigo: string;
  constructor(codigo: string, mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const parseRawList = (text: string): { items: Partial<CarouselItem>[] } => {
  let chunks: string[] = [];
  if (text.includes('---')) {
    chunks = text.split(/---/).map(c => c.trim()).filter(c => c !== '');
  } else {
    chunks = text.split(/\n\s*\n/).map(c => c.trim()).filter(c => c !== '');
  }

  const items: Partial<CarouselItem>[] = [];
  const pMarkerRegex = /\*\*?(P\d+)\*\*?/i;

  chunks.forEach((chunk, index) => {
    const lines = chunk.split('\n');
    let label = `Slide ${index + 1}`;
    let promptLines: string[] = [];

    lines.forEach(line => {
      const match = line.match(pMarkerRegex);
      if (match) {
        label = match[1].toUpperCase();
      } else if (line.trim()) {
        promptLines.push(line.trim());
      }
    });

    const prompt = promptLines.join(' ');

    if (prompt) {
      items.push({
        id: crypto.randomUUID(),
        pageLabel: label,
        prompt: prompt,
        status: 'pending'
      });
    }
  });

  if (items.length === 0) throw new Error("Roteiro inválido. Use o formato: **P1** Descrição --- **P2** Descrição.");
  
  return { items };
};

export const generateCarouselImage = async (item: CarouselItem, config: ImageConfig): Promise<string> => {
  const styleConfig = STYLES[config.style] || STYLES['3d-render'];
  const basePrompt = item.prompt ? item.prompt.trim() : "";
  const suffix = styleConfig.suffix ? styleConfig.suffix.trim() : "";
  const fullPrompt = suffix ? `${basePrompt}. ${suffix}` : basePrompt;

  // O formato 4:5 não existe na API; usa 3:4, o mais próximo.
  const aspectRatio = config.aspectRatio === "4:5" ? "3:4" : config.aspectRatio;

  let attempt = 0;
  const maxRetries = 2;

  while (attempt <= maxRetries) {
    let resposta: Response;
    try {
      resposta = await fetch("/api/gerar-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-senha-app": getSenha() },
        body: JSON.stringify({ prompt: fullPrompt, aspectRatio, resolution: config.resolution }),
      });
    } catch {
      throw new ErroServidor("REDE", "Sem conexão com o servidor. Verifique a internet.");
    }

    let dados: any = null;
    try { dados = await resposta.json(); } catch { /* resposta sem JSON */ }

    if (resposta.ok && dados?.imagem) return dados.imagem;

    const codigo = dados?.erro || `HTTP_${resposta.status}`;
    const mensagem = dados?.mensagem || `Falha no servidor (${resposta.status}).`;
    const repetir = (codigo === "OCUPADO" || resposta.status === 503 || resposta.status === 504) && attempt < maxRetries;
    if (repetir) {
      attempt++;
      await delay(2000 * Math.pow(2, attempt));
      continue;
    }
    throw new ErroServidor(codigo, mensagem);
  }
  throw new ErroServidor("FALHA", "Falha persistente na geração.");
};
