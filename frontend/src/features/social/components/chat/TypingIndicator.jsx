/**
 * ✏️ TYPING INDICATOR
 * * Animação orgânica de feedback de digitação.
 * - Efeito de onda suave com Framer Motion
 * - Design consistente com bolhas de mensagem Cinesia
 * - Suporte a múltiplos usuários simultâneos
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = memo(({ typingUsers }) => {
  if (!typingUsers?.length) return null;

  // Extração inteligente de nomes para não poluir o layout
  const names = typingUsers
    .map((t) => t.userName || 'Alguém')
    .map((name) => name.split(' ')[0])
    .join(', ');

  const dotTransition = {
    duration: 0.6,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-start gap-2 mb-4 mt-2 px-1"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl rounded-bl-none bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
        
        {/* Animação de Pontos Premium */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8] 
              }}
              transition={{ 
                ...dotTransition,
                delay: i * 0.2 
              }}
            />
          ))}
        </div>

        {/* Texto de Status */}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {names} <span className="animate-pulse">escrevendo</span>
        </span>
      </div>
    </motion.div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
export default TypingIndicator;