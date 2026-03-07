/**
 * 🏆 CHALLENGE RESULTS PREMIUM — v2.0
 * * Tela de recompensa gamificada com física de partículas.
 * - Dynamic Backgrounds baseados no resultado (Vitória/Derrota)
 * - Scoreboard estilo E-sports com alto contraste
 * - Confetti otimizado com cores da marca Cinesia
 */

import React, { memo, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Clock, Target, ArrowLeft, Star, Zap, Crown } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { calculateScore, averageResponseTime, getResultData } from '../../utils/challengeHelpers';

/**
 * 🎊 Confetti Premium (Física Melhorada)
 */
const SimpleConfetti = () => {
  const colors = ['#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#8b5cf6', '#f43f5e'];
  const pieces = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.8,
    rotation: Math.random() * 360,
    size: 5 + Math.random() * 8,
    duration: 2 + Math.random() * 2
  }));

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: -20,
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 2), // Algumas tiras, alguns quadrados
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.3 ? '2px' : '50%', // Mistura de formas
          }}
          initial={{ y: -20, rotate: 0, opacity: 1, scale: 0 }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 360,
            opacity: [0, 1, 1, 0],
            scale: 1
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94] // Curva de gravidade suave
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

  useEffect(() => {
    if (results?.isWinner) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5000); // Confetti dura um pouco mais
      return () => clearTimeout(t);
    }
  }, [results?.isWinner]);

  if (!results || !challenge) {
    return (
      <div className="fixed inset-0 z-[110] bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center">
        <Zap size={32} className="text-amber-500 animate-pulse mb-4" strokeWidth={2} />
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Calculando resultados...</p>
      </div>
    );
  }

  const { isWinner, isDraw, myScore, opponentScore, myCorrect, opponentCorrect, totalQ, myAvgTime, opponentAvgTime, opponentName, opponentPhoto } = results;

  // Animações de Cascata
  const containerVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  // Dinâmica de Cores baseada no resultado
  const bgGradient = isWinner 
    ? 'from-emerald-50/80 via-white to-amber-50/50 dark:from-emerald-950/30 dark:via-slate-950 dark:to-amber-950/20' 
    : isDraw 
      ? 'from-amber-50/80 via-white to-orange-50/50 dark:from-amber-950/30 dark:via-slate-950 dark:to-orange-950/20'
      : 'from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900';

  const headlineColor = isWinner ? 'text-emerald-500 dark:text-emerald-400' : isDraw ? 'text-amber-500' : 'text-slate-500';
  const headlineText = isWinner ? 'Vitória Absoluta!' : isDraw ? 'Empate Técnico!' : 'Fim de Jogo';
  
  const headlineIcon = isWinner 
    ? <Crown size={56} className="text-amber-400 drop-shadow-md" strokeWidth={2} />
    : isDraw 
      ? <Medal size={56} className="text-amber-500 opacity-80" strokeWidth={2} />
      : <Star size={56} className="text-slate-300 dark:text-slate-700" strokeWidth={2} />;

  return (
    <motion.div
      className={`fixed inset-0 z-[110] bg-gradient-to-b ${bgGradient} flex flex-col items-center overflow-y-auto pt-10 sm:pt-16 pb-10`}
      variants={containerVariant}
      initial="hidden"
      animate="visible"
    >
      {/* Pattern de Fundo */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

      {showConfetti && <SimpleConfetti />}

      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* ─── Header de Resultado ─── */}
        <motion.div variants={itemVariant} className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto mb-4 flex justify-center"
          >
            <div className="relative">
              {isWinner && <div className="absolute inset-0 bg-amber-400 blur-xl opacity-30 rounded-full" />}
              <div className="relative">{headlineIcon}</div>
            </div>
          </motion.div>
          <h1 className={`text-4xl font-black tracking-tight ${headlineColor} drop-shadow-sm`}>
            {headlineText}
          </h1>
          {isWinner && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-[15px] font-bold text-slate-600 dark:text-slate-300 mt-2">
              Seu conhecimento prevaleceu! 🎉
            </motion.p>
          )}
        </motion.div>

        {/* ─── Scoreboard (Placar E-sports) ─── */}
        <motion.div variants={itemVariant} className="relative bg-white dark:bg-slate-900 rounded-[32px] p-6 mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
            Placar Final
          </div>
          
          <div className="flex items-center justify-between mt-4">
            {/* Você */}
            <div className="text-center flex-1 relative">
              {isWinner && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce"><Crown size={20} /></div>}
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 border-4 ${isWinner ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}>
                <span className={`text-3xl font-black ${isWinner ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>{myCorrect}</span>
              </div>
              <p className="text-[14px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Você</p>
            </div>

            {/* Divisor VS */}
            <div className="px-2 flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center rotate-45 mb-2">
                <span className="text-[12px] font-black text-slate-400 -rotate-45 italic">VS</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalQ} cards</p>
            </div>

            {/* Oponente */}
            <div className="text-center flex-1 relative">
              {!isWinner && !isDraw && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce"><Crown size={20} /></div>}
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 border-4 overflow-hidden ${!isWinner && !isDraw ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}>
                {opponentPhoto ? (
                  <img src={opponentPhoto} alt={opponentName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className={`text-3xl font-black ${!isWinner && !isDraw ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>{opponentCorrect}</span>
                )}
              </div>
              <p className="text-[14px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[100px] mx-auto">
                {opponentName.split(' ')[0]}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Estatísticas Detalhadas ─── */}
        <motion.div variants={itemVariant} className="grid grid-cols-2 gap-4 mb-10">
          <StatCard
            icon={<Target size={18} className={isWinner ? 'text-emerald-500' : 'text-slate-500'} strokeWidth={2.5} />}
            label="Precisão"
            value={`${Math.round((myCorrect / totalQ) * 100)}%`}
            sublabel={`${myCorrect} de ${totalQ} acertos`}
            highlight={isWinner}
          />
          <StatCard
            icon={<Clock size={18} className={myAvgTime < opponentAvgTime ? 'text-indigo-500' : 'text-slate-500'} strokeWidth={2.5} />}
            label="Velocidade"
            value={myAvgTime > 0 ? `${(myAvgTime / 1000).toFixed(1)}s` : '-'}
            sublabel="média por card"
            highlight={myAvgTime < opponentAvgTime && myAvgTime > 0}
          />
        </motion.div>

        {/* ─── Botão de Saída ─── */}
        <motion.div variants={itemVariant}>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-[20px] bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-[15px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            Voltar para Amigos
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
});

// StatCard Refinado
const StatCard = memo(({ icon, label, value, sublabel, highlight }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border ${highlight ? 'border-indigo-100 dark:border-indigo-900/50' : 'border-slate-100 dark:border-slate-800'}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-lg ${highlight ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
        {icon}
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
    <p className={`text-2xl font-black mb-0.5 ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>
      {value}
    </p>
    <p className="text-[11px] font-medium text-slate-500">{sublabel}</p>
  </div>
));

ChallengeResults.displayName = 'ChallengeResults';
StatCard.displayName = 'StatCard';
export default ChallengeResults;