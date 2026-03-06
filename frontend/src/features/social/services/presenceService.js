/**
 * @file presenceService.js
 * @description Sistema de presença em tempo real usando Firebase Realtime Database.
 * Detecta online/offline automaticamente via .info/connected e onDisconnect.
 *
 * IMPORTANTE: setCurrentPage usa update() (não set()) para preservar o onDisconnect handler.
 */

import { ref, onValue, set, update, onDisconnect, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, rtdb } from '../../../config/firebase-config';

// Páginas que indicam estudo ativo
const STUDY_PAGES = ['flashcards', 'resumos', 'simulados', 'materias', 'consulta-rapida', 'quadro-branco'];

function isStudyPage(page) {
  return STUDY_PAGES.some((p) => page?.toLowerCase().includes(p));
}

export const presenceService = {
  // Referência para cleanup do beforeunload
  _beforeUnloadHandler: null,
  _userId: null,

  /**
   * Inicializa o sistema de presença para o usuário autenticado.
   * Deve ser chamado uma vez após login.
   */
  initPresence(userId, currentPage = 'home') {
    if (!userId || !rtdb) return () => {};

    this._userId = userId;

    try {
      const userStatusRTDBRef = ref(rtdb, `/status/${userId}`);
      const userDocRef = doc(db, 'users', userId);
      const studying = isStudyPage(currentPage);

      const isOfflineData = {
        isOnline: false,
        isStudying: false,
        lastActive: rtdbTimestamp(),
      };

      const isOnlineData = {
        isOnline: true,
        isStudying: studying,
        currentPage,
        lastActive: rtdbTimestamp(),
      };

      const connectedRef = ref(rtdb, '.info/connected');
      const unsubscribe = onValue(connectedRef, async (snap) => {
        if (snap.val() === false) return;

        // Re-registra o handler de disconnect a cada reconexão
        await onDisconnect(userStatusRTDBRef).set(isOfflineData);
        await set(userStatusRTDBRef, isOnlineData);

        // Espelha no Firestore para queries
        try {
          await updateDoc(userDocRef, {
            isOnline: true,
            isStudying: studying,
            currentPage,
            lastActive: serverTimestamp(),
          });
        } catch {
          // Doc pode não existir ainda
        }
      });

      // Handler para fechar aba/janela — garante offline imediato
      if (this._beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      }
      this._beforeUnloadHandler = () => {
        // sendBeacon é síncrono e funciona durante unload
        // Mas RTDB não suporta sendBeacon, então confiamos no onDisconnect
        // O set() síncrono abaixo é best-effort
        try {
          set(userStatusRTDBRef, {
            isOnline: false,
            isStudying: false,
            lastActive: rtdbTimestamp(),
          });
        } catch {
          // onDisconnect irá cuidar
        }
      };
      window.addEventListener('beforeunload', this._beforeUnloadHandler);

      return () => {
        unsubscribe();
        if (this._beforeUnloadHandler) {
          window.removeEventListener('beforeunload', this._beforeUnloadHandler);
          this._beforeUnloadHandler = null;
        }
      };
    } catch {
      return () => {};
    }
  },

  /**
   * Atualiza a página atual do usuário.
   * IMPORTANTE: usa update() para NÃO destruir o onDisconnect handler.
   */
  async setCurrentPage(userId, page) {
    if (!userId || !rtdb) return;
    try {
      const userStatusRTDBRef = ref(rtdb, `/status/${userId}`);
      const studying = isStudyPage(page);

      // update() faz merge parcial — preserva o onDisconnect handler
      await update(userStatusRTDBRef, {
        currentPage: page,
        isStudying: studying,
        lastActive: rtdbTimestamp(),
      });

      try {
        await updateDoc(doc(db, 'users', userId), {
          currentPage: page,
          isStudying: studying,
          lastActive: serverTimestamp(),
        });
      } catch {
        // ignora se doc não existe
      }
    } catch {
      // RTDB não disponível
    }
  },

  /**
   * Marca o usuário como offline manualmente (logout ou cleanup).
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
      // RTDB não disponível
    }

    // Remove beforeunload handler
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
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

          // Ghost-online protection: se lastActive > 10 min e online, considerar offline
          if (data.isOnline && data.lastActive) {
            const lastActive = typeof data.lastActive === 'number' ? data.lastActive : Date.now();
            const diffMin = (Date.now() - lastActive) / 60000;
            if (diffMin > 10) {
              data.isOnline = false;
              data.isStudying = false;
            }
          }

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
