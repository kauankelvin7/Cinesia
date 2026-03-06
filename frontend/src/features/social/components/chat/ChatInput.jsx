/**
 * @file ChatInput.jsx
 * @description Input de mensagem do chat estilo WhatsApp com emoji picker integrado.
 */

import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Emoji categories with curated emojis
const EMOJI_CATEGORIES = [
  {
    id: 'frequentes',
    icon: '🕐',
    label: 'Frequentes',
    emojis: ['😂', '❤️', '👍', '🔥', '😊', '🎉', '💪', '✨', '😍', '🥰', '😎', '💕', '👏', '🙏', '😢', '🤣'],
  },
  {
    id: 'rostos',
    icon: '😀',
    label: 'Rostos',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑',
      '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🥴', '😵',
      '🤯', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳',
      '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
      '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '💀', '💩', '🤡', '👹',
    ],
  },
  {
    id: 'gestos',
    icon: '👋',
    label: 'Gestos',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘',
      '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾', '🖕',
    ],
  },
  {
    id: 'coracoes',
    icon: '❤️',
    label: 'Corações',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹',
      '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💋', '💯', '💢',
      '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '💤', '🎵', '🎶',
    ],
  },
  {
    id: 'estudo',
    icon: '📚',
    label: 'Estudo',
    emojis: [
      '📚', '📖', '📝', '✏️', '📎', '📌', '📋', '🎓', '🏆', '🥇', '🥈', '🥉',
      '⭐', '🌟', '💡', '🔬', '🔭', '🧠', '🩺', '💊', '🦴', '🦷', '🧬', '🧪',
      '📊', '📈', '📉', '⏰', '⏳', '🗓️', '✅', '❌', '⚡', '🎯', '🚀', '🔥',
    ],
  },
  {
    id: 'natureza',
    icon: '🌸',
    label: 'Natureza',
    emojis: [
      '🌸', '🌹', '🌻', '🌺', '🌷', '🌼', '🍀', '🌿', '🍃', '🌱', '🌳', '🌴',
      '🌵', '🎋', '🌾', '🍁', '🍂', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻',
      '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦋', '🌈', '☀️', '🌙',
    ],
  },
  {
    id: 'comida',
    icon: '🍕',
    label: 'Comida',
    emojis: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍰', '🎂', '🍩', '🍪', '🍫', '🍬',
      '☕', '🍵', '🧃', '🍺', '🍷', '🥤', '🧊', '🍽️', '🥄', '🍴', '🥢',
    ],
  },
];

const EmojiPicker = memo(({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('frequentes');
  const pickerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const category = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
    >
      {/* Category tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 dark:border-slate-700 overflow-x-auto scrollbar-hide">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`
              p-1.5 rounded-lg text-base shrink-0 transition-colors
              ${activeCategory === cat.id
                ? 'bg-primary-100 dark:bg-primary-900/40'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }
            `}
            title={cat.label}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 h-44 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mb-1.5">
          {category?.label}
        </p>
        <div className="grid grid-cols-8 gap-0.5">
          {category?.emojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
EmojiPicker.displayName = 'EmojiPicker';

const ChatInput = memo(({ onSend, onTyping, disabled }) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setShowEmojis(false);
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

  const handleEmojiSelect = useCallback((emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const toggleEmojis = useCallback(() => {
    setShowEmojis((prev) => !prev);
  }, []);

  const hasText = text.trim().length > 0;

  return (
    <div className="relative border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojis(false)}
          />
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-2.5">
        {/* Emoji toggle */}
        <button
          onClick={toggleEmojis}
          className={`
            p-2 rounded-full transition-all shrink-0
            ${showEmojis
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }
          `}
          aria-label={showEmojis ? 'Fechar emojis' : 'Abrir emojis'}
          title="Emojis"
        >
          {showEmojis ? <X size={20} /> : <Smile size={20} />}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none text-sm px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/30 transition-all max-h-28 overflow-y-auto"
            style={{ minHeight: '42px' }}
            onFocus={() => setShowEmojis(false)}
          />
        </div>

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={!hasText || disabled}
          className={`
            p-2.5 rounded-full transition-all shrink-0 shadow-sm
            ${hasText
              ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/25 hover:shadow-md'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }
          `}
          whileTap={hasText ? { scale: 0.9 } : {}}
          aria-label="Enviar mensagem"
        >
          <Send size={18} className={hasText ? 'translate-x-0.5 -translate-y-0.5' : ''} />
        </motion.button>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
export default ChatInput;
