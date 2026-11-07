<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Criador de Ilustrações em Lote

Gera várias imagens de uma vez a partir de um roteiro (`**P1** ... --- **P2** ...`), com o Gemini.

## Como funciona a segurança

- A chave do Gemini (`GEMINI_API_KEY`) fica **só no servidor**, na função `api/gerar-imagem.ts` da Vercel. Ela não vai para o código do navegador.
- O app pede uma **senha de acesso** (`SENHA_APP`), que fica guardada no navegador. Sem ela, a função recusa o pedido, e ninguém de fora gasta a sua cota.

## Variáveis na Vercel (Settings > Environment Variables)

| Nome | O que é |
| --- | --- |
| `GEMINI_API_KEY` | Chave do Google AI Studio (aistudio.google.com/apikey) |
| `SENHA_APP` | Senha de acesso que você escolher |

Depois de mudar uma variável, faça um novo deploy (Deployments > ⋯ > Redeploy).

## Modelos

- Flash: `gemini-2.5-flash-image`
- Pro 1K/2K: `gemini-3-pro-image`

## Rodar localmente

Requer Node.js e a CLI da Vercel (a função `/api` só roda com ela):

1. `npm install`
2. Crie `.env.local` com `GEMINI_API_KEY=...` e `SENHA_APP=...`
3. `npx vercel dev`
