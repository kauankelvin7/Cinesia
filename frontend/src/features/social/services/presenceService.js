/**
 * @file presenceService.js
 * @description Sistema de presença em tempo real usando Firebase Realtime Database.
 * Detecta online/offline automaticamente via .info/connected e onDisconnect.
 */

import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, rtdb } from '../../../config/firebase-config';

export const presenceService = {
  /**
   * Inicializa o sistema de presença para o usuário autenticado.
   * Deve ser chamado uma vez após login.
   */
  initPresence(userId, currentPage = 'home') {
    if (!userId || !rtdb) return () => {};

    try {
    const userStatusRTDBRef = ref(rtdb, `/status/${userId}`);
    const userDocRef = doc(db, 'users', userId);

    const isOfflineData = {
      isOnline: false,
      isStudying: false,
      lastActive: rtdbTimestamp(),
    };

    const isOnlineData = {
      isOnline: true,
      isStudying: true,
      currentPage,
      lastActive: rtdbTimestamp(),
    };

    // Quando desconectar, RTDB atualiza automaticamente para offline
    onDisconnect(userStatusRTDBRef).set(isOfflineData);

    const connectedRef = ref(rtdb, '.info/connected');
    const unsubscribe = onValue(connectedRef, async (snap) => {
      if (snap.val() === false) return;

      // Re-registra o handler de disconnect
      await onDisconnect(userStatusRTDBRef).set(isOfflineData);
      await set(userStatusRTDBRef, isOnlineData);

      // Espelha no Firestore para queries
      try {
        await updateDoc(userDocRef, {
          isOnline: true,
          isStudying: true,
          currentPage,
          lastActive: serverTimestamp(),
        });
      } catch {
        // Doc pode não existir ainda — ignora silenciosamente
      }
    });

    return unsubscribe;
    } catch {
      return () => {};
    }
  },

  /**
   * Atualiza a página atual do usuário (ex: "flashcards", "resumos").
   */
  async setCurrentPage(userId, page) {
    if (!userId || !rtdb) return;
    try {
    const userStatusRTDBRef = ref(rtdb, `/status/${userId}`);
    await set(userStatusRTDBRef, {
      isOnline: true,
      isStudying: true,
      currentPage: page,
      lastActive: rtdbTimestamp(),
    });
    try {
      await updateDoc(doc(db, 'users', userId), {
        currentPage: page,
        lastActive: serverTimestamp(),
      });
    } catch {
      // ignora se doc não existe
    }
    } catch {
      // RTDB não disponível — ignora silenciosamente
    }
  },

  /**
   * Marca o usuário como offline manualmente (logout).
   */
  async goOffline(userId) {
    if (!userId || !rtdb) return;
    try {
    const userStatusRTDBRef = ref(rtdb, `/status/${userId}`);
    await set(userStatusRTDBRef, {
      isOnline: false,
      isStudying: false,
      lastActive: rtdbTimestamp(),
    });
    try {
      await updateDoc(doc(db, 'users', userId), {
        isOnline: false,
        isStudying: false,
        lastActive: serverTimestamp(),
      });
    } catch {
      // ignora
    }
    } catch {
      // RTDB não disponível — ignora silenciosamente
    }
  },

  /**
   * Assina o status de presença de uma lista de amigos.
   * @returns {Function} unsubscribe
   */
  subscribeToFriendsStatus(friendIds, callback) {
    if (!friendIds?.length || !rtdb) return () => {};

    try {
    const unsubscribes = friendIds.map((friendId) => {
      const statusRef = ref(rtdb, `/status/${friendId}`);
      return onValue(statusRef, (snap) => {
        const data = snap.val() || { isOnline: false, isStudying: false };
        callback(friendId, data);
      });
    });

    return () => unsubscribes.forEach((fn) => fn());
    } catch {
      return () => {};
    }
  },

  /**
   * Assina o status de um único usuário.
   * @returns {Function} unsubscribe
   */
  subscribeToUserStatus(userId, callback) {
    if (!userId || !rtdb) return () => {};
    try {
      const statusRef = ref(rtdb, `/status/${userId}`);
      return onValue(statusRef, (snap) => {
        const data = snap.val() || { isOnline: false, isStudying: false };
        callback(data);
      });
    } catch {
      return () => {};
    }
  },
};
