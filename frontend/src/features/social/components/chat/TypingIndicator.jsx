/**
 * @file TypingIndicator.jsx
 * @description Animação de "digitando..." com 3 bolinhas pulsantes.
 */

import React, { memo } from 'react';

const TypingIndicator = memo(({ typingUsers }) => {
  if (!typingUsers?.length) return null;

  const names = typingUsers.map((t) => t.userId).join(', ');

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className="flex gap-0.5 items-center">
        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 italic">
        digitando...
      </span>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
export default TypingIndicator;
