/**
 * @file MessageStatus.jsx
 * @description Indicador visual de status: ✓ enviado / ✓✓ entregue / ✓✓ azul lido.
 * Usa readBy map para determinar status real per-message.
 */

import React, { memo, useMemo } from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageStatus = memo(({ status, readBy, senderId }) => {
  // Determine actual status from readBy map
  const computedStatus = useMemo(() => {
    if (readBy && senderId) {
      const otherReaders = Object.keys(readBy).filter((uid) => uid !== senderId);
      if (otherReaders.length > 0) return 'read';
    }
    return status || 'sent';
  }, [status, readBy, senderId]);

  if (computedStatus === 'read') {
    return (
      <CheckCheck
        size={14}
        className="text-cyan-500 shrink-0"
        aria-label="Mensagem lida"
      />
    );
  }

  if (computedStatus === 'delivered') {
    return (
      <CheckCheck
        size={14}
        className="text-slate-400 shrink-0"
        aria-label="Mensagem entregue"
      />
    );
  }

  if (computedStatus === 'sent') {
    return (
      <Check
        size={14}
        className="text-slate-400 shrink-0"
        aria-label="Mensagem enviada"
      />
    );
  }

  // sending
  return (
    <div className="w-3 h-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin shrink-0" aria-label="Enviando..." />
  );
});

MessageStatus.displayName = 'MessageStatus';
export default MessageStatus;
