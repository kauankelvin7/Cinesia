/**
 * 🌀 LOADING SCREEN
 * * Minimalista, imersiva e calibrada para a identidade HealthTech.
 * - Efeito de orbe pulsante
 * - Tipografia com brilho dinâmico
 * - Consistente com o Logo
 */

import React from 'react';
import { motion } from 'framer-motion';
import Logo from '../Logo';

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Orbe de Luz ao fundo (Efeito Aura) */}
      <motion.div 
        className="absolute w-40 h-40 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-[60px]"
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo com Pulso Orgânico */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Logo size="large" iconOnly />
        
        {/* Reflexo de luz giratório ao redor do logo */}
        <motion.div 
          className="absolute inset-0 rounded-[20px] border-2 border-transparent border-t-indigo-500/20 border-l-indigo-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Texto da Marca com Brilho Progressivo */}
      <div className="relative mt-8">
        <motion.p
          className="text-[14px] font-black tracking-[0.3em] uppercase text-slate-300 dark:text-slate-800"
        >
          Cinesia
        </motion.p>
        
        {/* Máscara de brilho que passa sobre o texto */}
        <motion.p
          className="absolute inset-0 text-[14px] font-black tracking-[0.3em] uppercase bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent bg-clip-text text-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Cinesia
        </motion.p>
      </div>

      {/* Barra de Progresso Minimalista (Substitui os pontos) */}
      <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            ease: "easeInOut",
            repeatDelay: 0.2
          }}
        />
      </div>

      <motion.span 
        className="mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Carregando Saúde
      </motion.span>
    </motion.div>
  );
};

export default LoadingScreen;