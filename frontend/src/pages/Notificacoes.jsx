/**
 * 🔔 NOTIFICAÇÕES — Página de Notificações Premium
 * - Listagem de notificações do Firestore (users/{uid}/notifications)
 * - Badge de não lidas, marcar como lida, marcar todas como lidas
 * - Ordenadas da mais recente para a mais antiga
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
  Trophy,
  CheckCircle2,
  Inbox
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
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/50',
    accent: 'border-l-blue-500'
  },
  alerta: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
    accent: 'border-l-amber-500'
  },
  estudo: {
    icon: BookOpen,
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    accent: 'border-l-indigo-500'
  },
  conquista: {
    icon: Trophy,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    accent: 'border-l-emerald-500'
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={handleClick}
      className={`group relative flex items-start gap-4 p-5 rounded-[20px] border transition-all cursor-pointer ${
        isRead
          ? 'opacity-70 bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
          : `bg-white dark:bg-slate-800 border-l-[6px] ${config.accent} border-t border-r border-b border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md`
      }`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-[16px] ${config.bg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={config.text} strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[14px] font-bold ${isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {notification.title}
        </h4>
        <p className={`text-[13px] mt-1 leading-relaxed ${isRead ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
          {notification.message}
        </p>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-2.5 uppercase tracking-wide">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all absolute right-4 top-4"
        title="Remover notificação"
      >
        <Trash2 size={16} />
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
      toast.success('Tudo lido!');
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      toast.error('Erro ao processar ação');
    } finally {
      setMarkingAll(false);
    }
  }, [user?.uid, unreadCount]);

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto">
        {/* Header Premium */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bell size={24} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Notificações</h1>
                <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllAsRead}
                loading={markingAll}
                leftIcon={<CheckCheck size={16} />}
                className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700"
              >
                Marcar todas
              </Button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-[14px] font-medium text-slate-500">Sincronizando avisos...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
              <Inbox size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tudo em dia!</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-[240px]">
              Nenhuma notificação nova no momento.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
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