/**
 * STREAK INDICATOR - Componente Visual de Dias de Ofensiva
 *
 * Features:
 * - Animação de fogo 🔥
 * - Celebração quando atinge milestones
 * - Tooltip com estatísticas
 * - Aviso se em risco de perder streak
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Award, Info, Zap } from 'lucide-react';

const StreakIndicator = ({ 
  currentStreak = 0, 
  longestStreak = 0,
  totalLoginDays = 0,
  isAtRisk = false,
  showTooltip = true 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      console.log('CheckMobile:', mobile, 'Width:', window.innerWidth); // Debug
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Captura a posição do mouse e atualiza tooltip
  const handleMouseMove = (e) => {
    if (!isMobile) {
      // Desktop: tooltip segue o mouse com offset
      setTooltipPosition({
        top: e.clientY + 15,
        left: e.clientX + 15
      });
    }
  };

  // Atualiza posição inicial do tooltip
  const updateTooltipPosition = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      
      console.log('UpdateTooltip - isMobile:', isMobile, 'rect:', rect); // Debug
      
      if (isMobile) {
        // Mobile/Tablet: aparece no canto esquerdo do card
        const newPos = {
          top: rect.top,
          left: rect.left - 280 // Largura do tooltip (256px) + espaço (24px)
        };
        console.log('Setting mobile position:', newPos); // Debug
        setTooltipPosition(newPos);
      } else {
        // Desktop: inicia próximo ao ícone
        setTooltipPosition({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2
        });
      }
    }
  };

  // Cor baseada no streak
  const getStreakColor = () => {
    if (currentStreak === 0) return 'gray';
    if (currentStreak < 7) return 'orange';
    if (currentStreak < 30) return 'red';
    if (currentStreak < 100) return 'purple';
    return 'blue'; // Lendário 100+
  };

  const color = getStreakColor();

  const colorClasses = {
    gray: {
      gradient: 'from-slate-400 to-slate-500',
      shadow: 'shadow-slate-500/25',
      text: 'text-slate-500',
      bg: 'bg-slate-100'
    },
    orange: {
      gradient: 'from-orange-400 to-amber-500',
      shadow: 'shadow-orange-500/25',
      text: 'text-orange-500',
      bg: 'bg-orange-50'
    },
    red: {
      gradient: 'from-red-400 to-orange-500',
      shadow: 'shadow-red-500/25',
      text: 'text-red-500',
      bg: 'bg-red-50'
    },
    purple: {
      gradient: 'from-purple-400 to-pink-500',
      shadow: 'shadow-purple-500/25',
      text: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    blue: {
      gradient: 'from-blue-400 to-cyan-500',
      shadow: 'shadow-blue-500/25',
      text: 'text-blue-500',
      bg: 'bg-blue-50'
    }
  };

  const classes = colorClasses[color];

  // Milestone messages
  const getMilestoneMessage = () => {
    if (currentStreak === 0) return 'Comece sua jornada!';
    if (currentStreak === 1) return 'Primeiro dia! 🎉';
    if (currentStreak === 7) return 'Uma semana! 🌟';
    if (currentStreak === 30) return 'Um mês! 🏆';
    if (currentStreak === 100) return 'LENDÁRIO! 👑';
    if (currentStreak === 365) return 'UM ANO! 🎊';
    return `${currentStreak} dias seguidos!`;
  };



  useEffect(() => {
    if (showDetails) {
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition);
      window.addEventListener('resize', updateTooltipPosition);
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showDetails]);

  return (
    <div className="relative">
      <motion.div
        ref={cardRef}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => {
          if (showTooltip && !isMobile) {
            setShowDetails(true);
            updateTooltipPosition();
          }
        }}
        onClick={(e) => {
          if (showTooltip && isMobile) {
            e.preventDefault();
            e.stopPropagation();
            setShowDetails(true);
            updateTooltipPosition();
            // Em mobile, fecha após 4 segundos
            setTimeout(() => setShowDetails(false), 4000);
          }
        }}
        onTouchEnd={(e) => {
          if (showTooltip && isMobile) {
            e.preventDefault();
            setShowDetails(true);
            updateTooltipPosition();
            // Em mobile, fecha após 4 segundos
            setTimeout(() => setShowDetails(false), 4000);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (!isMobile) {
            setShowDetails(false);
          }
        }}
      >
        {/* Ícone Principal */}
        <motion.div 
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${classes.gradient} ${classes.shadow} flex items-center justify-center text-white flex-shrink-0 shadow-lg relative overflow-hidden`}
          animate={currentStreak > 0 ? {
            boxShadow: [
              `0 10px 30px -10px rgba(251, 146, 60, 0.3)`,
              `0 10px 40px -10px rgba(251, 146, 60, 0.5)`,
              `0 10px 30px -10px rgba(251, 146, 60, 0.3)`
            ]
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Efeito de brilho */}
          {currentStreak > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          <motion.div
            animate={currentStreak > 0 ? {
              rotate: [-5, 5, -5],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Flame size={28} strokeWidth={2} />
          </motion.div>

          {/* Badge de milestone */}
          {currentStreak >= 100 && (
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <Award size={12} className="text-yellow-900" />
            </motion.div>
          )}
        </motion.div>

        {/* Aviso de risco */}
        {isAtRisk && (
          <motion.div
            className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap size={12} className="text-white" fill="white" />
          </motion.div>
        )}
      </motion.div>

      {/* Tooltip com estatísticas - Renderizado via Portal */}
      {showDetails && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed w-64 max-w-[calc(100vw-3rem)] z-[9999]"
            style={{ 
              top: `${tooltipPosition.top}px`,
              left: isMobile ? `${Math.max(16, tooltipPosition.left)}px` : `${tooltipPosition.left}px`,
              transform: 'none',
              zIndex: 9999,
              maxWidth: 'calc(100vw - 3rem)'
            }}
          >
            <div className={`bg-white rounded-2xl shadow-2xl border-2 ${classes.text} border-current/20 p-4`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Flame className={classes.text} size={20} />
                  <h3 className="font-bold text-slate-900">Dias de Ofensiva</h3>
                </div>
                {isMobile && (
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {/* Streak Atual */}
                <div className={`${classes.bg} rounded-xl p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">Sequência Atual</span>
                    <Flame className={classes.text} size={16} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {getMilestoneMessage()}
                  </p>
                </div>

                {/* Recorde */}
                {longestStreak > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-teal-500" />
                      <span className="text-slate-600">Recorde</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                )}

                {/* Total de logins */}
                {totalLoginDays > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-purple-500" />
                      <span className="text-slate-600">Total de dias</span>
                    </div>
                    <span className="font-bold text-slate-900">{totalLoginDays}</span>
                  </div>
                )}

                {/* Aviso */}
                {isAtRisk && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2"
                  >
                    <div className="flex items-start gap-2">
                      <Zap size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium">
                        Faça login amanhã para não perder sua sequência!
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Dica */}
                {currentStreak === 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-2">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-teal-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-teal-700">
                        Faça login todos os dias para construir sua sequência!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seta apontando para cima */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-current/20 rotate-45" />
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default StreakIndicator;