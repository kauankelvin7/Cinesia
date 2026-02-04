/**
 * 🔍 FontSizeControl Component - Acessibilidade a11y
 * 
 * Controle visual de tamanho de fonte com 3 botões (A-, A, A+)
 * Design premium com animações e feedback visual
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Type } from 'lucide-react';
import { useFontSize } from '../utils/useFontSize';

const FontSizeControl = ({ variant = 'default' }) => {
  const { fontSize, increaseFontSize, decreaseFontSize, setSpecificSize, isMinSize, isMaxSize } = useFontSize();

  // Variante compacta para mobile
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200/50 shadow-sm">
        <Type size={16} className="text-slate-600" />
        <div className="flex items-center gap-1">
          <button
            onClick={decreaseFontSize}
            disabled={isMinSize}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold"
            aria-label="Diminuir tamanho da fonte"
          >
            A-
          </button>
          <button
            onClick={() => setSpecificSize('normal')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-slate-700 font-bold ${
              fontSize === 'normal' ? 'bg-teal-100 text-teal-700' : 'hover:bg-slate-100'
            }`}
            aria-label="Tamanho normal"
          >
            A
          </button>
          <button
            onClick={increaseFontSize}
            disabled={isMaxSize}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-lg"
            aria-label="Aumentar tamanho da fonte"
          >
            A+
          </button>
        </div>
      </div>
    );
  }

  // Variante padrão com labels
  return (
    <motion.div 
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
          <Type size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Tamanho do Texto</h3>
          <p className="text-xs text-slate-500">
            {fontSize === 'normal' && 'Normal (16px)'}
            {fontSize === 'grande' && 'Grande (18px)'}
            {fontSize === 'extraGrande' && 'Extra Grande (20px)'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <motion.button
          onClick={() => setSpecificSize('normal')}
          className={`px-3 py-2 rounded-lg font-bold transition-all duration-200 ${
            fontSize === 'normal'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Tamanho normal"
          aria-pressed={fontSize === 'normal'}
        >
          <span className="text-sm">A</span>
          <div className="text-xs mt-1 opacity-80">Normal</div>
        </motion.button>

        <motion.button
          onClick={() => setSpecificSize('grande')}
          className={`px-3 py-2 rounded-lg font-bold transition-all duration-200 ${
            fontSize === 'grande'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Tamanho grande"
          aria-pressed={fontSize === 'grande'}
        >
          <span className="text-base">A</span>
          <div className="text-xs mt-1 opacity-80">Grande</div>
        </motion.button>

        <motion.button
          onClick={() => setSpecificSize('extraGrande')}
          className={`px-3 py-2 rounded-lg font-bold transition-all duration-200 ${
            fontSize === 'extraGrande'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Tamanho extra grande"
          aria-pressed={fontSize === 'extraGrande'}
        >
          <span className="text-lg">A</span>
          <div className="text-xs mt-1 opacity-80">Extra</div>
        </motion.button>
      </div>

      {/* Indicador visual de acessibilidade */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
        <span>Recurso de acessibilidade ativado</span>
      </div>
    </motion.div>
  );
};

export default FontSizeControl;
