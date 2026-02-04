/**
 * ⏱️ POMODORO TIMER - Timer de Estudos Flutuante
 * 
 * Timer Pomodoro integrado: 25min Foco / 5min Pausa
 * Incrementa horas estudadas no dashboard
 * Design minimalista e não-intrusivo
 * 
 * OTIMIZAÇÕES v2.0:
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
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';

// Configurações do Pomodoro
const FOCUS_TIME = 25 * 60; // 25 minutos em segundos
const BREAK_TIME = 5 * 60;  // 5 minutos em segundos

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
      console.error('Erro ao carregar dados do Pomodoro:', error);
    }
  };

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
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
  };

  const savePomodoroProgress = async (cycles, minutes) => {
    try {
      const userId = user?.id || user?.uid;
      const today = new Date().toISOString().split('T')[0];
      const pomodoroRef = doc(db, 'pomodoro', `${userId}_${today}`);
      
      await setDoc(pomodoroRef, {
        uid: userId,
        date: today,
        cycles,
        minutesStudied: minutes,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Atualizar também o total do usuário
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        totalMinutesStudied: increment(25),
        lastPomodoroAt: serverTimestamp()
      }).catch(() => {
        // Ignora se o documento não existe
      });
      
    } catch (error) {
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

      {/* Widget Flutuante - Empilhado ACIMA do KakaBot no mobile */}
      <motion.div
        className="fixed bottom-40 right-4 z-40 sm:bottom-6 sm:right-24 lg:bottom-6 lg:right-28"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Botão Minimizado
            <motion.button
              key="minimized"
              onClick={() => setIsExpanded(true)}
              className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
                isRunning
                  ? mode === 'focus'
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500'
                    : 'bg-gradient-to-br from-amber-500 to-orange-500'
                  : 'bg-gradient-to-br from-slate-600 to-slate-700'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {isRunning ? (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white/30"
                  style={{
                    background: `conic-gradient(transparent ${100 - progress}%, rgba(255,255,255,0.3) ${100 - progress}%)`
                  }}
                />
              ) : null}
              <Timer className="text-white" size={24} />
              {isRunning && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-slate-700 shadow-md"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {Math.floor(timeLeft / 60)}
                </motion.div>
              )}
            </motion.button>
          ) : (
            // Painel Expandido
            <motion.div
              key="expanded"
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-72"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                mode === 'focus'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}>
                <div className="flex items-center gap-2 text-white">
                  {mode === 'focus' ? (
                    <Brain size={20} />
                  ) : (
                    <Coffee size={20} />
                  )}
                  <span className="font-semibold">
                    {mode === 'focus' ? 'Modo Foco' : 'Pausa'}
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronDown className="text-white" size={20} />
                </button>
              </div>

              {/* Timer Display */}
              <div className="p-6 text-center">
                {/* Círculo de Progresso */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={mode === 'focus' ? '#14B8A6' : '#F59E0B'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={352}
                      strokeDashoffset={352 - (352 * progress) / 100}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900 font-mono">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.button
                    onClick={resetTimer}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw size={20} className="text-slate-600" />
                  </motion.button>
                  
                  <motion.button
                    onClick={toggleTimer}
                    className={`p-4 rounded-xl text-white transition-colors ${
                      mode === 'focus'
                        ? 'bg-teal-500 hover:bg-teal-600'
                        : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isRunning ? <Pause size={24} /> : <Play size={24} />}
                  </motion.button>

                  <motion.button
                    onClick={() => switchMode(mode === 'focus' ? 'break' : 'focus')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {mode === 'focus' ? (
                      <Coffee size={20} className="text-slate-600" />
                    ) : (
                      <Brain size={20} className="text-slate-600" />
                    )}
                  </motion.button>
                </div>

                {/* Estatísticas do Dia */}
                <div className="bg-slate-50 rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Ciclos hoje:</span>
                    <span className="font-bold text-slate-900">{cyclesCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 mt-1">
                    <span>Tempo estudado:</span>
                    <span className="font-bold text-teal-600">{formatHours(totalMinutesToday)}</span>
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
