/**
 * 🏷️ TagInput — Componente reutilizável para adicionar/remover tags
 * 
 * Props:
 * - tags: string[] — lista de tags atuais
 * - onChange: (tags: string[]) => void — callback quando tags mudam
 * - placeholder?: string
 * - maxTags?: number (default 5)
 * - suggestions?: string[] — sugestões ao digitar
 */

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const PRESET_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

const getTagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length];
};

export default function TagInput({ 
  tags = [], 
  onChange, 
  placeholder = 'Adicionar tag...', 
  maxTags = 5, 
  suggestions = [] 
}) {
  // Estado interno para feedback visual imediato — não depende do round-trip do pai
  const [localTags, setLocalTags] = useState(tags);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  // Ref para rastrear a última versão que nós mesmos enviamos ao pai, evitando loop de sync
  const ownUpdateRef = useRef(false);

  // Sincroniza do pai apenas quando a mudança vier de fora (ex: resetForm, handleEdit)
  useEffect(() => {
    if (ownUpdateRef.current) {
      ownUpdateRef.current = false;
      return;
    }
    setLocalTags(tags);
  }, [tags]);

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !localTags.includes(s)
  ).slice(0, 5);

  const notify = (newTags) => {
    ownUpdateRef.current = true;
    onChange?.(newTags);
  };

  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || localTags.includes(trimmed) || localTags.length >= maxTags) return;
    const newTags = [...localTags, trimmed];
    setLocalTags(newTags);
    notify(newTags);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    const newTags = localTags.filter(t => t !== tagToRemove);
    setLocalTags(newTags);
    notify(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation(); // impede submissão do formulário pai
      addTag(input);
      return;
    }
    if (e.key === 'Backspace' && !input && localTags.length > 0) {
      removeTag(localTags[localTags.length - 1]);
    }
  };

  const handleBlur = () => {
    // Confirma a tag ao sair do campo (clicar fora ou Tab)
    if (input.trim()) addTag(input);
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 min-h-[42px] focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all">
        {localTags.map(tag => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getTagColor(tag)}`}
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:opacity-70 transition-opacity"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {localTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => input && setShowSuggestions(true)}
            onBlur={handleBlur}
            placeholder={localTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        )}
      </div>
      
      {localTags.length < maxTags && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {localTags.length}/{maxTags} tags · Enter ou vírgula para adicionar
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 overflow-hidden">
          {filteredSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
