/**
 * Design system André Viana — preset do Tailwind (v3).
 * As cores apontam para as variáveis de tokens.css, então o tema claro/escuro
 * troca sozinho pelo atributo <html data-theme="...">. Carregue tokens.css antes.
 *
 * Projeto com build (Vite):   presets: [require('./tailwind.preset.js')]
 * Tailwind pelo CDN:           tailwind.config = { presets: [avPreset] }  (cole o objeto abaixo num <script>)
 *
 * Transparência: use os tokens "-suave" (bg-primaria-suave) em vez de bg-primaria/20,
 * porque cor em var() não aceita o modificador de opacidade.
 */
const avPreset = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      colors: {
        fundo: 'var(--av-fundo)',
        superficie: { DEFAULT: 'var(--av-superficie)', 2: 'var(--av-superficie-2)' },
        texto: { DEFAULT: 'var(--av-texto)', suave: 'var(--av-texto-suave)' },
        linha: { DEFAULT: 'var(--av-linha)', forte: 'var(--av-linha-forte)' },
        primaria: { DEFAULT: 'var(--av-primaria)', hover: 'var(--av-primaria-hover)', suave: 'var(--av-primaria-suave)', sobre: 'var(--av-sobre-primaria)' },
        marca: { DEFAULT: 'var(--av-marca)', texto: 'var(--av-marca-texto)', suave: 'var(--av-marca-suave)' },
        sucesso: { DEFAULT: 'var(--av-sucesso)', suave: 'var(--av-sucesso-suave)' },
        atencao: { DEFAULT: 'var(--av-atencao)', sobre: 'var(--av-sobre-atencao)', suave: 'var(--av-atencao-suave)' },
        erro: { DEFAULT: 'var(--av-erro)', suave: 'var(--av-erro-suave)' },
        info: { DEFAULT: 'var(--av-info)', suave: 'var(--av-info-suave)' },
        // camada de estudo (mesmos significados das skills de estudo)
        disciplina: {
          portugues: { DEFAULT: 'var(--av-disc-portugues)', suave: 'var(--av-disc-portugues-suave)', borda: 'var(--av-disc-portugues-borda)' },
          legislacao: { DEFAULT: 'var(--av-disc-legislacao)', suave: 'var(--av-disc-legislacao-suave)', borda: 'var(--av-disc-legislacao-borda)' },
          gestao: { DEFAULT: 'var(--av-disc-gestao)', suave: 'var(--av-disc-gestao-suave)', borda: 'var(--av-disc-gestao-borda)' },
          informatica: { DEFAULT: 'var(--av-disc-informatica)', suave: 'var(--av-disc-informatica-suave)', borda: 'var(--av-disc-informatica-borda)' },
          especificos: { DEFAULT: 'var(--av-disc-especificos)', suave: 'var(--av-disc-especificos-suave)', borda: 'var(--av-disc-especificos-borda)' },
        },
        marcador: {
          gatilho: 'var(--av-mark-gatilho)', pegadinha: 'var(--av-mark-pegadinha)', regra: 'var(--av-mark-regra)',
          numero: 'var(--av-mark-numero)', fase: 'var(--av-mark-fase)',
        },
      },
      borderRadius: { p: 'var(--av-raio-p)', m: 'var(--av-raio-m)', g: 'var(--av-raio-g)' },
      boxShadow: { 1: 'var(--av-sombra-1)', 2: 'var(--av-sombra-2)' },
      backgroundImage: { assinatura: 'var(--av-assinatura)' },
      fontSize: {
        xs: ['0.8125rem', '1.45'], sm: ['0.9375rem', '1.5'], base: ['1.0625rem', '1.55'], lg: ['1.25rem', '1.5'],
        'titulo-4': ['1.375rem', '1.2'], 'titulo-3': ['1.75rem', '1.1'], 'titulo-2': ['2.25rem', '1.05'],
        'titulo-1': ['clamp(2.5rem, 5.6vw, 4.5rem)', '1.02'],
      },
      minHeight: { alvo: '44px' },
      maxWidth: { conteudo: '1120px', leitura: '68ch' },
      transitionTimingFunction: { av: 'cubic-bezier(.2,.7,.2,1)' },
    },
  },
};

if (typeof module !== 'undefined') module.exports = avPreset;
if (typeof window !== 'undefined') window.avPreset = avPreset;

/* ---- Tailwind v4 (projetos novos): cole no CSS principal, depois de @import "tailwindcss"; ----
@theme inline {
  --font-sans: "Archivo", system-ui, sans-serif;
  --color-fundo: var(--av-fundo);
  --color-superficie: var(--av-superficie);
  --color-superficie-2: var(--av-superficie-2);
  --color-texto: var(--av-texto);
  --color-texto-suave: var(--av-texto-suave);
  --color-linha: var(--av-linha);
  --color-primaria: var(--av-primaria);
  --color-primaria-suave: var(--av-primaria-suave);
  --color-marca: var(--av-marca);
  --color-sucesso: var(--av-sucesso);
  --color-atencao: var(--av-atencao);
  --color-erro: var(--av-erro);
  --color-info: var(--av-info);
  --radius-p: var(--av-raio-p);
  --radius-m: var(--av-raio-m);
  --radius-g: var(--av-raio-g);
}
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
*/
