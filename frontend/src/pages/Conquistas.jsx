/**
 * 🏆 Página de Conquistas / Achievements
 * 
 * Exibe conquistas desbloqueadas e bloqueadas do usuário
 * com categorias, progresso geral e animações.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, ChevronDown, Award, Star, Zap } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-500 dark:text-slate-400">Carregando conquistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
            <Trophy size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Conquistas
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Desbloqueie conquistas estudando e usando o Cinesia
        </p>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 mb-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Progresso Geral</p>
              <p className="text-4xl font-bold">{totalDesbloqueadas}<span className="text-xl text-indigo-200">/{totalConquistas}</span></p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">{percentual}%</p>
            </div>
          </div>
          
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentual}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats mini cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8"
        >
          {[
            { label: 'Flashcards', value: stats.flashcards, icon: '🃏' },
            { label: 'Resumos', value: stats.resumos, icon: '📝' },
            { label: 'Matérias', value: stats.materias, icon: '📂' },
            { label: 'Simulados', value: stats.simulados, icon: '🎯' },
            { label: 'Melhor Nota', value: `${stats.bestSimulado}%`, icon: '⭐' },
            { label: 'Streak', value: stats.streak, icon: '🔥' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-lg">{s.icon}</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              categoriaAtiva === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Unlocked */}
      {desbloqueadas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-500" />
            Desbloqueadas ({desbloqueadas.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {desbloqueadas.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{c.titulo}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{c.desc}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    {c.categoria}
                  </span>
                </div>
                <Award size={20} className="text-amber-500 flex-shrink-0 ml-auto" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {bloqueadas.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock size={18} className="text-slate-400" />
            Bloqueadas ({bloqueadas.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bloqueadas.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/40 dark:border-slate-700/40 flex items-center gap-4 opacity-60"
              >
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 grayscale">
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-600 dark:text-slate-400 truncate">{c.titulo}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 truncate">{c.desc}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    {c.categoria}
                  </span>
                </div>
                <Lock size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0 ml-auto" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {conquistasFiltradas.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <Trophy size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma conquista nesta categoria</p>
        </div>
      )}
    </div>
  );
}

export default Conquistas;
