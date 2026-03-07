/**
 * ⌨️ CHAT INPUT
 * * Interface de entrada otimizada para agilidade e precisão.
 * - Emoji picker customizado com navegação fluida
 * - Textarea auto-expansível com foco dinâmico
 * - Design consistente com o ecossistema Cinesia
 */

import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJI_CATEGORIES = [
  { id: 'frequentes', icon: '🕐', label: 'Frequentes', emojis: ['😂', '❤️', '👍', '🔥', '😊', '🎉', '💪', '✨', '😍', '🥰', '😎', '💕', '👏', '🙏', '😢', '🤣'] },
  { id: 'rostos', icon: '😀', label: 'Rostos', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🥴', '😵', '🤯', '🥳', '😎', '🤓', '🧐'] },
  { id: 'gestos', icon: '👍', label: 'Gestos', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾'] },
  { id: 'estudo', icon: '🧠', label: 'Estudo', emojis: ['📚', '📖', '📝', '✏️', '📎', '📌', '📋', '🎓', '🏆', '🥇', '⭐', '🌟', '💡', '🔬', '🔭', '🧠', '🩺', '💊', '🦴', '🦷', '🧬', '🧪', '📊', '📈', '✅', '❌', '⚡', '🎯', '🚀'] },
];

const EmojiPicker = memo(({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('frequentes');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const category = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className="absolute bottom-full left-0 right-0 mb-3 mx-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
    >
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-x-auto no-scrollbar">
        {EMOJI_CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative p-2 rounded-xl text-lg transition-all ${active ? 'bg-white dark:bg-slate-700 shadow-sm scale-110' : 'hover:bg-white/50 dark:hover:bg-slate-800'}`}
            >
              {cat.icon}
              {active && <motion.div layoutId="activeCat" className="absolute -bottom-1 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />}
            </button>
          );
        })}
      </div>

      <div className="p-3 h-48 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-7 gap-1">
          {category?.emojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className="w-10 h-10 flex items-center justify-center text-2xl rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-75"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

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
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
      inputRef.current.focus();
    }
  }, [text, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.();
    // Auto-resize logic
    e.target.style.height = '44px';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="relative border-t border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 py-3 pb-safe">
      <AnimatePresence>
        {showEmojis && <EmojiPicker onSelect={(emoji) => setText(p => p + emoji)} onClose={() => setShowEmojis(false)} />}
      </AnimatePresence>

      <div className="flex items-end gap-3 max-w-5xl mx-auto">
        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className={`p-2.5 rounded-2xl transition-all ${showEmojis ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
        >
          {showEmojis ? <X size={22} strokeWidth={2.5} /> : <Smile size={22} strokeWidth={2.5} />}
        </button>

        {/* Input Field */}
        <div className="flex-1 relative group">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Escreva sua mensagem..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none text-[15px] font-medium px-4 py-3 rounded-[20px] bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-300 no-scrollbar"
            style={{ minHeight: '44px', lineHeight: '20px' }}
            onFocus={() => setShowEmojis(false)}
          />
        </div>

        {/* Action Button */}
        <div className="h-[44px] flex items-center">
          <AnimatePresence mode="wait">
            {hasText ? (
              <motion.button
                key="send"
                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                onClick={handleSend}
                className="w-11 h-11 rounded-[18px] bg-gradient-to-br from-indigo-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 active:scale-90"
              >
                <Send size={18} strokeWidth={3} className="ml-0.5" />
              </motion.button>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-11 h-11 flex items-center justify-center text-slate-300 dark:text-slate-700"
              >
                <Sparkles size={20} strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
export default ChatInput;