/**
 * @file ChallengeScoreboard.jsx
 * @description Mini-scoreboard lateral/superior mostrando pontuação em tempo real
 * durante o desafio de flashcards.
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Swords, User } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { calculateProgress } from '../../utils/challengeHelpers';

const ChallengeScoreboard = memo(({ challenge, currentUserId }) => {
  const players = useMemo(() => {
    if (!challenge?.players) return [];

    const totalQ = challenge.totalQuestions || challenge.questions?.length || 10;

    return Object.entries(challenge.players).map(([uid, playerData]) => {
      const answeredCount = playerData.answers?.length || 0;
      const correctCount = playerData.score || 0;
      const progress = calculateProgress(answeredCount, totalQ);
      const isYou = uid === currentUserId;

      return {
        uid,
        name: isYou ? 'Você' : (uid === challenge.inviterId ? 'Jogador 1' : 'Jogador 2'),
        photo: null,
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
    <div className="flex items-center gap-3 w-full">
      {/* Player 1 */}
      <PlayerScore player={players[0]} align="left" />

      {/* VS */}
      <motion.div
        className="flex flex-col items-center shrink-0"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <Swords size={20} className="text-amber-500" />
        <span className="text-[10px] font-bold text-slate-400 mt-0.5">VS</span>
      </motion.div>

      {/* Player 2 */}
      <PlayerScore player={players[1]} align="right" />
    </div>
  );
});

const PlayerScore = memo(({ player, align }) => {
  const initials = getInitials(player.name);
  const avatarBg = getAvatarColor(player.name);
  const isRight = align === 'right';

  return (
    <div className={`flex-1 flex ${isRight ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
      {/* Avatar */}
      <div className="relative shrink-0">
        {player.photo ? (
          <img
            src={player.photo}
            alt={player.name}
            className="w-8 h-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: avatarBg }}
          >
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
        )}
        {player.isYou && (
          <span className="absolute -bottom-1 -right-1 text-[8px] bg-amber-500 text-white rounded-full px-1 font-bold">
            EU
          </span>
        )}
      </div>

      {/* Info */}
      <div className={`flex-1 min-w-0 ${isRight ? 'text-right' : 'text-left'}`}>
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
          {player.isYou ? 'Você' : player.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {isRight && <div className="flex-1" />}
          <span className="text-lg font-bold text-amber-500">{player.correctCount}</span>
          <span className="text-[10px] text-slate-400">/ {player.totalQ}</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${player.progress}%` }}
            transition={{ type: 'spring', stiffness: 120 }}
          />
        </div>
      </div>
    </div>
  );
});

ChallengeScoreboard.displayName = 'ChallengeScoreboard';
PlayerScore.displayName = 'PlayerScore';
export default ChallengeScoreboard;
