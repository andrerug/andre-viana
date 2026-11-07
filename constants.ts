
// Estilos de imagem. O "suffix" é acrescentado ao fim de cada descrição antes de ir para o Gemini.
// Grupo "estudo": receitas já validadas na skill gerar-imagem (flashcards, mnemônicos, mapas, palácio).
export type GrupoEstilo = 'estudo' | 'geral';
export const STYLES: Record<string, { label: string; descricao: string; grupo: GrupoEstilo; suffix: string }> = {
  'flashcard': {
    label: 'Vetorial limpo',
    descricao: 'Flashcards: um objeto, fundo liso, recorta e imprime bem',
    grupo: 'estudo',
    suffix: "Single concrete object centered, occupying about 70% of the frame, plain uniform solid background, soft frontal light, no hard shadows, clean vector illustration with well-defined outlines and a three-color palette. No text, no labels, no watermark, no border.",
  },
  'mnemonico': {
    label: 'Cena mnemônica',
    descricao: 'Exagerada e absurda, um protagonista e uma ação: fixa na memória',
    grupo: 'estudo',
    suffix: "One fictional protagonist doing one clear, exaggerated and absurd action, at most two supporting details, a single visual focus understood in one second, humorous and memorable, children's book illustration style, saturated colors, loose expressive linework. No text, no letters, no numbers.",
  },
  'editorial': {
    label: 'Infográfico editorial',
    descricao: 'Esquemas e ícones simples, fundo branco, sem enfeite',
    grupo: 'estudo',
    suffix: "Editorial infographic illustration, flat clean shapes, simple icons, white background, high contrast, limited color palette, no heavy shadows, no decorative elements, generous margins. No text.",
  },
  'fotorrealista': {
    label: 'Foto realista',
    descricao: 'Para cenas em ambientes reais, como no palácio da memória',
    grupo: 'estudo',
    suffix: "Photorealistic, natural integration with the ambient light, coherent shadows and reflections, realistic textures, one clear focal point, uncluttered scene. No text, no watermark.",
  },
  'caderno': {
    label: 'Desenho de caderno',
    descricao: 'Traço preto sobre branco, ótimo para imprimir em P&B',
    grupo: 'estudo',
    suffix: "Black ink line drawing on a plain white background, notebook sketch style, clean confident lines, no shading, no color, prints well in black and white. No text.",
  },
  'palitinho': {
    label: 'Desenho de palitinho',
    descricao: 'Bonecos de palito, traço simples e engraçado',
    grupo: 'estudo',
    suffix: "Stick figure drawing: simple stick figures with round heads and single-line limbs, expressive dot eyes and simple facial expressions, minimal hand-drawn black marker lines on a plain white background, only essential props drawn as simple outlines, at most one accent color, humorous and clear, lots of white space. No text, no letters, no numbers.",
  },
  'none': {
    label: 'Sem estilo',
    descricao: 'Usa só a descrição do roteiro',
    grupo: 'geral',
    suffix: "",
  },
  '3d-render': {
    label: '3D moderno',
    descricao: 'Render 3D com luz de cinema, azul e laranja',
    grupo: 'geral',
    suffix: "Photorealistic, cinematic lighting, modern 3D render style, high fidelity, dominant tones of deep blue and vibrant orange, clean composition, NO TEXT on the image, 8k resolution, highly detailed.",
  },
  'natural': {
    label: 'Natural',
    descricao: 'Foto espontânea, luz natural, gente de verdade',
    grupo: 'geral',
    suffix: "Natural lighting, authentic lifestyle photography, candid shot, shot on 35mm, soft bokeh, genuine atmosphere, human connection, high quality, realistic textures, NO TEXT.",
  },
  'illustration': {
    label: 'Ilustração plana',
    descricao: 'Vetor colorido, estilo corporativo',
    grupo: 'geral',
    suffix: "Modern flat vector illustration, clean lines, vibrant colors, corporate art style, minimal details, isometric view, trending on dribbble, smooth gradients, NO TEXT.",
  },
  'realistic': {
    label: 'Realista',
    descricao: 'Fotografia hiper-realista e dramática',
    grupo: 'geral',
    suffix: "Hyper-realistic photography, 8k resolution, razor sharp focus, dramatic lighting, ray tracing, incredibly detailed textures, national geographic style, NO TEXT.",
  },
  'minimalist': {
    label: 'Minimalista',
    descricao: 'Um objeto, muito espaço vazio, fundo liso',
    grupo: 'geral',
    suffix: "Minimalist photography, negative space, clean solid background, single subject, high contrast, studio lighting, museum quality, abstract forms, NO TEXT.",
  },
  'feminine': {
    label: 'Elegante',
    descricao: 'Tons pastel, rosé e creme, ar de revista',
    grupo: 'geral',
    suffix: "Soft pastel color palette, elegant and airy composition, rose gold and cream tones, feminine aesthetic, soft lighting, fashion magazine style, luxury feel, high quality, NO TEXT.",
  },
  'glamour': {
    label: 'Glamour',
    descricao: 'Editorial de moda, rosa e magenta',
    grupo: 'geral',
    suffix: "Hyper-feminine aesthetic, vogue editorial style, vibrant pink and magenta tones, luxury fashion, sparkles and glitter, chic composition, bold makeup style lighting, high fashion, NO TEXT.",
  },
  'anime': {
    label: 'Anime (Ghibli)',
    descricao: 'Cenários pintados à mão, clima delicado',
    grupo: 'geral',
    suffix: "Studio Ghibli art style, hand-painted watercolor backgrounds, whimsical atmosphere, hayao miyazaki style, vibrant nature, detailed clouds, cel shaded characters, soothing colors, anime masterpiece, NO TEXT.",
  },
  'lego': {
    label: 'Lego 3D',
    descricao: 'Tudo feito de pecinhas plásticas',
    grupo: 'geral',
    suffix: "Built with lego bricks, plastic texture, macro photography, depth of field, isometric view, playful toy aesthetic, vibrant primary colors, 3d render, detailed brick connections, NO TEXT.",
  },
  'tech': {
    label: 'Tecnologia',
    descricao: 'Neon, circuitos e fundo escuro',
    grupo: 'geral',
    suffix: "Cyberpunk aesthetic, neon lighting, dark background, circuit patterns, futuristic interface elements, glowing effects, matrix green and purple tones, sci-fi atmosphere, NO TEXT.",
  },
};

export const AI_INSTRUCTION_MODEL = `
Atue como um Engenheiro de Prompts especialista em carrosséis para redes sociais.
Sua tarefa é criar um roteiro visual para um carrossel sobre o tópico solicitado.
Siga RIGOROSAMENTE o formato abaixo para cada slide:

**PX** (onde X é o número do slide)
[Descrição visual detalhada em INGLÊS focada em objetos, iluminação e cenário, sem textos na imagem]

--- (separador obrigatório entre slides)

Exemplo:
**P1**
A judicial gavel made of futuristic glass resting on a wooden table, digital codes floating around.

---

**P2**
A young lawyer studying on a holographic tablet at night in a modern office.

REGRAS:
1. Use apenas o separador "---" entre os slides.
2. Mantenha o marcador **PX** no topo de cada bloco.
3. Não adicione introduções ou conclusões, retorne apenas os blocos.
`;
