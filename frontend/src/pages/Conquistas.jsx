/**
 * 🏆 Página de Conquistas / Achievements
 * * Exibe conquistas desbloqueadas e bloqueadas do usuário
 * com categorias, progresso geral e animações Premium.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Award, Star, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useConquistas } from '../utils/useConquistas';

const CATEGORIAS = ['Todas', 'Flashcards', 'Resumos', 'Matérias', 'Simulados', 'Streak'];

function Conquistas() {
  const { user } = useAuth();
  const userId = user?.id || user?.uid;
  const { conquistas, loading, totalDesbloqueadas, totalConquistas, percentual, stats } = useConquistas(userId);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

  const conquistasFiltradas = useMemo(() => {
    if (categoriaAtiva === 'Todas') return conquistas;
    return conquistas.filter(c => c.categoria === categoriaAtiva);
  }, [conquistas, categoriaAtiva]);

  const desbloqueadas = conquistasFiltradas.filter(c => c.desbloqueada);
  const bloqueadas = conquistasFiltradas.filter(c => !c.desbloqueada);

  // ─── TELA DE CARREGAMENTO CONSISTENTE ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center text-center animate-pulse"
        >
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-[20px] flex items-center justify-center mb-5 border border-amber-100/50 dark:border-amber-800/30">
            <Trophy size={32} className="text-amber-500" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Carregando Medalhas...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* ─── HEADER PREMIUM ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[16px] flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300 dark:border-amber-600">
              <Trophy size={28} className="text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                Conquistas
              </h1>
              <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" />
                Desbloqueie medalhas estudando todos os dias
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── PROGRESS CARD (HERO BANNER) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative overflow-hidden bg-slate-900 rounded-[32px] p-8 sm:p-10 mb-10 shadow-2xl border border-slate-800"
        >
          {/* Efeitos de Glow no fundo */}
          <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[150%] bg-gradient-to-bl from-amber-500/20 to-orange-600/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-50%] left-[-10%] w-[50%] h-[150%] bg-gradient-to-tr from-indigo-500/20 to-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-slate-400 text-[13px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" /> Progresso Geral
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">{totalDesbloqueadas}</p>
                  <p className="text-2xl font-bold text-slate-500 pb-1">/ {totalConquistas}</p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent drop-shadow-sm tracking-tighter">
                  {percentual}%
                </p>
              </div>
            </div>
            
            <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden shadow-inner border border-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentual}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              />
            </div>
          </div>
        </motion.div>

        {/* ─── STATS MINI CARDS (FLOATING PILLS) ─── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-10"
          >
            {[
              { label: 'Flashcards', value: stats.flashcards, icon: '🎴' },
              { label: 'Resumos', value: stats.resumos, icon: '📝' },
              { label: 'Matérias', value: stats.materias, icon: '📂' },
              { label: 'Simulados', value: stats.simulados, icon: '🎯' },
              { label: 'Recorde', value: `${stats.bestSimulado}%`, icon: '⭐' },
              { label: 'Sequência', value: stats.streak, icon: '🔥' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-4 sm:p-5 text-center border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900/50 transition-all duration-300">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-xl mb-3 shadow-inner border border-slate-100 dark:border-slate-800">
                  {s.icon}
                </div>
                <p className="text-[20px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">{s.value}</p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ─── FILTROS DE CATEGORIA (IOS STYLE) ─── */}
        <div className="flex overflow-x-auto custom-scrollbar-light gap-2 mb-8 p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 flex-1 min-w-max ${
                categoriaAtiva === cat
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ─── DESBLOQUEADAS ─── */}
        {desbloqueadas.length > 0 && (
          <div className="mb-12">
            <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star size={18} className="text-amber-500 fill-amber-500" strokeWidth={2} />
              </div>
              Medalhas Conquistadas
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[12px] px-2.5 py-0.5 rounded-full ml-1">
                {desbloqueadas.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {desbloqueadas.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="group bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-amber-200 dark:hover:border-amber-700/50 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                  
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-300 to-orange-500 rounded-[20px] flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 shadow-lg shadow-amber-500/30 border-2 border-amber-100 dark:border-amber-600 relative z-10 transform group-hover:scale-105 transition-transform duration-300">
                    {c.icon}
                  </div>
                  
                  <div className="min-w-0 flex-1 relative z-10">
                    <p className="font-extrabold text-[16px] sm:text-[18px] text-slate-900 dark:text-white truncate mb-1">{c.titulo}</p>
                    <p className="text-[13px] sm:text-[14px] font-medium text-slate-500 dark:text-slate-400 truncate mb-2.5">{c.desc}</p>
                    <span className="inline-flex px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700">
                      {c.categoria}
                    </span>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 ml-auto relative z-10 opacity-0 md:opacity-100 transition-opacity">
                    <Award size={20} className="text-amber-500" strokeWidth={2.5} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── BLOQUEADAS ─── */}
        {bloqueadas.length > 0 && (
          <div>
            <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5 opacity-70">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <Lock size={16} className="text-slate-500 dark:text-slate-400" strokeWidth={2.5} />
              </div>
              Ainda por vir
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[12px] px-2.5 py-0.5 rounded-full ml-1">
                {bloqueadas.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bloqueadas.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className="bg-white/40 dark:bg-slate-800/20 backdrop-blur-md rounded-[24px] p-5 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-5 opacity-60 hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800/80 rounded-[18px] flex items-center justify-center text-2xl flex-shrink-0 grayscale opacity-50 border border-slate-200 dark:border-slate-700 shadow-inner">
                    {c.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[15px] text-slate-700 dark:text-slate-300 truncate mb-0.5">{c.titulo}</p>
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-500 truncate mb-2">{c.desc}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500">
                      {c.categoria}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 ml-auto">
                    <Lock size={14} className="text-slate-400 dark:text-slate-500" strokeWidth={2} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── EMPTY STATE (Nenhuma conquista no filtro) ─── */}
        {conquistasFiltradas.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-6 bg-white/50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700"
          >
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[24px] flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-slate-700">
              <Trophy size={40} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
            </div>
            <p className="text-[20px] font-black text-slate-800 dark:text-slate-200 mb-2">Nenhuma conquista aqui</p>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-500">Mude a categoria no filtro acima para visualizar seu progresso em outras áreas.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Conquistas;