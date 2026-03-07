/**
 * 👥 FRIENDS LIST PREMIUM — v2.0
 * * Lista segmentada de conexões com status em tempo real.
 * - Empty State focado em conversão e engajamento
 * - Cabeçalhos de categoria com indicadores visuais
 * - Animações de entrada suaves
 */

import React, { memo } from 'react';
import { Users, Search, Loader2, Sparkles, Wifi, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import FriendCard from './FriendCard';

const FriendsList = memo(({ 
  friends, 
  friendsStatus = {}, 
  loading, 
  onMessage, 
  onChallenge, 
  onRemove, 
  onViewProfile, 
  onNavigateSearch 
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
          <Loader2 size={28} className="animate-spin text-indigo-500" />
        </div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sincronizando conexões...</p>
      </div>
    );
  }

  if (!friends?.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center px-4"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
          <div className="relative w-20 h-20 rounded-[28px] bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-indigo-100/50 dark:border-slate-700 shadow-xl">
            <Sparkles size={32} className="text-indigo-500" strokeWidth={2} />
          </div>
        </div>
        
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
          Sua rede está vazia
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed mb-6 font-medium">
          A jornada é melhor quando compartilhada. Busque colegas de fisioterapia e comecem a evoluir juntos!
        </p>
        
        {onNavigateSearch && (
          <button
            onClick={onNavigateSearch}
            className="flex items-center gap-2 px-6 py-3 text-[13px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-teal-500 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95"
          >
            <Search size={16} strokeWidth={2.5} />
            Encontrar Estudantes
          </button>
        )}
      </motion.div>
    );
  }

  const onlineFriends = friends.filter((f) => friendsStatus[f.uid]?.isOnline);
  const offlineFriends = friends.filter((f) => !friendsStatus[f.uid]?.isOnline);

  return (
    <div className="space-y-8">
      {/* ─── Online ─── */}
      {onlineFriends.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-full h-full rounded-full bg-emerald-400 opacity-50 animate-ping" />
              <Wifi size={14} className="text-emerald-500 relative z-10" />
            </div>
            <h4 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Online ({onlineFriends.length})
            </h4>
          </div>
          
          <div className="space-y-1.5">
            {onlineFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                status={friendsStatus[friend.uid]}
                onMessage={onMessage}
                onChallenge={onChallenge}
                onRemove={onRemove}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Offline ─── */}
      {offlineFriends.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 px-2 mb-3 opacity-60">
            <Moon size={14} className="text-slate-500" />
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Offline ({offlineFriends.length})
            </h4>
          </div>
          
          <div className="space-y-1.5">
            {offlineFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                status={friendsStatus[friend.uid]}
                onMessage={onMessage}
                onChallenge={onChallenge}
                onRemove={onRemove}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
});

FriendsList.displayName = 'FriendsList';
export default FriendsList;