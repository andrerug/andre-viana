
import React from 'react';
import { CarouselItem, AspectRatioType } from '../types';

interface CardDisplayProps {
  item: CarouselItem;
  onRetry: (item: CarouselItem) => void;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ item, onRetry }) => {
  const getReadableError = (msg?: string) => {
    if (!msg) return "Erro desconhecido";
    if (msg.includes("UNAUTHENTICATED") || msg.includes("401")) return "Erro de Autenticação.";
    if (msg.includes("503") || msg.includes("overloaded")) return "Servidor sobrecarregado.";
    if (msg.includes("SAFETY")) return "Conteúdo bloqueado.";
    return msg.length > 80 ? msg.substring(0, 80) + "..." : msg;
  };

  // Mapeamento de classes de aspecto do Tailwind
  const aspectClassMap: Record<AspectRatioType, string> = {
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-[16/9]",
    "4:3": "aspect-[4/3]"
  };

  // Usa a proporção salva no item no momento em que foi adicionado
  const currentAspect = item.config?.aspectRatio || "4:5";

  return (
    <div className="bg-brand-card rounded-2xl overflow-hidden border border-gray-800 flex flex-col h-full group transition-all hover:border-brand-blue/50">
      
      <div className={`relative ${aspectClassMap[currentAspect]} bg-gray-900 w-full overflow-hidden`}>
        {item.status === 'completed' && item.imageUrl ? (
          <>
            <img 
              src={item.imageUrl} 
              alt={item.pageLabel} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <a 
                href={item.imageUrl} 
                download={`${item.pageLabel}.png`}
                className="w-full py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-[10px] font-black uppercase tracking-widest text-center"
              >
                Download
              </a>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
             {item.status === 'generating' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-brand-blue font-black tracking-widest">GERANDO...</span>
                </div>
             )}
             {item.status === 'pending' && <span className="text-gray-700 text-xs font-bold uppercase tracking-widest animate-pulse">Aguardando</span>}
             {item.status === 'error' && (
               <div className="space-y-3">
                 <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                   <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div className="text-[10px] text-red-400/80 leading-tight px-2">
                   {getReadableError(item.errorMsg)}
                 </div>
                 <button onClick={() => onRetry(item)} className="text-[10px] bg-gray-800 px-4 py-2 rounded-xl border border-gray-700 font-bold">Tentar</button>
               </div>
             )}
          </div>
        )}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md text-[9px] font-black text-white rounded-lg border border-white/10 uppercase">
          {item.pageLabel}
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-brand-blue/30 backdrop-blur-md text-[8px] font-black text-white rounded-lg border border-brand-blue/30 uppercase">
          {item.config.style}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 bg-[#1A1D24] flex-1">
        <p className="text-[11px] text-gray-400 line-clamp-3 font-medium leading-relaxed italic">"{item.prompt}"</p>
      </div>
    </div>
  );
};
