/**
 * 📊 CHALLENGE SCOREBOARD PREMIUM — v2.0
 * * Placar superior em tempo real.
 * - Animação de "Pop" quando a pontuação muda
 * - Progress bars com cores assimétricas (Azul vs Oponente)
 * - Identificação visual clara de quem é "Você"
 */

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { calculateProgress } from '../../utils/challengeHelpers';

const ChallengeScoreboard = memo(({ challenge, currentUserId }) => {
  const players = useMemo(() => {
    if (!challenge?.players) return [];

    const totalQ = challenge.totalQuestions || challenge.questions?.length || 10;
    const ordered = [challenge.inviterId, challenge.inviteeId].filter(Boolean);

    return ordered.map((uid) => {
      const playerData = challenge.players[uid] || {};
      const answeredCount = playerData.answers?.length || 0;
      const correctCount = playerData.score || 0;
      const progress = calculateProgress(answeredCount, totalQ);
      const isYou = uid === currentUserId;

      const fallbackName = uid === challenge.inviterId
        ? challenge.inviterName
        : challenge.inviteeName;
      const fallbackPhoto = uid === challenge.inviterId
        ? challenge.inviterPhoto
        : challenge.inviteePhoto;

      return {
        uid,
        name: playerData.displayName || fallbackName || (isYou ? 'Você' : 'Oponente'),
        photo: playerData.photoURL || fallbackPhoto || null,
        correctCount,
        answeredCount,
        totalQ,
        progress,
        isYou,
      };
    });
  }, [challenge, currentUserId]);

  if (players.length < 2) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      {/* Player 1 (Geralmente o desafiante/você) */}
      <PlayerScore player={players[0]} align="left" />

      {/* ─── VS (Centro) ─── */}
      <div className="flex flex-col items-center shrink-0 px-2">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-200 dark:border-amber-800"
        >
          <Swords size={16} className="text-amber-500" strokeWidth={2.5} />
        </motion.div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
          VS
        </span>
      </div>

      {/* Player 2 (Oponente) */}
      <PlayerScore player={players[1]} align="right" />
    </div>
  );
});

const PlayerScore = memo(({ player, align }) => {
  const initials = getInitials(player.name);
  const avatarBg = getAvatarColor(player.name);
  const isRight = align === 'right';

  // Cores dinâmicas para diferenciar você do oponente
  const scoreColor = player.isYou ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300';
  const barColor = player.isYou ? 'bg-indigo-500' : 'bg-teal-500';
  const barBg = player.isYou ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-teal-100 dark:bg-teal-900/30';

  return (
    <div className={`flex-1 flex ${isRight ? 'flex-row-reverse' : 'flex-row'} items-center gap-3`}>
      
      {/* ─── Avatar ─── */}
      <div className="relative shrink-0">
        <div className={`absolute inset-0 rounded-full border-2 ${player.isYou ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-700'} scale-110 opacity-50`} />
        {player.photo ? (
          <img
            src={player.photo}
            alt={player.name}
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm"
            style={{ backgroundColor: avatarBg }}
          >
            <span className="text-sm font-black text-white">{initials}</span>
          </div>
        )}
        {player.isYou && (
          <span className="absolute -bottom-1 -right-1 text-[9px] bg-indigo-500 text-white rounded-md px-1.5 py-0.5 font-black uppercase tracking-widest border border-white dark:border-slate-900 shadow-sm">
            Eu
          </span>
        )}
      </div>

      {/* ─── Informações e Placar ─── */}
      <div className={`flex-1 min-w-0 flex flex-col justify-center ${isRight ? 'text-right' : 'text-left'}`}>
        <p className="text-[12px] sm:text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
          {player.isYou ? 'Você' : player.name.split(' ')[0]}
        </p>
        
        {/* Placar Animado */}
        <div className={`flex items-baseline gap-1 mt-0.5 ${isRight ? 'justify-end' : 'justify-start'}`}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={player.correctCount} // Sempre que o score mudar, o framer-motion recria o span e roda o 'initial'
              initial={{ scale: 1.5, color: '#f59e0b' }} // Acende em laranja e grande
              animate={{ scale: 1, color: '' }} // Volta pro tamanho/cor normal
              className={`text-xl sm:text-2xl font-black leading-none ${scoreColor}`}
            >
              {player.correctCount}
            </motion.span>
          </AnimatePresence>
          <span className="text-[11px] font-bold text-slate-400">/ {player.totalQ}</span>
        </div>
        
        {/* Barra de Progresso de Respostas */}
        <div className={`w-full h-1.5 sm:h-2 rounded-full mt-1.5 overflow-hidden ${barBg}`}>
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${player.progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
});

ChallengeScoreboard.displayName = 'ChallengeScoreboard';
PlayerScore.displayName = 'PlayerScore';
export default ChallengeScoreboard;