/**
 * 👤 USER AVATAR PREMIUM v2.0
 * * Componente de identidade visual com fallback determinístico.
 * - Suporte a indicador de status online (pulsante)
 * - Gradientes HealthTech refinados
 * - Prevenção contra Tracking Prevention (Safari/Edge)
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const GRADIENTS = [
  'from-indigo-500 to-blue-600',
  'from-teal-400 to-emerald-600',
  'from-violet-500 to-purple-600',
  'from-rose-400 to-red-600',
  'from-amber-400 to-orange-600',
  'from-cyan-400 to-indigo-500',
];

const UserAvatar = memo(({ 
  photoURL, 
  displayName, 
  size = 'md', 
  isOnline = false, 
  className = '', 
  style 
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = displayName?.[0]?.toUpperCase() ?? '?';
  const sizeClass = SIZES[size] || SIZES.md;

  // Gradiente determinístico: Garante que o Kauan sempre tenha a mesma cor de fallback
  const gradientIndex = (displayName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) ?? 0) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];

  return (
    <div className={`relative shrink-0 ${className}`} style={style}>
      <AnimatePresence mode="wait">
        {photoURL && !imgError ? (
          <motion.img
            key="photo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            src={photoURL}
            alt={displayName || 'Avatar'}
            className={`${sizeClass} rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm`}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white shadow-inner border-2 border-white dark:border-slate-800`}
            aria-label={displayName || 'Avatar'}
          >
            {initial}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de Status Online */}
      {isOnline && (
        <div className="absolute bottom-0 right-0 transform translate-x-[10%] translate-y-[10%]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
          </span>
        </div>
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;