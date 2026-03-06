/**
 * @file ChatMessage.jsx
 * @description Bolha de mensagem individual com suporte a tipos especiais.
 */

import React, { memo } from 'react';
import MessageStatus from './MessageStatus';
import ShareContent from '../shared/ShareContent';
import { formatChatTime } from '../../utils/chatHelpers';

const ChatMessage = memo(({ message, isOwn, onOpenContent, onAcceptChallenge, onDeclineChallenge }) => {
  const { type, text, attachedContent, createdAt, status } = message;

  // Mensagem do sistema
  if (type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          {text}
        </span>
      </div>
    );
  }

  // Convite de desafio
  if (type === 'challenge_invite' && attachedContent) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="max-w-70 rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="px-3 py-2.5">
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
            {!isOwn && (
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => onAcceptChallenge?.(attachedContent.challengeId)}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  Aceitar ⚔️
                </button>
                <button
                  onClick={() => onDeclineChallenge?.(attachedContent.challengeId)}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Recusar
                </button>
              </div>
            )}
          </div>
          <div className="px-3 py-1 bg-amber-500/5 flex justify-end">
            <span className="text-[10px] text-slate-400">{formatChatTime(createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Resultado de desafio
  if (type === 'challenge_result' && attachedContent) {
    const { scores, winnerId } = attachedContent;
    const players = Object.entries(scores || {});

    return (
      <div className="flex justify-center mb-2">
        <div className="max-w-70 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850">
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
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="max-w-70">
          <ShareContent content={attachedContent} onOpen={onOpenContent} />
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-slate-400">{formatChatTime(createdAt)}</span>
            {isOwn && <MessageStatus status={status} />}
          </div>
        </div>
      </div>
    );
  }

  // Mensagem de texto normal
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`
          max-w-70 px-3 py-2 rounded-2xl
          ${isOwn
            ? 'bg-cyan-600/20 border border-cyan-500/30 rounded-br-md'
            : 'bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600/40 rounded-bl-md'
          }
        `}
      >
        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap wrap-break-word">
          {text}
        </p>
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatChatTime(createdAt)}
          </span>
          {isOwn && <MessageStatus status={status} />}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;
