/**
 * @file TypingIndicator.jsx
 * @description Animação de "digitando..." estilo WhatsApp — bolha com bolinhas pulsantes e nome.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = memo(({ typingUsers }) => {
  if (!typingUsers?.length) return null;

  const names = typingUsers
    .map((t) => t.userName || 'Alguém')
    .map((name) => name.split(' ')[0]) // primeiro nome apenas
    .join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-start gap-2 mb-1"
    >
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
          <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {names} digitando...
        </span>
      </div>
    </motion.div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
export default TypingIndicator;
