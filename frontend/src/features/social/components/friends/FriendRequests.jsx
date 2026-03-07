/**
 * 🤝 FRIEND REQUESTS PREMIUM — v2.0
 * * Gerenciamento de convites de amizade recebidos e enviados.
 * - Hierarquia visual clara (foco absoluto nos Recebidos)
 * - Micro-interações táteis nos botões de Aceitar/Recusar
 * - Animações suaves de lista
 */

import React, { memo, useState } from 'react';
import { Check, X, Clock, Loader2, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getInitials, getAvatarColor, formatMessageTime } from '../../utils/chatHelpers';

const FriendRequests = memo(({ pendingRequests, sentRequests, onAccept, onDecline }) => {
  const [processing, setProcessing] = useState({});

  const handleAction = async (friendshipId, action) => {
    setProcessing((prev) => ({ ...prev, [friendshipId]: action }));
    try {
      if (action === 'accept') await onAccept(friendshipId);
      else await onDecline(friendshipId);
    } catch (err) {
      toast.error(err.message || 'Erro ao processar pedido');
    }
    setProcessing((prev) => ({ ...prev, [friendshipId]: null }));
  };

  const hasReceived = pendingRequests?.length > 0;
  const hasSent = sentRequests?.length > 0;

  // Variantes para animação em lista
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  if (!hasReceived && !hasSent) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center px-4"
      >
        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-5 border border-slate-100 dark:border-slate-800 shadow-inner">
          <Clock size={28} className="text-slate-300" strokeWidth={2.5} />
        </div>
        <h3 className="text-[15px] font-black text-slate-800 dark:text-slate-200">
          Nenhum pedido pendente
        </h3>
        <p className="text-[12px] text-slate-400 mt-1 max-w-[200px]">
          Você está em dia! Todos os convites foram respondidos.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── Pedidos Recebidos (Prioridade Alta) ─── */}
      {hasReceived && (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <div className="flex items-center gap-2 px-2 mb-4">
            <Sparkles size={16} className="text-indigo-500" />
            <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Convites Novos ({pendingRequests.length})
            </h4>
          </div>
          
          <div className="space-y-2.5">
            <AnimatePresence>
              {pendingRequests.map((req) => {
                const senderData = req.requestedBy === req.users[0] ? req.user1Data : req.user2Data;
                const initials = getInitials(senderData?.displayName);
                const avatarBg = getAvatarColor(senderData?.displayName);

                return (
                  <motion.div
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={req.id}
                    className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    {senderData?.photoURL ? (
                      <img src={senderData.photoURL} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-indigo-50 dark:border-slate-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 shadow-inner" style={{ backgroundColor: avatarBg }}>
                        {initials}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-black text-slate-800 dark:text-slate-100 truncate tracking-tight">
                        {senderData?.displayName || 'Estudante'}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                        Há {formatMessageTime(req.createdAt)}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 pl-2">
                      <button
                        onClick={() => handleAction(req.id, 'decline')}
                        disabled={!!processing[req.id]}
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all disabled:opacity-50 active:scale-90"
                        title="Recusar"
                        aria-label="Recusar pedido"
                      >
                        {processing[req.id] === 'decline' ? <Loader2 size={18} className="animate-spin" /> : <X size={20} strokeWidth={2.5} />}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'accept')}
                        disabled={!!processing[req.id]}
                        className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-90"
                        title="Aceitar"
                        aria-label="Aceitar pedido"
                      >
                        {processing[req.id] === 'accept' ? <Loader2 size={20} className="animate-spin" /> : <Check size={22} strokeWidth={3} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ─── Pedidos Enviados (Prioridade Baixa) ─── */}
      {hasSent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 px-2 mb-3 mt-6 opacity-70">
            <Send size={14} className="text-slate-500" />
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Enviados ({sentRequests.length})
            </h4>
          </div>
          
          <div className="space-y-1.5 opacity-90">
            {sentRequests.map((req) => {
              const targetData = req.requestedTo === req.users[0] ? req.user1Data : req.user2Data;
              const initials = getInitials(targetData?.displayName);
              
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors"
                >
                  {/* Avatar Pequeno */}
                  {targetData?.photoURL ? (
                    <img src={targetData.photoURL} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 grayscale-[20%]" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0" style={{ backgroundColor: getAvatarColor(targetData?.displayName) }}>
                      {initials}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 truncate">
                      {targetData?.displayName || 'Usuário Cinesia'}
                    </p>
                  </div>

                  {/* Status Discreto */}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <Clock size={10} strokeWidth={3} />
                    Aguardando
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
});

FriendRequests.displayName = 'FriendRequests';
export default FriendRequests;