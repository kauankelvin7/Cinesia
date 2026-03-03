/**
 * 🔔 NOTIFICAÇÕES — Página de Notificações do Usuário
 * 
 * - Listagem de notificações do Firestore (users/{uid}/notifications)
 * - Badge de não lidas, marcar como lida, marcar todas como lidas
 * - Ordenadas da mais recente para a mais antiga
 * - Dark mode completo
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  BookOpen,
  Loader2,
  Trash2,
  Circle,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';

const TYPE_CONFIG = {
  info: {
    icon: Info,
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  alerta: {
    icon: AlertTriangle,
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  estudo: {
    icon: BookOpen,
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    text: 'text-primary-600 dark:text-primary-400',
    border: 'border-primary-200 dark:border-primary-800',
  },
};

function NotificationItem({ notification, userId, onMarkRead }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
  const Icon = config.icon;
  const isRead = notification.read;

  const handleClick = async () => {
    if (!isRead) {
      try {
        const notifRef = doc(db, 'users', userId, 'notifications', notification.id);
        await updateDoc(notifRef, { read: true });
        onMarkRead?.();
      } catch (err) {
        console.error('Erro ao marcar notificação como lida:', err);
      }
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const notifRef = doc(db, 'users', userId, 'notifications', notification.id);
      await deleteDoc(notifRef);
      toast.success('Notificação removida');
    } catch (err) {
      console.error('Erro ao excluir notificação:', err);
      toast.error('Erro ao remover notificação');
    }
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={handleClick}
      className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
        isRead
          ? 'opacity-60 bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 hover:opacity-80'
          : `bg-white dark:bg-slate-800 ${config.border} hover:shadow-md dark:hover:shadow-slate-900/30`
      }`}
    >
      {/* Unread dot */}
      {!isRead && (
        <div className="absolute top-4 right-4">
          <Circle size={8} className="text-primary-500 fill-primary-500" />
        </div>
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={config.text} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold ${isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {notification.title}
        </h4>
        <p className={`text-sm mt-0.5 leading-relaxed ${isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
          {notification.message}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
        title="Remover notificação"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}

export default function Notificacoes() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Real-time listener
  useEffect(() => {
    if (!user?.uid) return;

    const notifRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar notificações:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid || unreadCount === 0) return;
    setMarkingAll(true);

    try {
      const notifRef = collection(db, 'users', user.uid, 'notifications');
      const snapshot = await getDocs(notifRef);
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnapshot => {
        if (!docSnapshot.data().read) {
          batch.update(docSnapshot.ref, { read: true });
        }
      });

      await batch.commit();
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      toast.error('Erro ao marcar notificações');
    } finally {
      setMarkingAll(false);
    }
  }, [user?.uid, unreadCount]);

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                <Bell size={28} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Notificações
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                loading={markingAll}
                leftIcon={<CheckCheck size={16} />}
              >
                Marcar todas
              </Button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={32} className="text-primary-500 animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando notificações...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <BellOff size={36} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Nenhuma notificação
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-sm">
              Quando houver novidades sobre seus estudos, elas aparecerão aqui.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  userId={user.uid}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
