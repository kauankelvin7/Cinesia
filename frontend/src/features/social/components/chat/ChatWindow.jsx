/**
 * @file ChatWindow.jsx
 * @description Janela de conversa estilo WhatsApp com date separators, message grouping,
 * scroll-to-bottom e typing indicator.
 */

import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useChat } from '../../hooks/useChat';
import { useSocial } from '../../context/SocialContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import OnlineIndicator from '../shared/OnlineIndicator';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { challengeService } from '../../services/challengeService';
import { toast } from 'sonner';

/**
 * Groups messages with date separators and consecutive-sender grouping.
 */
function processMessages(messages, currentUserId) {
  const result = [];
  let lastDate = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    // Insert date separator if day changes
    if (dateKey !== lastDate) {
      result.push({ type: 'date-separator', date: msgDate, key: `date-${dateKey}` });
      lastDate = dateKey;
    }

    // Determine grouping: same sender in consecutive messages
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const sameSenderAsPrev = prev && prev.senderId === msg.senderId && prev.type !== 'system';
    const sameSenderAsNext = next && next.senderId === msg.senderId && next.type !== 'system';

    // Check time proximity (within 2 minutes)
    const prevTime = prev?.createdAt?.toDate ? prev.createdAt.toDate() : prev?.createdAt ? new Date(prev.createdAt) : null;
    const nextTime = next?.createdAt?.toDate ? next.createdAt.toDate() : next?.createdAt ? new Date(next.createdAt) : null;
    const closeInTimePrev = prevTime && (msgDate - prevTime) < 120000;
    const closeInTimeNext = nextTime && (nextTime - msgDate) < 120000;

    const isFirstInGroup = !(sameSenderAsPrev && closeInTimePrev);
    const isLastInGroup = !(sameSenderAsNext && closeInTimeNext);

    result.push({
      type: 'message',
      data: msg,
      isOwn: msg.senderId === currentUserId,
      isFirstInGroup,
      isLastInGroup,
      key: msg.id,
    });
  }

  return result;
}

/**
 * Formats a date for the date separator.
 */
function formatDateSeparator(date) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const ChatWindow = memo(({ conversationId, friendData, friendStatus, onBack, onClose }) => {
  const { user } = useAuth();
  const { messages, typing, loading, sendMessage, handleTyping, markAsRead, deleteMessage } = useChat(conversationId);
  const { startChallenge } = useSocial();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const isAtBottom = useRef(true);
  const prevMessageCount = useRef(0);

  // Process messages into groups with date separators
  const processedMessages = useMemo(
    () => processMessages(messages, user?.uid),
    [messages, user?.uid],
  );

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }
    setShowScrollDown(false);
    setNewMessageCount(0);
  }, []);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 80;
    isAtBottom.current = atBottom;
    setShowScrollDown(!atBottom);
    if (atBottom) {
      setNewMessageCount(0);
      markAsRead();
    }
  }, [markAsRead]);

  // Auto-scroll when new messages arrive (if already at bottom)
  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCount.current) {
      if (isAtBottom.current) {
        scrollToBottom();
      } else {
        const newCount = count - prevMessageCount.current;
        setNewMessageCount((prev) => prev + newCount);
      }
    }
    prevMessageCount.current = count;
  }, [messages.length, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = getInitials(friendData?.displayName);
  const avatarBg = getAvatarColor(friendData?.displayName);
  const isOnline = friendStatus?.isOnline || false;
  const isStudying = friendStatus?.isStudying || false;

  const handleAcceptChallenge = useCallback(async (challengeId) => {
    try {
      await challengeService.acceptChallenge(challengeId, user.uid);
      startChallenge(challengeId);
    } catch (err) {
      toast.error(err.message || 'Erro ao aceitar desafio');
    }
  }, [user?.uid, startChallenge]);

  const handleDeclineChallenge = useCallback(async (challengeId) => {
    try {
      await challengeService.declineChallenge(challengeId);
    } catch (err) {
      console.error('Erro ao recusar desafio:', err);
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors md:hidden"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="relative shrink-0">
          {friendData?.photoURL ? (
            <img
              src={friendData.photoURL}
              alt={friendData.displayName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-900"
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
            {typing.length > 0
              ? '✏️ digitando...'
              : isStudying
                ? '📚 Estudando agora'
                : isOnline
                  ? '🟢 Online'
                  : '⚪ Offline'}
          </p>
        </div>
        {/* Close button — visible only on desktop where there's no back button */}
        {onClose && (
          <button
            onClick={onClose}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
            aria-label="Fechar chat"
            title="Fechar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ overscrollBehavior: 'contain' }}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Carregando mensagens...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-cyan-100 dark:from-primary-900/30 dark:to-cyan-900/30 flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Inicie a conversa!
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-48">
              Envie uma mensagem ou emoji para {friendData?.displayName?.split(' ')[0] || 'seu amigo'} 😊
            </p>
          </div>
        ) : (
          <>
            {processedMessages.map((item) => {
              if (item.type === 'date-separator') {
                return (
                  <div key={item.key} className="flex justify-center my-3">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                      {formatDateSeparator(item.date)}
                    </span>
                  </div>
                );
              }

              return (
                <ChatMessage
                  key={item.key}
                  message={item.data}
                  isOwn={item.isOwn}
                  isFirstInGroup={item.isFirstInGroup}
                  isLastInGroup={item.isLastInGroup}
                  onAcceptChallenge={handleAcceptChallenge}
                  onDeclineChallenge={handleDeclineChallenge}
                  onDelete={deleteMessage}
                />
              );
            })}
          </>
        )}

        <TypingIndicator typingUsers={typing} />
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-20 right-4 w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors z-10"
          >
            <ChevronDown size={18} />
            {newMessageCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-primary-500 rounded-full flex items-center justify-center">
                {newMessageCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <ChatInput onSend={sendMessage} onTyping={handleTyping} />
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
export default ChatWindow;
