/**
 * HOME — Premium SaaS Dashboard
 * Dark mode aware, new design system colors
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  Flame, 
  Plus,
  Calendar,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import StreakIndicator from '../components/StreakIndicator';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import { salvarEvento, deletarEvento } from '../services/firebaseService';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import AddEventModal from '../components/modals/AddEventModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import '../styles/calendar.css';

// Utility function (outside component to avoid recreation)
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

// Skeleton Loader - Memoizado
const SkeletonCard = memo(() => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 animate-pulse border border-slate-200/60 dark:border-slate-700/60">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded-lg w-24 mb-3"></div>
        <div className="h-7 bg-slate-100 dark:bg-slate-700 rounded-lg w-16 mb-2"></div>
        <div className="h-3 bg-slate-50 dark:bg-slate-700/50 rounded w-28"></div>
      </div>
    </div>
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

// Color presets
const colorPresets = {
  teal: 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400',
  blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  purple: 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400',
  orange: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
};

// Stat Card - Memoizado
const StatCard = memo(({ title, value, icon: Icon, subtitle, delay = 0, color = 'teal' }) => {
  const SafeIcon = Icon || BookOpen;

  return (
    <motion.div
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-slate-200/60 dark:border-slate-700/60"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center justify-center text-center gap-3 w-full">
        <div 
          className={`w-12 h-12 rounded-xl ${colorPresets[color]} flex items-center justify-center flex-shrink-0`}
        >
          <SafeIcon size={24} strokeWidth={1.8} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400">
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
  const { data: cachedData, isLoading: cacheLoading, loadData, refreshData } = useDashboardData();

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
    
    const loadData2 = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await loadData(userId);
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData2();
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
      const updatedData = await refreshData(userId);
      setDashboardData(updatedData);
      setIsEventModalOpen(false);
      toast.success('Evento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      toast.error('Não foi possível salvar o evento.');
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
      const updatedData = await refreshData(userId);
      setDashboardData(updatedData);
      setConfirmDeleteEvento({ isOpen: false, evento: null });
      toast.success('Evento excluído com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Não foi possível excluir o evento.');
    } finally {
      setIsDeletingEvento(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ipad:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-3 py-1 rounded-full">
                  {getGreeting()} 
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {user?.displayName || user?.email?.split('@')[0] || 'Estudante'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Transforme conhecimento em prática. Sua jornada na fisioterapia começa aqui.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 ipad:px-8 py-8">
        {/* Stats Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ipad:grid-cols-4 gap-5 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 ipad:grid-cols-4 gap-5 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-slate-200/60 dark:border-slate-700/60"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex flex-col items-center justify-center text-center gap-3 w-full">
                <StreakIndicator
                  currentStreak={dashboardData?.offensiveStreak || 0}
                  longestStreak={dashboardData?.longestStreak || 0}
                  totalLoginDays={dashboardData?.totalLoginDays || 0}
                />
                <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Dias de Ofensiva</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {dashboardData?.offensiveStreak || 0}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {dashboardData?.offensiveStreak === 0 ? 'Comece sua sequência!' : 'Continue assim!'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grid Principal - 12 colunas para melhor proporção */}
        <div className="grid grid-cols-1 ipad:grid-cols-12 xl:grid-cols-12 gap-6">
          {/* Materias em Foco */}
          <motion.div 
            className="ipad:col-span-7 xl:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                    <TrendingUp size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  Matérias em Foco
                </h2>
                <button
                  onClick={() => navigate('/materias')}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm flex items-center gap-1 transition-colors group"
                >
                  Ver todas
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Empty State Premium */}
              {!isLoading && (!dashboardData?.materiasRecentes || dashboardData.materiasRecentes.length === 0) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Bookmark size={40} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Nenhuma matéria criada ainda
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-md mx-auto">
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
                    <div key={i} className="h-24 bg-slate-50 dark:bg-slate-700 rounded-xl animate-pulse"></div>
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
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer group border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{ 
                          backgroundColor: materia.cor || '#0EA5E9'
                        }}
                      >
                        {materia.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-slate-900 dark:text-white font-semibold truncate text-lg">
                          {materia.nome}
                        </h3>
                        {materia.descricao && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                            {materia.descricao}
                          </p>
                        )}
                      </div>
                      <ChevronRight 
                        className="text-slate-300 dark:text-slate-600 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0" 
                        size={24} 
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Agenda — 5 colunas no ipad+ */}
          <motion.div 
            className="ipad:col-span-5 xl:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                    <Calendar size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  Agenda
                </h2>
                <button
                  onClick={() => handleOpenEventModal()}
                  className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-sm"
                  title="Adicionar Evento"
                >
                  <Plus size={16} />
                </button>
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
