
// Visual style definitions
export const STYLES: Record<string, { label: string; suffix: string; color: string; thumbnail: string }> = {
  'none': {
    label: 'Sem Estilo (Prompt)',
    suffix: "", 
    color: 'bg-slate-700',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=150&q=80'
  },
  '3d-render': {
    label: '3D Moderno',
    suffix: "Photorealistic, cinematic lighting, modern 3D render style, high fidelity, dominant tones of deep blue and vibrant orange, clean composition, NO TEXT on the image, 8k resolution, highly detailed.",
    color: 'bg-blue-600',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80'
  },
  'natural': {
    label: 'Natural',
    suffix: "Natural lighting, authentic lifestyle photography, candid shot, shot on 35mm, soft bokeh, genuine atmosphere, human connection, high quality, realistic textures, NO TEXT.",
    color: 'bg-green-600',
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=150&q=80'
  },
  'illustration': {
    label: 'Ilustração',
    suffix: "Modern flat vector illustration, clean lines, vibrant colors, corporate art style, minimal details, isometric view, trending on dribbble, smooth gradients, NO TEXT.",
    color: 'bg-purple-600',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'
  },
  'realistic': {
    label: 'Realista',
    suffix: "Hyper-realistic photography, 8k resolution, razor sharp focus, dramatic lighting, ray tracing, incredibly detailed textures, national geographic style, NO TEXT.",
    color: 'bg-gray-600',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&q=80'
  },
  'feminine': {
    label: 'Elegante',
    suffix: "Soft pastel color palette, elegant and airy composition, rose gold and cream tones, feminine aesthetic, soft lighting, fashion magazine style, luxury feel, high quality, NO TEXT.",
    color: 'bg-pink-500',
    thumbnail: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=150&q=80'
  },
  'glamour': {
    label: 'Glamour',
    suffix: "Hyper-feminine aesthetic, vogue editorial style, vibrant pink and magenta tones, luxury fashion, sparkles and glitter, chic composition, bold makeup style lighting, high fashion, NO TEXT.",
    color: 'bg-pink-700',
    thumbnail: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=150&q=80'
  },
  'anime': {
    label: 'Anime (Ghibli)',
    suffix: "Studio Ghibli art style, hand-painted watercolor backgrounds, whimsical atmosphere, hayao miyazaki style, vibrant nature, detailed clouds, cel shaded characters, soothing colors, anime masterpiece, NO TEXT.",
    color: 'bg-indigo-500',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=150&q=80'
  },
  'lego': {
    label: 'Lego 3D',
    suffix: "Built with lego bricks, plastic texture, macro photography, depth of field, isometric view, playful toy aesthetic, vibrant primary colors, 3d render, detailed brick connections, NO TEXT.",
    color: 'bg-yellow-600',
    thumbnail: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=150&q=80'
  },
  'minimalist': {
    label: 'Minimalista',
    suffix: "Minimalist photography, negative space, clean solid background, single subject, high contrast, studio lighting, museum quality, abstract forms, NO TEXT.",
    color: 'bg-gray-400',
    thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=150&q=80'
  },
  'tech': {
    label: 'Tech',
    suffix: "Cyberpunk aesthetic, neon lighting, dark background, circuit patterns, futuristic interface elements, glowing effects, matrix green and purple tones, sci-fi atmosphere, NO TEXT.",
    color: 'bg-cyan-600',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&q=80'
  }
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
