/**
 * @file MessageStatus.jsx
 * @description Indicador de status da mensagem: ✓ enviado / ✓✓ lido.
 */

import React, { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageStatus = memo(({ status }) => {
  if (status === 'read') {
    return (
      <CheckCheck
        size={14}
        className="text-cyan-500 shrink-0"
        aria-label="Mensagem lida"
      />
    );
  }

  if (status === 'delivered') {
    return (
      <CheckCheck
        size={14}
        className="text-slate-400 shrink-0"
        aria-label="Mensagem entregue"
      />
    );
  }

  if (status === 'sent') {
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
