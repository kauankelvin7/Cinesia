/**
 * 👤 FRIEND PROFILE MODAL PREMIUM — v2.0
 * * Cartão de jogador/estudante com estatísticas e ações sociais.
 * - Capa imersiva com Glassmorphism
 * - Avatar em destaque com status em tempo real
 * - Estatísticas formatadas como Mini-Cards
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Swords, BookOpen, Flame, UserMinus } from 'lucide-react';
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
          {/* Backdrop com Blur mais intenso */}
          <motion.div
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="fixed inset-x-4 top-1/2 z-[101] max-w-sm mx-auto"
            initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
            animate={{ opacity: 1, y: '-50%', scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }}
            exit={{ opacity: 0, y: '-45%', scale: 0.95, transition: { duration: 0.2 } }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
              
              {/* ─── Capa (Cover) Premium ─── */}
              <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-400">
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                
                {/* Botão Fechar Glass */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 flex items-center justify-center p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all active:scale-90"
                  aria-label="Fechar"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* ─── Avatar e Cabeçalho ─── */}
              <div className="relative px-6 -mt-12 flex flex-col items-center">
                <div className="relative inline-block group">
                  <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-full scale-110 shadow-sm" />
                  {displayData.photoURL && !imgError ? (
                    <img
                      src={displayData.photoURL}
                      alt={displayData.displayName}
                      className="relative w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-md"
                      onError={() => setImgError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black border-4 border-white dark:border-slate-900 shadow-md"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Indicador de Status Ampliado */}
                  <div className="absolute bottom-1 right-1 ring-4 ring-white dark:ring-slate-900 rounded-full">
                    <OnlineIndicator isOnline={isOnline} isStudying={isStudying} size="lg" />
                  </div>
                </div>

                <div className="text-center mt-3 mb-2">
                  <h3 className="text-[22px] font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                    {displayData.displayName}
                  </h3>
                  {displayData.institution && (
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                      <BookOpen size={14} /> {displayData.institution}
                    </p>
                  )}
                </div>

                {/* Badge de Estudo */}
                {isStudying && (
                  <div className="mt-1 mb-2">
                    <StudyingBadge isStudying={isStudying} currentPage={friendStatus?.currentPage} />
                  </div>
                )}
              </div>

              {/* ─── Conteúdo ─── */}
              <div className="px-6 pb-6">
                {displayData.bio && (
                  <p className="text-[14px] text-center text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl italic">
                    "{displayData.bio}"
                  </p>
                )}

                {/* Estatísticas Mini-Cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex flex-col items-center justify-center py-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                      <Flame size={16} strokeWidth={2.5} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ofensiva</span>
                    </div>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-500 leading-none">
                      {displayData.streakDays || 0}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-1 text-indigo-500 mb-1">
                      <BookOpen size={14} strokeWidth={2.5} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Estudo</span>
                    </div>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                      {displayData.totalStudyMinutes ? Math.round(displayData.totalStudyMinutes / 60) : 0}<span className="text-sm font-bold">h</span>
                    </p>
                  </div>
                </div>

                {/* Streak Comparison */}
                <div className="mb-6">
                  <StreakComparison
                    myStreak={myStreak}
                    friendStreak={displayData.streakDays || 0}
                    friendName={displayData.displayName.split(' ')[0]}
                  />
                </div>

                {/* ─── Botões de Ação ─── */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { onMessage?.(friend); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-[14px] font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                  >
                    <MessageCircle size={18} strokeWidth={2.5} /> Conversar
                  </button>
                  <button
                    onClick={() => { onChallenge?.(friend); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white text-[14px] font-bold shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                  >
                    <Swords size={18} strokeWidth={2.5} /> Desafiar
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