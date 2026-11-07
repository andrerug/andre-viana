
export interface CarouselItem {
  id: string;
  pageLabel: string; // e.g., "P1 (Capa)"
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'error' | 'cancelled';
  imageUrl?: string;
  errorMsg?: string;
  config: ImageConfig; // Armazena a configuração ativa no momento da criação
}

export interface GeneratedCarousel {
  title: string;
  items: CarouselItem[];
}

export enum GenerationMode {
  PARSE = 'PARSE', // User pasted the list
  CREATE = 'CREATE' // User provided a topic
}

export type ImageStyleId = 'flashcard' | 'mnemonico' | 'editorial' | 'fotorrealista' | 'caderno' | 'palitinho' | '3d-render' | 'natural' | 'illustration' | 'realistic' | 'feminine' | 'minimalist' | 'tech' | 'glamour' | 'anime' | 'lego' | 'none';

export type AspectRatioType = "1:1" | "4:5" | "9:16" | "16:9" | "4:3";

export interface ImageConfig {
  aspectRatio: AspectRatioType;
  resolution: "Flash" | "1K" | "2K";
  style: ImageStyleId;
  referencia?: string; // imagem de referência (data URL JPEG reduzida), opcional
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
