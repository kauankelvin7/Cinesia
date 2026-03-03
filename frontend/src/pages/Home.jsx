/**
 * HOME — Premium Cinesia Dashboard v2
 * Fixes: spacing, bento grid balance, offensive pill, subject names,
 * compact agenda (no full calendar), 2-col bottom layout
 *
 * Paleta: ciano (#06B6D4), azul-marinho (#0A1628), índigo
 */

import { useState, useEffect, useMemo, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, useInView } from 'framer-motion';
import {
  BookOpen,
  FileText,
  CreditCard,
  Flame,
  Plus,
  Calendar,
  TrendingUp,
  ChevronRight,
  Bookmark,
  Layers,
  Brain,
  Sparkles,
  PenTool,
  Zap,
  Target,
  Activity,
  Search,
  Bone,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import { salvarEvento, deletarEvento } from '../services/firebaseService';
import AddEventModal from '../components/modals/AddEventModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', emoji: '☀️' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
  return { text: 'Boa noite', emoji: '🌙' };
};

const motivationalPhrases = [
  'A anatomia é a base. Domine-a e tudo fará sentido.',
  'Cada flashcard revisado é um passo mais perto da aprovação.',
  'Consistência supera intensidade. Continue estudando!',
  'Seu futuro paciente agradece cada hora de estudo.',
  'Fisioterapia é ciência e arte — domine ambas.',
  'Pequenos passos diários constroem conhecimento sólido.',
  'Revise hoje o que aprendeu ontem. Repetição espaçada funciona!',
  'Você está construindo uma base que vai durar toda sua carreira.',
];

const getMotivationalPhrase = () => {
  const idx = (new Date().getDate() + new Date().getHours()) % motivationalPhrases.length;
  return motivationalPhrases[idx];
};

const timeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = date?.toDate?.() || new Date(date);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD}d`;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

/* ═══════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════ */

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

/* ═══════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.2 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const target = typeof value === 'number' ? value : 0;
    if (target === 0) { setDisplay(0); return; }

    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, inView, duration]);

  return <span ref={ref} className="tabular-nums">{display}</span>;
};

/* ═══════════════════════════════════════════
   CIRCULAR PROGRESS
   ═══════════════════════════════════════════ */
const CircularProgress = memo(({ percentage = 0, size = 88, strokeWidth = 7 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white tabular-nums">
          <AnimatedNumber value={percentage} duration={1.5} />
          <span className="text-sm">%</span>
        </span>
        <span className="text-[9px] text-slate-400 uppercase tracking-wider">completo</span>
      </div>
    </div>
  );
});
CircularProgress.displayName = 'CircularProgress';

/* ═══════════════════════════════════════════
   FLAME ANIMATION
   ═══════════════════════════════════════════ */
const AnimatedFlame = memo(({ size = 20 }) => (
  <motion.div
    animate={{
      scale: [1, 1.15, 1],
      filter: [
        'drop-shadow(0 0 4px rgba(245,158,11,0.4))',
        'drop-shadow(0 0 10px rgba(245,158,11,0.7))',
        'drop-shadow(0 0 4px rgba(245,158,11,0.4))',
      ],
    }}
    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
  >
    <Flame size={size} className="text-amber-400" />
  </motion.div>
));
AnimatedFlame.displayName = 'AnimatedFlame';

/* ═══════════════════════════════════════════
   USER AVATAR
   ═══════════════════════════════════════════ */
const UserAvatar = memo(({ user, size = 'lg', showStatus = false }) => {
  const sizeMap = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };
  const glowMap = {
    sm: '-inset-0.5', md: '-inset-0.5', lg: '-inset-1',
  };
  const statusMap = {
    sm: 'w-2.5 h-2.5 border', md: 'w-3 h-3 border-2', lg: 'w-3.5 h-3.5 border-2',
  };
  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="relative shrink-0">
      <div className={`absolute ${glowMap[size]} rounded-full bg-linear-to-br from-cyan-400 via-cyan-500 to-blue-500 opacity-50 blur-sm`} />
      {user?.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || ''}
          className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-cyan-400/40 relative z-10`}
        />
      ) : (
        <div className={`${sizeMap[size]} rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold ring-2 ring-cyan-400/40 relative z-10`}>
          {initial}
        </div>
      )}
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${statusMap[size]} bg-emerald-500 ring-2 ring-[#0A1628] rounded-full z-20`} />
      )}
    </div>
  );
});
UserAvatar.displayName = 'UserAvatar';

/* ═══════════════════════════════════════════
   GLASS CARD
   ═══════════════════════════════════════════ */
const GlassCard = memo(({ children, className = '', onClick, hover = true }) => (
  <motion.div
    variants={fadeUp}
    className={`
      relative overflow-hidden rounded-2xl
      bg-white/4 backdrop-blur-xl
      border border-white/8
      transition-all duration-300
      ${hover ? 'hover:bg-white/7 hover:border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/5' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
    onClick={onClick}
    whileHover={onClick ? { y: -2 } : undefined}
  >
    {children}
  </motion.div>
));
GlassCard.displayName = 'GlassCard';

/* ═══════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════ */
const SkeletonPulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/6 rounded-xl ${className}`} />
);

/* ═══════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════ */
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cachedData, isLoading: cacheLoading, loadData, refreshData } = useDashboardData();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de Evento
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState(new Date());

  // Modal de Confirmação de Exclusão
  const [confirmDeleteEvento, setConfirmDeleteEvento] = useState({ isOpen: false, evento: null });
  const [isDeletingEvento, setIsDeletingEvento] = useState(false);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const loadDash = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) { setIsLoading(false); return; }
      try {
        const data = await loadData(userId);
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDash();
  }, [user]);

  /* ── Event handlers ── */
  const handleOpenEventModal = (date = new Date()) => {
    setSelectedDateForEvent(date);
    setIsEventModalOpen(true);
  };

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
      throw error;
    }
  };

  const handleDeleteEvento = (evento) => {
    setConfirmDeleteEvento({ isOpen: true, evento });
  };

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

  /* ── Computed values ── */
  const greeting = useMemo(() => getGreeting(), []);
  const motivational = useMemo(() => getMotivationalPhrase(), []);

  const progressPercent = useMemo(() => {
    if (!dashboardData || !dashboardData.totalMaterias) return 0;
    return Math.round((dashboardData.concluidas / dashboardData.totalMaterias) * 100);
  }, [dashboardData]);

  // Próximos 3 eventos (para agenda compacta inline)
  const proximosEventos = useMemo(() => {
    const eventos = dashboardData?.proximosEventos || [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return eventos
      .map(e => ({ ...e, dataObj: e.data?.toDate?.() || new Date(e.data) }))
      .filter(e => e.dataObj >= hoje)
      .sort((a, b) => a.dataObj - b.dataObj)
      .slice(0, 4);
  }, [dashboardData]);

  // Feed de atividade recente
  const recentActivity = useMemo(() => {
    if (!dashboardData) return [];
    const activities = [];
    if (dashboardData.materiasRecentes?.length > 0) {
      dashboardData.materiasRecentes.slice(0, 2).forEach(m => {
        activities.push({
          type: 'materia', icon: BookOpen,
          text: `Acessou ${m.nome}`,
          time: m.updatedAt || m.createdAt,
          color: 'text-cyan-400', bg: 'bg-cyan-500/10',
        });
      });
    }
    if (dashboardData.totalResumos > 0) {
      activities.push({
        type: 'resumo', icon: FileText,
        text: 'Resumo atualizado',
        time: new Date(Date.now() - 3600000 * 2),
        color: 'text-violet-400', bg: 'bg-violet-500/10',
      });
    }
    if (dashboardData.totalFlashcards > 0) {
      activities.push({
        type: 'flashcard', icon: CreditCard,
        text: 'Flashcards revisados',
        time: new Date(Date.now() - 3600000 * 5),
        color: 'text-blue-400', bg: 'bg-blue-500/10',
      });
    }
    activities.push({
      type: 'login', icon: Activity,
      text: 'Sessão de estudo iniciada',
      time: new Date(),
      color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    });
    return activities.slice(0, 5);
  }, [dashboardData]);

  /* ── Quick actions dock ── */
  const quickActions = [
    { icon: PenTool, label: 'Novo Resumo', onClick: () => navigate('/resumos', { state: { openNew: true } }), badge: 'Popular', color: 'from-violet-500/20 to-violet-600/10 text-violet-400 border-violet-500/20' },
    { icon: Layers, label: 'Flashcards', onClick: () => navigate('/flashcards'), color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20' },
    { icon: Brain, label: 'Simulado', onClick: () => navigate('/simulado'), color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20' },
    { icon: Search, label: 'Consulta', onClick: () => navigate('/consulta-rapida'), color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20' },
    { icon: Bone, label: 'Atlas 3D', onClick: () => navigate('/atlas-3d'), color: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/20' },
    { icon: PenTool, label: 'Quadro', onClick: () => navigate('/quadro-branco'), color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/20' },
  ];

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <motion.div
      className="min-h-screen pb-32"
      initial="hidden"
      animate="show"
      variants={staggerContainer}
    >
      {/* ═══════════════════════════════════════════
          1. HEADER — Avatar + greeting + offensive pill inline
          ═══════════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-[#0A1628] via-[#0F1E35] to-[#0A1628]">
          <motion.div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.3, 1], x: [0, -10, 0], y: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-8 sm:pt-10 pb-12 sm:pb-16">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <UserAvatar user={user} size="lg" showStatus />
            </motion.div>

            {/* Greeting + offensive pill */}
            <div className="flex-1 min-w-0">
              <motion.p
                className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {greeting.text} {greeting.emoji}
              </motion.p>
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                {user?.displayName || user?.email?.split('@')[0] || 'Estudante'}
              </motion.h1>

              {/* Offensive streak pill — inline under name */}
              <motion.div
                className="flex items-center gap-3 mt-2.5 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-sm font-semibold">
                  <AnimatedFlame size={14} />
                  <span className="text-orange-300 tabular-nums">
                    {isLoading ? '—' : <AnimatedNumber value={dashboardData?.offensiveStreak || 0} />}
                  </span>
                  <span className="text-orange-400/70 text-xs font-medium">
                    {(dashboardData?.offensiveStreak || 0) === 0 ? 'Comece hoje!' : 'dias'}
                  </span>
                </span>

                {/* Motivational phrase — desktop */}
                <span className="hidden sm:flex items-center gap-1.5 text-slate-400/70 text-sm">
                  <Sparkles size={13} className="text-cyan-400/50 shrink-0" />
                  <span className="truncate max-w-xs">{motivational}</span>
                </span>
              </motion.div>
            </div>
          </div>

          {/* Motivational phrase — mobile only */}
          <motion.div
            className="mt-4 sm:hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="bg-white/4 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/6 flex items-center gap-2">
              <Sparkles size={14} className="text-cyan-400/60 shrink-0" />
              <p className="text-xs text-slate-300/80 line-clamp-2">{motivational}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 -mt-6 relative z-20">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">

          {/* ═══════════════════════════════════════════
              2. BENTO GRID — 4 balanced columns
              Progress (2-col) | Flashcards | Resumos
              All cards same height
              ═══════════════════════════════════════════ */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
              <SkeletonPulse className="h-40 col-span-2" />
              <SkeletonPulse className="h-40" />
              <SkeletonPulse className="h-40" />
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {/* ── Progress card (2 cols, same height as others) ── */}
              <GlassCard className="col-span-2 p-6" onClick={() => navigate('/materias')}>
                <div className="flex items-center gap-5 h-full">
                  <CircularProgress
                    percentage={progressPercent}
                    size={88}
                    strokeWidth={7}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Progresso Geral
                    </p>
                    <p className="text-lg font-bold text-white mb-3">
                      <AnimatedNumber value={dashboardData?.concluidas || 0} />
                      <span className="text-slate-500 font-normal text-sm"> / {dashboardData?.totalMaterias || 0} matérias</span>
                    </p>
                    <div className="space-y-2">
                      {dashboardData?.materiasRecentes?.slice(0, 3).map((m, i) => (
                        <div key={m.id || i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.cor || '#06B6D4' }} />
                          <span className="text-xs text-slate-300 truncate flex-1">{m.nome}</span>
                          <div className="w-12 h-1.5 bg-white/6 rounded-full overflow-hidden shrink-0">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: m.cor || '#06B6D4' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${30 + (i * 20) % 70}%` }}
                              transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 shrink-0 hidden sm:block" />
                </div>
              </GlassCard>

              {/* ── Flashcards card ── */}
              <GlassCard className="p-6 flex flex-col" onClick={() => navigate('/flashcards')}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CreditCard size={16} className="text-blue-400" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Flashcards</p>
                </div>
                <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                  <AnimatedNumber value={dashboardData?.totalFlashcards || 0} />
                </p>
                <p className="text-xs text-slate-500 mb-auto">cards para revisão</p>
                <div className="mt-4 flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="flex-1 h-5 bg-blue-500/10 rounded-md border border-blue-500/10"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    />
                  ))}
                </div>
              </GlassCard>

              {/* ── Resumos card ── */}
              <GlassCard className="p-6 flex flex-col" onClick={() => navigate('/resumos')}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-violet-400" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Resumos</p>
                </div>
                <p className="text-3xl font-bold text-white mb-1 tabular-nums">
                  <AnimatedNumber value={dashboardData?.totalResumos || 0} />
                </p>
                <p className="text-xs text-slate-500 mb-auto">documentos salvos</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-linear-to-r from-violet-500 to-violet-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">ativos</span>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              3. DOCK — Quick access, horizontal scroll on mobile
              ═══════════════════════════════════════════ */}
          <motion.div className="mb-10" variants={fadeUp}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3.5 flex items-center gap-2">
              <Zap size={13} className="text-cyan-400/60" />
              Acesso Rápido
            </h2>
            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={action.label}
                  onClick={action.onClick}
                  className={`
                    group relative shrink-0 flex items-center gap-2.5
                    px-4 py-2.5 rounded-xl
                    bg-linear-to-br ${action.color}
                    border border-white/6
                    backdrop-blur-md
                    hover:border-white/15 hover:scale-[1.03]
                    active:scale-[0.98]
                    transition-all duration-200
                  `}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.06, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                >
                  <action.icon size={16} strokeWidth={1.8} />
                  <span className="text-sm font-medium text-white/90 whitespace-nowrap">{action.label}</span>
                  {action.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/20">
                      {action.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ═══════════════════════════════════════════
              4. BOTTOM GRID — 2 columns on desktop
              Left (col-span-2): Matérias + Atividade stacked
              Right (col-span-1): Agenda compact
              ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

            {/* ──────── LEFT: Matérias + Atividade ──────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Matérias em Foco */}
              <motion.div variants={fadeUp}>
                <GlassCard className="p-6" hover={false}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-white flex items-center gap-2.5 tracking-tight">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <TrendingUp size={16} className="text-cyan-400" />
                      </div>
                      Matérias em Foco
                    </h2>
                    <button
                      onClick={() => navigate('/materias')}
                      className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors group"
                    >
                      Ver todas
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {!isLoading && (!dashboardData?.materiasRecentes || dashboardData.materiasRecentes.length === 0) ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                      <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bookmark size={28} className="text-cyan-400/40" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1.5">Nenhuma matéria criada</h3>
                      <p className="text-slate-400 text-sm mb-5 max-w-xs mx-auto">
                        Crie sua primeira matéria para organizar seus estudos
                      </p>
                      <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/materias')}>
                        Criar Matéria
                      </Button>
                    </motion.div>
                  ) : isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <SkeletonPulse key={i} className="h-16" />)}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {dashboardData.materiasRecentes.slice(0, 5).map((materia, idx) => (
                        <motion.div
                          key={materia.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.07 }}
                          onClick={() => navigate('/materias')}
                          className="group flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/4 transition-all cursor-pointer border border-transparent hover:border-white/6"
                        >
                          {/* Color icon with letter */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                            style={{ backgroundColor: materia.cor || '#06B6D4' }}
                          >
                            {materia.nome?.charAt(0).toUpperCase()}
                          </div>

                          {/* Name + description — more space */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm leading-snug">{materia.nome}</h3>
                            {materia.descricao && (
                              <p className="text-slate-500 text-xs truncate mt-0.5">{materia.descricao}</p>
                            )}
                          </div>

                          {/* Shorter progress bar so name doesn't truncate */}
                          <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <div className="w-14 h-1.5 bg-white/6 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: materia.cor || '#06B6D4' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${20 + (idx * 15) % 80}%` }}
                                transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                              />
                            </div>
                          </div>

                          <ChevronRight
                            size={16}
                            className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0"
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>

              {/* Atividade Recente */}
              <motion.div variants={fadeUp}>
                <GlassCard className="p-6" hover={false}>
                  <h2 className="text-base font-bold text-white flex items-center gap-2.5 tracking-tight mb-5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Activity size={16} className="text-emerald-400" />
                    </div>
                    Atividade Recente
                  </h2>

                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">Nenhuma atividade recente</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {recentActivity.map((activity, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-start gap-3 py-2.5 relative"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.08 }}
                        >
                          {idx < recentActivity.length - 1 && (
                            <div className="absolute left-3.75 top-9.5 bottom-0 w-px bg-white/6" />
                          )}
                          <div className={`w-7.5 h-7.5 rounded-lg ${activity.bg} flex items-center justify-center shrink-0 relative z-10`}>
                            <activity.icon size={14} className={activity.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300">{activity.text}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{timeAgo(activity.time)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Monthly goal */}
                  {dashboardData?.metaMensal && (
                    <motion.div
                      className="mt-5 pt-4 border-t border-white/6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <Target size={12} className="text-cyan-400/60" />
                          Meta {dashboardData.metaMensal.mesNome}
                        </span>
                        <span className="text-xs text-cyan-400 font-bold tabular-nums">
                          {dashboardData.metaMensal.atual}/{dashboardData.metaMensal.meta}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/6 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-linear-to-r from-cyan-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${dashboardData.metaMensal.porcentagem}%` }}
                          transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            </div>

            {/* ──────── RIGHT: Agenda Compact (no full calendar) ──────── */}
            <motion.div className="lg:col-span-1" variants={fadeUp}>
              <GlassCard className="p-6 lg:sticky lg:top-6" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white flex items-center gap-2.5 tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar size={16} className="text-blue-400" />
                    </div>
                    Agenda
                  </h2>
                  <button
                    onClick={() => handleOpenEventModal()}
                    className="w-8 h-8 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    title="Adicionar Evento"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Compact inline event list (no react-calendar) */}
                {proximosEventos.length > 0 ? (
                  <div className="space-y-2.5">
                    {proximosEventos.map((evento, index) => (
                      <motion.div
                        key={evento.id || index}
                        className="group flex items-center gap-3 p-3 bg-white/3 rounded-xl hover:bg-white/6 transition-colors border border-white/5 hover:border-white/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                      >
                        {/* Date badge */}
                        <div className="shrink-0 w-11 h-11 bg-blue-500/10 rounded-xl flex flex-col items-center justify-center border border-blue-500/15">
                          <span className="text-xs font-bold text-blue-300 leading-none">
                            {evento.dataObj.getDate()}
                          </span>
                          <span className="text-[9px] text-blue-400/70 uppercase leading-none mt-0.5">
                            {evento.dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </span>
                        </div>

                        {/* Event info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {evento.titulo || evento.title}
                          </p>
                          {evento.tipo && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{evento.tipo}</p>
                          )}
                        </div>

                        {/* Delete on hover */}
                        {evento.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEvento(evento); }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all shrink-0"
                            title="Excluir evento"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-12 h-12 bg-blue-500/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CalendarDays size={22} className="text-blue-400/40" />
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Nenhum evento próximo</p>
                    <p className="text-xs text-slate-500">Clique em + para adicionar</p>
                  </motion.div>
                )}

                {/* Today's date footer */}
                <div className="mt-5 pt-4 border-t border-white/6">
                  <p className="text-[11px] text-slate-500 text-center">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════ */}
      <AddEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDateForEvent}
      />

      <ConfirmModal
        isOpen={confirmDeleteEvento.isOpen}
        onClose={() => setConfirmDeleteEvento({ isOpen: false, evento: null })}
        onConfirm={confirmarExclusaoEvento}
        title="Excluir Evento"
        message={
          <>
            Tem certeza que deseja excluir o evento{' '}
            <span className="font-semibold text-white">
              "{confirmDeleteEvento.evento?.titulo || confirmDeleteEvento.evento?.title}"
            </span>?
            <br />
            <span className="text-red-400 font-medium">
              Essa ação não pode ser desfeita.
            </span>
          </>
        }
        confirmText="Excluir Evento"
        type="danger"
        isLoading={isDeletingEvento}
      />
    </motion.div>
  );
};

export default Home;
