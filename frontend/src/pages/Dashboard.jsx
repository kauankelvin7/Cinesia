import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBook, FiFileText, FiLayers, FiArrowRight, FiPlus, FiTarget, FiAward } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext-firebase';
import api from '../services/api';
import { getDashboardStats } from '../services/dashboardService';
import IconWrapper from '../components/IconWrapper';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    materias: 0,
    resumos: 0,
    flashcards: 0
  });
  const [metaMensal, setMetaMensal] = useState(null);
  const [recentMaterias, setRecentMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [materiasRes, resumosRes, flashcardsRes] = await Promise.all([
        api.get('/materias').catch(() => ({ data: [] })),
        api.get('/resumos').catch(() => ({ data: [] })),
        api.get('/flashcards').catch(() => ({ data: [] }))
      ]);

      setStats({
        materias: materiasRes.data.length || 0,
        resumos: resumosRes.data.length || 0,
        flashcards: flashcardsRes.data.length || 0
      });

      // Calcula Meta Mensal
      const dashStats = await getDashboardStats(user?.uid);
      if (dashStats?.metaMensal) {
        setMetaMensal(dashStats.metaMensal);
      }

      // Pega as 6 matérias mais recentes
      const materias = materiasRes.data || [];
      setRecentMaterias(materias.slice(0, 6));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('pt-BR', options);
  };

  const statsCards = [
    {
      title: 'Matérias Ativas',
      value: stats.materias,
      icon: FiBook,
      color: 'teal',
      link: '/materias'
    },
    {
      title: 'Resumos Criados',
      value: stats.resumos,
      icon: FiFileText,
      color: 'blue',
      link: '/resumos'
    },
    {
      title: 'Flashcards',
      value: stats.flashcards,
      icon: FiLayers,
      color: 'purple',
      link: '/flashcards'
    }
  ];

  const colorClasses = {
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200',
      hover: 'hover:bg-teal-100'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-100'
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Olá, {user?.nome || 'Estudante'}! 👋
        </h1>
        <p className="text-slate-500 capitalize">{getCurrentDate()}</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statsCards.map((stat, index) => {
          const colors = colorClasses[stat.color];
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link}>
                <div className={`bg-white rounded-xl border border-slate-100 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${colors.bg} ${colors.text} p-3 rounded-lg`}>
                      <IconWrapper icon={stat.icon} size={24} />
                    </div>
                    <FiArrowRight className="text-slate-400" size={20} />
                  </div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Meta Mensal Card */}
      {metaMensal && (
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`rounded-2xl p-6 shadow-lg ${
            metaMensal.metaAtingida 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
              : 'bg-gradient-to-br from-amber-500 to-orange-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {metaMensal.metaAtingida ? (
                    <FiAward className="text-white" size={28} />
                  ) : (
                    <FiTarget className="text-white" size={28} />
                  )}
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Meta de {metaMensal.mesNome}</h3>
                  <p className="text-white/80 text-sm">
                    {metaMensal.metaAtingida ? '🎉 Parabéns! Meta atingida!' : 'Continue estudando!'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-3xl font-bold">{metaMensal.atual}/{metaMensal.meta}</p>
                <p className="text-white/80 text-sm">materiais criados</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(metaMensal.porcentagem, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
              </div>
              <p className="text-white/90 text-sm mt-2 text-center font-medium">
                {metaMensal.porcentagem}% concluído
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Acesso Rápido */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Acesso Rápido</h2>
          <Link to="/materias">
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus size={18} />
              Nova Matéria
            </motion.button>
          </Link>
        </div>

        {recentMaterias.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
            <FiBook className="mx-auto mb-4 text-slate-300" size={48} />
            <h3 className="text-slate-600 font-medium mb-2">Nenhuma matéria ainda</h3>
            <p className="text-slate-500 text-sm mb-4">Comece criando sua primeira matéria de estudo</p>
            <Link to="/materias">
              <button className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Criar Matéria
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMaterias.map((materia, index) => (
              <motion.div
                key={materia.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to="/materias">
                  <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${materia.cor}20` }}
                      >
                        <FiBook style={{ color: materia.cor }} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 mb-1 truncate group-hover:text-teal-600 transition-colors">
                          {materia.nome}
                        </h3>
                        {materia.descricao && (
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {materia.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link to="/resumos">
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <FiFileText className="text-blue-600 mb-3" size={28} />
            <h3 className="text-lg font-bold text-blue-900 mb-1">Meus Resumos</h3>
            <p className="text-blue-700 text-sm">Organize e revise seu conteúdo</p>
          </motion.div>
        </Link>

        <Link to="/flashcards">
          <motion.div
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <FiLayers className="text-purple-600 mb-3" size={28} />
            <h3 className="text-lg font-bold text-purple-900 mb-1">Flashcards</h3>
            <p className="text-purple-700 text-sm">Pratique com cartões de memória</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
