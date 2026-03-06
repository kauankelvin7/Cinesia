/**
 * @file friendsService.js
 * @description CRUD de amizades no Firestore. Gerencia pedidos, aceitações,
 * recusas, bloqueios e busca de usuários.
 */

import {
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc,
  query, where, getDocs, onSnapshot, orderBy, Timestamp, limit,
} from 'firebase/firestore';
import { cleanUndefined } from '../../../utils/firestoreHelpers';
import { db } from '../../../config/firebase-config';
import { handleFirestoreError } from '../../../utils/firestoreErrorHandler';
import { getAuth } from 'firebase/auth';

const auth = getAuth();

/**
 * Gera um ID determinístico para a amizade (sempre o mesmo independente da ordem).
 */
export const getFriendshipId = (uid1, uid2) =>
  [uid1, uid2].sort().join('_');

export const friendsService = {
  /**
   * Envia um pedido de amizade.
   */
  async sendFriendRequest(currentUser, targetUser) {
    // Resolve uid — compatível com documentos Firestore antigos que têm .id mas não têm .uid
    const currentUserResolved = {
      ...currentUser,
      uid: currentUser?.uid || currentUser?.id || null,
    };
    const targetUserResolved = {
      ...targetUser,
      uid: targetUser?.uid || targetUser?.id || null,
    };

    // Fallback: se currentUser ainda sem uid, pega do Firebase Auth
    if (!currentUserResolved.uid) {
      const { getAuth } = await import('firebase/auth');
      const authUid = getAuth().currentUser?.uid;
      if (authUid) currentUserResolved.uid = authUid;
    }

    if (!currentUserResolved.uid || !targetUserResolved.uid) {
      console.error('[Friendship] UID ausente após resolução:', {
        currentUser: currentUserResolved,
        targetUser: targetUserResolved,
      });
      throw new Error(
        'Não foi possível identificar o usuário. ' +
        'Tente fazer logout e login novamente.'
      );
    }

    const fid = getFriendshipId(currentUserResolved.uid, targetUserResolved.uid);
    const friendshipRef = doc(db, 'friendships', fid);

    const existing = await getDoc(friendshipRef);
    if (existing.exists()) {
      const data = existing.data();
      if (data.status === 'accepted') throw new Error('Vocês já são amigos!');
      if (data.status === 'pending')  throw new Error('Pedido já enviado!');
      if (data.status === 'blocked')  throw new Error('Não é possível enviar pedido.');
    }

    const sortedUsers = [currentUser.uid, targetUser.uid].sort();

    const dadosAmizade = {
      id: fid,
      users: sortedUsers,
      status: 'pending',
      requestedBy: currentUser.uid,
      requestedTo: targetUser.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      user1Data: {
        uid: sortedUsers[0] === currentUser.uid ? currentUser.uid : targetUser.uid,
        displayName: sortedUsers[0] === currentUser.uid
          ? (currentUser.displayName || currentUser.email || '')
          : (targetUser.displayName  || targetUser.email  || ''),
        photoURL: sortedUsers[0] === currentUser.uid
          ? (typeof currentUser.photoURL === 'string' ? currentUser.photoURL : null)
          : (typeof targetUser.photoURL  === 'string' ? targetUser.photoURL  : null),
      },
      user2Data: {
        uid: sortedUsers[1] === currentUser.uid ? currentUser.uid : targetUser.uid,
        displayName: sortedUsers[1] === currentUser.uid
          ? (currentUser.displayName || currentUser.email || '')
          : (targetUser.displayName  || targetUser.email  || ''),
        photoURL: sortedUsers[1] === currentUser.uid
          ? (typeof currentUser.photoURL === 'string' ? currentUser.photoURL : null)
          : (typeof targetUser.photoURL  === 'string' ? targetUser.photoURL  : null),
      },
    };

    const encontrarUndefined = (obj, caminho = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const caminhoAtual = caminho ? `${caminho}.${key}` : key;
        if (value === undefined) {
          console.error(`[Firestore] Campo undefined: "${caminhoAtual}"`);
        } else if (typeof value === 'object' && value !== null && !value?.toDate) {
          encontrarUndefined(value, caminhoAtual);
        }
      });
    };

    encontrarUndefined(dadosAmizade);
    await setDoc(friendshipRef, cleanUndefined(dadosAmizade));

    const dadosNotificacao = {
      recipientId: targetUser.uid,
      type: 'friend_request',
      title: 'Novo pedido de amizade',
      body: `${currentUser.displayName || currentUser.email} quer ser seu amigo no Cinesia`,
      data: {
        senderId:    currentUser.uid,
        senderName:  currentUser.displayName || currentUser.email,
        senderPhoto: currentUser.photoURL || null,
        friendshipId: fid,
      },
      read: false,
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(collection(db, 'notifications')), cleanUndefined(dadosNotificacao));

    return fid;
  },

  /**
   * Aceita um pedido de amizade pendente.
   */
  async acceptFriendRequest(friendshipId) {
    await updateDoc(doc(db, 'friendships', friendshipId), cleanUndefined({
      status: 'accepted',
      updatedAt: Timestamp.now(),
    }));
  },

  /**
   * Recusa um pedido (remove o documento).
   */
  async declineFriendRequest(friendshipId) {
    await deleteDoc(doc(db, 'friendships', friendshipId));
  },

  /**
   * Remove amizade existente.
   */
  async removeFriend(friendshipId) {
    await deleteDoc(doc(db, 'friendships', friendshipId));
  },

  /**
   * Bloqueia um usuário.
   */
  async blockUser(friendshipId) {
    await updateDoc(doc(db, 'friendships', friendshipId), cleanUndefined({
      status: 'blocked',
      updatedAt: Timestamp.now(),
    }));
  },

  /**
   * Assina a lista de amigos aceitos em tempo real.
   * @returns {Function} unsubscribe
   */
  subscribeFriends(userId, callback) {
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId),
      where('status', '==', 'accepted'),
    );
    return onSnapshot(
      q,
      (snap) => {
        const friends = snap.docs.map((d) => {
          const data = d.data();
          const isUser1 = data.users[0] === userId;
          const friendData = isUser1 ? data.user2Data : data.user1Data;
          return { ...friendData, friendshipId: d.id };
        });
        callback(friends);
      },
      (error) => handleFirestoreError(error, 'subscribeFriends'),
    );
  },

  /**
   * Assina pedidos de amizade recebidos pendentes.
   * @returns {Function} unsubscribe
   */
  subscribePendingRequests(userId, callback) {
    const q = query(
      collection(db, 'friendships'),
      where('requestedTo', '==', userId),
      where('status', '==', 'pending'),
    );
    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, 'subscribePendingRequests'),
    );
  },

  /**
   * Assina pedidos enviados pelo usuário (pendentes).
   * @returns {Function} unsubscribe
   */
  subscribeSentRequests(userId, callback) {
    const q = query(
      collection(db, 'friendships'),
      where('requestedBy', '==', userId),
      where('status', '==', 'pending'),
    );
    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, 'subscribeSentRequests'),
    );
  },

  /**
   * Busca usuários por displayName (prefix search, case-insensitive).
   */
  async searchUsers(searchTerm, currentUserId) {
    if (!searchTerm || searchTerm.trim().length < 2) return [];

    const trimmed = searchTerm.trim().toLowerCase();
    const q = query(
      collection(db, 'users'),
      where('displayNameLower', '>=', trimmed),
      where('displayNameLower', '<=', trimmed + '\uf8ff'),
      orderBy('displayNameLower'),
      limit(20),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.uid !== currentUserId);
  },

  /**
   * Verifica o status de amizade entre dois usuários.
   */
  async getFriendshipStatus(uid1, uid2) {
    const fid = getFriendshipId(uid1, uid2);
    const snap = await getDoc(doc(db, 'friendships', fid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  /**
   * Cria ou atualiza o perfil público do usuário na coleção users.
   */
  async ensureUserProfile(user) {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const displayName = user.displayName || user.email?.split('@')[0] || 'Usuário';

    if (!snap.exists()) {
      await setDoc(userRef, cleanUndefined({
        uid:               user.uid,
        displayName,
        displayNameLower:  displayName.toLowerCase(),
        email:             user.email    || '',
        photoURL:          user.photoURL || null,
        bio:               '',
      }));
    }
  },

  /**
   * Busca o perfil público de um usuário.
   */
  async getUserProfile(userId) {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },
};

export function ensureUserProfileOnAuth() {
  auth.onAuthStateChanged(async (user) => {
    if (user && user.uid) {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const displayName = user.displayName || user.email?.split('@')[0] || 'Usuário';
      if (!snap.exists() || !snap.data().uid) {
        await setDoc(userRef, cleanUndefined({
          uid:                user.uid,
          displayName,
          displayNameLower:   displayName.toLowerCase(),
          email:              user.email    || '',
          photoURL:           user.photoURL || null,
          bio:                '',
          institution:        '',
          streakDays:         0,
          totalStudyMinutes:  0,
          lastActive:         Timestamp.now(),
          isOnline:           true,
          isStudying:         false,
          currentPage:        'home',
          createdAt:          Timestamp.now(),
          settings: {
            allowFriendRequests:      true,
            showOnlineStatus:         true,
            showStudyActivity:        true,
            challengeNotifications:   true,
          },
        }));
      }
    }
  });
}