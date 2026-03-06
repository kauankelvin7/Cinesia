/**
 * @file notificationService.js
 * @description Gerenciamento de notificações in-app do sistema social.
 */

import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Timestamp,
  getDocs, writeBatch,
} from 'firebase/firestore';
import { cleanUndefined } from '../../../utils/firestoreHelpers';
import { db } from '../../../config/firebase-config';

export const notificationService = {
  /**
   * Cria uma nova notificação.
   */
  async create(notification) {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, cleanUndefined({
      id: notifRef.id,
      ...notification,
      read: false,
      createdAt: Timestamp.now(),
    }));
    return notifRef.id;
  },

  /**
   * Marca uma notificação como lida.
   */
  async markAsRead(notificationId) {
    await updateDoc(doc(db, 'notifications', notificationId), cleanUndefined({
      read: true,
    }));
  },

  /**
   * Marca todas as notificações como lidas.
   */
  async markAllAsRead(userId) {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  },

  /**
   * Remove uma notificação.
   */
  async remove(notificationId) {
    await deleteDoc(doc(db, 'notifications', notificationId));
  },

  /**
   * Assina notificações não lidas do usuário em tempo real.
   * @returns {Function} unsubscribe
   */
  subscribeNotifications(userId, callback, limitCount = 30) {
    if (!userId) return () => {};
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },

  /**
   * Assina a contagem de não lidas.
   * @returns {Function} unsubscribe
   */
  subscribeUnreadCount(userId, callback) {
    if (!userId) return () => {};
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.size);
    });
  },
};
