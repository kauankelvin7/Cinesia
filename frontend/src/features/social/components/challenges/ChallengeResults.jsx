/**
 * @file ChallengeResults.jsx
 * @description Tela de resultados do desafio com animações e confetti no vencedor.
 */

import React, { memo, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Clock, Target, ArrowLeft, Star, ChevronRight } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { calculateScore, averageResponseTime, getResultData } from '../../utils/challengeHelpers';

/**
 * Confetti simples usando divs animadas (sem dependência extra).
 */
const SimpleConfetti = () => {
  const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.6,
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 z-120 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: -10,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: '100vh',
            rotate: p.rotation + 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random(),
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
};

const ChallengeResults = memo(({ challenge, currentUserId, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  const results = useMemo(() => {
    if (!challenge) return null;
    return getResultData(challenge, currentUserId);
  }, [challenge, currentUserId]);

  // Mostra confetti se venceu
  useEffect(() => {
    if (results?.isWinner) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [results?.isWinner]);

  if (!results || !challenge) {
    return (
      <div className="fixed inset-0 z-110 bg-white dark:bg-slate-950 flex items-center justify-center">
        <p className="text-sm text-slate-500">Aguardando resultados...</p>
      </div>
    );
  }

  const { isWinner, isDraw, myScore, opponentScore, myCorrect, opponentCorrect, totalQ, myAvgTime, opponentAvgTime, opponentName, opponentPhoto } = results;

  const containerVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const headlineColor = isWinner
    ? 'text-green-600 dark:text-green-400'
    : isDraw
    ? 'text-amber-500'
    : 'text-red-500';

  const headlineText = isWinner ? 'Vitória!' : isDraw ? 'Empate!' : 'Derrota';
  const headlineIcon = isWinner ? (
    <Trophy size={48} className="text-amber-500" />
  ) : isDraw ? (
    <Medal size={48} className="text-amber-400" />
  ) : (
    <Star size={48} className="text-slate-400" />
  );

  return (
    <motion.div
      className="fixed inset-0 z-110 bg-white dark:bg-slate-950 flex flex-col items-center overflow-y-auto"
      variants={containerVariant}
      initial="hidden"
      animate="visible"
    >
      {showConfetti && <SimpleConfetti />}

      <div className="w-full max-w-md px-4 py-8">
        {/* Header */}
        <motion.div variants={itemVariant} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mx-auto mb-4"
          >
            {headlineIcon}
          </motion.div>
          <h1 className={`text-3xl font-extrabold ${headlineColor}`}>
            {headlineText}
          </h1>
          {isWinner && (
            <p className="text-sm text-slate-500 mt-1">
              Parabéns pela vitória! 🎉
            </p>
          )}
        </motion.div>

        {/* Score comparison */}
        <motion.div
          variants={itemVariant}
          className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-4"
        >
          <div className="flex items-center justify-between">
            {/* You */}
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-500">{myCorrect}</span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Você</p>
              <p className="text-[10px] text-slate-400">
                {myAvgTime > 0 ? `${(myAvgTime / 1000).toFixed(1)}s/q` : '-'}
              </p>
            </div>

            {/* Divider */}
            <div className="px-4 text-center">
              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">vs</span>
              <p className="text-[10px] text-slate-400 mt-1">{totalQ} questões</p>
            </div>

            {/* Opponent */}
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 mx-auto mb-2 flex items-center justify-center">
                {opponentPhoto ? (
                  <img
                    src={opponentPhoto}
                    alt={opponentName}
                    className="w-14 h-14 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-500">{opponentCorrect}</span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-25 mx-auto">
                {opponentName}
              </p>
              <p className="text-[10px] text-slate-400">
                {opponentAvgTime > 0 ? `${(opponentAvgTime / 1000).toFixed(1)}s/q` : '-'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariant} className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={<Target size={16} className="text-green-500" />}
            label="Acertos"
            value={`${myCorrect}/${totalQ}`}
            sublabel={`${Math.round((myCorrect / totalQ) * 100)}%`}
          />
          <StatCard
            icon={<Clock size={16} className="text-blue-500" />}
            label="Tempo médio"
            value={myAvgTime > 0 ? `${(myAvgTime / 1000).toFixed(1)}s` : '-'}
            sublabel="por questão"
          />
        </motion.div>

        {/* Close button */}
        <motion.div variants={itemVariant}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
});

const StatCard = memo(({ icon, label, value, sublabel }) => (
  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</p>
    <p className="text-[10px] text-slate-400">{sublabel}</p>
  </div>
));

ChallengeResults.displayName = 'ChallengeResults';
StatCard.displayName = 'StatCard';
export default ChallengeResults;
