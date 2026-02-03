/**
 * 🏠 HOME (DASHBOARD) - Painel Principal Premium do Cinesia
 * 
 * RESPONSÁVEL POR:
 * - Exibir métricas em tempo real do Firestore (matérias, resumos, flashcards)
 * - Calcular ofensiva de dias consecutivos de estudo (Study Streak)
 * - Apresentar saudação personalizada (Bom dia/Boa tarde/Boa noite)
 * - Listar matérias mais recentes em foco com progresso visual
 * - Calendário com eventos e provas
 * - Empty states quando não há matérias criadas
 * - Skeleton loaders para evitar FOUC (Flash of Unstyled Content)
 * 
 * DESIGN SYSTEM PREMIUM:
 * - Light Mode: Slate-50 background, Teal-600 primary, gradientes sutis
 * - Dark Mode: Slate-950 background, Teal-400 primary, sombras soft-dark
 * - Medical Clean: Sombras suaves, muito espaço em branco, micro-animações
 * - Acessibilidade: Contraste WCAG AAA, foco visível, textos semânticos
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  Flame, 
  Plus, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  BookMarked,
  ArrowRight
} from 'lucide-react';

// Validação de ícones para evitar erros de SVG
const safeIcon = (Icon, props = {}) => {
  try {
    return <Icon {...props} />;
  } catch (error) {
    console.warn('Erro ao renderizar ícone:', error);
    return null;
  }
};
import { useAuth } from '../contexts/AuthContext-firebase';
import { getDashboardStats, getGreeting } from '../services/dashboardService';
import { salvarEvento } from '../services/firebaseService';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import StatCard from '../components/Dashboard/StatCard';
import DashboardSkeleton from '../components/DashboardSkeleton';

// Frases motivacionais sobre saúde e estudos em fisioterapia
const MOTIVATIONAL_QUOTES = [
  "O movimento é a cura. Continue estudando! 💪",
  "Cada resumo é um passo mais perto da excelência.",
  "A fisioterapia começa com conhecimento sólido.",
  "Seu futuro paciente agradecerá sua dedicação hoje.",
  "Transforme teoria em prática, um flashcard de cada vez.",
  "O corpo humano é fascinante. Explore cada detalhe!",
  "Sua jornada na fisioterapia está apenas começando. 🌟",
  "Conhecimento é o melhor tratamento que você pode oferecer.",
  "A prática deliberada transforma estudantes em profissionais.",
  "Cada diagnóstico começa com uma base teórica sólida."
];

// Seleciona uma frase aleatória
const getRandomQuote = () => {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
};

// Formata a data atual por extenso
const getCurrentDateFormatted = () => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date().toLocaleDateString('pt-BR', options);
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estado local
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [motivationalQuote] = useState(() => getRandomQuote());
  const [greeting] = useState(() => getGreeting());

  // Carrega dados do Firestore uma única vez
  useEffect(() => {
    if (!user) {
      setIsLoadingData(false);
      return;
    }
    
    const loadDashboardData = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) {
        setIsLoadingData(false);
        return;
      }
      
      try {
        console.log('🔄 Carregando dashboard para user:', userId);
        const firestoreData = await getDashboardStats(userId);
        console.log('✅ Dados recebidos:', firestoreData);
        setDashboardData(firestoreData);
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        setDashboardData({
          totalMaterias: 0,
          ativas: 0,
          concluidas: 0,
          totalResumos: 0,
          totalFlashcards: 0,
          offensiveStreak: 0,
          materiasRecentes: [],
          proximosEventos: [],
          error: error.message
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Handler para adicionar eventos no calendário
  const handleAddEvent = async (newEvent) => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    
    try {
      await salvarEvento(newEvent, userId);
      
      // Recarrega dados após adicionar evento
      const updatedData = await getDashboardStats(userId);
      setDashboardData(updatedData);
    } catch (error) {
      console.error('❌ Erro ao adicionar evento:', error);
    }
  };

  // ===== LOADING STATE =====
  // Mostra skeleton loader enquanto busca dados do Firestore
  if (isLoadingData) {
    return <DashboardSkeleton />;
  }

  // ===== CONFIGURAÇÃO DOS CARDS DE MÉTRICAS =====
  const metricsCards = [
    { 
      title: 'Matérias Ativas', 
      value: dashboardData?.ativas || 0, 
      icon: BookOpen, 
      colorScheme: 'teal',
      subtitle: `${dashboardData?.totalMaterias || 0} no total`
    },
    { 
      title: 'Flashcards Criados', 
      value: dashboardData?.totalFlashcards || 0, 
      icon: CreditCard, 
      colorScheme: 'blue',
      subtitle: 'Prontos para revisão'
    },
    { 
      title: 'Resumos', 
      value: dashboardData?.totalResumos || 0, 
      icon: FileText, 
      colorScheme: 'purple',
      subtitle: 'Documentos salvos'
    },
    { 
      title: 'Dias de Ofensiva', 
      value: dashboardData?.offensiveStreak || 0, 
      icon: Flame, 
      colorScheme: 'orange',
      subtitle: 'Continue assim! 🔥'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32 transition-colors duration-200">
      {/* Header de Boas-vindas com Saudação Dinâmica */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {greeting}, {user?.displayName || user?.email?.split('@')[0] || 'Estudante'}! 👋
              </h1>
              <p className="text-slate-600 text-sm mb-1">
                {getCurrentDateFormatted()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles size={16} className="text-teal-600" />
                <p className="text-slate-700 text-sm font-medium italic">
                  {motivationalQuote}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/materias')}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 shadow-md w-fit"
            >
              <Plus size={20} />
              Novo Estudo
            </motion.button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid de Métricas (Stats Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricsCards.map((card, index) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorScheme={card.colorScheme}
              subtitle={card.subtitle}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Seção Principal: Matérias em Foco + Calendário */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Matérias em Foco */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={24} className="text-teal-600" />
                  Matérias em Foco
                </h2>
                <button
                  onClick={() => navigate('/materias')}
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1 transition-colors"
                >
                  Ver todas
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* ===== EMPTY STATE ===== */}
              {!dashboardData?.materiasRecentes || dashboardData.materiasRecentes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookMarked size={40} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhuma matéria criada ainda
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
                    Comece sua jornada de estudos criando sua primeira matéria. 
                    Organize seus conhecimentos e alcance a excelência acadêmica!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/materias')}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Criar Primeira Matéria
                    <ArrowRight size={20} />
                  </motion.button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.materiasRecentes.slice(0, 6).map((materia, idx) => {
                    // Calcula progresso visual baseado em resumos/flashcards (mock)
                    const hasResumos = dashboardData.totalResumos > 0;
                    const hasFlashcards = dashboardData.totalFlashcards > 0;
                    const mockProgress = hasResumos && hasFlashcards 
                      ? 30 + (idx * 15) 
                      : hasResumos ? 20 : 10;
                    
                    return (
                      <motion.div
                        key={materia.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => navigate('/materias')}
                        className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all duration-200 cursor-pointer group border border-transparent hover:border-teal-200"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
                            style={{ backgroundColor: materia.cor || '#14b8a6' }}
                          >
                            {materia.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-slate-900 font-semibold truncate">
                              {materia.nome}
                            </h3>
                            {materia.descricao && (
                              <p className="text-slate-500 text-sm truncate">
                                {materia.descricao}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="text-slate-400 group-hover:text-teal-600 transition-colors flex-shrink-0" size={20} />
                        </div>
                        
                        {/* Barra de Progresso Visual (Mock baseado em conteúdo criado) */}
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-600 font-medium">
                              Progresso de Estudo
                            </span>
                            <span className="text-xs text-slate-600 font-bold">
                              {mockProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${mockProgress}%` }}
                              transition={{ delay: 0.3 + (idx * 0.1), duration: 0.8, ease: 'easeOut' }}
                              className="bg-gradient-to-r from-teal-500 to-teal-600 h-full rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Calendário de Eventos */}
          <div className="lg:col-span-1">
            <CalendarWidget
              eventos={dashboardData?.proximosEventos || []}
              onAddEvent={handleAddEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
