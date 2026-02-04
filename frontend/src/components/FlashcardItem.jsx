/**
 * 🎴 FLASHCARD ITEM - Card com Animação 3D Flip
 * 
 * Componente individual de flashcard com efeito de virar
 * Design Clean com sombras e cores da matéria
 * 
 * OTIMIZAÇÕES v2.0:
 * - React.memo para evitar re-renders desnecessários
 * - useCallback para handlers estáveis
 * - Animações GPU-accelerated (transform only)
 * - Lazy loading de imagens
 */

import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import Badge from './ui/Badge';
import OptimizedImage from './ui/OptimizedImage';

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

  return (
    <div 
      className="group perspective-1000 h-72 cursor-pointer min-h-[280px]"
      onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-500 transform-style-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRENTE - Pergunta */}
        <div 
          className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-5 flex flex-col justify-between hover:shadow-xl transition-shadow"
          style={{ 
            backfaceVisibility: 'hidden',
            borderTopColor: flashcard.materiaCor || '#14B8A6',
            borderTopWidth: '4px'
          }}
        >
          <div>
            <div className="flex items-start justify-between mb-3">
              <Badge color={flashcard.materiaCor} size="sm">
                <span className="truncate block max-w-[120px]">{flashcard.materiaNome || 'Sem matéria'}</span>
              </Badge>
              {showActions && (
                <div className="flex gap-1">
                  <button
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors"
                    title="Editar"
                    aria-label="Editar flashcard"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Excluir"
                    aria-label="Excluir flashcard"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 line-clamp-3">
              {flashcard.pergunta}
            </h3>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">
              Clique para ver a resposta →
            </p>
          </div>
        </div>

        {/* VERSO - Resposta */}
        <div 
          className="absolute inset-0 backface-hidden bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl shadow-lg border-2 p-5 flex flex-col justify-between"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderColor: flashcard.materiaCor || '#14B8A6'
          }}
        >
          <div className="overflow-y-auto flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: flashcard.materiaCor || '#14B8A6' }}
              />
              Resposta
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
              {flashcard.resposta}
            </p>

            {flashcard.imagemUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border-2 border-white shadow-md">
                <OptimizedImage 
                  src={flashcard.imagemUrl} 
                  alt="Imagem do flashcard"
                  className="w-full h-24 sm:h-32"
                  height={128}
                />
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: flashcard.materiaCor || '#14B8A6' }}>
              ← Clique para voltar
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

FlashcardItem.displayName = 'FlashcardItem';

export default FlashcardItem;
