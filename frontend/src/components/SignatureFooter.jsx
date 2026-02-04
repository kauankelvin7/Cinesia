import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SignatureFooter.jsx
 * Rodapé minimalista com micro-interação romântica
 */

const heartbeat = {
  animate: {
    scale: [1, 1.15, 0.95, 1.1, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
      times: [0, 0.2, 0.4, 0.7, 1],
    },
  },
};

export default function SignatureFooter() {
  const [showSecret, setShowSecret] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Detecta primeiro toque para ativar modo mobile
  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') {
      setIsTouch(true);
      setShowSecret((v) => !v);
    }
  };

  // Desktop: hover revela, mobile: toggle no click
  const handleMouseEnter = () => {
    if (!isTouch) setShowSecret(true);
  };
  const handleMouseLeave = () => {
    if (!isTouch) setShowSecret(false);
  };
  const handleClick = () => {
    if (isTouch) setShowSecret((v) => !v);
  };

  return (
    <footer className="w-full flex flex-col items-center justify-center py-6 select-none">
      <div
        className="flex items-center gap-1 text-sm text-slate-500 cursor-pointer"
        onPointerDown={handlePointerDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        tabIndex={0}
        role="button"
        aria-label="Assinatura do criador"
      >
        <span className="font-medium text-slate-600 transition-colors hover:text-pink-500">Kauan Kelvin</span>
        <span>fez com</span>
        <motion.span
          className="inline-block mx-0.5"
          aria-label="coração pulsante"
          {...heartbeat}
        >
          💖
        </motion.span>
      </div>
      <AnimatePresence>
        {showSecret && (
          <motion.div
            key="secret"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mt-2 text-xs text-slate-400 text-center px-2"
          >
            Feito para a futura melhor Fisioterapeuta do mundo! 🩺✨
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
