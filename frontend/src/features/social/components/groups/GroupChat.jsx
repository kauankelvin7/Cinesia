/**
 * @file GroupChat.jsx
 * @description Chat em tempo real para grupos de estudo. Reutiliza lógica do ChatWindow.
 */

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  MoreVertical,
  Send,
  BookOpen,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useChat } from '../../hooks/useChat';
import { formatMessageTime } from '../../utils/chatHelpers';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import TypingIndicator from '../chat/TypingIndicator';

const GroupChat = memo(({ group, onBack, onShowMembers }) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, typing, handleTyping } = useChat(
    group?.id,
  );
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
    inputRef.current?.focus();
  }, [text, sendMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInputChange = useCallback(
    (e) => {
      setText(e.target.value);
      handleTyping?.();
    },
    [handleTyping],
  );

  if (!group) return null;

  const typingUsers = Array.isArray(typing)
    ? typing.filter((t) => t.userId !== user?.uid)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} className="text-slate-500" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          {group.photoURL ? (
            <img
              src={group.photoURL}
              alt={group.groupName}
              className="w-10 h-10 rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <BookOpen size={16} className="text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {group.groupName}
          </h4>
          <p className="text-[10px] text-slate-400">
            {group.participants?.length || 0} membros
          </p>
        </div>

        <button
          onClick={onShowMembers}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Ver membros"
        >
          <Users size={18} className="text-slate-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} className="text-violet-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              Nenhuma mensagem ainda. Diga oi! 👋
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === user?.uid;
            const prevMsg = messages[idx - 1];
            const showSender =
              !isOwn &&
              (!prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system');

            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="flex justify-center"
                >
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    isOwn
                      ? 'bg-violet-500 text-white rounded-2xl rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-md'
                  } px-3 py-2`}
                >
                  {showSender && (
                    <p className="text-[10px] font-semibold text-violet-300 dark:text-violet-400 mb-0.5">
                      {msg.senderName || 'Membro'}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                    {msg.text}
                  </p>
                  <p
                    className={`text-[9px] mt-1 ${
                      isOwn ? 'text-white/60' : 'text-slate-400'
                    } text-right`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <TypingIndicator typingUsers={typingUsers} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem..."
            rows={1}
            className="flex-1 resize-none px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 max-h-25"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Enviar"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

GroupChat.displayName = 'GroupChat';
export default GroupChat;
