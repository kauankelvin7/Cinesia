/**
 * @file FriendRequests.jsx
 * @description Lista de pedidos de amizade recebidos e enviados.
 */

import React, { memo, useState } from 'react';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials, getAvatarColor, formatMessageTime } from '../../utils/chatHelpers';

const FriendRequests = memo(({ pendingRequests, sentRequests, onAccept, onDecline }) => {
  const [processing, setProcessing] = useState({});

  const handleAction = async (friendshipId, action) => {
    setProcessing((prev) => ({ ...prev, [friendshipId]: action }));
    try {
      if (action === 'accept') await onAccept(friendshipId);
      else await onDecline(friendshipId);
      toast.success(action === 'accept' ? 'Pedido aceito!' : 'Pedido recusado');
    } catch (err) {
      toast.error(err.message || 'Erro ao processar pedido');
    }
    setProcessing((prev) => ({ ...prev, [friendshipId]: null }));
  };

  const hasReceived = pendingRequests?.length > 0;
  const hasSent = sentRequests?.length > 0;

  if (!hasReceived && !hasSent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <Clock size={24} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Nenhum pedido pendente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recebidos */}
      {hasReceived && (
        <div>
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider px-1 mb-3">
            Recebidos ({pendingRequests.length})
          </p>
          <div className="space-y-2">
            {pendingRequests.map((req) => {
              const senderData = req.requestedBy === req.users[0] ? req.user1Data : req.user2Data;
              const initials = getInitials(senderData?.displayName);
              const avatarBg = getAvatarColor(senderData?.displayName);

              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/50"
                >
                  {senderData?.photoURL ? (
                    <img
                      src={senderData.photoURL}
                      alt={senderData.displayName}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {senderData?.displayName || 'Usuário'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatMessageTime(req.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAction(req.id, 'accept')}
                      disabled={!!processing[req.id]}
                      className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                      title="Aceitar"
                      aria-label="Aceitar pedido"
                    >
                      {processing[req.id] === 'accept' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'decline')}
                      disabled={!!processing[req.id]}
                      className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Recusar"
                      aria-label="Recusar pedido"
                    >
                      {processing[req.id] === 'decline' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enviados */}
      {hasSent && (
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mb-3">
            Enviados ({sentRequests.length})
          </p>
          <div className="space-y-2">
            {sentRequests.map((req) => {
              const targetData = req.requestedTo === req.users[0] ? req.user1Data : req.user2Data;
              const initials = getInitials(targetData?.displayName);
              const avatarBg = getAvatarColor(targetData?.displayName);

              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  {targetData?.photoURL ? (
                    <img
                      src={targetData.photoURL}
                      alt={targetData.displayName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {targetData?.displayName || 'Usuário'}
                    </p>
                  </div>

                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <Clock size={12} /> Pendente
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

FriendRequests.displayName = 'FriendRequests';
export default FriendRequests;
