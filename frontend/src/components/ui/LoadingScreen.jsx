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
      {/* Logo Container com Pulse */}
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-3xl blur-2xl scale-150" />
        
        {/* Logo Icon */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/30">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-10 h-10 text-white"
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

      {/* Loading Text */}
      <motion.p
        className="mt-6 text-slate-500 text-sm font-medium tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Carregando...
      </motion.p>

      {/* Minimal Progress Dots */}
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-teal-500"
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
