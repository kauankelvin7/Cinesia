import React from 'react';
import { motion } from 'framer-motion';

/**
 * 🏥 LOGO CINESIA PREMIUM — Identidade Visual Refinada
 * Versão ícone e texto com estética HealthTech moderna.
 */
const Logo = ({ className = '', size = 'medium', iconOnly = false }) => {
  const sizes = {
    small: { icon: 34, text: 'text-[18px]', sub: 'text-[9px]', gap: 'gap-2' },
    medium: { icon: 48, text: 'text-[24px]', sub: 'text-[11px]', gap: 'gap-3' },
    large: { icon: 72, text: 'text-[36px]', sub: 'text-[14px]', gap: 'gap-4' },
  };

  const s = sizes[size] || sizes.medium;

  const LogoIcon = ({ w = s.icon }) => (
    <svg width={w} height={w} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      <defs>
        {/* Gradiente Cinesia Signature */}
        <linearGradient id="logo-grad-premium" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" /> {/* Indigo 500 */}
          <stop offset="100%" stopColor="#14B8A6" /> {/* Teal 500 */}
        </linearGradient>
        
        {/* Filtro de brilho para o ícone interno */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background: Squircle (quadrado arredondado orgânico) */}
      <rect width="48" height="48" rx="14" fill="url(#logo-grad-premium)" />
      
      {/* Símbolo Humano Abstrato (Movimento/Cinética) */}
      <g transform="translate(24, 24)" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)">
        {/* Cabeça */}
        <circle cx="0" cy="-13" r="4" fill="white" stroke="none" />
        
        {/* Espinha/Fluxo Cinético - Curva de Bézier mais suave */}
        <path d="M0 -8 C3 -4, -3 4, 0 10" strokeWidth="3.5" />
        
        {/* Membros Dinâmicos (Braços/Asas de movimento) */}
        <path d="M-10 -2 C-6 -5, -2 -5, 0 -2" opacity="0.9" />
        <path d="M10 -2 C6 -5, 2 -5, 0 -2" opacity="0.9" />
        
        {/* Base de Impulsão */}
        <path d="M-6 14 L0 10 L6 14" strokeWidth="2.5" opacity="0.7" />
        
        {/* Arco de Energia/Conhecimento */}
        <path d="M-14 -8 A18 18 0 0 1 14 -8" strokeWidth="1.5" opacity="0.4" strokeDasharray="2 2" />
      </g>
    </svg>
  );

  if (iconOnly) {
    return <LogoIcon />;
  }

  return (
    <motion.div 
      className={`flex items-center ${s.gap} ${className} select-none`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="shrink-0 flex items-center justify-center">
        <LogoIcon />
      </div>
      
      <div className="flex flex-col justify-center">
        <span className={`${s.text} font-black tracking-tighter leading-none bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-teal-400`}>
          CINESIA
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-[1px] w-3 bg-slate-300 dark:bg-slate-700" />
          <span className={`${s.sub} text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] uppercase`}>
            Fisioterapia
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Logo;