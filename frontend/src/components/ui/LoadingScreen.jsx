/**
 * 🌀 LOADING SCREEN - Transição Premium para Lazy Loading
 * 
 * Fallback elegante para React.Suspense
 * Features:
 * - Logo pulsante centralizada
 * - Animação suave e rápida
 * - Gradiente consistente com a marca
 * - Não bloqueia a thread principal
 */

import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Logo Container com Pulse (smaller) */}
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Glow Background (smaller, softer) */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-2xl blur-xl scale-110" />
        {/* Logo Icon (smaller) */}
        <div className="relative w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-7 h-7 text-white"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </motion.div>

      {/* Loading Text (smaller margin) */}
      <motion.p
        className="mt-4 text-slate-500 text-xs font-medium tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Carregando...
      </motion.p>

      {/* Minimal Progress Dots (smaller) */}
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-teal-500"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
