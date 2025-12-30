
import React from 'react';

interface ApiKeyModalProps {
  onSelect: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSelect, isLoading, error }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#1A1D24] border border-brand-blue/30 rounded-3xl p-10 max-w-md w-full shadow-2xl shadow-brand-blue/20">
        <div className="text-center space-y-8">
          <div className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center mx-auto border border-brand-blue/40 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Ative o Gerador</h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              Para acessar o modelo <strong>Gemini 3 Pro</strong> e gerar imagens de alta resolução, conecte sua chave de um projeto com faturamento ativo.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-400 text-left animate-in slide-in-from-top-2">
              <div className="font-black uppercase tracking-wider mb-1">Erro de Conexão</div>
              <p className="opacity-90 leading-tight">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onSelect}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-brand-blue hover:bg-blue-500 text-white font-black rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-brand-blue/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Conectar Projeto Google</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
            
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              Documentação de Faturamento
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
