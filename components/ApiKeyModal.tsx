import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSubmit: (senha: string) => void;
  error?: string | null;
}

// Tela de acesso: pede a senha do app (a chave do Gemini fica no servidor).
export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSubmit, error }) => {
  const [senha, setSenha] = useState('');

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.trim()) onSubmit(senha.trim());
  };

  return (
    <div className="min-h-screen bg-fundo text-texto flex flex-col">
      <div className="h-[2px] bg-assinatura" aria-hidden="true"></div>
      <main className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={enviar} className="bg-superficie border border-linha rounded-g p-6 sm:p-8 max-w-md w-full shadow-2 space-y-6">
          <div className="flex items-center gap-3">
            <span className="av-marca-simbolo" aria-hidden="true"></span>
            <span className="font-bold">Criador de Ilustrações</span>
          </div>

          <div>
            <h1 className="text-titulo-3 font-extrabold mb-2" style={{ fontVariationSettings: '"wdth" 80' }}>Entrar</h1>
            <p className="text-texto-suave">Digite a senha de acesso. Ela fica guardada neste navegador.</p>
          </div>

          {error && (
            <div className="av-aviso av-aviso--erro" role="alert">
              <span className="av-aviso-icone" aria-hidden="true">×</span>
              <div><strong>Não foi possível entrar</strong>{error}</div>
            </div>
          )}

          <div className="av-campo">
            <label htmlFor="senha">Senha de acesso</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
              autoComplete="current-password"
              aria-invalid={!!error}
            />
          </div>

          <button type="submit" disabled={!senha.trim()} className="av-btn av-btn--primario w-full">
            Entrar
          </button>
        </form>
      </main>
    </div>
  );
};
