/**
 * 📊 HISTÓRICO DE SIMULADOS PREMIUM
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
  AlertTriangle,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  CalendarDays,
  History
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

  // ─── TELA DE LOADING CONSISTENTE ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center text-center animate-pulse"
        >
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-[20px] flex items-center justify-center mb-5 border border-indigo-100/50 dark:border-indigo-800/30">
            <History size={32} className="text-indigo-500" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Buscando Histórico...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        
        {/* ─── HEADER PREMIUM ─── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/simulados')} // Atualizei a rota para o plural, ajuste se necessário
              className="w-12 h-12 rounded-[16px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                Histórico de Simulados
              </h1>
              <p className="text-[14px] sm:text-[15px] font-medium text-slate-500 dark:text-slate-400">
                Você já completou <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats.total} sessões</span> de estudo
              </p>
            </div>
          </div>

          {/* ─── STATS CARDS ─── */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[
                { icon: <Target size={20} />, label: 'Média', value: `${stats.media}%`, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-800' },
                { icon: <Trophy size={20} />, label: 'Recorde', value: `${stats.melhor}%`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800' },
                { icon: <BookOpen size={20} />, label: 'Sessões', value: stats.total, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800' },
                { icon: <Clock size={20} />, label: 'Tempo Total', value: formatTime(stats.tempoTotal), color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-800' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-[16px] ${stat.bg} flex items-center justify-center mb-3 sm:mb-4 ${stat.color} shadow-sm`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none mb-1">{stat.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ─── PONTOS FRACOS (Insights) ─── */}
          {pontosFracos.length > 0 && (
            <motion.div
              className="mb-10 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-8 shadow-sm overflow-hidden relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-3xl pointer-events-none" />
              
              <h2 className="flex items-center gap-3 text-[16px] font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-[12px] border border-amber-100 dark:border-amber-800/50">
                  <AlertTriangle size={18} className="text-amber-500" strokeWidth={2.5} />
                </div>
                Onde Focar o Estudo
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                {pontosFracos.map(pt => (
                  <div key={pt.tema} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{pt.tema}</span>
                      <span className={`text-[12px] font-black uppercase tracking-wider ${
                        pt.pct >= 70 ? 'text-red-500' : pt.pct >= 40 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {pt.pct}% Erros
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
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

        {/* ─── LISTA DE SESSÕES ─── */}
        {simulados.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white/50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-[24px] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-6 border border-indigo-100 dark:border-indigo-800/50">
              <BookOpen size={36} className="text-indigo-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Nenhum simulado ainda
            </h3>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Realize seu primeiro simulado com IA para começar a registrar seu progresso aqui.
            </p>
            <Button variant="primary" size="lg" className="h-14 px-8 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600" onClick={() => navigate('/simulados')}>
              Começar Agora
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-4">Sessões Recentes</h2>
            
            {simulados.map((sim, idx) => (
              <motion.div
                key={sim.id}
                className="group bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedSimulado(sim)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  
                  {/* Avatar/Score Circular */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] flex flex-col items-center justify-center shrink-0 shadow-sm ${getScoreBg(sim.score)}`}>
                    <span className={`text-xl sm:text-2xl font-black font-mono leading-none tracking-tighter ${getScoreColor(sim.score)}`}>
                      {sim.score}
                    </span>
                    <span className={`text-[10px] font-bold uppercase mt-0.5 opacity-80 ${getScoreColor(sim.score)}`}>%</span>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] sm:text-[18px] font-extrabold text-slate-800 dark:text-white truncate tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sim.tema}
                    </h3>
                    
                    {/* Tags (Badges) de Informação */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                        <Target size={12} className="text-indigo-500" strokeWidth={3} /> {sim.acertos}/{sim.total}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                        <Clock size={12} className="text-amber-500" strokeWidth={3} /> {formatTime(sim.tempoSegundos)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                        <CalendarDays size={12} className="text-emerald-500" strokeWidth={3} /> {formatDate(sim.data || sim.createdAt).split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Seta indicativa */}
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all border border-transparent group-hover:border-indigo-100 dark:group-hover:border-indigo-800">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── MODAL DE REVISÃO DO SIMULADO ─── */}
        <AnimatePresence>
          {selectedSimulado && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSimulado(null)}
            >
              <motion.div
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/50 dark:border-slate-700/50 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header do Modal */}
                <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 sm:p-8 flex items-start justify-between shrink-0">
                  <div className="pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">Gabarito</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                      {selectedSimulado.tema}
                    </h2>
                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CalendarDays size={14} /> Realizado em {formatDate(selectedSimulado.data || selectedSimulado.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSimulado(null)}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm shrink-0"
                    aria-label="Fechar"
                  >
                    <X size={20} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                  </button>
                </div>

                {/* Área de Scroll com as Questões */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
                  
                  {/* Resumo Rápido no topo do modal */}
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Aproveitamento</p>
                      <p className={`text-4xl font-black font-mono tracking-tighter ${getScoreColor(selectedSimulado.score)}`}>{selectedSimulado.score}%</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Tempo Gasto</p>
                      <p className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">{formatTime(selectedSimulado.tempoSegundos)}</p>
                    </div>
                  </div>

                  {(selectedSimulado.questoes || []).map((q, qIdx) => {
                    const fcKey = `${selectedSimulado.id}-${qIdx}`;
                    const fcStatus = flashcardStatus[fcKey];
                    return (
                    <div
                      key={qIdx}
                      className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden"
                    >
                      <div className={`p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4 ${q.acertou ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : 'bg-red-50/30 dark:bg-red-950/10'}`}>
                        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border ${
                          q.acertou 
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>
                          {q.acertou ? <CheckCircle size={20} strokeWidth={2.5} /> : <XCircle size={20} strokeWidth={2.5} />}
                        </div>
                        
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[16px] font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                            {q.pergunta}
                          </p>
                          
                          {/* Botão Salvar como Flashcard (Apenas para Erros) */}
                          {!q.acertou && (
                            <div className="mt-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCriarFlashcard(selectedSimulado, q, fcKey)}
                                disabled={fcStatus === 'loading' || fcStatus === 'done'}
                                className={`flex items-center gap-2 text-[12px] px-3.5 py-2 rounded-xl transition-all font-bold shadow-sm border ${
                                  fcStatus === 'done'
                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20'
                                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                                }`}
                              >
                                {fcStatus === 'loading' ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : fcStatus === 'done' ? (
                                  <CheckCircle size={16} strokeWidth={2.5} />
                                ) : (
                                  <Sparkles size={16} />
                                )}
                                {fcStatus === 'done' ? 'Salvo nos Flashcards' : 'Salvar Erro como Flashcard'}
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5 sm:p-6 space-y-3">
                        {(q.opcoes || []).map((opcao, oIdx) => {
                          const isCorrect = q.correta === oIdx;
                          const isSelected = q.respostaUsuario === oIdx;
                          
                          let cardCls = 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400';
                          let letterCls = 'bg-white dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 shadow-sm';

                          if (isCorrect) {
                            cardCls = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/20';
                            letterCls = 'bg-emerald-500 text-white border-transparent shadow-sm shadow-emerald-500/30';
                          } else if (isSelected && !isCorrect) {
                            cardCls = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
                            letterCls = 'bg-red-500 text-white border-transparent shadow-sm shadow-red-500/30';
                          }

                          return (
                            <div key={oIdx} className={`flex items-start gap-3.5 p-3.5 rounded-[16px] border transition-all ${cardCls}`}>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5 ${letterCls}`}>
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                              <span className="flex-1 font-semibold text-[15px] leading-relaxed pt-1.5">{opcao}</span>
                            </div>
                          );
                        })}
                        
                        {/* Box de Explicação */}
                        {q.explicacao && (
                          <div className="mt-6 p-5 sm:p-6 rounded-[20px] bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                               <BookOpen size={64} />
                            </div>
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                              <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                              <p className="text-[12px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Feedback do Professor</p>
                            </div>
                            <p className="text-[14px] sm:text-[15px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed relative z-10">
                              {q.explicacao}
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
                  <Button variant="primary" size="lg" fullWidth onClick={() => setSelectedSimulado(null)} className="h-14 rounded-2xl font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white border-none text-[15px]">
                    Concluir Revisão
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
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
}

export default HistoricoSimulados;