/**
 * 📊 ANALYTICS - Página de Estatísticas de Estudo
 * 
 * Gráficos e métricas de desempenho do usuário.
 * Usa recharts para visualizações interativas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Brain,
  BookOpen,
  FileText,
  Zap,
  Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext-firebase';
import { listarFlashcards, listarResumos, listarMaterias, listarSimulados } from '../services/firebaseService';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function Analytics() {
  const { user } = useAuth();
  const userId = user?.id || user?.uid;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ flashcards: [], resumos: [], materias: [], simulados: [] });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [flashcards, resumos, materias, simulados] = await Promise.all([
          listarFlashcards(userId).catch(() => []),
          listarResumos(userId).catch(() => []),
          listarMaterias(userId).catch(() => []),
          listarSimulados(userId, 200).catch(() => []),
        ]);
        setData({ flashcards, resumos, materias, simulados });
      } catch (err) {
        console.error('Erro ao carregar analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // Content per matéria
  const materiasChart = useMemo(() => {
    return data.materias.map(m => ({
      name: m.nome?.length > 15 ? m.nome.substring(0, 15) + '…' : m.nome,
      fullName: m.nome,
      flashcards: data.flashcards.filter(f => f.materiaId === m.id).length,
      resumos: data.resumos.filter(r => r.materiaId === m.id).length,
    })).filter(m => m.flashcards > 0 || m.resumos > 0);
  }, [data]);

  // Simulados performance over time
  const simuladosChart = useMemo(() => {
    return data.simulados
      .slice()
      .sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.data);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || b.data);
        return da - db;
      })
      .map((s, i) => ({
        name: `#${i + 1}`,
        nota: s.score || 0,
        tema: s.tema || 'Sem tema',
      }));
  }, [data.simulados]);

  // Study activity last 7 days
  const activityChart = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);

      const toMs = (item) => {
        const c = item.createdAt;
        if (!c) return 0;
        if (c.toDate) return c.toDate().getTime();
        if (c.seconds) return c.seconds * 1000;
        return new Date(c).getTime();
      };

      const fc = data.flashcards.filter(f => { const ms = toMs(f); return ms >= d.getTime() && ms < next.getTime(); }).length;
      const rs = data.resumos.filter(r => { const ms = toMs(r); return ms >= d.getTime() && ms < next.getTime(); }).length;

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      days.push({
        name: dayNames[d.getDay()],
        flashcards: fc,
        resumos: rs,
      });
    }
    return days;
  }, [data]);

  // Pie chart: content distribution
  const pieData = useMemo(() => {
    const items = [];
    if (data.flashcards.length > 0) items.push({ name: 'Flashcards', value: data.flashcards.length });
    if (data.resumos.length > 0) items.push({ name: 'Resumos', value: data.resumos.length });
    if (data.simulados.length > 0) items.push({ name: 'Simulados', value: data.simulados.length });
    return items;
  }, [data]);

  // KPIs
  const avgScore = useMemo(() => {
    if (data.simulados.length === 0) return 0;
    return Math.round(data.simulados.reduce((s, sim) => s + (sim.score || 0), 0) / data.simulados.length);
  }, [data.simulados]);

  const totalStudyTime = useMemo(() => {
    const secs = data.simulados.reduce((s, sim) => s + (sim.tempoSegundos || 0), 0);
    return Math.round(secs / 60);
  }, [data.simulados]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
          />
          <p className="text-slate-500 dark:text-slate-400">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  const KpiCard = ({ icon: Icon, label, value, color, sub }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <BarChart3 size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">Acompanhe seu progresso e desempenho</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Brain} label="Flashcards" value={data.flashcards.length} color="bg-indigo-500" />
        <KpiCard icon={FileText} label="Resumos" value={data.resumos.length} color="bg-emerald-500" />
        <KpiCard icon={Target} label="Simulados" value={data.simulados.length} color="bg-amber-500" sub={`Média: ${avgScore}%`} />
        <KpiCard icon={Clock} label="Tempo Total" value={`${totalStudyTime}min`} color="bg-purple-500" sub="Em simulados" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity last 7 days */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" />
            Atividade (últimos 7 dias)
          </h3>
          {activityChart.some(d => d.flashcards > 0 || d.resumos > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                />
                <Bar dataKey="flashcards" name="Flashcards" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resumos" name="Resumos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              Sem atividade nos últimos 7 dias
            </div>
          )}
        </motion.div>

        {/* Content distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-500" />
            Distribuição de Conteúdo
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              Nenhum conteúdo criado ainda
            </div>
          )}
        </motion.div>
      </div>

      {/* Simulados performance line */}
      {simuladosChart.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm mb-8"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" />
            Evolução nos Simulados
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={simuladosChart}>
              <defs>
                <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={(value, name) => [`${value}%`, 'Nota']}
                labelFormatter={(label) => {
                  const item = simuladosChart.find(s => s.name === label);
                  return item?.tema || label;
                }}
              />
              <Area type="monotone" dataKey="nota" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorNota)" dot={{ r: 4, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Per-matéria breakdown */}
      {materiasChart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-purple-500" />
            Conteúdo por Matéria
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, materiasChart.length * 40)}>
            <BarChart data={materiasChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                labelFormatter={(label) => {
                  const item = materiasChart.find(m => m.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="flashcards" name="Flashcards" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="resumos" name="Resumos" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Empty state */}
      {data.flashcards.length === 0 && data.resumos.length === 0 && data.simulados.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sem dados ainda</p>
          <p className="text-sm mt-1">Crie flashcards, resumos e faça simulados para ver seus analytics</p>
        </div>
      )}
    </div>
  );
}

export default Analytics;
