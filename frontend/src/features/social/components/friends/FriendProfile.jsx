/**
 * @file FriendProfile.jsx
 * @description Modal de perfil público de um amigo com comparação de ofensiva.
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Swords, UserMinus, BookOpen, Flame } from 'lucide-react';
import OnlineIndicator from '../shared/OnlineIndicator';
import StudyingBadge from '../shared/StudyingBadge';
import StreakComparison from '../shared/StreakComparison';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { friendsService } from '../../services/friendsService';

const FriendProfile = memo(({ friend, friendStatus, isOpen, onClose, onMessage, onChallenge, onRemove, myStreak = 0 }) => {
  const [profile, setProfile] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!friend?.uid || !isOpen) return;
    setProfile(null);
    setImgError(false);
    friendsService.getUserProfile(friend.uid).then((data) => {
      if (data) setProfile(data);
    }).catch(() => {});
  }, [friend?.uid, isOpen]);

  if (!friend) return null;

  const displayData = profile || friend;
  const initials = getInitials(displayData.displayName);
  const avatarBg = getAvatarColor(displayData.displayName);
  const isOnline = friendStatus?.isOnline || false;
  const isStudying = friendStatus?.isStudying || false;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-1/2 z-101 max-w-sm mx-auto"
            initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
            animate={{ opacity: 1, y: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: '-45%', scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header com foto */}
              <div className="relative bg-linear-to-br from-primary-500 to-cyan-500 h-24">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/30 transition-colors"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Avatar */}
              <div className="relative px-4 -mt-10">
                <div className="relative inline-block">
                  {displayData.photoURL && !imgError ? (
                    <img
                      src={displayData.photoURL}
                      alt={displayData.displayName}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-900"
                      onError={() => setImgError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-slate-900"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                  )}
                  <OnlineIndicator
                    isOnline={isOnline}
                    isStudying={isStudying}
                    size="md"
                    className="absolute -bottom-1 -right-1 ring-2 ring-white dark:ring-slate-900"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="px-4 pt-2 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {displayData.displayName}
                </h3>
                {displayData.bio && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {displayData.bio}
                  </p>
                )}
                {displayData.institution && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                    <BookOpen size={12} /> {displayData.institution}
                  </p>
                )}

                {isStudying && (
                  <div className="mt-2">
                    <StudyingBadge isStudying={isStudying} currentPage={friendStatus?.currentPage} />
                  </div>
                )}

                {/* Streak comparison */}
                <div className="mt-3">
                  <StreakComparison
                    myStreak={myStreak}
                    friendStreak={displayData.streakDays || 0}
                    friendName={displayData.displayName}
                  />
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-center flex-1">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {displayData.streakDays || 0}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dias 🔥</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {displayData.totalStudyMinutes ? Math.round(displayData.totalStudyMinutes / 60) : 0}h
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estudo</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { onMessage?.(friend); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
                  >
                    <MessageCircle size={16} /> Mensagem
                  </button>
                  <button
                    onClick={() => { onChallenge?.(friend); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
                  >
                    <Swords size={16} /> Desafiar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

FriendProfile.displayName = 'FriendProfile';
export default FriendProfile;
