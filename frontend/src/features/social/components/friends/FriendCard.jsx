/**
 * 🪪 FRIEND CARD PREMIUM — v2.0
 * * Componente de lista interativo com micro-interações.
 * - Layout em "Elevated Card" para maior separação
 * - Dropdown menu animado com Framer Motion
 * - Acessibilidade e responsividade (touch vs hover) aprimoradas
 */

import React, { memo, useState } from 'react';
import { MessageCircle, Swords, MoreHorizontal, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import OnlineIndicator from '../shared/OnlineIndicator';
import StudyingBadge from '../shared/StudyingBadge';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const FriendCard = memo(({ friend, status, onMessage, onChallenge, onRemove, onViewProfile }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(friend.displayName);
  const avatarBg = getAvatarColor(friend.displayName);
  const isOnline = status?.isOnline || false;
  const isStudying = status?.isStudying || false;
  const currentPage = status?.currentPage || '';

  // Variantes para o menu Dropdown
  const menuVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10, transformOrigin: 'top right' },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.3, bounce: 0.4 } },
    exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15 } }
  };

  return (
    <div
      className="relative group rounded-2xl p-3 mb-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all cursor-pointer active:scale-[0.98]"
      onClick={() => onViewProfile?.(friend)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onViewProfile?.(friend)}
    >
      <div className="flex items-center gap-3.5">
        {/* ─── Avatar ─── */}
        <div className="relative shrink-0">
          {friend.photoURL && !imgError ? (
            <img
              src={friend.photoURL}
              alt={friend.displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-slate-50 dark:border-slate-800 group-hover:border-indigo-50 dark:group-hover:border-slate-700 transition-colors"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shadow-inner"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
          )}
          <OnlineIndicator
            isOnline={isOnline}
            isStudying={isStudying}
            size="md"
            className="absolute -bottom-0.5 -right-0.5 ring-4 ring-white dark:ring-slate-900"
          />
        </div>

        {/* ─── Info ─── */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">
            {friend.displayName || 'Usuário Cinesia'}
          </p>
          <div className="mt-0.5">
            {isStudying ? (
              <StudyingBadge isStudying={isStudying} currentPage={currentPage} />
            ) : (
              <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {isOnline ? 'Online agora' : 'Offline'}
              </p>
            )}
          </div>
        </div>

        {/* ─── Actions (Adaptive: Mobile/Desktop) ─── */}
        <div className="flex items-center gap-1.5 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMessage?.(friend)}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-500 transition-all active:scale-90"
            title="Enviar mensagem"
            aria-label={`Enviar mensagem para ${friend.displayName}`}
          >
            <MessageCircle size={18} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={() => onChallenge?.(friend)}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500 transition-all active:scale-90"
            title="Desafiar"
            aria-label={`Desafiar ${friend.displayName}`}
          >
            <Swords size={18} strokeWidth={2.5} />
          </button>

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-90 ${showMenu ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              aria-label="Mais opções"
            >
              <MoreHorizontal size={18} strokeWidth={2.5} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  {/* Overlay invisível para fechar ao clicar fora */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  
                  <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 min-w-[160px] overflow-hidden"
                  >
                    <button
                      onClick={async () => {
                        try {
                          await onRemove?.(friend.friendshipId || friend.uid);
                          toast.success('Amigo removido da sua lista.');
                        } catch (e) {
                          toast.error(e.message || 'Erro ao remover');
                        }
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <UserMinus size={16} strokeWidth={2.5} />
                      Desfazer Amizade
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

FriendCard.displayName = 'FriendCard';
export default FriendCard;