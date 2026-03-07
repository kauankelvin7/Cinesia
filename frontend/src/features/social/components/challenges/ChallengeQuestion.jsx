/**
 * ⏱️ CHALLENGE QUESTION PREMIUM — v2.0
 * * Interface de duelo gamificada com timer de alta tensão.
 * - Animação de pulso quando o tempo está acabando (< 5s)
 * - Respostas com feedback visual forte (Ícones + Sombras coloridas)
 * - Entrada em cascata (Staggered) das alternativas
 */

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Zap } from 'lucide-react';

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

  const handleSelect = useCallback((optionIndex) => {
    if (isAnswered || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    clearInterval(timerRef.current);
    const elapsedMs = Date.now() - startTimeRef.current;
    onAnswer(questionIndex, optionIndex, elapsedMs);
  }, [isAnswered, questionIndex, onAnswer]);

  if (!question) return null;

  const isUrgent = timeLeft <= 5 && !isAnswered;
  const timerPercent = (timeLeft / TIMER_DURATION) * 100;
  const timerColor = timeLeft > 7 ? 'text-emerald-500' : timeLeft > 5 ? 'text-amber-500' : 'text-red-500';
  const barColor = timeLeft > 7 ? 'bg-emerald-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-red-500';

  const options = (question.options && question.options.length > 0)
    ? question.options
    : [question.back || question.front, ...(question.distractors || [])];

  const correctIndex = question.correctIndex ?? 0;

  // Variantes para a animação em cascata
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      key={questionIndex}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full max-w-2xl mx-auto w-full"
    >
      {/* ─── Header: Progresso e Timer ─── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-black text-sm">
            {questionIndex + 1}
          </div>
          <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
            de {totalQuestions}
          </span>
        </div>
        
        <div className={`flex items-center gap-1.5 font-mono font-black text-xl transition-colors duration-300 ${timerColor} ${isUrgent ? 'animate-pulse scale-110' : ''}`}>
          <Clock size={20} strokeWidth={isUrgent ? 3 : 2.5} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* ─── Barra de Tempo Gamificada ─── */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden shadow-inner">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${barColor} ${isUrgent ? 'shadow-[0_0_10px_rgba(239,68,68,0.6)]' : ''}`}
          initial={{ width: '100%' }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* ─── Pergunta ─── */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[24px] p-6 sm:p-8 mb-6 shadow-sm border border-slate-200/60 dark:border-slate-700/50">
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-[-6deg]">
          <Zap size={20} className="fill-white" />
        </div>
        <p className="text-lg sm:text-[19px] font-bold text-slate-800 dark:text-slate-100 leading-relaxed text-center mt-2">
          {question.front || question.question || 'Pergunta'}
        </p>
      </div>

      {/* ─── Opções (Alternativas) ─── */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 flex-1 pb-4">
        {options.map((opt, idx) => {
          const isCorrect = idx === correctIndex;
          const isSelected = idx === selectedOption;
          
          let optionStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10 text-slate-700 dark:text-slate-200';
          let IconComponent = null;

          if (isAnswered) {
            if (isCorrect) {
              optionStyle = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-md shadow-emerald-500/20 text-emerald-800 dark:text-emerald-300 z-10 scale-[1.02]';
              IconComponent = <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={3} />;
            } else if (isSelected && !isCorrect) {
              optionStyle = 'bg-red-50 dark:bg-red-900/20 border-red-500 shadow-md shadow-red-500/20 text-red-800 dark:text-red-300';
              IconComponent = <XCircle size={20} className="text-red-500" strokeWidth={3} />;
            } else {
              optionStyle = 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-40 grayscale-[50%]';
            }
          }

          const labels = ['A', 'B', 'C', 'D', 'E'];

          return (
            <motion.button
              variants={itemVariants}
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              whileTap={!isAnswered ? { scale: 0.97 } : undefined}
              className={`
                w-full text-left flex items-center gap-4 p-4 rounded-[20px] border-2 transition-all duration-300
                ${optionStyle}
                ${!isAnswered ? 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800' : 'cursor-default'}
              `}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors
                ${isAnswered && isCorrect ? 'bg-emerald-200/50 dark:bg-emerald-900/50' : ''}
                ${isAnswered && isSelected && !isCorrect ? 'bg-red-200/50 dark:bg-red-900/50' : ''}
                ${!isAnswered || (!isCorrect && !isSelected) ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-sm' : ''}
              `}>
                {IconComponent ? IconComponent : labels[idx] || idx + 1}
              </div>
              <span className={`text-[15px] font-semibold leading-snug ${isAnswered && (isCorrect || isSelected) ? 'font-black' : ''}`}>
                {typeof opt === 'string' ? opt : opt?.text || ''}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
});

ChallengeQuestion.displayName = 'ChallengeQuestion';
export default ChallengeQuestion;