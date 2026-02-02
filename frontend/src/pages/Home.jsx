import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, CreditCard, CheckCircle, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { getDashboardStats, salvarEvento } from '../services/firebaseService';
import CalendarWidget from '../components/Dashboard/CalendarWidget';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    ativas: 0,
    concluidas: 0,
    totalMaterias: 0,
    materiasRecentes: [],
    totalResumos: 0,
    totalFlashcards: 0,
    eventos: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const carregarDados = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getDashboardStats(userId);
        setStats({
          ...data,
          totalMaterias: data.ativas + data.concluidas
        });
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [user]);

  const handleAddEvento = async (novoEvento) => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    
    try {
      await salvarEvento(novoEvento, userId);
      const data = await getDashboardStats(userId);
      setStats({ ...data, totalMaterias: data.ativas + data.concluidas });
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
    }
  };

  const statCards = [
    { title: 'Total', value: stats.totalMaterias, icon: BookOpen, color: 'teal' },
    { title: 'Ativas', value: stats.ativas, icon: TrendingUp, color: 'blue' },
    { title: 'Concluídas', value: stats.concluidas, icon: CheckCircle, color: 'green' },
    { title: 'Resumos', value: stats.totalResumos, icon: FileText, color: 'orange' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo, {user?.displayName || user?.email?.split('@')[0] || 'Estudante'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Acompanhe seu progresso de estudos</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/materias')}
              className="bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-md w-fit"
            >
              <Plus size={20} />
              Nova Matéria
            </motion.button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const [bgColor, textColor] = colorMap[card.color].split(' ');
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${bgColor} p-3 rounded-lg`}>
                    <Icon className={textColor} size={24} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Seção Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matérias Recentes */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={24} className="text-teal-600" />
                  Matérias em Progresso
                </h2>
                <button
                  onClick={() => navigate('/materias')}
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                >
                  Ver todas →
                </button>
              </div>

              {stats.materiasRecentes && stats.materiasRecentes.length > 0 ? (
                <div className="space-y-3">
                  {stats.materiasRecentes.slice(0, 5).map((materia, idx) => (
                    <motion.div
                      key={materia.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate('/materias')}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: materia.cor || '#14b8a6' }}
                      >
                        {materia.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 font-semibold truncate">{materia.nome}</h3>
                        {materia.descricao && (
                          <p className="text-gray-500 text-sm truncate">{materia.descricao}</p>
                        )}
                      </div>
                      <BookOpen className="text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0" size={20} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhuma matéria criada ainda</p>
                  <p className="text-sm mt-1">Comece criando sua primeira matéria</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/materias')}
                    className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                  >
                    Criar Matéria
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Calendário */}
          <div>
            <CalendarWidget 
              eventos={stats.eventos}
              onAddEvento={handleAddEvento}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
