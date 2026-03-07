/**
 * 📊 HISTÓRICO DE SIMULADOS
 * Lista todos os simulados realizados com score, tempo e detalhes.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertTriangle,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { listarSimulados, criarFlashcard } from '../services/firebaseService';
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
  if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50';
  if (score >= 60) return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50';
  return 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50';
};

function HistoricoSimulados() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimulado, setSelectedSimulado] = useState(null);
  const [flashcardStatus, setFlashcardStatus] = useState({});

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

  const pontosFracos = useMemo(() => {
    if (simulados.length === 0) return [];
    const mapa = {};
    simulados.forEach(sim => {
      const tema = sim.tema || 'Geral';
      if (!mapa[tema]) mapa[tema] = { tema, total: 0, erros: 0 };
      (sim.questoes || []).forEach(q => {
        mapa[tema].total++;
        if (!q.acertou) mapa[tema].erros++;
      });
    });
    return Object.values(mapa)
      .filter(t => t.erros > 0 && t.total > 0)
      .map(t => ({ ...t, pct: Math.round((t.erros / t.total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [simulados]);

  const handleCriarFlashcard = useCallback(async (sim, q, key) => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    setFlashcardStatus(prev => ({ ...prev, [key]: 'loading' }));
    const respostaCorreta = q.opcoes?.[q.correta] ?? 'Ver gabarito';
    const resposta = q.explicacao
      ? `${respostaCorreta}\n\n${q.explicacao}`
      : respostaCorreta;
    try {
      await criarFlashcard(
        { pergunta: q.pergunta, resposta, materiaId: null, materiaNome: sim.tema, materiaCor: null },
        null,
        userId
      );
      setFlashcardStatus(prev => ({ ...prev, [key]: 'done' }));
      toast.success('Flashcard criado com sucesso!');
    } catch {
      setFlashcardStatus(prev => ({ ...prev, [key]: 'error' }));
      toast.error('Erro ao criar flashcard.');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-500 font-bold">Processando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        {/* Header Premium */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/simulado')}
              className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Histórico de Simulados
              </h1>
              <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Você já completou <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats.total} sessões</span> de estudo
              </p>
            </div>
          </div>

          {/* Stats Cards Premium */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { icon: <Target size={18} />, label: 'Média', value: `${stats.media}%`, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-800' },
                { icon: <Trophy size={18} />, label: 'Recorde', value: `${stats.melhor}%`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800' },
                { icon: <BookOpen size={18} />, label: 'Simulados', value: stats.total, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800' },
                { icon: <Clock size={18} />, label: 'Tempo Total', value: formatTime(stats.tempoTotal), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{stat.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pontos Fracos Visual Insight */}
          {pontosFracos.length > 0 && (
            <motion.div
              className="mb-10 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm overflow-hidden relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-5">
                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle size={16} className="text-amber-500" strokeWidth={2.5} />
                </div>
                Onde Focar o Estudo (Pontos Fracos)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {pontosFracos.map(pt => (
                  <div key={pt.tema} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[70%]">{pt.tema}</span>
                      <span className={`text-[12px] font-black font-mono ${
                        pt.pct >= 70 ? 'text-red-500' : pt.pct >= 40 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {pt.pct}% de erros
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className={`h-full rounded-full ${
                          pt.pct >= 70 ? 'bg-red-500' : pt.pct >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pt.pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Content - Lista de Simulados */}
        {simulados.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} className="text-indigo-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Nenhum simulado ainda
            </h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
              Realize seu primeiro simulado com IA para começar a traquear seu progresso.
            </p>
            <Button variant="primary" size="lg" className="h-12 px-8 rounded-xl font-bold shadow-md bg-indigo-600" onClick={() => navigate('/simulado')}>
              Começar Agora
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-slate-400 ml-2 mb-4">Sessões Recentes</h2>
            {simulados.map((sim, idx) => (
              <motion.div
                key={sim.id}
                className="group bg-white dark:bg-slate-800 rounded-[22px] border border-slate-200 dark:border-slate-700 p-5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedSimulado(sim)}
              >
                <div className="flex items-center gap-5">
                  {/* Score badge Ring Style */}
                  <div className={`w-16 h-16 rounded-[18px] border-2 flex flex-col items-center justify-center shrink-0 shadow-sm ${getScoreBg(sim.score)}`}>
                    <span className={`text-xl font-black font-mono leading-none ${getScoreColor(sim.score)}`}>
                      {sim.score}
                    </span>
                    <span className={`text-[10px] font-bold uppercase mt-1 opacity-70 ${getScoreColor(sim.score)}`}>%</span>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-extrabold text-slate-800 dark:text-white truncate tracking-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sim.tema}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">
                        <Target size={13} className="text-emerald-500" strokeWidth={3} /> {sim.acertos}/{sim.total} Acertos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} /> {formatTime(sim.tempoSegundos)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} /> {formatDate(sim.data || sim.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                    <ChevronRight size={20} strokeWidth={3} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal com Glassmorphism e Refinamento de Leitura */}
        <AnimatePresence>
          {selectedSimulado && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSimulado(null)}
            >
              <motion.div
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/50 dark:border-slate-700/50 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header Premium */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-6 flex items-start justify-between shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">Review</span>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        {selectedSimulado.tema}
                      </h2>
                    </div>
                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                      Realizado em {formatDate(selectedSimulado.data || selectedSimulado.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSimulado(null)}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    <X size={20} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                  </button>
                </div>

                {/* Questions Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                      <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Aproveitamento</p>
                      <p className={`text-3xl font-black ${getScoreColor(selectedSimulado.score)}`}>{selectedSimulado.score}%</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                      <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Tempo Total</p>
                      <p className="text-3xl font-black text-slate-800 dark:text-white font-mono">{formatTime(selectedSimulado.tempoSegundos)}</p>
                    </div>
                  </div>

                  {(selectedSimulado.questoes || []).map((q, qIdx) => {
                    const fcKey = `${selectedSimulado.id}-${qIdx}`;
                    const fcStatus = flashcardStatus[fcKey];
                    return (
                    <div
                      key={qIdx}
                      className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                    >
                      <div className={`p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-start gap-4 ${q.acertou ? 'bg-emerald-50/20' : 'bg-red-50/20'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                          q.acertou 
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>
                          {q.acertou ? <CheckCircle size={18} strokeWidth={2.5} /> : <XCircle size={18} strokeWidth={2.5} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
                            {q.pergunta}
                          </p>
                          
                          {/* Botão criar flashcard Inteligente */}
                          {!q.acertou && (
                            <div className="mt-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCriarFlashcard(selectedSimulado, q, fcKey)}
                                disabled={fcStatus === 'loading' || fcStatus === 'done'}
                                className={`flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-lg transition-all font-bold shadow-sm ${
                                  fcStatus === 'done'
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                                }`}
                              >
                                {fcStatus === 'loading' ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : fcStatus === 'done' ? (
                                  <CheckCircle size={14} strokeWidth={3} />
                                ) : (
                                  <Sparkles size={14} fill="white" />
                                )}
                                {fcStatus === 'done' ? 'Flashcard Criado!' : 'Salvar como Flashcard'}
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-2.5">
                        {(q.opcoes || []).map((opcao, oIdx) => {
                          const isCorrect = q.correta === oIdx;
                          const isSelected = q.respostaUsuario === oIdx;
                          
                          let cardCls = 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400';
                          let letterCls = 'bg-slate-200 dark:bg-slate-700 text-slate-500';

                          if (isCorrect) {
                            cardCls = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/10';
                            letterCls = 'bg-emerald-500 text-white';
                          } else if (isSelected && !isCorrect) {
                            cardCls = 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
                            letterCls = 'bg-red-500 text-white';
                          }

                          return (
                            <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cardCls}`}>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[12px] shrink-0 shadow-sm ${letterCls}`}>
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                              <span className="flex-1 font-medium text-[14px] leading-snug">{opcao}</span>
                            </div>
                          );
                        })}
                        
                        {q.explicacao && (
                          <div className="mt-4 p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                              <p className="text-[12px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Explicação do Professor</p>
                            </div>
                            <p className="text-[14px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                              "{q.explicacao}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                
                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  <Button variant="secondary" fullWidth onClick={() => setSelectedSimulado(null)} className="h-12 rounded-xl font-bold">
                    Fechar Revisão
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Estilos para Scrollbar Customizada */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

export default HistoricoSimulados;