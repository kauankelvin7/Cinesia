/**
 * ⏱️ POMODORO TIMER - Timer de Estudos Flutuante Premium
 * * Timer Pomodoro integrado: 25min Foco / 5min Pausa
 * Incrementa horas estudadas no dashboard
 * Design minimalista e não-intrusivo
 * * OTIMIZAÇÕES v2.0:
 * - React.memo para evitar re-renders
 * - useCallback para handlers estáveis
 * - useMemo para cálculos derivados
 * - Animações GPU-accelerated
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain,
  ChevronDown
} from 'lucide-react';
import { doc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';

// Configurações do Pomodoro
const FOCUS_TIME = 25 * 60; // 25 minutos em segundos
const BREAK_TIME = 5 * 60;  // 5 minutos em segundos

const cleanUndefined = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const PomodoroTimer = memo(() => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const handleTimerCompleteRef = useRef(null);

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      loadUserPomodoroData();
    }
  }, [user]);

  const loadUserPomodoroData = async () => {
    try {
      const userId = user?.id || user?.uid;
      const today = new Date().toISOString().split('T')[0];
      const pomodoroRef = doc(db, 'pomodoro', `${userId}_${today}`);
      const docSnap = await getDoc(pomodoroRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCyclesCompleted(data.cycles || 0);
        setTotalMinutesToday(data.minutesStudied || 0);
      }
    } catch (error) {
      if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
        console.warn('[PomodoroTimer] Firestore temporariamente indisponível, usando dados locais');
        return;
      }
      console.error('Erro ao carregar dados do Pomodoro:', error);
    }
  };

  // Timer logic
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    
    // Tocar som de notificação
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Se completou um ciclo de foco
    if (mode === 'focus') {
      const newCycles = cyclesCompleted + 1;
      const newMinutes = totalMinutesToday + 25;
      setCyclesCompleted(newCycles);
      setTotalMinutesToday(newMinutes);
      
      // Salvar no Firebase
      await savePomodoroProgress(newCycles, newMinutes);
      
      // Trocar para modo pausa
      setMode('break');
      setTimeLeft(BREAK_TIME);
      
      // Mostrar notificação
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 Pomodoro Completo!', {
          body: `Você completou ${newCycles} ciclo(s) hoje! Hora de uma pausa de 5 minutos.`,
          icon: '/vite.svg'
        });
      }
    } else {
      // Completou pausa, volta para foco
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Pausa Finalizada!', {
          body: 'Hora de voltar aos estudos! 📚',
          icon: '/vite.svg'
        });
      }
    }
  }, [mode, cyclesCompleted, totalMinutesToday, user]);

  // Keep ref in sync with latest callback
  handleTimerCompleteRef.current = handleTimerComplete;

  // Timer tick effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerCompleteRef.current();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const savePomodoroProgress = async (cycles, minutes) => {
    try {
      const userId = user?.id || user?.uid;
      const today = new Date().toISOString().split('T')[0];
      const pomodoroRef = doc(db, 'pomodoro', `${userId}_${today}`);
      
      const pomodoroData = {
        uid: userId,
        date: today,
        cycles,
        minutesStudied: minutes,
        updatedAt: serverTimestamp()
      };

      await setDoc(pomodoroRef, pomodoroData, { merge: true });
      await setDoc(pomodoroRef, cleanUndefined(pomodoroData), { merge: true });
      
      // Atualizar também o total do usuário (setDoc + merge para criar se não existir)
      const userRef = doc(db, 'users', userId);
      const userData = {
        totalMinutesStudied: increment(25),
        lastPomodoroAt: serverTimestamp()
      };

      await setDoc(userRef, userData, { merge: true });
      await setDoc(userRef, cleanUndefined(userData), { merge: true });
      
    } catch (error) {
      if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
        console.warn('[PomodoroTimer] Firestore indisponível, progresso será salvo depois');
        return;
      }
      console.error('Erro ao salvar progresso do Pomodoro:', error);
    }
  };

  // useMemo para cálculos derivados (evita recálculo a cada render)
  const progress = useMemo(() => {
    return mode === 'focus' 
      ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100
      : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;
  }, [mode, timeLeft]);

  // useCallback para funções estáveis
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatHours = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }, []);

  const toggleTimer = useCallback(() => {
    if (!isRunning && timeLeft === (mode === 'focus' ? FOCUS_TIME : BREAK_TIME)) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    setIsRunning(prev => !prev);
  }, [isRunning, timeLeft, mode]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  }, [mode]);

  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  }, []);

  if (!user) return null;

  return (
    <>
      {/* Som de notificação */}
      <audio ref={audioRef} preload="none">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAgAj9teleAgAMbS0rVwLxsdaK/k4pdmGwBAt9fQpE8EDkOE0+nGjT4AAIzL5tCMRQAAZqbl57aHMAAA" />
      </audio>

      {/* Widget Flutuante — posicionado externamente pelo FABStack */}
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Botão Minimizado (FAB Premium)
            <motion.button
              key="minimized"
              onClick={() => setIsExpanded(true)}
              aria-label="Abrir temporizador Pomodoro"
              aria-pressed={false}
              className={`relative w-14 h-14 max-[374px]:w-12 max-[374px]:h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                isRunning
                  ? mode === 'focus'
                    ? 'bg-gradient-to-br from-indigo-500 to-teal-500 shadow-indigo-500/40'
                    : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/40'
                  : 'bg-slate-700 dark:bg-slate-800 shadow-slate-900/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {isRunning ? (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/20"
                  style={{
                    background: `conic-gradient(transparent ${100 - progress}%, rgba(255,255,255,0.25) ${100 - progress}%)`
                  }}
                />
              ) : null}
              <Timer className="text-white relative z-10" size={24} strokeWidth={2} />
              
              {isRunning && (
                <motion.div
                  className="absolute -top-1 -right-1 w-[22px] h-[22px] bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-800 shadow-md border border-slate-100"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {Math.floor(timeLeft / 60)}
                </motion.div>
              )}
            </motion.button>
          ) : (
            // Painel Expandido (Glassmorphism Style)
            <motion.div
              key="expanded"
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[28px] shadow-2xl overflow-hidden w-[300px] border border-slate-200/60 dark:border-slate-700/60 flex flex-col"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Header */}
              <div className={`px-5 py-4 flex items-center justify-between ${
                mode === 'focus'
                  ? 'bg-gradient-to-r from-indigo-600 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}>
                <div className="flex items-center gap-2.5 text-white">
                  {mode === 'focus' ? (
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                      <Brain size={18} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                      <Coffee size={18} strokeWidth={2.5} />
                    </div>
                  )}
                  <span className="font-bold text-[15px] tracking-wide">
                    {mode === 'focus' ? 'Modo Foco' : 'Pausa Curta'}
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronDown className="text-white" size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Timer Display */}
              <div className="p-6 text-center">
                {/* Círculo de Progresso */}
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke={mode === 'focus' ? '#6366f1' : '#f59e0b'} // Indigo vs Amber
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * progress) / 100}
                      transition={{ duration: 0.5, ease: "linear" }}
                      style={{ filter: `drop-shadow(0 0 6px ${mode === 'focus' ? 'rgba(99,102,241,0.4)' : 'rgba(245,158,11,0.4)'})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[40px] font-extrabold text-slate-800 dark:text-white font-mono tracking-tighter leading-none mt-2">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {mode === 'focus' ? 'Focado' : 'Relaxando'}
                    </span>
                  </div>
                </div>

                {/* Controles Principais */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <motion.button
                    onClick={resetTimer}
                    className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors text-slate-500 dark:text-slate-400"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Reiniciar Timer"
                  >
                    <RotateCcw size={20} strokeWidth={2.5} />
                  </motion.button>
                  
                  <motion.button
                    onClick={toggleTimer}
                    className={`w-16 h-16 flex items-center justify-center rounded-[20px] text-white shadow-lg transition-all ${
                      mode === 'focus'
                        ? 'bg-gradient-to-br from-indigo-500 to-teal-500 shadow-indigo-500/25 hover:shadow-indigo-500/40'
                        : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/25 hover:shadow-orange-500/40'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                  </motion.button>

                  <motion.button
                    onClick={() => switchMode(mode === 'focus' ? 'break' : 'focus')}
                    className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors text-slate-500 dark:text-slate-400"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={mode === 'focus' ? 'Pular para Pausa' : 'Pular para Foco'}
                  >
                    {mode === 'focus' ? (
                      <Coffee size={20} strokeWidth={2.5} />
                    ) : (
                      <Brain size={20} strokeWidth={2.5} />
                    )}
                  </motion.button>
                </div>

                {/* Estatísticas do Dia (Box style) */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 text-[13px] font-medium border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Ciclos hoje:</span>
                    <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                      {cyclesCompleted} <span className="text-[10px] text-amber-500 ml-0.5">🔥</span>
                    </span>
                  </div>
                  <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Tempo total:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatHours(totalMinutesToday)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
});

PomodoroTimer.displayName = 'PomodoroTimer';

export default PomodoroTimer;