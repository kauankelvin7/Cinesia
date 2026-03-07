/**
 * 🎭 MODAL
 * * Features: Glassmorphism, Focus Trap, ESC Close, Scale & Fade Animations
 * Elevando a experiência de janelas flutuantes no Cinesia.
 */

import React, { useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  footer = null,
}) => {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => closeButtonRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop Glass */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={`
              relative bg-white dark:bg-slate-900 
              rounded-[32px] shadow-2xl
              w-full ${sizeClasses[size]}
              max-h-[90vh] overflow-hidden flex flex-col
              border border-white/20 dark:border-slate-800
            `}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                {title && (
                  <h2 id={titleId} className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label={title ? `Fechar modal ${title}` : 'Fechar modal'}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 focus:outline-none"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}

            {/* Content Area */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-slate-600 dark:text-slate-300">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-3 z-10">
                {footer}
              </div>
            )}
          </motion.div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { 
              background: rgba(148, 163, 184, 0.2); 
              border-radius: 10px; 
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;