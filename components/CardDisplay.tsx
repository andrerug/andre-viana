import React, { useState } from 'react';
import { CarouselItem, AspectRatioType } from '../types';
import { STYLES } from '../constants';
import { extensaoDoMime } from '../services/zip';

interface CardDisplayProps {
  item: CarouselItem;
  onRetry: (item: CarouselItem) => void;
  onEdit: (item: CarouselItem, novoPrompt: string) => void;
  onVariation: (item: CarouselItem) => void;
  onRemove: (item: CarouselItem) => void;
}

// Mensagens de erro em linguagem simples: o que houve e o que fazer.
const erroLegivel = (msg?: string) => {
  if (!msg) return 'Não foi possível gerar esta imagem. Tente de novo.';
  if (/UNAUTHENTICATED|401/.test(msg)) return 'A senha de acesso não confere. Entre de novo.';
  if (/503|overloaded|sobrecarregado/i.test(msg)) return 'O Gemini está ocupado. Tente de novo em 1 minuto.';
  if (/SAFETY|segurança/i.test(msg)) return 'O Google bloqueou esta descrição. Edite o pedido e gere de novo.';
  return msg.length > 140 ? msg.slice(0, 140) + '…' : msg;
};

const aspectClassMap: Record<AspectRatioType, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-[16/9]',
  '4:3': 'aspect-[4/3]',
};

export const CardDisplay: React.FC<CardDisplayProps> = ({ item, onRetry, onEdit, onVariation, onRemove }) => {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(item.prompt);
  const proporcao = item.config?.aspectRatio || '4:5';
  const estilo = STYLES[item.config.style]?.label || item.config.style;
  const ocupado = item.status === 'generating' || item.status === 'pending';
  const mime = item.imageUrl ? (/data:([^;]+)/.exec(item.imageUrl)?.[1] || 'image/png') : 'image/png';
  const nomeArquivo = `${item.pageLabel.replace(/[^\p{L}\p{N}]+/gu, '_')}_${item.config.style}.${extensaoDoMime(mime)}`;

  return (
    <article className="bg-superficie border border-linha rounded-m overflow-hidden flex flex-col" aria-label={`Ilustração ${item.pageLabel}`}>
      <div className={`relative ${aspectClassMap[proporcao]} bg-superficie-2 w-full overflow-hidden`}>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={`${item.pageLabel}: ${item.prompt.slice(0, 120)}`} className={`w-full h-full object-cover ${item.status === 'completed' ? '' : 'opacity-30'}`} />
        )}
        {item.status !== 'completed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3">
            {item.status === 'generating' && (
              <>
                <div className="w-8 h-8 border-[3px] border-primaria border-t-transparent rounded-full motion-safe:animate-spin" aria-hidden="true"></div>
                <span className="text-sm font-semibold text-texto">Gerando…</span>
              </>
            )}
            {item.status === 'pending' && <span className="text-sm font-semibold text-texto">Na fila</span>}
            {item.status === 'cancelled' && <span className="text-sm font-semibold text-texto">Parada</span>}
            {item.status === 'error' && (
              <>
                <span className="w-9 h-9 rounded-full bg-erro text-white grid place-items-center font-bold" aria-hidden="true">!</span>
                <p className="text-sm text-texto max-w-[28ch]">{erroLegivel(item.errorMsg)}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="av-tag">{item.pageLabel}</span>
          <span className="av-tag av-tag--marca">{estilo}</span>
          {item.config.referencia && <span className="text-xs text-texto-suave">com referência</span>}
        </div>

        {editando ? (
          <div className="av-campo" style={{ marginBottom: 0 }}>
            <label htmlFor={`p-${item.id}`}>Descrição desta imagem</label>
            <textarea id={`p-${item.id}`} value={rascunho} onChange={e => setRascunho(e.target.value)} className="!min-h-[110px] text-sm" />
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="av-btn av-btn--primario av-btn--pequeno" disabled={!rascunho.trim()}
                onClick={() => { onEdit(item, rascunho.trim()); setEditando(false); }}>Gerar de novo</button>
              <button type="button" className="av-btn av-btn--fantasma av-btn--pequeno" onClick={() => { setRascunho(item.prompt); setEditando(false); }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-texto-suave line-clamp-3">{item.prompt}</p>
        )}

        {!editando && (
          <div className="mt-auto flex flex-wrap gap-2">
            {item.imageUrl && !ocupado && (
              <a href={item.imageUrl} download={nomeArquivo} className="av-btn av-btn--secundario av-btn--pequeno">Baixar</a>
            )}
            {(item.status === 'error' || item.status === 'cancelled') && (
              <button type="button" className="av-btn av-btn--secundario av-btn--pequeno" onClick={() => onRetry(item)}>Tentar de novo</button>
            )}
            <button type="button" className="av-btn av-btn--fantasma av-btn--pequeno" disabled={ocupado} onClick={() => { setRascunho(item.prompt); setEditando(true); }}>Editar</button>
            {item.status === 'completed' && (
              <button type="button" className="av-btn av-btn--fantasma av-btn--pequeno" onClick={() => onVariation(item)}>Variação</button>
            )}
            <button type="button" className="av-btn av-btn--fantasma av-btn--pequeno" onClick={() => onRemove(item)} aria-label={`Remover ${item.pageLabel}`}>Remover</button>
          </div>
        )}
      </div>
    </article>
  );
};
