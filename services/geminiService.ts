
import { GoogleGenAI } from "@google/genai";
import { STYLES } from "../constants";
import { CarouselItem, GeneratedCarousel, ImageConfig } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("UNAUTHENTICATED: Chave de API não configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

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
  const ai = getAI();
  
  const styleConfig = STYLES[config.style] || STYLES['3d-render'];
  const basePrompt = item.prompt ? item.prompt.trim() : "";
  const suffix = styleConfig.suffix ? styleConfig.suffix.trim() : "";
  const fullPrompt = suffix ? `${basePrompt}. ${suffix}` : basePrompt;

  const isFlash = config.resolution === 'Flash';
  const model = isFlash ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';

  let apiAspectRatio: string = config.aspectRatio;
  if (config.aspectRatio === "4:5") {
    apiAspectRatio = "3:4"; 
  }

  const imageConfig: any = {
    aspectRatio: apiAspectRatio,
  };

  if (!isFlash) {
    imageConfig.imageSize = config.resolution;
  }

  let attempt = 0;
  const maxRetries = 2;

  while (attempt <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig
        }
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("A API não retornou candidatos.");
      }

      const candidate = response.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }

      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Segurança: Prompt bloqueado.");
      }

      throw new Error("Nenhum dado de imagem recebido.");

    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      const msg = error.message || "";
      const isRetryable = msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE");
      
      if (isRetryable && attempt < maxRetries) {
        attempt++;
        await delay(2000 * Math.pow(2, attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Falha persistente na geração.");
};
