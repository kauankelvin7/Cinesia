import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const PomodoroWidget = () => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(25 * 60); // 25 minutos em segundos
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const STUDY_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  // Timer logic
  useEffect(() => {
    let interval = null;

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(time - 1);
      }, 1000);
    } else if (time === 0 && isActive) {
      // Fim do tempo - toca som e muda modo
      playNotification();
      if (!isBreak) {
        setSessions(sessions + 1);
        setIsBreak(true);
        setTime(BREAK_TIME);
      } else {
        setIsBreak(false);
        setTime(STUDY_TIME);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, time, isBreak, sessions]);

  // Notificação sonora
  const playNotification = () => {
    if (isMuted) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(STUDY_TIME);
    setIsBreak(false);
  };

  const progressPercent = isBreak
    ? ((BREAK_TIME - time) / BREAK_TIME) * 100
    : ((STUDY_TIME - time) / STUDY_TIME) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Pomodoro Timer
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isBreak ? '☕ Pausa' : '📚 Estude'}
          </p>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-gray-500" />
          ) : (
            <Volume2 className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Circle Timer */}
      <div className="flex flex-col items-center justify-center mb-8">
        {/* Círculo SVG com progresso */}
        <div className="relative w-48 h-48 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Fundo do círculo */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-slate-700"
            />
            {/* Progresso */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progressPercent / 100)}`}
              className={`transition-all duration-1000 ${
                isBreak ? 'text-green-500' : 'text-blue-500'
              }`}
            />
          </svg>

          {/* Texto central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-bold ${isBreak ? 'text-green-600' : 'text-blue-600'}`}>
              {formatTime(time)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {isBreak ? 'Sessões: ' : 'Sessão: '} {sessions}
            </div>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isActive ? (
            <>
              <Pause size={20} />
              Pausar
            </>
          ) : (
            <>
              <Play size={20} />
              Iniciar
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetTimer}
          className="px-4 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-lg transition-colors"
        >
          <RotateCcw size={20} />
        </motion.button>
      </div>

      {/* Info Cards */}
      <div className="space-y-2">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            25 min de estudo + 5 min de pausa
          </p>
        </div>
        {sessions > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✅ {sessions} {sessions === 1 ? 'sessão' : 'sessões'} concluídas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroWidget;
