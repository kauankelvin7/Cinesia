/**
 * 🗑️ CONFIRM MODAL - Modal de Confirmação Reutilizável
 * 
 * Componente para confirmar ações destrutivas ou importantes
 * Visual: Glassmorphism com alerta, ícone contextual e botões
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onConfirm: function
 * - title: string
 * - message: string | ReactNode
 * - type: 'danger' | 'warning' | 'info'
 * - confirmText: string
 * - cancelText: string
 * - isLoading: boolean
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, AlertCircle, Info } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger', // 'danger' | 'warning' | 'info'
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

  // Configuração visual por tipo
  const typeConfig = {
    danger: {
      iconBg: 'bg-red-100',
      icon: <Trash2 className="text-red-600" size={28} />,
      buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      accentColor: 'text-red-600'
    },
    warning: {
      iconBg: 'bg-amber-100',
      icon: <AlertTriangle className="text-amber-600" size={28} />,
      buttonBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      accentColor: 'text-amber-600'
    },
    info: {
      iconBg: 'bg-blue-100',
      icon: <Info className="text-blue-600" size={28} />,
      buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      accentColor: 'text-blue-600'
    }
  };

  const config = typeConfig[type] || typeConfig.danger;

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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/50"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de fechar */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            {/* Header com Ícone */}
            <div className="pt-8 pb-4 px-6 text-center">
              <motion.div
                className={`w-16 h-16 ${config.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                {config.icon}
              </motion.div>
              
              <motion.h3 
                className="text-xl font-bold text-slate-900 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {title}
              </motion.h3>
              
              <motion.div 
                className="text-slate-600 text-sm leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {typeof message === 'string' ? (
                  <p>{message}</p>
                ) : (
                  message
                )}
              </motion.div>
            </div>

            {/* Botões */}
            <motion.div 
              className="px-6 pb-6 flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
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
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white ${config.buttonBg} transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Processando...
                  </>
                ) : (
                  confirmText
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
