/**
 * @file useChat.js
 * @description Hook para chat em tempo real — mensagens, conversas e typing indicators.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext-firebase';
import { chatService } from '../services/chatService';

/**
 * @param {string|null} conversationId - ID da conversa ativa (null se nenhuma aberta)
 * @returns {{ messages, conversations, typing, loading, sendMessage, handleTyping, shareContent, markAsRead }}
 */
export function useChat(conversationId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [typing, setTyping] = useState([]);
  const [loading, setLoading] = useState(true);
  const typingTimeout = useRef(null);

  // Assina todas as conversas do usuário
  useEffect(() => {
    if (!user?.uid) return;
    return chatService.subscribeConversations(user.uid, (convs) => {
      setConversations(convs);
    });
  }, [user?.uid]);

  // Assina mensagens + typing da conversa ativa
  useEffect(() => {
    if (!conversationId || !user?.uid) {
      setMessages([]);
      setTyping([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubMsg = chatService.subscribeMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    const unsubTyping = chatService.subscribeTyping(conversationId, user.uid, setTyping);

    // Marca como lido ao abrir a conversa
    chatService.markAsRead(conversationId, user.uid);

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [conversationId, user?.uid]);

  const sendMessage = useCallback(
    async (text, type = 'text', attachedContent = null) => {
      if (!user?.uid || !conversationId || !text?.trim()) return;
      await chatService.sendMessage(conversationId, user.uid, user, {
        text,
        type,
        attachedContent,
      });
      // Para o indicador de digitando
      chatService.setTyping(conversationId, user.uid, false);
    },
    [user, conversationId],
  );

  const handleTyping = useCallback(() => {
    if (!conversationId || !user?.uid) return;
    chatService.setTyping(conversationId, user.uid, true);

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      chatService.setTyping(conversationId, user.uid, false);
    }, 2000);
  }, [conversationId, user?.uid]);

  const shareContent = useCallback(
    async (content) => {
      if (!user?.uid || !conversationId) return;
      await chatService.shareContent(conversationId, user.uid, user, content);
    },
    [user, conversationId],
  );

  const markAsRead = useCallback(() => {
    if (!conversationId || !user?.uid) return;
    chatService.markAsRead(conversationId, user.uid);
  }, [conversationId, user?.uid]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => clearTimeout(typingTimeout.current);
  }, []);

  return {
    messages,
    conversations,
    typing,
    loading,
    sendMessage,
    handleTyping,
    shareContent,
    markAsRead,
  };
}
