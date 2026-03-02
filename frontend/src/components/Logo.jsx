import React from 'react';
import { motion } from 'framer-motion';

/**
 * 🏥 LOGO CINESIA — Símbolo de movimento/corpo humano
 * Versão completa (ícone + texto) e versão ícone (só símbolo)
 * Funciona em fundo claro e escuro
 */
const Logo = ({ className = '', size = 'medium', iconOnly = false }) => {
  const sizes = {
    small: { icon: 32, text: 'text-lg', sub: 'text-[10px]' },
    medium: { icon: 44, text: 'text-2xl', sub: 'text-xs' },
    large: { icon: 64, text: 'text-4xl', sub: 'text-sm' },
  };

  const s = sizes[size] || sizes.medium;

  const LogoIcon = ({ w = s.icon }) => (
    <svg width={w} height={w} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
      {/* Stylized human figure in motion — abstract spine + arms */}
      <g transform="translate(24, 24)" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <circle cx="0" cy="-12" r="3.5" fill="white" stroke="none" />
        {/* Spine curve — representing movement/kinesia */}
        <path d="M0 -8 C2 -4, -2 2, 0 8" />
        {/* Arms reaching outward — dynamic pose */}
        <path d="M-8 -2 C-5 -4, -2 -4, 0 -2" />
        <path d="M8 -2 C5 -4, 2 -4, 0 -2" />
        {/* Legs in motion */}
        <path d="M0 8 L-5 16" />
        <path d="M0 8 L5 14" />
        {/* Motion arc */}
        <path d="M-10 -6 A14 14 0 0 1 10 -6" strokeWidth="1.5" opacity="0.5" />
      </g>
    </svg>
  );

  if (iconOnly) {
    return <LogoIcon />;
  }

  return (
    <motion.div 
      className={`flex items-center gap-2.5 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <LogoIcon />
      <div className="flex flex-col">
        <span className={`${s.text} font-heading font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent leading-none`}>
          Cinesia
        </span>
        <span className={`${s.sub} text-slate-400 dark:text-slate-500 font-medium tracking-widest uppercase`}>
          Fisioterapia
        </span>
      </div>
    </motion.div>
  );
};

export default Logo;
