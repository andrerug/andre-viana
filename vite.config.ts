import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A GEMINI_API_KEY NÃO é colocada no código do navegador.
// Ela é lida só pela função de servidor em api/gerar-imagem.ts.
export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
