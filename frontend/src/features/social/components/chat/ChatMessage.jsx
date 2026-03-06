/**
 * @file ChatMessage.jsx
 * @description Bolha de mensagem estilo WhatsApp com suporte a agrupamento, tipos especiais e ações.
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { Trash2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase-config';
import MessageStatus from './MessageStatus';
import ShareContent from '../shared/ShareContent';
import { formatChatTime } from '../../utils/chatHelpers';
import { toast } from 'sonner';

/**
 * Renders a real-time challenge invite bubble. Subscribes to the challenge
 * document so the UI updates instantly when the invite is accepted/declined.
 */
const ChallengeInviteMessage = memo(({ attachedContent, isOwn, createdAt, onAcceptChallenge, onDeclineChallenge }) => {
  const [challengeStatus, setChallengeStatus] = useState(null);
  const challengeId = attachedContent?.challengeId;

  useEffect(() => {
    if (!challengeId) return;
    const unsub = onSnapshot(
      doc(db, 'challenges', challengeId),
      (snap) => setChallengeStatus(snap.exists() ? snap.data().status : 'expired'),
      () => setChallengeStatus('expired'),
    );
    return () => unsub();
  }, [challengeId]);

  const status = challengeStatus ?? 'pending';

  const statusLabel = () => {
    if (isOwn) {
      if (status === 'in_progress') return <p className="text-xs text-green-600 dark:text-green-400 text-center py-1">✅ Aceito!</p>;
      if (status === 'cancelled' || status === 'declined') return <p className="text-xs text-slate-400 text-center py-1">❌ Recusado.</p>;
      if (status === 'expired') return <p className="text-xs text-slate-400 text-center py-1">⏱️ Expirado.</p>;
      if (status === 'finished') return <p className="text-xs text-slate-400 text-center py-1">🏁 Finalizado.</p>;
      return null;
    }
    if (status === 'pending') return (
      <div className="flex gap-2">
        <button
          onClick={() => onAcceptChallenge?.(challengeId)}
          className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
        >
          Aceitar ⚔️
        </button>
        <button
          onClick={() => onDeclineChallenge?.(challengeId)}
          className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
        >
          Recusar
        </button>
      </div>
    );
    if (status === 'in_progress') return <p className="text-xs font-semibold text-green-600 dark:text-green-400 text-center py-1.5">✅ Duelo em andamento!</p>;
    if (status === 'cancelled' || status === 'declined') return <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center py-1.5">❌ Desafio recusado.</p>;
    if (status === 'expired') return <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-1.5">⏱️ Expirado.</p>;
    if (status === 'finished') return <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-1.5">🏁 Finalizado.</p>;
    return null;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className="max-w-[75%] rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20 shadow-sm">
        <div className="px-3.5 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Duelo de Flashcards!
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
            Deck: <span className="font-medium">{attachedContent.deckName}</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {attachedContent.cardCount} questões
          </p>
          <div className="mt-2.5">{statusLabel()}</div>
        </div>
        <div className="px-3 py-1 bg-amber-500/5 flex justify-end">
          <span className="text-[10px] text-slate-400">{formatChatTime(createdAt)}</span>
        </div>
      </div>
    </div>
  );
});

const ChatMessage = memo(({ message, isOwn, isFirstInGroup, isLastInGroup, onOpenContent, onAcceptChallenge, onDeclineChallenge, onDelete }) => {
  const { type, text, attachedContent, createdAt, status, readBy, senderId } = message;
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setShowActions(false);
      toast.success('Copiado!');
    }
  }, [text]);

  const handleDelete = useCallback(() => {
    onDelete?.(message.id);
    setShowActions(false);
  }, [message.id, onDelete]);

  const toggleActions = useCallback(() => {
    setShowActions((prev) => !prev);
  }, []);

  // Detect if message is emoji-only (1-3 emojis with no other text)
  const isEmojiOnly = text && /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}\u200d\uFE0F\s]{1,11}$/u.test(text.trim()) && text.trim().length <= 11;

  // Mensagem do sistema
  if (type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
          {text}
        </span>
      </div>
    );
  }

  // Convite de desafio
  if (type === 'challenge_invite' && attachedContent) {
    return (
      <ChallengeInviteMessage
        attachedContent={attachedContent}
        isOwn={isOwn}
        createdAt={createdAt}
        onAcceptChallenge={onAcceptChallenge}
        onDeclineChallenge={onDeclineChallenge}
      />
    );
  }

  // Resultado de desafio
  if (type === 'challenge_result' && attachedContent) {
    const { scores, winnerId } = attachedContent;
    const players = Object.entries(scores || {});

    return (
      <div className="flex justify-center my-2">
        <div className="max-w-[75%] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 shadow-sm">
          <div className="px-4 py-3 text-center">
            <span className="text-2xl">🏆</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              Resultado: {attachedContent.deckName}
            </p>
            <div className="flex justify-center gap-6 mt-2">
              {players.map(([uid, data]) => (
                <div key={uid} className={`text-center ${winnerId === uid ? 'font-bold' : ''}`}>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {data.correct}/{data.total}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {winnerId === uid ? '🏅 Vencedor' : winnerId === 'draw' ? '🤝' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Resumo ou flashcard compartilhado
  if ((type === 'resumo' || type === 'flashcard') && attachedContent) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5`}>
        <div className="max-w-[75%]">
          <ShareContent content={attachedContent} onOpen={onOpenContent} />
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-slate-400">{formatChatTime(createdAt)}</span>
            {isOwn && <MessageStatus status={status} readBy={readBy} senderId={senderId} />}
          </div>
        </div>
      </div>
    );
  }

  // Emoji-only message (large emojis)
  if (isEmojiOnly) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}>
        <div
          className="relative max-w-[75%] group cursor-pointer"
          onClick={toggleActions}
        >
          <p className="text-4xl leading-tight px-1">
            {text}
          </p>
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {formatChatTime(createdAt)}
            </span>
            {isOwn && <MessageStatus status={status} readBy={readBy} senderId={senderId} />}
          </div>

          {/* Actions popup */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-10 flex gap-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-10`}
              >
                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Copiar">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                {isOwn && (
                  <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500 transition-colors" title="Apagar">
                    <Trash2 size={14} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Bubble corner radius logic for message grouping
  const getBubbleRadius = () => {
    if (isOwn) {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-md';
      if (isFirstInGroup) return 'rounded-2xl rounded-br-md rounded-br-md';
      if (isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-md';
      return 'rounded-2xl rounded-r-md';
    }
    if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-md';
    if (isFirstInGroup) return 'rounded-2xl rounded-bl-md';
    if (isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-md';
    return 'rounded-2xl rounded-l-md';
  };

  // Mensagem de texto normal — estilo WhatsApp
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}>
      <div
        className={`
          relative max-w-[75%] px-3 py-1.5 ${getBubbleRadius()} group cursor-pointer
          ${isOwn
            ? 'bg-gradient-to-br from-primary-500/15 to-cyan-500/10 dark:from-primary-500/20 dark:to-cyan-500/15 border border-primary-500/20 dark:border-primary-400/15'
            : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-sm'
          }
        `}
        onClick={toggleActions}
      >
        <p className="text-[13.5px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
          {text}
        </p>
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'} -mb-0.5`}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 select-none">
            {formatChatTime(createdAt)}
          </span>
          {isOwn && <MessageStatus status={status} readBy={readBy} senderId={senderId} />}
        </div>

        {/* Actions popup */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-10 flex gap-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-10`}
            >
              <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Copiar">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
              {isOwn && (
                <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500 transition-colors" title="Apagar">
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;
