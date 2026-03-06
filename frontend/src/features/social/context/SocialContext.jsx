/**
 * @file SocialContext.jsx
 * @description Contexto global do sistema social. Centraliza:
 * - Total de mensagens não lidas (badge global)
 * - Pedidos de amizade pendentes (badge)
 * - Estado do painel de chat (aberto/fechado)
 * - Desafio ativo
 * - Presença do usuário
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext-firebase';
import { chatService } from '../services/chatService';
import { friendsService } from '../services/friendsService';
import { presenceService } from '../services/presenceService';
import { useLocation } from 'react-router-dom';

const SocialContext = createContext(null);

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) {
    throw new Error('useSocial deve ser usado dentro de um SocialProvider');
  }
  return ctx;
};

export const SocialProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Estado global
  const [totalUnread, setTotalUnread] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeChallengeId, setActiveChallengeId] = useState(null);

  const presenceInitialized = useRef(false);
  const presenceCleanup = useRef(null);

  // Inicializa presença e perfil público
  useEffect(() => {
    if (!user?.uid) {
      presenceInitialized.current = false;
      return;
    }

    // Garante que o perfil público existe
    friendsService.ensureUserProfile(user);

    // Inicializa presença (online/offline automático)
    if (!presenceInitialized.current) {
      presenceCleanup.current = presenceService.initPresence(
        user.uid,
        location.pathname.replace('/', '') || 'home',
      );
      presenceInitialized.current = true;
    }

    return () => {
      if (presenceCleanup.current) {
        presenceCleanup.current();
        presenceCleanup.current = null;
      }
      if (user?.uid) {
        presenceService.goOffline(user.uid);
      }
      presenceInitialized.current = false;
    };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualiza página atual no sistema de presença
  useEffect(() => {
    if (!user?.uid || !presenceInitialized.current) return;
    const page = location.pathname.replace('/', '') || 'home';
    presenceService.setCurrentPage(user.uid, page);
  }, [location.pathname, user?.uid]);

  // Assina total de não lidas (chat)
  useEffect(() => {
    if (!user?.uid) return;
    return chatService.subscribeTotalUnread(user.uid, setTotalUnread);
  }, [user?.uid]);

  // Assina pedidos pendentes
  useEffect(() => {
    if (!user?.uid) return;
    return friendsService.subscribePendingRequests(user.uid, (requests) => {
      setPendingRequestsCount(requests.length);
    });
  }, [user?.uid]);

  // Ações
  const openChat = useCallback((conversationId = null) => {
    setIsChatOpen(true);
    if (conversationId) setActiveConversationId(conversationId);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setActiveConversationId(null);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      if (prev) setActiveConversationId(null);
      return !prev;
    });
  }, []);

  const openConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId);
    setIsChatOpen(true);
  }, []);

  const backToList = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const startChallenge = useCallback((challengeId) => {
    setActiveChallengeId(challengeId);
  }, []);

  const endChallenge = useCallback(() => {
    setActiveChallengeId(null);
  }, []);

  const value = {
    // State
    totalUnread,
    pendingRequestsCount,
    isChatOpen,
    activeConversationId,
    activeChallengeId,

    // Actions
    openChat,
    closeChat,
    toggleChat,
    openConversation,
    backToList,
    startChallenge,
    endChallenge,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};
