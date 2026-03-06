/**
 * 🌀 LOADING SCREEN — Premium SaaS Design System
 * 
 * Minimal loading screen with logo pulse and progress dots.
 * Dark mode aware.
 */

import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-80 flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Logo Icon */}
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
            {/* Stylized figure */}
            <circle cx="24" cy="12" r="4" fill="white"/>
            <path d="M24 18 C24 22, 22 28, 24 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M16 22 Q20 20, 24 21 Q28 20, 32 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M22 32 L18 40" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M26 32 L30 40" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      </motion.div>

      {/* Brand text */}
      <motion.p
        className="mt-4 text-xs font-medium tracking-widest uppercase text-slate-400 dark:text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        Cinesia
      </motion.p>

      {/* Progress Dots */}
      <div className="flex gap-1.5 mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary-500"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
