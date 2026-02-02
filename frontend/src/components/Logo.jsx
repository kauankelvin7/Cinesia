import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ className = '', size = 'medium' }) => {
  const sizes = {
    small: { container: 'h-10', text: 'text-2xl' },
    medium: { container: 'h-16', text: 'text-4xl' },
    large: { container: 'h-24', text: 'text-6xl' },
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <motion.div 
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* SVG Logo - Silhueta de movimento/coluna */}
      <svg 
        className={currentSize.container}
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fundo circular com gradiente */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#14B8A6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0D9488', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Círculo de fundo */}
        <circle cx="60" cy="60" r="55" fill="url(#logoGradient)" opacity="0.1" />
        
        {/* Silhueta de coluna vertebral estilizada */}
        <g transform="translate(60, 60)">
          {/* Vértebras - representadas como formas circulares conectadas */}
          <motion.circle 
            cx="0" cy="-35" r="5" 
            fill="#0D9488"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle 
            cx="0" cy="-25" r="5.5" 
            fill="#0D9488"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle 
            cx="0" cy="-15" r="6" 
            fill="#0D9488"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          />
          <motion.circle 
            cx="0" cy="-5" r="6.5" 
            fill="#14B8A6"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
          <motion.circle 
            cx="0" cy="5" r="6.5" 
            fill="#14B8A6"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
          />
          <motion.circle 
            cx="0" cy="15" r="6" 
            fill="#0D9488"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.circle 
            cx="0" cy="25" r="5.5" 
            fill="#0D9488"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
          />
          <motion.circle 
            cx="0" cy="35" r="5" 
            fill="#0D9488"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
          />
          
          {/* Conexão central - linha da coluna */}
          <motion.path
            d="M 0 -40 Q 0 -20 0 0 Q 0 20 0 40"
            stroke="#14B8A6"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Curvas laterais - representando movimento */}
          <motion.path
            d="M -8 -30 Q -15 0 -8 30"
            stroke="#0D9488"
            strokeWidth="1.5"
            fill="none"
            opacity="0.2"
            animate={{ 
              d: [
                "M -8 -30 Q -15 0 -8 30",
                "M -8 -30 Q -12 0 -8 30",
                "M -8 -30 Q -15 0 -8 30"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.path
            d="M 8 -30 Q 15 0 8 30"
            stroke="#0D9488"
            strokeWidth="1.5"
            fill="none"
            opacity="0.2"
            animate={{ 
              d: [
                "M 8 -30 Q 15 0 8 30",
                "M 8 -30 Q 12 0 8 30",
                "M 8 -30 Q 15 0 8 30"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />
        </g>
      </svg>

      {/* Nome do App */}
      <motion.div 
        className="flex flex-col"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span className={`${currentSize.text} font-bold text-primary-700 leading-none`}>
          Cinesia
        </span>
        <span className="text-xs text-secondary-500 font-medium tracking-wide uppercase">
          Fisioterapia
        </span>
      </motion.div>
    </motion.div>
  );
};

export default Logo;
