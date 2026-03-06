/**
 * @file ChatList.jsx
 * @description Lista de conversas recentes com unread count e preview.
 */

import React, { memo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import OnlineIndicator from '../shared/OnlineIndicator';
import { formatMessageTime, truncateText, getInitials, getAvatarColor } from '../../utils/chatHelpers';

const ChatList = memo(({ conversations, friendsStatus, onSelectConversation }) => {
  const { user } = useAuth();

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <MessageCircle size={24} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Nenhuma conversa ainda
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Envie uma mensagem para um amigo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {conversations.map((conv) => {
        // Para conversas diretas, pega os dados do outro participante
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

        return (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors
              ${unreadCount > 0
                ? 'bg-primary-50/50 dark:bg-primary-950/30 hover:bg-primary-50 dark:hover:bg-primary-950/50'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
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
                  className="w-10 h-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${conv.type === 'group' ? 'rounded-xl' : ''}`}
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
                <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                  {displayName}
                </p>
                {conv.lastMessage?.timestamp && (
                  <span className={`text-[10px] shrink-0 ${unreadCount > 0 ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-400'}`}>
                    {formatMessageTime(conv.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              {conv.lastMessage && (
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                    {conv.lastMessage.senderId === user?.uid ? 'Você: ' : ''}
                    {truncateText(conv.lastMessage.text, 40)}
                  </p>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-primary-500 rounded-full shrink-0">
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
