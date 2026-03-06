/**
 * @file ChatWindow.jsx
 * @description Janela de conversa individual com mensagens, scroll automático e typing.
 */

import React, { memo, useEffect, useRef } from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useChat } from '../../hooks/useChat';
import { useSocial } from '../../context/SocialContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import OnlineIndicator from '../shared/OnlineIndicator';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const ChatWindow = memo(({ conversationId, friendData, friendStatus, onBack }) => {
  const { user } = useAuth();
  const { messages, typing, loading, sendMessage, handleTyping } = useChat(conversationId);
  const { startChallenge } = useSocial();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Scroll automático quando novas mensagens chegam
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  const initials = getInitials(friendData?.displayName);
  const avatarBg = getAvatarColor(friendData?.displayName);
  const isOnline = friendStatus?.isOnline || false;
  const isStudying = friendStatus?.isStudying || false;

  const handleAcceptChallenge = (challengeId) => {
    startChallenge(challengeId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="relative shrink-0">
          {friendData?.photoURL ? (
            <img
              src={friendData.photoURL}
              alt={friendData.displayName}
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
          )}
          <OnlineIndicator
            isOnline={isOnline}
            isStudying={isStudying}
            size="xs"
            className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-900"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {friendData?.displayName || 'Amigo'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isStudying ? '📚 Estudando agora' : isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <span className="text-3xl mb-2">👋</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Envie a primeira mensagem!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.uid}
                onAcceptChallenge={handleAcceptChallenge}
              />
            ))}
          </>
        )}

        <TypingIndicator typingUsers={typing} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} onTyping={handleTyping} />
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
export default ChatWindow;
