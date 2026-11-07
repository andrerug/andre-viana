// Função de servidor da Vercel: gera a imagem com o Gemini.
// A GEMINI_API_KEY fica só aqui no servidor e nunca chega ao navegador.
// Só atende quem enviar a senha certa (variável SENHA_APP na Vercel).

import { GoogleGenAI } from "@google/genai";
import { createHash, timingSafeEqual } from "node:crypto";

const MODELO_FLASH = "gemini-2.5-flash-image";
const MODELO_PRO = "gemini-3-pro-image";

const PROPORCOES = new Set(["1:1", "3:4", "4:3", "4:5", "9:16", "16:9"]);
const RESOLUCOES = new Set(["Flash", "1K", "2K"]);
const MAX_PROMPT = 4000;
const MAX_CORPO = 20_000; // bytes, pedido só com texto
const MAX_CORPO_COM_REFERENCIA = 3_000_000; // bytes, com imagem de referência (o navegador reduz para 1024 px)
const REF_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_RESPOSTA = 4_200_000; // limite de resposta das funções da Vercel é 4,5 MB

function json(status: number, corpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function erro(status: number, codigo: string, mensagem: string): Response {
  return json(status, { erro: codigo, mensagem });
}

function senhaConfere(recebida: string, esperada: string): boolean {
  const a = createHash("sha256").update(recebida).digest();
  const b = createHash("sha256").update(esperada).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const chave = process.env.GEMINI_API_KEY;
  const senhaApp = process.env.SENHA_APP;
  if (!senhaApp) return erro(500, "SEM_SENHA_APP", "O servidor está sem a variável SENHA_APP. Configure na Vercel e refaça o deploy.");
  if (!chave) return erro(500, "SEM_CHAVE", "O servidor está sem a variável GEMINI_API_KEY. Configure na Vercel e refaça o deploy.");

  const senha = request.headers.get("x-senha-app") || "";
  if (!senhaConfere(senha, senhaApp)) return erro(401, "SENHA", "Senha de acesso incorreta.");

  const tamanho = Number(request.headers.get("content-length") || 0);
  if (tamanho > MAX_CORPO_COM_REFERENCIA) return erro(413, "ENTRADA", "Pedido grande demais. Use uma imagem de referência menor.");

  let dados: any;
  try {
    dados = await request.json();
  } catch {
    return erro(400, "ENTRADA", "Pedido inválido.");
  }

  const prompt = typeof dados?.prompt === "string" ? dados.prompt.trim() : "";
  const proporcao = String(dados?.aspectRatio || "1:1");
  const resolucao = String(dados?.resolution || "1K");
  if (!prompt) return erro(400, "ENTRADA", "Descrição vazia.");
  if (prompt.length > MAX_PROMPT) return erro(400, "ENTRADA", `Descrição longa demais (máximo ${MAX_PROMPT} caracteres).`);
  if (!PROPORCOES.has(proporcao)) return erro(400, "ENTRADA", "Proporção inválida.");
  if (!RESOLUCOES.has(resolucao)) return erro(400, "ENTRADA", "Qualidade inválida.");

  // Imagem de referência opcional: data URL de JPEG/PNG/WebP
  let referencia: { mimeType: string; data: string } | null = null;
  if (dados?.referencia != null) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dados.referencia));
    if (!m || !REF_MIMES.has(m[1])) return erro(400, "ENTRADA", "Imagem de referência inválida.");
    if (m[2].length > MAX_CORPO_COM_REFERENCIA) return erro(413, "ENTRADA", "Imagem de referência grande demais.");
    referencia = { mimeType: m[1], data: m[2] };
  } else if (tamanho > MAX_CORPO) {
    return erro(413, "ENTRADA", "Pedido grande demais.");
  }

  const isFlash = resolucao === "Flash";
  const montarConfig = (aspectRatio: string) => {
    const imageConfig: Record<string, string> = { aspectRatio };
    if (!isFlash) imageConfig.imageSize = resolucao;
    return imageConfig;
  };
  const partes: any[] = referencia
    ? [{ inlineData: referencia }, { text: `${prompt}

Use the attached image as the visual reference: keep its style, colors and characters consistent.` }]
    : [{ text: prompt }];

  try {
    const ai = new GoogleGenAI({ apiKey: chave });
    const gerar = (aspectRatio: string) => ai.models.generateContent({
      model: isFlash ? MODELO_FLASH : MODELO_PRO,
      contents: { parts: partes },
      config: { imageConfig: montarConfig(aspectRatio) },
    });
    let resposta;
    try {
      resposta = await gerar(proporcao);
    } catch (e: any) {
      // Se o modelo não aceitar 4:5, usa 3:4 (o mais próximo) em vez de falhar.
      if (proporcao === "4:5" && /aspect|INVALID_ARGUMENT|400/i.test(String(e?.message || e))) resposta = await gerar("3:4");
      else throw e;
    }

    const candidato = resposta.candidates?.[0];
    for (const parte of candidato?.content?.parts || []) {
      const dadosImg = parte.inlineData?.data;
      if (dadosImg) {
        if (dadosImg.length > MAX_RESPOSTA) {
          return erro(413, "GRANDE", "A imagem ficou grande demais para o servidor. Tente a qualidade Pro 1K.");
        }
        const mime = parte.inlineData?.mimeType || "image/png";
        return json(200, { imagem: `data:${mime};base64,${dadosImg}` });
      }
    }
    if (candidato?.finishReason === "SAFETY" || candidato?.finishReason === "PROHIBITED_CONTENT") {
      return erro(422, "SEGURANCA", "O Google bloqueou esta descrição por segurança. Reescreva o pedido.");
    }
    return erro(502, "SEM_IMAGEM", "O Gemini não devolveu imagem. Tente de novo.");
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.error("Falha no Gemini:", msg.slice(0, 300));
    if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(msg)) {
      return erro(502, "CHAVE_INVALIDA", "A chave do Gemini no servidor é inválida ou foi desativada. Gere uma nova e atualize a GEMINI_API_KEY na Vercel.");
    }
    if (/not found|404|is not supported/i.test(msg)) {
      return erro(502, "MODELO", "O modelo de imagem não está disponível para esta chave.");
    }
    if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) {
      return erro(429, "LIMITE", "Limite de uso do Gemini atingido. Aguarde um pouco ou verifique o faturamento.");
    }
    if (/503|overloaded|UNAVAILABLE/i.test(msg)) {
      return erro(503, "OCUPADO", "O Gemini está sobrecarregado. Tentando de novo…");
    }
    return erro(502, "FALHA", "Falha ao gerar a imagem.");
  }
}
