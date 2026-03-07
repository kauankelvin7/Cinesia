/**
 * 🪟 CHAT WINDOW
 * * Janela de conversa de alta fidelidade com agrupamento inteligente.
 * - Header imersivo com status em tempo real
 * - Gerenciamento de scroll otimizado para mobile
 * - Separadores de data com design Glassmorphism
 */

import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, ChevronDown, X, Sparkles, Clock, BookOpen } from 'lucide-react';
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

/* ─── Funções de Processamento Intactas ─── */
function processMessages(messages, currentUserId) {
  const result = [];
  let lastDate = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    if (dateKey !== lastDate) {
      result.push({ type: 'date-separator', date: msgDate, key: `date-${dateKey}` });
      lastDate = dateKey;
    }

    const prev = messages[i - 1];
    const next = messages[i + 1];
    const sameSenderAsPrev = prev && prev.senderId === msg.senderId && prev.type !== 'system';
    const sameSenderAsNext = next && next.senderId === msg.senderId && next.type !== 'system';

    const prevTime = prev?.createdAt?.toDate ? prev.createdAt.toDate() : prev?.createdAt ? new Date(prev.createdAt) : null;
    const nextTime = next?.createdAt?.toDate ? next.createdAt.toDate() : next?.createdAt ? new Date(next.createdAt) : null;
    const closeInTimePrev = prevTime && (msgDate - prevTime) < 120000;
    const closeInTimeNext = nextTime && (nextTime - msgDate) < 120000;

    result.push({
      type: 'message',
      data: msg,
      isOwn: msg.senderId === currentUserId,
      isFirstInGroup: !(sameSenderAsPrev && closeInTimePrev),
      isLastInGroup: !(sameSenderAsNext && closeInTimeNext),
      key: msg.id,
    });
  }
  return result;
}

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

  const processedMessages = useMemo(() => processMessages(messages, user?.uid), [messages, user?.uid]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
    setShowScrollDown(false);
    setNewMessageCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottom.current = atBottom;
    setShowScrollDown(!atBottom);
    if (atBottom) {
      setNewMessageCount(0);
      markAsRead();
    }
  }, [markAsRead]);

  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCount.current) {
      if (isAtBottom.current) scrollToBottom();
      else setNewMessageCount((prev) => prev + (count - prevMessageCount.current));
    }
    prevMessageCount.current = count;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom(false);
  }, [loading]);

  const handleAcceptChallenge = useCallback(async (challengeId) => {
    try {
      await challengeService.acceptChallenge(challengeId, user.uid);
      startChallenge(challengeId);
    } catch (err) {
      toast.error(err.message || 'Erro ao aceitar desafio');
    }
  }, [user?.uid, startChallenge]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative">
      {/* ─── Header Premium ─── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-30">
        <button
          onClick={onBack}
          aria-label="Voltar para lista de conversas"
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 md:hidden"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>

        <div className="relative">
          {friendData?.photoURL ? (
            <img src={friendData.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: getAvatarColor(friendData?.displayName) }}>
              {getInitials(friendData?.displayName)}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 scale-110">
            <OnlineIndicator isOnline={friendStatus?.isOnline} isStudying={friendStatus?.isStudying} size="xs" pulse />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-black text-slate-900 dark:text-white truncate tracking-tight leading-none">
            {friendData?.displayName || 'Estudante'}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            {typing.length > 0 ? (
              <span className="text-[11px] font-bold text-indigo-500 animate-pulse uppercase tracking-tighter">Escrevendo...</span>
            ) : friendStatus?.isStudying ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 uppercase tracking-tighter"><BookOpen size={10} /> Em Foco</span>
            ) : friendStatus?.isOnline ? (
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-tighter">Disponível</span>
            ) : (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Offline</span>
            )}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar conversa"
            className="hidden md:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ─── Mensagens ─── */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-950"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sincronizando</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[32px] flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">O começo de uma jornada!</p>
            <p className="text-xs mt-1">Diga olá para {friendData?.displayName?.split(' ')[0]}</p>
          </div>
        ) : (
          processedMessages.map((item) => {
            if (item.type === 'date-separator') {
              return (
                <div key={item.key} className="flex justify-center my-6 sticky top-2 z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-900/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
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
                onDeclineChallenge={() => challengeService.declineChallenge(item.data.attachedContent?.challengeId)}
                onDelete={deleteMessage}
              />
            );
          })
        )}
        <TypingIndicator typingUsers={typing} />
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ─── Botão Scroll-to-Bottom ─── */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 w-11 h-11 rounded-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-500 z-40 transition-transform active:scale-90"
          >
            <ChevronDown size={22} strokeWidth={3} />
            {newMessageCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -left-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black shadow-lg"
              >
                {newMessageCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Input Row ─── */}
      <div className="relative z-40">
        <ChatInput onSend={sendMessage} onTyping={handleTyping} />
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
export default ChatWindow;