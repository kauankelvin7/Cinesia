/**
 * @file ChatList.jsx
 * @description Lista de conversas recentes estilo WhatsApp com unread count, preview e status online.
 */

import React, { memo } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import OnlineIndicator from '../shared/OnlineIndicator';
import { formatMessageTime, truncateText, getInitials, getAvatarColor } from '../../utils/chatHelpers';

const ChatList = memo(({ conversations, friendsStatus, onSelectConversation }) => {
  const { user } = useAuth();

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-cyan-100 dark:from-primary-900/30 dark:to-cyan-900/30 flex items-center justify-center mb-4">
          <MessageCircle size={28} className="text-primary-500" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Nenhuma conversa
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-48">
          Envie uma mensagem para um amigo na aba Amigos para começar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {conversations.map((conv) => {
        const otherUid = conv.participants?.find((uid) => uid !== user?.uid);
        const otherData = conv.participantsData?.[otherUid] || {};
        const unreadCount = conv.unreadCount?.[user?.uid] || 0;
        const status = friendsStatus?.[otherUid];
        const isOnline = status?.isOnline || false;
        const isStudying = status?.isStudying || false;

        const displayName = conv.type === 'group'
          ? conv.groupName || 'Grupo'
          : otherData.displayName || 'Usuário';

        const initials = getInitials(displayName);
        const avatarBg = getAvatarColor(displayName);
        const photoURL = conv.type === 'group' ? conv.groupPhoto : otherData.photoURL;

        // Last message emoji detection for preview
        const lastMsgText = conv.lastMessage?.text || '';
        const isFromMe = conv.lastMessage?.senderId === user?.uid;
        const previewPrefix = isFromMe ? 'Você: ' : '';

        return (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-150
              ${unreadCount > 0
                ? 'bg-primary-50/60 dark:bg-primary-950/20 hover:bg-primary-50 dark:hover:bg-primary-950/30 border border-primary-200/30 dark:border-primary-800/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
              }
            `}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectConversation(conv)}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white dark:ring-slate-900 ${conv.type === 'group' ? 'rounded-xl' : ''}`}
                  style={{ backgroundColor: avatarBg }}
                >
                  {conv.type === 'group' ? displayName.charAt(0) : initials}
                </div>
              )}
              {conv.type === 'direct' && (
                <OnlineIndicator
                  isOnline={isOnline}
                  isStudying={isStudying}
                  size="sm"
                  className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-slate-900 dark:text-slate-50' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                  {displayName}
                </p>
                {conv.lastMessage?.timestamp && (
                  <span className={`text-[10px] shrink-0 ${unreadCount > 0 ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {formatMessageTime(conv.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              {conv.lastMessage && (
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                    {previewPrefix}{truncateText(lastMsgText, 38)}
                  </p>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold text-white bg-primary-500 rounded-full shrink-0 shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

ChatList.displayName = 'ChatList';
export default ChatList;
