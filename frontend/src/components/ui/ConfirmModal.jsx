/**
 * 🗑️ CONFIRM MODAL - Modal de Confirmação de Exclusão
 * 
 * Componente reutilizável para confirmar ações destrutivas
 * Visual: Alerta com ícone, texto contextual e botões
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Exclusão',
  itemName = 'este item',
  message = null,
  confirmText = 'Excluir Definitivamente',
  cancelText = 'Cancelar',
  type = 'danger', // 'danger' | 'warning'
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const iconConfig = {
    danger: {
      bg: 'bg-red-100',
      icon: <Trash2 className="text-red-600" size={28} />,
      buttonBg: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bg: 'bg-amber-100',
      icon: <AlertTriangle className="text-amber-600" size={28} />,
      buttonBg: 'bg-amber-600 hover:bg-amber-700'
    }
  };

  const config = iconConfig[type] || iconConfig.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com Ícone */}
            <div className="pt-6 pb-4 px-6 text-center">
              <motion.div
                className={`w-16 h-16 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-4`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                {config.icon}
              </motion.div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {title}
              </h3>
              
              <p className="text-slate-600 text-sm leading-relaxed">
                {message || (
                  <>
                    Tem certeza que deseja excluir{' '}
                    <span className="font-semibold text-slate-900">"{itemName}"</span>?
                    <br />
                    <span className="text-red-600 font-medium">
                      Essa ação não pode ser desfeita.
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Botões */}
            <div className="px-6 pb-6 flex gap-3">
              <motion.button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {cancelText}
              </motion.button>
              
              <motion.button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white ${config.buttonBg} transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    {confirmText}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
