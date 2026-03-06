/**
 * @file groupService.js
 * @description Gerenciamento de grupos de estudo (até 10 pessoas).
 */

import {
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Timestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';

export const groupService = {
  /**
   * Cria um novo grupo de estudo.
   * @returns {string} conversationId (do tipo grupo)
   */
  async createGroup(creator, groupName, description = '', initialMembers = []) {
    const convRef = doc(collection(db, 'conversations'));
    const participants = [creator.uid, ...initialMembers.map((m) => m.uid || m)];

    // Monta participantsData
    const participantsData = {
      [creator.uid]: {
        uid: creator.uid,
        displayName: creator.displayName || 'Usuário',
        photoURL: creator.photoURL || null,
      },
    };
    initialMembers.forEach((m) => {
      const uid = m.uid || m;
      participantsData[uid] = {
        uid,
        displayName: m.displayName || 'Membro',
        photoURL: m.photoURL || null,
      };
    });

    await setDoc(convRef, {
      id: convRef.id,
      type: 'group',
      participants,
      groupName: groupName || 'Grupo de Estudo',
      description: description || '',
      groupPhoto: null,
      createdBy: creator.uid,
      admins: [creator.uid],
      lastMessage: null,
      unreadCount: Object.fromEntries(participants.map((uid) => [uid, 0])),
      readBy: {},
      participantsData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return convRef.id;
  },

  /**
   * Adiciona um membro ao grupo (máx 10).
   */
  async addMember(conversationId, newMember, addedBy) {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (!snap.exists()) throw new Error('Grupo não encontrado');

    const data = snap.data();
    if (data.participants.length >= 10) {
      throw new Error('Limite de 10 membros atingido');
    }
    if (data.participants.includes(newMember.uid || newMember)) {
      throw new Error('Membro já está no grupo');
    }

    const uid = newMember.uid || newMember;
    await updateDoc(convRef, {
      participants: arrayUnion(uid),
      [`participantsData.${uid}`]: {
        uid,
        displayName: newMember.displayName || 'Membro',
        photoURL: newMember.photoURL || null,
      },
      [`unreadCount.${uid}`]: 0,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Remove um membro do grupo.
   */
  async removeMember(conversationId, memberId, removedBy) {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (!snap.exists()) throw new Error('Grupo não encontrado');

    const data = snap.data();
    if (!data.admins.includes(removedBy) && removedBy !== memberId) {
      throw new Error('Apenas admins podem remover membros');
    }

    await updateDoc(convRef, {
      participants: arrayRemove(memberId),
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Sai do grupo voluntariamente.
   */
  async leaveGroup(conversationId, userId) {
    return groupService.removeMember(conversationId, userId, userId);
  },

  /**
   * Atualiza dados do grupo (nome, foto).
   */
  async updateGroup(conversationId, updates) {
    const allowed = {};
    if (updates.groupName) allowed.groupName = updates.groupName;
    if (updates.groupPhoto !== undefined) allowed.groupPhoto = updates.groupPhoto;
    allowed.updatedAt = Timestamp.now();

    await updateDoc(doc(db, 'conversations', conversationId), allowed);
  },

  /**
   * Assina a lista de grupos do usuário.
   * @returns {Function} unsubscribe
   */
  subscribeGroups(userId, callback) {
    if (!userId) return () => {};
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      where('type', '==', 'group'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },
};
