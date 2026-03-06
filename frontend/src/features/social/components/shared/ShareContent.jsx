/**
 * @file ShareContent.jsx
 * @description Card de conteúdo compartilhado no chat (resumo ou flashcard).
 */

import React, { memo } from 'react';
import { FileText, Layers } from 'lucide-react';

const ShareContent = memo(({ content, onOpen }) => {
  if (!content) return null;

  const isResumo = content.type === 'resumo';

  return (
    <div
      className={`
        rounded-xl p-3 cursor-pointer transition-colors
        ${isResumo
          ? 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15'
          : 'bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15'
        }
      `}
      onClick={() => onOpen?.(content)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(content)}
    >
      <div className="flex items-start gap-2.5">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center shrink-0
          ${isResumo ? 'bg-blue-500/20' : 'bg-purple-500/20'}
        `}>
          {isResumo
            ? <FileText size={16} className="text-blue-500" />
            : <Layers size={16} className="text-purple-500" />
          }
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold ${isResumo ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
            {isResumo ? 'Resumo' : 'Flashcards'}
          </p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {content.title || content.deckName || 'Sem título'}
          </p>
          {content.preview && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              {content.preview}
            </p>
          )}
          {content.materia && (
            <span className="inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
              {content.materia}
            </span>
          )}
        </div>

        <span className={`text-[10px] font-medium mt-0.5 ${isResumo ? 'text-blue-500' : 'text-purple-500'}`}>
          Abrir →
        </span>
      </div>
    </div>
  );
});

ShareContent.displayName = 'ShareContent';
export default ShareContent;
