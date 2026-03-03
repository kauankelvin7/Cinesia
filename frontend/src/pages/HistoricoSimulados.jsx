/**
 * 📊 HISTÓRICO DE SIMULADOS
 * Lista todos os simulados realizados com score, tempo e detalhes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Clock,
  ChevronRight,
  ArrowLeft,
  Target,
  TrendingUp,
  Calendar,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { listarSimulados } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';

const formatTime = (s) => {
  if (!s || s <= 0) return '--:--';
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = dateStr?.toDate?.() || new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
};

const getScoreBg = (score) => {
  if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
  if (score >= 60) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
};

function HistoricoSimulados() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimulado, setSelectedSimulado] = useState(null);

  useEffect(() => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    listarSimulados(userId)
      .then(setSimulados)
      .catch(err => console.error('Erro ao listar simulados:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    if (simulados.length === 0) return { total: 0, media: 0, melhor: 0, tempoTotal: 0 };
    const scores = simulados.map(s => s.score || 0);
    return {
      total: simulados.length,
      media: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      melhor: Math.max(...scores),
      tempoTotal: simulados.reduce((a, s) => a + (s.tempoSegundos || 0), 0),
    };
  }, [simulados]);

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/simulado')}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Histórico de Simulados
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stats.total} simulado{stats.total !== 1 ? 's' : ''} realizado{stats.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: <Target size={16} />, label: 'Média', value: `${stats.media}%`, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
                { icon: <Trophy size={16} />, label: 'Melhor', value: `${stats.melhor}%`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                { icon: <BookOpen size={16} />, label: 'Total', value: stats.total, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                { icon: <Clock size={16} />, label: 'Tempo Total', value: formatTime(stats.tempoTotal), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                >
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{stat.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : simulados.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={36} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Nenhum simulado realizado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Complete um simulado para ver seu histórico aqui
            </p>
            <Button variant="primary" onClick={() => navigate('/simulado')}>
              Fazer Simulado
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {simulados.map((sim, idx) => (
              <motion.div
                key={sim.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedSimulado(sim)}
              >
                <div className="flex items-center gap-4">
                  {/* Score badge */}
                  <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center shrink-0 ${getScoreBg(sim.score)}`}>
                    <span className={`text-lg font-bold font-mono ${getScoreColor(sim.score)}`}>
                      {sim.score}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {sim.tema}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Target size={12} /> {sim.acertos}/{sim.total}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatTime(sim.tempoSegundos)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(sim.data || sim.createdAt)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedSimulado && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSimulado(null)}
            >
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedSimulado.tema}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(selectedSimulado.data || selectedSimulado.createdAt)} • {selectedSimulado.acertos}/{selectedSimulado.total} acertos
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSimulado(null)}
                    className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X size={18} className="text-slate-600 dark:text-slate-300" />
                  </button>
                </div>

                {/* Questions */}
                <div className="p-5 space-y-4">
                  {(selectedSimulado.questoes || []).map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            q.acertou ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                          }`}>
                            {q.acertou ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {q.pergunta}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {(q.opcoes || []).map((opcao, oIdx) => {
                          const isCorrect = q.correta === oIdx;
                          const isSelected = q.respostaUsuario === oIdx;
                          let cls = 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                          if (isCorrect) cls = 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300';
                          if (isSelected && !isCorrect) cls = 'border-red-400 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300';
                          return (
                            <div key={oIdx} className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${cls}`}>
                              <span className="font-bold text-xs w-5">{String.fromCharCode(65 + oIdx)}</span>
                              <span className="flex-1">{opcao}</span>
                              {isCorrect && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                              {isSelected && !isCorrect && <XCircle size={14} className="text-red-500 shrink-0" />}
                            </div>
                          );
                        })}
                        {q.explicacao && (
                          <div className="mt-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Explicação</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{q.explicacao}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HistoricoSimulados;
