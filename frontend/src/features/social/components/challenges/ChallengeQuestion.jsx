/**
 * @file ChallengeQuestion.jsx
 * @description Componente de pergunta individual no desafio com timer de 15s.
 */

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

const TIMER_DURATION = 15; // 15 segundos por questão

const ChallengeQuestion = memo(({ question, questionIndex, totalQuestions, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isAnswered, setIsAnswered] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const hasSubmittedRef = useRef(false);

  // Reset on question change
  useEffect(() => {
    setSelectedOption(null);
    setTimeLeft(TIMER_DURATION);
    setIsAnswered(false);
    startTimeRef.current = Date.now();
    hasSubmittedRef.current = false;
  }, [questionIndex]);

  // Timer countdown
  useEffect(() => {
    if (isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Tempo esgotado — resposta errada
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            setIsAnswered(true);
            const elapsedMs = Date.now() - startTimeRef.current;
            onAnswer(questionIndex, null, elapsedMs);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [questionIndex, isAnswered, onAnswer]);

  const handleSelect = useCallback(
    (optionIndex) => {
      if (isAnswered || hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setSelectedOption(optionIndex);
      setIsAnswered(true);
      clearInterval(timerRef.current);
      const elapsedMs = Date.now() - startTimeRef.current;
      onAnswer(questionIndex, optionIndex, elapsedMs);
    },
    [isAnswered, questionIndex, onAnswer],
  );

  if (!question) return null;

  const timerPercent = (timeLeft / TIMER_DURATION) * 100;
  const timerColor = timeLeft > 7 ? 'text-green-500' : timeLeft > 3 ? 'text-amber-500' : 'text-red-500';
  const barColor = timeLeft > 7 ? 'bg-green-500' : timeLeft > 3 ? 'bg-amber-500' : 'bg-red-500';

  const options = (question.options && question.options.length > 0)
    ? question.options
    : [
      question.back || question.front,
      ...(question.distractors || []),
    ];

  const correctIndex = question.correctIndex ?? 0;

  return (
    <motion.div
      key={questionIndex}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full"
    >
      {/* Timer bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: '100%' }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </div>

      {/* Timer + progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {questionIndex + 1} / {totalQuestions}
        </span>
        <div className={`flex items-center gap-1 ${timerColor} font-mono font-bold text-lg`}>
          <Clock size={16} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Question text */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
        <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
          {question.front || question.question || 'Pergunta'}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2 flex-1">
        {options.map((opt, idx) => {
          let optionStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500';

          if (isAnswered) {
            if (idx === correctIndex) {
              optionStyle = 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400';
            } else if (idx === selectedOption && idx !== correctIndex) {
              optionStyle = 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400';
            } else {
              optionStyle = 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50';
            }
          } else if (idx === selectedOption) {
            optionStyle = 'bg-amber-50 dark:bg-amber-900/20 border-amber-500';
          }

          const labels = ['A', 'B', 'C', 'D', 'E'];

          return (
            <motion.button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              whileTap={!isAnswered ? { scale: 0.98 } : undefined}
              className={`
                w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all
                ${optionStyle}
                ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                {labels[idx] || idx + 1}
              </span>
              <span className="text-sm">{typeof opt === 'string' ? opt : opt?.text || ''}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
});

ChallengeQuestion.displayName = 'ChallengeQuestion';
export default ChallengeQuestion;
