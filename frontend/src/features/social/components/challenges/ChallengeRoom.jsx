/**
 * 🏟️ CHALLENGE ROOM PREMIUM — v2.0
 * * A Arena de Batalha (Full-Screen Container).
 * - Background radial imersivo (Modo Foco)
 * - Telas de Loading e Waiting gamificadas (Radar de oponente)
 * - Header de combate polido
 */

import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Loader2, Zap, WifiOff, ArrowLeft } from 'lucide-react';
import ChallengeQuestion from './ChallengeQuestion';
import ChallengeScoreboard from './ChallengeScoreboard';
import ChallengeResults from './ChallengeResults';
import { useChallenge } from '../../hooks/useChallenge';

const ChallengeRoom = memo(({ challengeId, currentUserId, onClose }) => {
  const { challenge, loading, submitAnswer } = useChallenge(challengeId);
  const [currentQ, setCurrentQ] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questions = useMemo(() => challenge?.questions || [], [challenge?.questions]);
  const totalQ = questions.length;
  const myPlayerData = challenge?.players?.[currentUserId];
  const answeredCount = myPlayerData?.answers?.length || 0;

  // Avança para próxima questão ou resultados
  const handleAnswer = useCallback(async (questionIndex, selectedOption, elapsedMs) => {
      const question = questions[questionIndex];
      if (!question || !challengeId) return;

      const correct = selectedOption !== null && selectedOption === (question.correctIndex ?? 0);

      try {
        await submitAnswer(questionIndex, selectedOption, correct, elapsedMs);
      } catch (err) {
        console.error('Erro ao enviar resposta:', err);
      }

      // Auto-avança após 1.4s para mostrar feedback de acerto/erro confortavelmente
      setTimeout(() => {
        if (questionIndex + 1 >= totalQ) {
          setShowResults(true);
        } else {
          setCurrentQ(questionIndex + 1);
        }
      }, 1400); 
    },
    [questions, challengeId, submitAnswer, totalQ],
  );

  useEffect(() => {
    if (challenge?.status === 'finished') {
      setShowResults(true);
    }
  }, [challenge?.status]);

  useEffect(() => {
    if (!challenge) return;
    if (answeredCount > 0 && answeredCount < totalQ && answeredCount > currentQ) {
      setCurrentQ(answeredCount);
    }
  }, [challenge?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── TELA 1: LOADING (Warm-up) ───
  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950" />
        <div className="relative text-center flex flex-col items-center">
          <div className="relative w-24 h-24 mb-6">
             <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-ping" />
             <div className="relative w-full h-full bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Swords size={40} className="text-white animate-pulse" strokeWidth={2} />
             </div>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Preparando Arena</h2>
          <p className="text-sm font-medium text-slate-400">Carregando os flashcards...</p>
        </div>
      </div>
    );
  }

  // ─── TELA 2: ERROR / NOT FOUND ───
  if (!challenge) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
             <WifiOff size={32} className="text-slate-400" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Desafio Perdido</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-[250px] mx-auto">Não foi possível encontrar a arena. O duelo pode ter expirado ou sido cancelado.</p>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-black uppercase tracking-wide transition-all active:scale-95"
          >
            <ArrowLeft size={18} strokeWidth={2.5} /> Sair da Arena
          </button>
        </div>
      </div>
    );
  }

  // ─── TELA 3: AGUARDANDO OPONENTE (Waiting Room) ───
  if (challenge.status === 'pending') {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900 flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-900 to-slate-950 pointer-events-none" />
        
        <div className="relative text-center px-6 w-full max-w-sm">
          
          {/* Radar Animation */}
          <div className="relative w-32 h-32 mx-auto mb-10">
             {/* Oponent Placeholder */}
             <div className="absolute top-0 right-0 w-10 h-10 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center z-10 animate-bounce">
                <span className="text-lg">❓</span>
             </div>
             
             {/* Player */}
             <motion.div
               animate={{ rotate: [0, 15, -15, 0] }}
               transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
               className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] z-20"
             >
               <Swords size={48} className="text-white drop-shadow-md" strokeWidth={2.5} />
             </motion.div>

             {/* Radar Waves */}
             <div className="absolute inset-0 border-2 border-amber-500/40 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
             <div className="absolute inset-[-20px] border border-amber-500/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            Aguardando oponente...
          </h2>
          <p className="text-[14px] text-slate-400 mb-10 leading-relaxed">
            O convite foi enviado para <br/>
            <span className="font-black text-amber-400 text-lg uppercase tracking-wider">{challenge.inviteeName || challenge.challengedName || 'Oponente'}</span>
          </p>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-2xl font-bold transition-all active:scale-[0.98]"
          >
            <X size={18} strokeWidth={2.5} /> Cancelar Duelo
          </button>
        </div>
      </div>
    );
  }

  // ─── TELA 4: RESULTADOS ───
  if (showResults) {
    return (
      <ChallengeResults challenge={challenge} currentUserId={currentUserId} onClose={onClose} />
    );
  }

  // ─── TELA 5: ARENA (JOGO EM ANDAMENTO) ───
  return (
    <motion.div
      className="fixed inset-0 z-[110] bg-slate-50 dark:bg-slate-950 flex flex-col"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Imersivo da Arena */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50 dark:from-indigo-900/10 dark:via-slate-950 dark:to-slate-950 pointer-events-none" />

      {/* Header com scoreboard */}
      <div className="relative shrink-0 px-4 pt-4 pb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm z-10">
        <div className="flex items-center justify-between mb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <Zap size={16} className="text-amber-500 fill-amber-500" />
            <span className="text-[12px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
              Duelo Real
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors active:scale-90"
            aria-label="Sair"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="max-w-2xl mx-auto w-full">
          <ChallengeScoreboard challenge={challenge} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Question area */}
      <div className="relative flex-1 overflow-y-auto px-4 py-6 z-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          <ChallengeQuestion
            key={currentQ}
            question={questions[currentQ]}
            questionIndex={currentQ}
            totalQuestions={totalQ}
            onAnswer={handleAnswer}
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

ChallengeRoom.displayName = 'ChallengeRoom';
export default ChallengeRoom;