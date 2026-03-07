/**
 * ✅ MESSAGE STATUS
 * * Indicador visual de ciclo de vida da mensagem.
 * - Suporte a transições suaves entre estados (Enviado -> Lido)
 * - Otimizado para legibilidade em bolhas coloridas
 * - Micro-animação de feedback visual
 */

import React, { memo, useMemo } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageStatus = memo(({ status, readBy, senderId }) => {
  
  const computedStatus = useMemo(() => {
    if (readBy && senderId) {
      const otherReaders = Object.keys(readBy).filter((uid) => uid !== senderId);
      if (otherReaders.length > 0) return 'read';
    }
    return status || 'sent';
  }, [status, readBy, senderId]);

  return (
    <div className="flex items-center justify-center shrink-0 ml-1">
      <AnimatePresence mode="wait">
        {computedStatus === 'read' ? (
          <motion.div
            key="read"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sky-400 dark:text-sky-400" // Azul vibrante para leitura
          >
            <CheckCheck size={13} strokeWidth={3.5} aria-label="Lida" />
          </motion.div>
        ) : computedStatus === 'delivered' ? (
          <motion.div
            key="delivered"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-300 dark:text-slate-500"
          >
            <CheckCheck size={13} strokeWidth={3} aria-label="Entregue" />
          </motion.div>
        ) : computedStatus === 'sent' ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-300 dark:text-slate-500"
          >
            <Check size={13} strokeWidth={3} aria-label="Enviada" />
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-2.5 h-2.5 border-[1.5px] border-slate-300 border-t-transparent rounded-full animate-spin"
            aria-label="Enviando..."
          />
        )}
      </AnimatePresence>
    </div>
  );
});

MessageStatus.displayName = 'MessageStatus';
export default MessageStatus;