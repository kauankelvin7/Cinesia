/**
 * 🗑️ CONFIRM MODAL — Premium SaaS Design System
 * 
 * Confirmation dialog for destructive/important actions.
 * Dark mode, focus trap, ESC close, contextual icons.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Exclusão',
  itemName = 'este item',
  message = null,
  confirmText = 'Excluir Definitivamente',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false
}) => {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelRef.current?.focus();

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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => { if (!isLoading) onConfirm(); };
  const handleBackdropClick = (e) => { if (e.target === e.currentTarget && !isLoading) onClose(); };

  const typeConfig = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      icon: <Trash2 className="text-red-600 dark:text-red-400" size={26} />,
      buttonBg: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      icon: <AlertTriangle className="text-amber-600 dark:text-amber-400" size={26} />,
      buttonBg: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      icon: <Info className="text-blue-600 dark:text-blue-400" size={26} />,
      buttonBg: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
    },
  };

  const config = typeConfig[type] || typeConfig.danger;

  const messageContent = message || (
    <>
      Tem certeza que deseja excluir{' '}
      <span className="font-semibold text-slate-900 dark:text-slate-100">"{itemName}"</span>?
      <br />
      <span className="text-red-600 dark:text-red-400 font-medium">
        Essa ação não pode ser desfeita.
      </span>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm"
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
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 dark:border-slate-700/60"
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center">
              <motion.div
                className={`w-13 h-13 ${config.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                {config.icon}
              </motion.div>
              
              <h3 id="confirm-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {title}
              </h3>
              
              <div id="confirm-modal-desc" className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {typeof messageContent === 'string' ? <p>{messageContent}</p> : messageContent}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <motion.button
                ref={cancelRef}
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.97 } : {}}
              >
                {cancelText}
              </motion.button>
              
              <motion.button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`flex-1 py-2.5 px-4 rounded-[10px] font-semibold text-white ${config.buttonBg} transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.97 } : {}}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Processando...
                  </>
                ) : confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
