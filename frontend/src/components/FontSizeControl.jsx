/**
 * 🔍 FontSizeControl Component - Acessibilidade a11y Premium
 * * Controle visual de tamanho de fonte integrado ao Design System
 * Design premium com animações de deslizamento e feedback visual progressivo
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Type, Sparkles } from 'lucide-react';
import { useFontSize } from '../utils/useFontSize';

const FontSizeControl = ({ variant = 'default' }) => {
  const { fontSize, increaseFontSize, decreaseFontSize, setSpecificSize, isMinSize, isMaxSize } = useFontSize();

  // Variante compacta para mobile ou toolbars
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl px-2 py-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div className="p-1.5 text-slate-400">
          <Type size={14} strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={decreaseFontSize}
            disabled={isMinSize}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 font-bold text-xs"
            aria-label="Diminuir fonte"
          >
            A-
          </button>
          <button
            onClick={() => setSpecificSize('normal')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all font-bold text-sm ${
              fontSize === 'normal' 
                ? 'bg-indigo-500 text-white shadow-sm' 
                : 'hover:bg-white dark:hover:bg-slate-800 text-slate-500'
            }`}
          >
            A
          </button>
          <button
            onClick={increaseFontSize}
            disabled={isMaxSize}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 font-bold text-base"
            aria-label="Aumentar fonte"
          >
            A+
          </button>
        </div>
      </div>
    );
  }

  // Variante Padrão (Usada em Configurações)
  const options = [
    { key: 'normal', label: 'Normal', sizeCls: 'text-[13px]' },
    { key: 'grande', label: 'Grande', sizeCls: 'text-[16px]' },
    { key: 'extraGrande', label: 'Extra', sizeCls: 'text-[20px]' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Type size={16} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">Tamanho da Fonte</h3>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
              {fontSize === 'normal' && '16px'}
              {fontSize === 'grande' && '18px'}
              {fontSize === 'extraGrande' && '20px'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
          <Sparkles size={10} className="text-amber-500" />
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tighter">Acessibilidade</span>
        </div>
      </div>

      <div className="relative flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-[16px] border border-slate-200/50 dark:border-slate-800 shadow-inner">
        {options.map((opt) => {
          const active = fontSize === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setSpecificSize(opt.key)}
              className={`relative flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 z-10 ${
                active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {active && (
                <motion.div 
                  layoutId="activeFontSize"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`font-black relative z-20 ${opt.sizeCls}`}>A</span>
              <span className="text-[10px] font-bold uppercase tracking-tighter relative z-20 mt-0.5">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[12px] font-medium text-slate-400 italic">
        "O tamanho ideal do texto melhora a retenção do conteúdo em 20%."
      </p>
    </div>
  );
};

export default FontSizeControl;