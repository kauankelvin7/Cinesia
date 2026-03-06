/**
 * @file FriendCard.jsx
 * @description Card individual de um amigo com foto, nome, status e ações.
 */

import React, { memo, useState } from 'react';
import { MessageCircle, Swords, MoreHorizontal, UserMinus } from 'lucide-react';
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

  return (
    <div
      className="relative group rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      onClick={() => onViewProfile?.(friend)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onViewProfile?.(friend)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {friend.photoURL && !imgError ? (
            <img
              src={friend.photoURL}
              alt={friend.displayName}
              className="w-10 h-10 rounded-full object-cover"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
          )}
          <OnlineIndicator
            isOnline={isOnline}
            isStudying={isStudying}
            size="sm"
            className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {friend.displayName || 'Usuário'}
          </p>
          {isStudying ? (
            <StudyingBadge isStudying={isStudying} currentPage={currentPage} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMessage?.(friend)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-500 transition-colors"
            title="Enviar mensagem"
            aria-label={`Enviar mensagem para ${friend.displayName}`}
          >
            <MessageCircle size={16} />
          </button>
          <button
            onClick={() => onChallenge?.(friend)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-500 transition-colors"
            title="Desafiar"
            aria-label={`Desafiar ${friend.displayName}`}
          >
            <Swords size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              aria-label="Mais opções"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-35">
                  <button
                    onClick={async () => {
                      try {
                        await onRemove?.(friend.friendshipId || friend.uid);
                        toast.success('Amigo removido');
                      } catch (e) {
                        toast.error(e.message || 'Erro ao remover');
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <UserMinus size={14} />
                    Remover amigo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

FriendCard.displayName = 'FriendCard';
export default FriendCard;
