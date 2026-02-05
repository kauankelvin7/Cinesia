/**
 * HOME - Dashboard HealthTech Premium (Light Mode Only)
 * 
 * Design System v2.0 - Glassmorphism Edition
 * Features:
 * - Glassmorphism cards (bg-white/80 backdrop-blur)
 * - Gradientes premium teal/emerald
 * - Animações fluidas com Framer Motion
 * - Skeleton loaders elegantes
 * - Lucide icons modernos
 * 
 * OTIMIZAÇÕES v2.0:
 * - React.memo em componentes estáticos
 * - useMemo/useCallback para handlers
 * - Animações GPU-accelerated only
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  Flame, 
  Plus,
  Sparkles,
  Calendar,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import StreakIndicator from '../components/StreakIndicator';
import { useAuth } from '../contexts/AuthContext-firebase';
import { getDashboardStats } from '../services/dashboardService';
import { salvarEvento, deletarEvento } from '../services/firebaseService';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import AddEventModal from '../components/modals/AddEventModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import Button from '../components/ui/Button';
import '../styles/calendar.css';

// Utility function (outside component to avoid recreation)
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

// Skeleton Loader Premium - Memoizado
const SkeletonCard = memo(() => (
  <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 p-6 animate-pulse border border-white/50">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 bg-gradient-to-br from-teal-200 to-emerald-200 rounded-2xl flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded-lg w-24 mb-3"></div>
        <div className="h-8 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-lg w-20 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-32"></div>
      </div>
    </div>
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

// Color presets (definido fora para evitar recriação)
const colorPresets = {
  teal: 'from-teal-400 to-emerald-500 shadow-teal-500/25',
  blue: 'from-blue-400 to-cyan-500 shadow-blue-500/25',
  purple: 'from-purple-400 to-pink-500 shadow-purple-500/25',
  orange: 'from-orange-400 to-amber-500 shadow-orange-500/25',
};

// Stat Card Premium - Memoizado
const StatCard = memo(({ title, value, icon: Icon, subtitle, delay = 0, color = 'teal' }) => {
  // Fallback icon protection - prevents SVG undefined error
  const SafeIcon = Icon || BookOpen;

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow duration-300 p-6 border border-white/50 group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -5 }}
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="flex flex-col items-center justify-center text-center gap-4 w-full">
        <motion.div 
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorPresets[color]} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <SafeIcon size={28} strokeWidth={2} />
        </motion.div>
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles size={12} className="text-teal-500" />
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados do Modal de Evento
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState(new Date());
  
  // Estados do Modal de Confirmação de Exclusão
  const [confirmDeleteEvento, setConfirmDeleteEvento] = useState({ isOpen: false, evento: null });
  const [isDeletingEvento, setIsDeletingEvento] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    const loadData = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await getDashboardStats(userId);
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Handler para abrir o modal de evento
  const handleOpenEventModal = (date = new Date()) => {
    setSelectedDateForEvent(date);
    setIsEventModalOpen(true);
  };

  // Handler para salvar evento via modal
  const handleSaveEvent = async (newEvent) => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    
    try {
      await salvarEvento(newEvent, userId);
      const updatedData = await getDashboardStats(userId);
      setDashboardData(updatedData);
      setIsEventModalOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      throw error; // Re-throw para o modal mostrar erro
    }
  };

  // Handler para clique em dia do calendário
  const handleDayClick = (date) => {
    handleOpenEventModal(date);
  };

  // Handler para abrir modal de confirmação de exclusão de evento
  const handleDeleteEvento = (evento) => {
    setConfirmDeleteEvento({ isOpen: true, evento });
  };

  // Handler para confirmar exclusão de evento
  const confirmarExclusaoEvento = async () => {
    if (!confirmDeleteEvento.evento?.id) return;
    
    setIsDeletingEvento(true);
    try {
      await deletarEvento(confirmDeleteEvento.evento.id);
      const userId = user?.id || user?.uid;
      const updatedData = await getDashboardStats(userId);
      setDashboardData(updatedData);
      setConfirmDeleteEvento({ isOpen: false, evento: null });
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
    } finally {
      setIsDeletingEvento(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 pb-32">
      {/* Header Premium com Glass Effect */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-40 shadow-lg shadow-slate-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                  {getGreeting()} 
                </span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-2">
                {user?.displayName || user?.email?.split('@')[0] || 'Estudante'}
              </h1>
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <Sparkles size={14} className="text-teal-500" />
                Transforme conhecimento em prática. Sua jornada na fisioterapia começa aqui.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Plus size={20} />}
                onClick={() => navigate('/materias')}
              >
                Nova Matéria
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Matérias Ativas"
              value={dashboardData?.ativas || 0}
              icon={BookOpen}
              subtitle={`${dashboardData?.totalMaterias || 0} no total`}
              color="teal"
              delay={0}
            />
            <StatCard
              title="Flashcards"
              value={dashboardData?.totalFlashcards || 0}
              icon={CreditCard}
              subtitle="Prontos para revisão"
              color="blue"
              delay={0.1}
            />
            <StatCard
              title="Resumos"
              value={dashboardData?.totalResumos || 0}
              icon={FileText}
              subtitle="Documentos salvos"
              color="purple"
              delay={0.2}
            />
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow duration-300 p-6 border border-white/50 group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -5 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="flex flex-col items-center justify-center text-center gap-4 w-full">
                <StreakIndicator
                  currentStreak={dashboardData?.offensiveStreak || 0}
                  longestStreak={dashboardData?.longestStreak || 0}
                  totalLoginDays={dashboardData?.totalLoginDays || 0}
                  // isAtRisk pode ser implementado depois com lógica de risco
                />
                <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
                  <p className="text-sm font-medium text-slate-500 mb-1">Dias de Ofensiva</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-1">
                    {dashboardData?.offensiveStreak || 0}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Sparkles size={12} className="text-teal-500" />
                    {dashboardData?.offensiveStreak === 0 ? 'Comece sua sequência!' : 'Continue assim!'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grid Principal - 12 colunas para melhor proporção */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Materias em Foco */}
          <motion.div 
            className="xl:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg shadow-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                    <TrendingUp size={18} className="text-white" />
                  </div>
                  Matérias em Foco
                </h2>
                <button
                  onClick={() => navigate('/materias')}
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1 transition-colors group"
                >
                  Ver todas
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Empty State Premium */}
              {!isLoading && (!dashboardData?.materiasRecentes || dashboardData.materiasRecentes.length === 0) ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/10">
                    <Bookmark size={48} className="text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Nenhuma matéria criada ainda
                  </h3>
                  <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
                    Comece sua jornada criando sua primeira matéria de estudos
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Plus size={20} />}
                    rightIcon={<ArrowRight size={20} />}
                    onClick={() => navigate('/materias')}
                  >
                    Criar Primeira Matéria
                  </Button>
                </motion.div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.materiasRecentes.slice(0, 6).map((materia, idx) => (
                    <motion.div
                      key={materia.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      onClick={() => navigate('/materias')}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl hover:from-teal-50 hover:to-emerald-50 transition-all cursor-pointer group border border-slate-100 hover:border-teal-200 hover:shadow-md"
                    >
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${materia.cor || '#14B8A6'}, ${materia.cor || '#14B8A6'}dd)` 
                        }}
                      >
                        {materia.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-slate-900 font-semibold truncate text-lg">
                          {materia.nome}
                        </h3>
                        {materia.descricao && (
                          <p className="text-slate-500 text-sm truncate">
                            {materia.descricao}
                          </p>
                        )}
                      </div>
                      <ChevronRight 
                        className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all flex-shrink-0" 
                        size={24} 
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Calendario - 5 colunas no XL para não ficar espremido */}
          <motion.div 
            className="xl:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg shadow-slate-200/50 p-4 lg:p-5 calendar-container-compact">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                  <Calendar size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Agenda</h2>
              </div>
              <CalendarWidget
                eventos={dashboardData?.proximosEventos || []}
                onOpenAddModal={handleOpenEventModal}
                onClickDay={handleDayClick}
                onDeleteEvento={handleDeleteEvento}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Adicionar Evento */}
      <AddEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDateForEvent}
      />

      {/* Modal de Confirmação de Exclusão de Evento */}
      <ConfirmModal
        isOpen={confirmDeleteEvento.isOpen}
        onClose={() => setConfirmDeleteEvento({ isOpen: false, evento: null })}
        onConfirm={confirmarExclusaoEvento}
        title="Excluir Evento"
        message={
          <>
            Tem certeza que deseja excluir o evento{' '}
            <span className="font-semibold text-slate-900">
              "{confirmDeleteEvento.evento?.titulo || confirmDeleteEvento.evento?.title}"
            </span>?
            <br />
            <span className="text-red-600 font-medium">
              Essa ação não pode ser desfeita.
            </span>
          </>
        }
        confirmText="Excluir Evento"
        type="danger"
        isLoading={isDeletingEvento}
      />
    </div>
  );
};

export default Home;
