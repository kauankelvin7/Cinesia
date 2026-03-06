/**
 * @file chatService.js
 * @description Serviço de chat em tempo real via Firestore.
 * Gerencia conversas, mensagens, indicadores de digitação, leitura e status de entrega.
 */

import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Timestamp,
  increment, writeBatch, startAfter,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { handleFirestoreError } from '../../../utils/firestoreErrorHandler';

/**
 * Gera ID determinístico para conversas 1-a-1.
 */
export const getConversationId = (uid1, uid2) => [uid1, uid2].sort().join('_');

export const chatService = {
  /**
   * Busca ou cria uma conversa 1-a-1.
   * @returns {string} conversationId
   */
  async getOrCreateConversation(currentUserId, friendId, currentUserData, friendData) {
    const convId = getConversationId(currentUserId, friendId);
    const convRef = doc(db, 'conversations', convId);
    const snap = await getDoc(convRef);

    if (!snap.exists()) {
      const participants = [currentUserId, friendId].sort();
      await setDoc(convRef, {
        id: convId,
        type: 'direct',
        participants,
        lastMessage: null,
        unreadCount: { [currentUserId]: 0, [friendId]: 0 },
        readBy: {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        participantsData: {
          [currentUserId]: {
            uid: currentUserId,
            displayName: currentUserData?.displayName || 'Usuário',
            photoURL: currentUserData?.photoURL || null,
          },
          [friendId]: {
            uid: friendId,
            displayName: friendData?.displayName || 'Usuário',
            photoURL: friendData?.photoURL || null,
          },
        },
      });
    }

    return convId;
  },

  /**
   * Envia uma mensagem em uma conversa.
   * @returns {string} messageId
   */
  async sendMessage(conversationId, senderId, senderData, messageData) {
    const batch = writeBatch(db);

    // 1. Cria a mensagem na subcoleção
    const msgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    batch.set(msgRef, {
      id: msgRef.id,
      senderId,
      senderName: senderData?.displayName || 'Usuário',
      senderPhoto: senderData?.photoURL || null,
      type: messageData.type || 'text',
      text: messageData.text || '',
      attachedContent: messageData.attachedContent || null,
      status: 'sent',
      readBy: { [senderId]: Timestamp.now() },
      deliveredTo: { [senderId]: Timestamp.now() },
      createdAt: Timestamp.now(),
      editedAt: null,
      deletedAt: null,
    });

    // 2. Atualiza lastMessage + unreadCount na conversa
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    const participants = convSnap.data()?.participants || [];

    const updates = {
      lastMessage: {
        text: messageData.text || `[${messageData.type || 'text'}]`,
        senderId,
        senderName: senderData?.displayName || 'Usuário',
        timestamp: Timestamp.now(),
        type: messageData.type || 'text',
      },
      updatedAt: Timestamp.now(),
    };

    // Incrementa unread para todos exceto o remetente
    participants.forEach((uid) => {
      if (uid !== senderId) {
        updates[`unreadCount.${uid}`] = increment(1);
      }
    });

    batch.update(convRef, updates);
    await batch.commit();
    return msgRef.id;
  },

  /**
   * Marca conversa como lida pelo usuário e atualiza readBy nas mensagens não lidas.
   */
  async markAsRead(conversationId, userId) {
    if (!conversationId || !userId) return;

    const batch = writeBatch(db);

    // 1. Zera unreadCount + marca readBy na conversa
    const convRef = doc(db, 'conversations', conversationId);
    batch.update(convRef, {
      [`unreadCount.${userId}`]: 0,
      [`readBy.${userId}`]: Timestamp.now(),
    });

    // 2. Atualiza readBy em mensagens que ainda não foram lidas por este usuário
    try {
      const msgsSnap = await getDocs(
        query(
          collection(db, 'conversations', conversationId, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(50),
        ),
      );
      const now = Timestamp.now();
      msgsSnap.docs.forEach((msgDoc) => {
        const data = msgDoc.data();
        if (data.senderId !== userId && !data.readBy?.[userId]) {
          batch.update(msgDoc.ref, {
            [`readBy.${userId}`]: now,
            [`deliveredTo.${userId}`]: data.deliveredTo?.[userId] || now,
            status: 'read',
          });
        }
      });
    } catch {
      // silently continue — conversation-level read is still set
    }

    await batch.commit();
  },

  /**
   * Define indicador de "digitando..." para o usuário.
   */
  async setTyping(conversationId, userId, isTyping, userName = null) {
    if (!conversationId || !userId) return;
    const typingRef = doc(db, 'conversations', conversationId, 'typing', userId);
    if (isTyping) {
      await setDoc(typingRef, {
        userId,
        userName: userName || 'Alguém',
        typingAt: Timestamp.now(),
      });
    } else {
      try {
        await deleteDoc(typingRef);
      } catch {
        // doc pode não existir — ignora
      }
    }
  },

  /**
   * Assina indicadores de digitação dos outros participantes.
   * @returns {Function} unsubscribe
   */
  subscribeTyping(conversationId, currentUserId, callback) {
    if (!conversationId) return () => {};
    const q = collection(db, 'conversations', conversationId, 'typing');
    return onSnapshot(
      q,
      (snap) => {
        const typingUsers = snap.docs
          .map((d) => d.data())
          .filter((d) => d.userId !== currentUserId);
        callback(typingUsers);
      },
      (error) => handleFirestoreError(error, 'subscribeTyping'),
    );
  },

  /**
   * Assina mensagens de uma conversa em tempo real (últimas N mensagens).
   * @returns {Function} unsubscribe
   */
  subscribeMessages(conversationId, callback, limitCount = 80) {
    if (!conversationId) return () => {};
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(limitCount),
    );
    return onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => !m.deletedAt);
        callback(msgs);
      },
      (error) => handleFirestoreError(error, 'subscribeMessages'),
    );
  },

  /**
   * Assina lista de conversas do usuário ordenada por última atualização.
   * @returns {Function} unsubscribe
   */
  subscribeConversations(userId, callback) {
    if (!userId) return () => {};
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        // Fallback: se o índice ainda não existe, tenta sem ordenação
        if (error?.code === 'failed-precondition') {
          console.warn('[chatService] Índice sendo criado, usando fallback sem ordenação...');
          const qFallback = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', userId),
          );
          onSnapshot(
            qFallback,
            (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
            (err) => handleFirestoreError(err, 'subscribeConversations-fallback'),
          );
          return;
        }
        handleFirestoreError(error, 'subscribeConversations');
      },
    );
  },

  /**
   * Compartilha conteúdo (resumo ou flashcard) no chat.
   */
  async shareContent(conversationId, senderId, senderData, content) {
    return chatService.sendMessage(conversationId, senderId, senderData, {
      type: content.type,
      text: `Compartilhou um ${content.type === 'resumo' ? 'resumo' : 'deck de flashcards'}`,
      attachedContent: content,
    });
  },

  /**
   * Calcula total de mensagens não lidas em todas as conversas.
   * @returns {Function} unsubscribe que chama callback(totalUnread)
   */
  subscribeTotalUnread(userId, callback) {
    if (!userId) return () => {};
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
    );
    return onSnapshot(
      q,
      (snap) => {
        let total = 0;
        snap.docs.forEach((d) => {
          const data = d.data();
          total += data.unreadCount?.[userId] || 0;
        });
        callback(total);
      },
      (error) => handleFirestoreError(error, 'subscribeTotalUnread'),
    );
  },

  /**
   * Deleta uma mensagem (soft delete).
   */
  async deleteMessage(conversationId, messageId) {
    if (!conversationId || !messageId) return;
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, { deletedAt: Timestamp.now() });
  },
};
