/**
 * 📊 ANALYTICS - Página de Estatísticas de Estudo Premium
 * * Gráficos e métricas de desempenho do usuário.
 * Usa recharts para visualizações interativas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight,
  Plus,
  Play
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext-firebase';
import { listarFlashcards, listarResumos, listarMaterias, listarSimulados } from '../services/firebaseService';
import Button from '../components/ui/Button'; // Importando o Button para o Empty State

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center text-center animate-pulse"
        >
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-[20px] flex items-center justify-center mb-5 border border-indigo-100/50 dark:border-indigo-800/30">
            <BarChart3 size={32} className="text-indigo-400 dark:text-indigo-500" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Calculando Métricas...
          </p>
        </motion.div>
      </div>
    );
  }

  const KpiCard = ({ icon: Icon, label, value, colorClass, gradientClass, sub, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[28px] p-6 border border-slate-100 dark:border-slate-700/80 shadow-sm transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/50' : ''}`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shadow-sm ${gradientClass}`}>
          <Icon size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[13px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">{label}</span>
      </div>
      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      {sub && (
        <p className={`text-[12px] font-bold mt-2 flex items-center gap-1 opacity-90 ${colorClass}`}>
          {sub}
        </p>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        {/* Header Premium */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-[16px] flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                 <BarChart3 size={28} className="text-white" strokeWidth={2.5} />
               </div>
               <div>
                 <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                   Analytics
                 </h1>
                 <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                   <TrendingUp size={14} className="text-indigo-500" />
                   Acompanhe seu progresso e desempenho
                 </p>
               </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
          <KpiCard 
            icon={Brain} 
            label="Flashcards" 
            value={data.flashcards.length} 
            gradientClass="bg-gradient-to-br from-indigo-500 to-indigo-600" 
            colorClass="text-indigo-600 dark:text-indigo-400"
          />
          <KpiCard 
            icon={FileText} 
            label="Resumos" 
            value={data.resumos.length} 
            gradientClass="bg-gradient-to-br from-teal-400 to-teal-500"
            colorClass="text-teal-600 dark:text-teal-400" 
          />
          <KpiCard 
            icon={Target} 
            label="Simulados" 
            value={data.simulados.length} 
            gradientClass="bg-gradient-to-br from-amber-400 to-orange-500" 
            colorClass="text-orange-600 dark:text-orange-400"
            sub={<span>Média: {avgScore}% <ChevronRight size={14} className="inline -ml-0.5" /></span>} 
            onClick={() => navigate('/historico-simulados')}
          />
          <KpiCard 
            icon={Clock} 
            label="Tempo" 
            value={`${totalStudyTime}m`} 
            gradientClass="bg-gradient-to-br from-purple-500 to-pink-500" 
            colorClass="text-purple-600 dark:text-purple-400"
            sub="Dedicado a simulados" 
          />
        </div>

        {/* Verificação de Empty State */}
        {data.flashcards.length === 0 && data.resumos.length === 0 && data.simulados.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm"
           >
             <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[24px] flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800/50">
               <BarChart3 size={40} className="text-indigo-500" strokeWidth={1.5} />
             </div>
             <h3 className="text-[22px] font-black text-slate-800 dark:text-slate-100 mb-2">Seu painel de Analytics está vazio</h3>
             <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
               As métricas e gráficos aparecerão aqui automaticamente assim que você começar a criar seu material de estudo.
             </p>
             <div className="flex flex-col sm:flex-row gap-3">
               <Button 
                 onClick={() => navigate('/flashcards')} 
                 variant="primary" 
                 leftIcon={<Plus size={18} />}
                 className="bg-indigo-600"
               >
                 Criar Flashcards
               </Button>
               <Button 
                 onClick={() => navigate('/simulados')} 
                 variant="secondary" 
                 leftIcon={<Play size={18} />}
                 className="bg-slate-100 dark:bg-slate-800"
               >
                 Fazer um Simulado
               </Button>
             </div>
           </motion.div>
        ) : (
          /* Charts Grid */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Activity last 7 days */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[28px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700/80 shadow-sm"
              >
                <h3 className="text-[16px] font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2.5 uppercase tracking-widest">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                  </div>
                  Produção (7 dias)
                </h3>
                {activityChart.some(d => d.flashcards > 0 || d.resumos > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={activityChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                        contentStyle={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 600 }}
                        itemStyle={{ fontWeight: 700 }}
                      />
                      <Bar dataKey="flashcards" name="Flashcards" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={16} />
                      <Bar dataKey="resumos" name="Resumos" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-dashed border-slate-200 dark:border-slate-700">
                    <Calendar size={32} className="mb-3 opacity-40" strokeWidth={1.5} />
                    <span className="text-[13px] font-bold uppercase tracking-widest opacity-80">Sem atividade na semana</span>
                  </div>
                )}
              </motion.div>

              {/* Content distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[28px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700/80 shadow-sm"
              >
                <h3 className="text-[16px] font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2.5 uppercase tracking-widest">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                    <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  Distribuição
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: 16, border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 600 }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: '#64748B' }} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-[20px] border border-dashed border-slate-200 dark:border-slate-700">
                    <BookOpen size={32} className="mb-3 opacity-40" strokeWidth={1.5} />
                    <span className="text-[13px] font-bold uppercase tracking-widest opacity-80">Nenhum conteúdo</span>
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
                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[28px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700/80 shadow-sm mb-6"
              >
                <h3 className="text-[16px] font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2.5 uppercase tracking-widest">
                  <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                    <TrendingUp size={16} className="text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  </div>
                  Evolução Simulados
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={simuladosChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                      itemStyle={{ fontWeight: 800, fontSize: 16, color: '#f59e0b' }}
                      labelStyle={{ color: '#94A3B8', fontWeight: 700, marginBottom: 4, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px' }}
                      formatter={(value) => [`${value}%`, 'Nota']}
                      labelFormatter={(label) => {
                        const item = simuladosChart.find(s => s.name === label);
                        return item?.tema || label;
                      }}
                    />
                    <Area type="monotone" dataKey="nota" stroke="#f59e0b" strokeWidth={3} fill="url(#colorNota)" activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
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
                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[28px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700/80 shadow-sm"
              >
                <h3 className="text-[16px] font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2.5 uppercase tracking-widest">
                  <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <Zap size={16} className="text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                  </div>
                  Conteúdo por Matéria
                </h3>
                <ResponsiveContainer width="100%" height={Math.max(240, materiasChart.length * 45)}>
                  <BarChart data={materiasChart} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      contentStyle={{ borderRadius: 16, border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 600 }}
                      labelFormatter={(label) => {
                        const item = materiasChart.find(m => m.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="flashcards" name="Flashcards" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={12} />
                    <Bar dataKey="resumos" name="Resumos" fill="#14b8a6" radius={[0, 6, 6, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;