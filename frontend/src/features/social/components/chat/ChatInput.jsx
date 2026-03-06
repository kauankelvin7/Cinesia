/**
 * @file ChatInput.jsx
 * @description Input de mensagem do chat com suporte a typing indicator.
 */

import React, { memo, useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';

const ChatInput = memo(({ onSend, onTyping, disabled }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  }, [text, onSend]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleChange = useCallback(
    (e) => {
      setText(e.target.value);
      onTyping?.();
    },
    [onTyping],
  );

  return (
    <div className="flex items-end gap-2 p-3 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma mensagem..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none text-sm px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all max-h-24 overflow-y-auto"
        style={{ minHeight: '38px' }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="p-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        aria-label="Enviar mensagem"
      >
        <Send size={16} />
      </button>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
export default ChatInput;
