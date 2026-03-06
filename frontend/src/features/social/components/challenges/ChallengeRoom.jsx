/**
 * @file ChallengeRoom.jsx
 * @description Sala de desafio full-screen: scoreboard, questão com timer, progresso.
 */

import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Loader2, Trophy, ArrowRight } from 'lucide-react';
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
  const handleAnswer = useCallback(
    async (questionIndex, selectedOption, elapsedMs) => {
      const question = questions[questionIndex];
      if (!question || !challengeId) return;

      const correct =
        selectedOption !== null && selectedOption === (question.correctIndex ?? 0);

      try {
        await submitAnswer(questionIndex, selectedOption, correct, elapsedMs);
      } catch (err) {
        console.error('Erro ao enviar resposta:', err);
      }

      // Auto-avança após 1.2s para mostrar feedback
      setTimeout(() => {
        if (questionIndex + 1 >= totalQ) {
          setShowResults(true);
        } else {
          setCurrentQ(questionIndex + 1);
        }
      }, 1200);
    },
    [questions, challengeId, submitAnswer, totalQ],
  );

  // Se o status mudou para finished, mostra resultados
  useEffect(() => {
    if (challenge?.status === 'finished') {
      setShowResults(true);
    }
  }, [challenge?.status]);

  // Skip questões já respondidas (reconexão)
  useEffect(() => {
    if (!challenge) return;
    if (answeredCount > 0 && answeredCount < totalQ && answeredCount > currentQ) {
      setCurrentQ(answeredCount);
    }
  }, [challenge?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="fixed inset-0 z-110 bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando desafio...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="fixed inset-0 z-110 bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">Desafio não encontrado.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Estado: aguardando oponente aceitar
  if (challenge.status === 'pending') {
    return (
      <div className="fixed inset-0 z-110 bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center px-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-4"
          >
            <Swords size={48} className="text-amber-500" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Aguardando oponente...
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Desafio enviado para{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {challenge.challengedName || 'oponente'}
            </span>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Sair da sala
          </button>
        </div>
      </div>
    );
  }

  // Resultados
  if (showResults) {
    return (
      <ChallengeResults
        challenge={challenge}
        currentUserId={currentUserId}
        onClose={onClose}
      />
    );
  }

  // JOGO EM ANDAMENTO
  return (
    <motion.div
      className="fixed inset-0 z-110 bg-white dark:bg-slate-950 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header com scoreboard */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-amber-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Desafio
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Sair"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <ChallengeScoreboard
          challenge={challenge}
          currentUserId={currentUserId}
        />
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
