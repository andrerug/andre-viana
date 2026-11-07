import { ImageConfig } from '../types';

// Estimativa de custo da geração de imagens (Gemini), em dólar.
// Preço por imagem de saída, da tabela do Google; a entrada (texto e referência) custa frações de centavo
// e não entra na conta. É estimativa: o valor final aparece no faturamento do Google Cloud.
// Modelos: "Rápida" = gemini-2.5-flash-image; "Pro 1K" e "Pro 2K" = gemini-3-pro-image (api/gerar-imagem.ts).
export const PRECO_USD: Record<ImageConfig['resolution'], number> = {
  Flash: 0.039,
  '1K': 0.134,
  '2K': 0.134,
};

export function textoCusto(qtd: number, precoUsd: number) {
  const total = qtd * precoUsd;
  return {
    curto: `≈ US$ ${total.toFixed(2)}`,
    detalhe: `Estimativa: ${qtd} × US$ ${precoUsd.toFixed(3)} por imagem. O valor final aparece no faturamento do Google.`,
  };
}

/** Custo de uma lista de itens, cada um com a sua qualidade. */
export const custoDeItens = (itens: { config: ImageConfig }[]) => itens.reduce((s, i) => s + (PRECO_USD[i.config.resolution] ?? 0.134), 0);
