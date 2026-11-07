
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#1A1D24] border border-brand-blue/30 rounded-3xl p-10 max-w-md w-full shadow-2xl shadow-brand-blue/20">
        <form onSubmit={enviar} className="text-center space-y-8">
          <div className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center mx-auto border border-brand-blue/40 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Acesso ao Gerador</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              Digite a senha de acesso. Ela fica guardada neste navegador.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-400 text-left animate-in slide-in-from-top-2">
              <div className="font-black uppercase tracking-wider mb-1">Não foi possível entrar</div>
              <p className="opacity-90 leading-tight">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha de acesso"
              autoFocus
              autoComplete="current-password"
              aria-label="Senha de acesso"
              className="w-full py-4 px-5 bg-black/40 border border-gray-700 rounded-2xl text-white outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              disabled={!senha.trim()}
              className="w-full py-4 px-6 bg-brand-blue hover:bg-blue-500 text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-brand-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
