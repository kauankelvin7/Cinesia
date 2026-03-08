/**
 * 🗑️ CONFIRM MODAL
 * * Dialogo de confirmação para ações críticas ou destrutivas.
 * - Glassmorphism backdrop
 * - Focus Trap & Accessibility (A11y)
 * - Estados semânticos (Danger, Warning, Info)
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Info, Sparkles, Loader2 } from 'lucide-react';
import Button from './Button';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Exclusão',
  itemName = 'este item',
  message = null,
  confirmText = 'Excluir Definitivamente',
  cancelText = 'Manter item',
  type = 'danger',
  isLoading = false
}) => {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Delay sutil para garantir que o modal montou antes do foco
    const timer = setTimeout(() => cancelRef.current?.focus(), 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) { onClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, isLoading, onClose]);

  const handleConfirm = () => { if (!isLoading) onConfirm(); };
  const handleBackdropClick = (e) => { if (e.target === e.currentTarget && !isLoading) onClose(); };

  const typeConfig = {
    danger: {
      iconBg: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50',
      icon: <Trash2 className="text-red-500" size={28} strokeWidth={2.5} />,
      buttonClass: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20 text-white border-none',
    },
    warning: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50',
      icon: <AlertTriangle className="text-amber-500" size={28} strokeWidth={2.5} />,
      buttonClass: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/20 text-white border-none',
    },
    info: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50',
      icon: <Info className="text-indigo-500" size={28} strokeWidth={2.5} />,
      buttonClass: 'bg-gradient-to-br from-indigo-500 to-teal-500 shadow-indigo-500/20 text-white border-none',
    },
  };

  const config = typeConfig[type] || typeConfig.danger;

  const messageContent = message || (
    <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
      Tem certeza que deseja remover <span className="font-bold text-slate-900 dark:text-slate-100">"{itemName}"</span>? 
      <br />
      <span className="text-red-500/80 dark:text-red-400/80 text-[13px] font-bold">Esta ação é irreversível.</span>
    </p>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 dark:border-slate-800"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon Area */}
            <div className="pt-10 pb-6 px-8 text-center">
              <motion.div
                className={`w-20 h-20 ${config.iconBg} rounded-[24px] border-2 flex items-center justify-center mx-auto mb-6 shadow-sm`}
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                {config.icon}
              </motion.div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {title}
              </h3>
              
              <div className="px-2">
                {messageContent}
              </div>
            </div>

            {/* Actions Section */}
            <div className="px-8 pb-8 flex flex-col gap-3">
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`h-14 rounded-2xl font-bold text-[15px] ${config.buttonClass}`}
                leftIcon={isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
              >
                {isLoading ? 'Processando...' : confirmText}
              </Button>

              <button
                ref={cancelRef}
                onClick={onClose}
                disabled={isLoading}
                className="h-12 text-[14px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;