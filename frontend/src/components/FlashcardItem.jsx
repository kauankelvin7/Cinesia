/**
 * 🎴 FLASHCARD ITEM - Card com Animação 3D Flip
 * * Componente individual de flashcard com efeito de virar
 * Design Clean com sombras e cores da matéria
 * * OTIMIZAÇÕES v2.0:
 * - React.memo para evitar re-renders desnecessários
 * - useCallback para handlers estáveis
 * - Animações GPU-accelerated (transform only)
 * - Lazy loading de imagens
 */

import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, RotateCcw, ChevronLeft } from 'lucide-react';
import OptimizedImage from './ui/OptimizedImage';

// Helper para criar fundo translúcido a partir de um HEX
const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(14, 165, 233, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16) || 14;
  const g = parseInt(hex.slice(3, 5), 16) || 165;
  const b = parseInt(hex.slice(5, 7), 16) || 233;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const FlashcardItem = memo(({ 
  flashcard, 
  onEdit, 
  onDelete,
  showActions = true 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // useCallback para evitar recriação de funções
  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit(flashcard);
  }, [onEdit, flashcard]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(flashcard);
  }, [onDelete, flashcard]);

  const materiaColor = flashcard.materiaCor || '#0EA5E9';

  return (
    <div 
      className="group perspective-1000 h-[280px] w-full cursor-pointer"
      onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-500 transform-style-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ==================== FRENTE - Pergunta ==================== */}
        <div 
          className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-[20px] p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 group-hover:shadow-xl shadow-md border border-slate-200/80 dark:border-slate-700/80"
          style={{ 
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Efeito de brilho de fundo no topo */}
          <div 
            className="absolute top-0 left-0 right-0 h-24 opacity-10 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, ${materiaColor}, transparent)` }}
          />

          <div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              {/* Badge da matéria Premium */}
              <div 
                className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm"
                style={{ 
                  backgroundColor: hexToRgba(materiaColor, 0.15),
                  color: materiaColor,
                  border: `1px solid ${hexToRgba(materiaColor, 0.3)}`
                }}
              >
                <span className="truncate max-w-[140px]">{flashcard.materiaNome || 'Sem matéria'}</span>
              </div>

              {/* Botões de Ação com Glassmorphism */}
              {showActions && (
                <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-1 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <button
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 dark:bg-slate-700 dark:hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors active:scale-95"
                    title="Editar"
                    aria-label="Editar flashcard"
                  >
                    <Edit2 size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/50 text-slate-400 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 transition-colors active:scale-95"
                    title="Excluir"
                    aria-label="Excluir flashcard"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-[16px] sm:text-[17px] font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-4 relative z-10">
              {flashcard.pergunta}
            </h3>

            {flashcard.tags && flashcard.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 relative z-10">
                {flashcard.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                    #{tag}
                  </span>
                ))}
                {flashcard.tags.length > 3 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-400">+{flashcard.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="text-center pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50">
            <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <RotateCcw size={14} /> Clique para virar
            </p>
          </div>
        </div>

        {/* ==================== VERSO - Resposta ==================== */}
        <div 
          className="absolute inset-0 backface-hidden rounded-[20px] shadow-lg border border-slate-200/50 dark:border-slate-700/50 p-6 flex flex-col overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(145deg, ${hexToRgba(materiaColor, 0.05)} 0%, ${hexToRgba(materiaColor, 0.15)} 100%)`,
            backgroundColor: 'var(--bg-surface)' // Fallback responsivo dark/light
          }}
        >
          <div className="overflow-y-auto flex-1 custom-scrollbar pr-1">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: materiaColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: materiaColor }} />
              Resposta
            </h3>
            
            <p className="text-[15px] sm:text-[16px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {flashcard.resposta}
            </p>

            {flashcard.imagemUrl && (
              <div className="mt-4 rounded-xl overflow-hidden shadow-md border border-white/20 dark:border-slate-700">
                <OptimizedImage 
                  src={flashcard.imagemUrl} 
                  alt="Imagem do flashcard"
                  className="w-full h-24 sm:h-32 object-cover hover:scale-105 transition-transform duration-500"
                  height={128}
                />
              </div>
            )}
          </div>

          <div className="text-center mt-4 pt-3 shrink-0">
            <p className="text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ color: materiaColor }}>
              <ChevronLeft size={14} strokeWidth={2.5} /> Voltar
            </p>
          </div>
        </div>

      </motion.div>

      {/* CSS para Scrollbar estilizada do verso */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
});

FlashcardItem.displayName = 'FlashcardItem';

export default FlashcardItem;