/**
 * HOME — Cinesia Premium Dashboard v5
 * Design System: Medical Precision meets Modern Study App
 * Inspired by: Linear.app, Vercel Dashboard, Raycast
 *
 * Palette: Blue (#2563EB), Teal (#0D9488), Orange (#EA580C)
 * Fonts: Sora (display), DM Sans (body), JetBrains Mono (numbers)
 */

import { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, useInView } from 'framer-motion';
import {
  BookOpen,
  FileText,
  CreditCard,
  Plus,
  Calendar,
  TrendingUp,
  ChevronRight,
  Bookmark,
  Zap,
  Target,
  Trash2,
  CalendarDays,
  Sun,
  CloudSun,
  Moon,
  Search,
  Layers,
  PenLine,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import { salvarEvento, deletarEvento, listarFlashcards } from '../services/firebaseService';
import { isDueForReview } from '../utils/sm2';
import { useTheme } from '../contexts/ThemeContext';
import AddEventModal from '../components/modals/AddEventModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', Icon: Sun, color: '#FBBF24' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', Icon: CloudSun, color: '#FB923C' };
  return { text: 'Boa noite', Icon: Moon, color: '#A78BFA' };
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

const getStoredMetaMensal = () => {
  try {
    const raw = localStorage.getItem('cinesia:meta:mensal');
    if (raw == null) return { value: 50, hasSaved: false };
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) return { value: 50, hasSaved: false };
    return { value: Math.min(500, Math.round(parsed)), hasSaved: true };
  } catch {
    return { value: 50, hasSaved: false };
  }
};

const parseSafeDate = (value) => {
  try {
    const candidate = value?.toDate?.() || (value ? new Date(value) : null);
    if (!candidate || Number.isNaN(candidate.getTime())) return null;
    return candidate;
  } catch {
    return null;
  }
};

/* ═══════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════ */

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ═══════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.2, className = 'tabular-nums font-mono', style }) => {
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, inView, duration]);

  return <span ref={ref} className={className} style={style}>{display}</span>;
};

/* ═══════════════════════════════════════════
   AVATAR WITH FALLBACK — never breaks
   ═══════════════════════════════════════════ */
const Avatar = memo(({ src, name, size = 56, ring = false, className = '' }) => {
  const [error, setError] = useState(false);
  const initials = useMemo(() =>
    (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  , [name]);
  const bgColor = useMemo(() => {
    const colors = ['#2563EB','#0D9488','#7C3AED','#059669','#D97706','#DB2777'];
    return colors[(name || '').charCodeAt(0) % colors.length || 0];
  }, [name]);

  const renderFallback = (w, h, fs) => (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: w, height: h, backgroundColor: bgColor, fontSize: fs }}
    >
      {initials}
    </div>
  );

  if (!ring) {
    return (
      <div className={className}>
        {(error || !src) ? renderFallback(size, size, size * 0.35) : (
          <img
            src={src} alt={name || ''}
            className="rounded-full object-cover shrink-0"
            style={{ width: size, height: size }}
            onError={() => setError(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size + 6, height: size + 6 }}>
      <div
        className="absolute inset-0 rounded-full opacity-80"
        style={{
          background: 'conic-gradient(from 0deg, #2563EB, #0D9488, #34D399, #2563EB)',
          animation: 'spin-ring 4s linear infinite',
        }}
      />
      <div className="absolute rounded-full" style={{ inset: '2px', background: 'var(--bg-app)' }} />
      <div className="absolute" style={{ inset: '3px' }}>
        {(error || !src) ? (
          <div
            className="rounded-full flex items-center justify-center text-white font-bold w-full h-full"
            style={{ backgroundColor: bgColor, fontSize: size * 0.35 }}
          >{initials}</div>
        ) : (
          <img
            src={src} alt={name || ''}
            className="rounded-full object-cover w-full h-full"
            style={{ border: '2px solid rgba(255,255,255,0.2)' }}
            onError={() => setError(true)}
          />
        )}
      </div>
    </div>
  );
});
Avatar.displayName = 'Avatar';

/* ═══════════════════════════════════════════
   KPI CARD — hero mini-card com linha colorida
   ═══════════════════════════════════════════ */
const KPI_VARIANTS = {
  materias:  { color: '#60a5fa', Icon: BookOpen,   label: 'Matérias',   sublabel: 'cadastradas',    path: '/materias'  },
  flashcard: { color: '#fb923c', Icon: CreditCard, label: 'Flashcards', sublabel: 'para revisão',   path: '/flashcards' },
  resumos:   { color: '#34d399', Icon: FileText,   label: 'Resumos',    sublabel: 'salvos',         path: '/resumos'   },
};

const KpiCard = memo(({ variant, value, loading, navigate: nav, delay = 0, isDarkMode = true }) => {
  const { color, Icon, label, sublabel, path } = KPI_VARIANTS[variant] || {};
  return (
    <motion.div
      role="listitem"
      onClick={() => nav(path)}
      className="relative overflow-hidden cursor-pointer"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '16px 14px',
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0,0,0,0.3)' 
          : '0 4px 20px rgba(37,99,235,0.05)',
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{
        y: -4,
        borderColor: color,
        boxShadow: `0 8px 24px ${color}20`,
      }}
      whileTap={{ y: 0 }}
    >
      {/* Top color line */}
      <div 
        className="absolute pointer-events-none" 
        style={{ top: 0, left: '16px', right: '16px', height: '3px', borderRadius: '0 0 4px 4px', background: color, opacity: 0.9 }} 
      />

      {/* Icon + label row */}
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon size={14} style={{ color }} />
          </div>
        )}
        <span 
          className="uppercase font-bold" 
          style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-2)' }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      {loading ? (
        <div 
          className="animate-pulse rounded-md mt-1" 
          style={{ height: '32px', width: '55%', backgroundColor: 'var(--bg-elevated)' }} 
        />
      ) : (
        <AnimatedNumber
          value={value}
          duration={1.5}
          className="mt-1"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: 'var(--text-1)'
          }}
        />
      )}

      {/* Sub-label */}
      <span style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px', display: 'block', lineHeight: 1 }}>
        {sublabel}
      </span>
    </motion.div>
  );
});
KpiCard.displayName = 'KpiCard';

/* ═══════════════════════════════════════════
   CIRCULAR PROGRESS (SVG) for Meta Mensal
   ═══════════════════════════════════════════ */
const CircularProgress = memo(({ current = 0, total = 50, size = 90, showStartMessage = false }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#cpGradHome)"
          strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="cpGradHome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--teal)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showStartMessage ? (
          <span className="font-display font-bold" style={{ fontSize: '13px', color: 'var(--primary)', lineHeight: 1.2, textAlign: 'center' }}>Comece!</span>
        ) : (
          <>
            <span className="font-mono font-bold" style={{ fontSize: '22px', color: 'var(--text-1)', lineHeight: 1 }}>
              <AnimatedNumber value={current} duration={1.5} />
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>de {total}</span>
          </>
        )}
      </div>
    </div>
  );
});
CircularProgress.displayName = 'CircularProgress';

/* ═══════════════════════════════════════════
   SECTION CARD — themed for light & dark • border + shadow
   ═══════════════════════════════════════════ */
const SectionCard = memo(({ children, className = '', hover = true, onClick }) => {
  const { isDarkMode } = useTheme();
  return (
    <motion.div
      variants={fadeUp}
      className={`relative overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: isDarkMode
          ? '0 2px 8px rgba(0,0,0,0.2)'
          : '0 2px 12px rgba(37,99,235,0.03)',
      }}
      onClick={onClick}
      whileHover={hover && onClick ? { y: -2, borderColor: 'var(--border-strong)' } : undefined}
    >
      {children}
    </motion.div>
  );
});
SectionCard.displayName = 'SectionCard';

/* ═══════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════ */
const SkeletonPulse = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl ${className}`} style={{ backgroundColor: 'var(--bg-elevated)' }} />
);

/* ═══════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════ */
const Home = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { loadData, refreshData } = useDashboardData();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState(new Date());
  const [confirmDeleteEvento, setConfirmDeleteEvento] = useState({ isOpen: false, evento: null });
  const [isDeletingEvento, setIsDeletingEvento] = useState(false);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaValue, setMetaValue] = useState(() => getStoredMetaMensal().value);
  const [hasSavedMeta, setHasSavedMeta] = useState(() => getStoredMetaMensal().hasSaved);
  const location = useLocation();

  const persistMetaMensal = useCallback((value) => {
    const safe = Math.max(1, Math.min(500, Number(value) || 50));
    try {
      localStorage.setItem('cinesia:meta:mensal', String(safe));
      setHasSavedMeta(true);
    } catch {
      setHasSavedMeta(false);
    }
    setMetaValue(safe);
  }, []);

  // Carregar contagem de flashcards pendentes de revisão (SM-2)
  useEffect(() => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    listarFlashcards(userId)
      .then(fcs => setPendingReviews(fcs.filter(fc => isDueForReview(fc)).length))
      .catch(() => setPendingReviews(0));
  }, [user?.uid]);

  // Ouvir evento de alteração de resumo e re-fetchar o dashboard
  useEffect(() => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    const handleResumoAlterado = async () => {
      try {
        const updatedData = await refreshData(userId);
        setDashboardData(updatedData);
      } catch {
        setDashboardData((prev) => prev);
      }
    };
    window.addEventListener('cinesia:resumo:alterado', handleResumoAlterado);
    return () => window.removeEventListener('cinesia:resumo:alterado', handleResumoAlterado);
  }, [user, refreshData]);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const loadDash = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) { setIsLoading(false); return; }
      try {
        const data = await loadData(userId);
        setDashboardData(data);
      } catch {
        setDashboardData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadDash();
  }, [user]);

  /* ── Event handlers ── */
  const handleOpenEventModal = useCallback((date = new Date()) => {
    setSelectedDateForEvent(date);
    setIsEventModalOpen(true);
  }, []);

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
      toast.error('Não foi possível salvar o evento.');
      throw error;
    }
  };

  const handleDeleteEvento = useCallback((evento) => {
    setConfirmDeleteEvento({ isOpen: true, evento });
  }, []);

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

  const proximosEventos = useMemo(() => {
    const eventos = dashboardData?.proximosEventos || [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return eventos
      .map(e => ({ ...e, dataObj: parseSafeDate(e?.data) }))
      .filter(e => e.dataObj)
      .filter(e => e.dataObj >= hoje)
      .sort((a, b) => a.dataObj - b.dataObj)
      .slice(0, 4);
  }, [dashboardData]);

  /* ── Quick actions with distinct colors ── */
  const quickActions = [
    { Icon: FileText,   label: 'Novo Resumo', path: '/resumos',        onClick: () => navigate('/resumos', { state: { openNew: true } }), color: '#7C3AED', rgb: '124,58,237' },
    { Icon: CreditCard, label: 'Flashcards',  path: '/flashcards',     onClick: () => navigate('/flashcards'), color: '#2563EB', rgb: '37,99,235' },
    { Icon: Target,     label: 'Simulados',   path: '/simulado',       onClick: () => navigate('/simulado'), color: '#059669', rgb: '5,150,105' },
    { Icon: Search,     label: 'Consulta',    path: '/consulta-rapida',onClick: () => navigate('/consulta-rapida'), color: '#D97706', rgb: '217,119,6' },
    { Icon: Layers,     label: 'Atlas 3D',    path: '/atlas-3d',       onClick: () => navigate('/atlas-3d'), color: '#0D9488', rgb: '13,148,136' },
    { Icon: PenLine,    label: 'Quadro',      path: '/quadro-branco',  onClick: () => navigate('/quadro-branco'), color: '#DB2777', rgb: '219,39,119' },
  ];

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <motion.div className="min-h-screen pb-32" initial="hidden" animate="show" variants={staggerContainer}>

      {/* ═══════════════════════════════════════════
         ① HERO HEADER — dark gradient + dot grid + ring avatar
         ═══════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden mx-3 sm:mx-5 mt-2 sm:mt-4 pb-16 sm:pb-20"
        style={{
          borderRadius: '20px',
          backgroundImage: isDarkMode ? [
            'radial-gradient(circle at 70% 30%, rgba(37,99,235,0.20) 0%, transparent 60%)',
            'linear-gradient(135deg, #0f1f3d 0%, #0d2540 35%, #0a3040 65%, #083c3c 100%)',
          ].join(', ') : [
            'radial-gradient(circle at 70% 30%, rgba(37,99,235,0.12) 0%, transparent 60%)',
            'linear-gradient(135deg, #1e3a8a 0%, #1e40af 35%, #0e7490 65%, #0f766e 100%)',
          ].join(', '),
          paddingTop: 'clamp(24px, 4vw, 32px)',
          paddingLeft: 'clamp(24px, 4vw, 32px)',
          paddingRight: 'clamp(24px, 4vw, 32px)',
        }}
      >
        {/* Decorative glow — teal, top-right */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            top: '-80px', 
            right: '-80px', 
            width: '260px', 
            height: '260px', 
            background: isDarkMode ? 'radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(13,148,136,0.35) 0%, transparent 70%)' 
          }} 
        />
        {/* Bright bottom border line */}
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none" 
          style={{ 
            height: '1px', 
            background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.4), rgba(96,165,250,0.3), transparent)' 
          }} 
        />

        {/* Avatar + Greeting row */}
        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Avatar 
              src={user?.photoURL} 
              name={user?.displayName || user?.email} 
              size={64} 
              ring 
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h1
              className="font-display tracking-tight leading-tight truncate"
              style={{
                fontSize: 'clamp(22px, 4.5vw, 30px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
              }}
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
            >
              {greeting.text}, {user?.displayName || user?.email?.split('@')[0] || 'Estudante'}
              {' '}
              <motion.span
                className="inline-flex ml-1 align-middle"
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <greeting.Icon size={26} style={{ color: greeting.color }} />
              </motion.span>
            </motion.h1>

            <motion.p
              className="italic mt-1.5 line-clamp-2 hidden sm:block font-medium"
              style={{ fontSize: '14px', color: isDarkMode ? 'rgba(199,210,254,0.8)' : 'rgba(219,234,254,0.9)' }}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
            >
              &ldquo;{motivational}&rdquo;
            </motion.p>

            {/* Streak badge */}
            <motion.div 
              className="mt-3" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
            >
              <span 
                className="inline-flex items-center gap-2 rounded-full font-bold" 
                style={{ 
                  background: 'rgba(0,0,0,0.25)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#FFFFFF', 
                  padding: '6px 14px', 
                  fontSize: '13px', 
                  backdropFilter: 'blur(4px)' 
                }}
              >
                <motion.span 
                  animate={{ scale: [1, 1.15, 1] }} 
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🔥
                </motion.span>
                <span className="font-mono tabular-nums text-orange-400">
                  {isLoading ? '—' : <AnimatedNumber value={dashboardData?.offensiveStreak || 0} />}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 'normal' }}>
                  {(dashboardData?.offensiveStreak || 0) === 0 ? 'Comece hoje!' : 'dias consecutivos'}
                </span>
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
         ② FLOATING KPIs (Efeito de Sobreposição)
         ═══════════════════════════════════════════ */}
      <div className="relative z-20 max-w-[1280px] mx-auto px-5 sm:px-8 -mt-10 sm:-mt-12">
        <div className="grid grid-cols-3 gap-3 sm:gap-5" role="list">
          <KpiCard 
            variant="materias"  
            value={dashboardData?.totalMaterias || 0} 
            loading={isLoading} 
            navigate={navigate} 
            delay={0.58} 
            isDarkMode={isDarkMode} 
          />
          <KpiCard 
            variant="flashcard" 
            value={dashboardData?.totalFlashcards || 0} 
            loading={isLoading} 
            navigate={navigate} 
            delay={0.64} 
            isDarkMode={isDarkMode} 
          />
          <KpiCard 
            variant="resumos"   
            value={dashboardData?.totalResumos || 0} 
            loading={isLoading} 
            navigate={navigate} 
            delay={0.70} 
            isDarkMode={isDarkMode} 
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
         MAIN GRID (max-w-1280, responsive)
         ═══════════════════════════════════════════ */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-5 mt-8">
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          animate="show" 
          className="flex flex-col gap-6"
        >

          {/* ═══════════════════════════════
              ③ ZONA DE FOCO (Revisão + Agenda)
              ═══════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* ── Revisão de Hoje (SM-2) ── */}
            <div className="lg:col-span-2 flex flex-col justify-center">
              {pendingReviews > 0 ? (
                <motion.div variants={fadeUp} className="h-full">
                  <motion.div
                    className="relative overflow-hidden cursor-pointer h-full flex items-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(234,88,12,0.04) 100%)',
                      border: '1px solid rgba(251,146,60,0.3)',
                      borderRadius: '16px',
                      padding: '24px 28px',
                    }}
                    onClick={() => navigate('/flashcards', { state: { reviewMode: true } })}
                    whileHover={{ y: -2, borderColor: 'rgba(251,146,60,0.6)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-5 w-full">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" 
                        style={{ backgroundColor: '#EA580C15' }}
                      >
                        <BookOpen size={28} style={{ color: '#EA580C' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg" style={{ color: 'var(--text-1)' }}>
                          Sua Revisão Diária
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                          Você tem <span className="font-bold font-mono text-orange-500 text-base">{pendingReviews}</span> flashcards te esperando.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        className="bg-orange-500 hover:bg-orange-600 shrink-0 font-bold px-6 py-3"
                        onClick={(e) => { e.stopPropagation(); navigate('/flashcards', { state: { reviewMode: true } }); }}
                      >
                        Iniciar Revisão
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  variants={fadeUp} 
                  className="h-full"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <div
                    className="flex items-center gap-4 h-full rounded-2xl"
                    style={{
                      padding: '24px 28px',
                      backgroundColor: 'rgba(13,148,136,0.05)',
                      border: '1px dashed rgba(13,148,136,0.3)',
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center" 
                      style={{ backgroundColor: 'rgba(13,148,136,0.1)' }}
                    >
                      <span style={{ fontSize: '20px' }}>✨</span>
                    </div>
                    <div>
                      <span className="text-base font-bold block mb-0.5" style={{ color: 'var(--teal)' }}>
                        Tudo em dia!
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-3)' }}>
                        Você completou todas as revisões programadas para hoje.
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Agenda Compacta ── */}
            <motion.div className="lg:col-span-1" variants={fadeUp}>
              <SectionCard className="p-5 h-full" hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                    <Calendar size={15} style={{ color: 'var(--primary)' }} />
                    Próximos Eventos
                  </h2>
                  <button
                    onClick={() => handleOpenEventModal()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-opacity-80"
                    style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}
                    title="Adicionar Evento"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {proximosEventos.length > 0 ? (
                  <div className="space-y-2.5">
                    {proximosEventos.map((evento, index) => (
                      <motion.div
                        key={evento.id || index}
                        className="group flex items-center gap-3 p-2.5 rounded-xl transition-all"
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border)' }}
                        whileHover={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-strong)' }}
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.3 + index * 0.08 }}
                      >
                        <div 
                          className="shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center" 
                          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                        >
                          <span className="font-mono text-sm font-bold" style={{ color: 'var(--primary)', lineHeight: 1.1 }}>
                            {evento.dataObj.getDate()}
                          </span>
                          <span className="uppercase font-semibold mt-0.5" style={{ fontSize: '9px', color: 'var(--text-4)' }}>
                            {evento.dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                            {evento.titulo || evento.title}
                          </p>
                          {evento.tipo && (
                            <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                              {evento.tipo}
                            </p>
                          )}
                        </div>
                        {evento.id && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteEvento(evento); }} 
                            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0 hover:bg-red-500 hover:bg-opacity-10" 
                            style={{ color: 'var(--accent)' }} 
                            title="Excluir evento"
                          >
                            <Trash2 size={14} />
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
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" 
                      style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    >
                      <CalendarDays size={20} style={{ color: 'var(--text-4)' }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                      Nenhum evento próximo
                    </p>
                    <p className="mt-1" style={{ fontSize: '12px', color: 'var(--text-4)' }}>
                      Clique no + para se organizar
                    </p>
                  </motion.div>
                )}
                
                <div className="mt-4 pt-3 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </SectionCard>
            </motion.div>
          </div>

          {/* ═══════════════════════════════
              ④ FERRAMENTAS (Acesso Rápido Estilo Linear)
              ═══════════════════════════════ */}
          <motion.div variants={fadeUp}>
            <h2 className="font-display text-sm font-bold flex items-center gap-2 mb-3 ml-2" style={{ color: 'var(--text-2)' }}>
              <Zap size={14} /> Acesso Rápido
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {quickActions.map((action, idx) => {
                const isActive = location.pathname === action.path;
                return (
                  <motion.button
                    key={action.label}
                    onClick={action.onClick}
                    className="group flex flex-col items-center justify-center gap-2 rounded-2xl transition-all relative overflow-hidden"
                    style={{
                      padding: '16px 10px',
                      backgroundColor: isActive ? `rgba(${action.rgb}, 0.08)` : 'var(--bg-card)',
                      border: isActive ? `1px solid rgba(${action.rgb}, 0.3)` : '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                    whileHover={{
                      backgroundColor: `rgba(${action.rgb}, 0.04)`,
                      borderColor: `rgba(${action.rgb}, 0.3)`,
                      y: -2,
                    }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                  >
                    <action.Icon 
                      size={20} 
                      style={{ color: isActive ? action.color : 'var(--text-3)' }} 
                      className="group-hover:text-[color:var(--hover-color)] transition-colors" 
                    />
                    <style>{`.group:hover .group-hover\\:text-\\[color\\:var\\(--hover-color\\)\\] { color: ${action.color} !important; }`}</style>
                    <span 
                      className="font-semibold" 
                      style={{ fontSize: '12px', color: isActive ? 'var(--text-1)' : 'var(--text-2)' }}
                    >
                      {action.label}
                    </span>
                    
                    {/* Mantido o código original do badge caso adicione futuramente */}
                    {action.badge && (
                      <span
                        className="absolute font-extrabold uppercase"
                        style={{
                          top: '8px',
                          right: '8px',
                          fontSize: '8px',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          backgroundColor: '#7C3AED',
                          color: 'white',
                          letterSpacing: '0.05em',
                          lineHeight: 1.4,
                        }}
                      >
                        {action.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ═══════════════════════════════
              ⑤ PROGRESSO GERAL
              ═══════════════════════════════ */}
          <motion.div variants={fadeUp}>
            {isLoading ? (
              <SkeletonPulse className="h-48" />
            ) : (
              <SectionCard className="overflow-hidden" hover={false}>
                {/* Header with divider */}
                <div 
                  className="flex items-center justify-between px-5 py-4" 
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h2 className="font-display text-[13px] font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                    <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
                    Progresso Geral
                  </h2>
                  <button 
                    onClick={() => navigate('/materias')} 
                    className="group flex items-center gap-1 text-xs font-medium transition-colors" 
                    style={{ color: 'var(--primary)' }}
                  >
                    Ver todas
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Total bar with shimmer */}
                <div className="mx-5 mt-3">
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                    <span className="font-bold font-mono" style={{ color: 'var(--text-1)' }}>
                      {dashboardData?.concluidas || 0}
                    </span>
                    <span style={{ color: 'var(--text-3)' }}>
                      {' / '}{dashboardData?.totalMaterias || 0} matérias concluídas
                    </span>
                  </p>
                  <div 
                    className="relative mt-2 mb-4 overflow-hidden" 
                    style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)' }}
                  >
                    <motion.div
                      className="h-full relative overflow-hidden"
                      style={{ background: 'linear-gradient(90deg, var(--primary), var(--teal))', borderRadius: '3px' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div 
                        className="absolute inset-0" 
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s ease infinite' }} 
                      />
                    </motion.div>
                    <span 
                      className="absolute right-1 top-1/2 -translate-y-1/2 font-mono font-bold" 
                      style={{ fontSize: '10px', color: 'var(--text-3)' }}
                    >
                      {progressPercent}%
                    </span>
                  </div>
                </div>

                {/* Subject rows with left color bar */}
                {dashboardData?.materiasRecentes?.length > 0 ? (
                  <div>
                    {dashboardData.materiasRecentes.slice(0, 5).map((materia, idx) => (
                      <motion.div
                        key={materia.id || idx}
                        className="flex items-center gap-3 px-5 py-2.5 transition-colors cursor-pointer"
                        style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                        onClick={() => navigate('/materias')}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        initial={{ opacity: 0, x: -15 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.07 }}
                      >
                        {/* Subject icon */}
                        <div 
                          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-sm shrink-0"
                          style={{ 
                            backgroundColor: `${materia.cor || '#2563EB'}18`, 
                            color: materia.cor || 'var(--primary)', 
                            borderLeft: `3px solid ${materia.cor || 'var(--primary)'}` 
                          }}
                        >
                          {materia.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                            {materia.nome}
                          </h3>
                          {materia.descricao && (
                            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                              {materia.descricao}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                            <span>{materia.totalFlashcards || 0} cards</span>
                            <span>·</span>
                            <span>{materia.totalResumos || 0} resumos</span>
                          </div>
                        </div>
                        {/* Progress pill — only show if real data exists */}
                        {materia.progresso != null && (
                          <div 
                            className="hidden sm:block shrink-0" 
                            style={{ width: '48px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--bg-elevated)', overflow: 'hidden' }}
                          >
                            <motion.div 
                              className="h-full" 
                              style={{ backgroundColor: materia.cor || 'var(--primary)', borderRadius: '2px' }} 
                              initial={{ width: 0 }} 
                              animate={{ width: `${Math.min(materia.progresso, 100)}%` }} 
                              transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }} 
                            />
                          </div>
                        )}
                        <ChevronRight size={16} className="shrink-0 ml-2" style={{ color: 'var(--text-4)' }} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-center py-10 px-5"
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" 
                      style={{ backgroundColor: 'var(--primary-bg)' }}
                    >
                      <Bookmark size={28} style={{ color: 'var(--text-4)' }} />
                    </div>
                    <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--text-1)' }}>
                      Nenhuma matéria criada
                    </h3>
                    <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: 'var(--text-3)' }}>
                      Crie sua primeira matéria para organizar seus estudos
                    </p>
                    <Button 
                      variant="primary" 
                      leftIcon={<Plus size={16} />} 
                      onClick={() => navigate('/materias')}
                    >
                      Criar Matéria
                    </Button>
                  </motion.div>
                )}
              </SectionCard>
            )}
          </motion.div>

          {/* ═══════════════════════════════
              ⑥ ESTE MÊS + META MENSAL
              ═══════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* ── Este Mês — dados reais (Restaurados os Cards e o Gráfico de 7 Dias) ── */}
            <motion.div className="lg:col-span-2" variants={fadeUp}>
              <SectionCard className="p-5 h-full flex flex-col" hover={false}>
                <h2 className="font-display text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-1)' }}>
                  <TrendingUp size={15} style={{ color: 'var(--teal)' }} />
                  Este Mês
                  <span className="text-xs font-normal ml-auto" style={{ color: 'var(--text-4)' }}>
                    {dashboardData?.metaMensal?.mesNome || new Date().toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                  </span>
                </h2>

                {/* Stat cards row (Restaurado) */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Resumos */}
                  <motion.div
                    className="rounded-2xl p-4 flex flex-col justify-between"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.35 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" 
                        style={{ backgroundColor: 'var(--primary-bg)' }}
                      >
                        <FileText size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                        Resumos
                      </span>
                    </div>
                    <p className="font-mono font-bold" style={{ fontSize: '34px', color: 'var(--text-1)', lineHeight: 1 }}>
                      {isLoading ? '—' : (dashboardData?.metaMensal?.resumosDoMes || 0) === 0
                        ? <button onClick={() => navigate('/resumos')} className="text-xs underline font-sans font-normal" style={{ color: 'var(--text-4)' }}>Criar primeiro →</button>
                        : <><span style={{ color: 'var(--teal)', fontWeight: 700 }}>+</span><AnimatedNumber value={dashboardData?.metaMensal?.resumosDoMes || 0} /></>}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>
                      este mês · {dashboardData?.totalResumos || 0} no total
                    </p>
                  </motion.div>

                  {/* Flashcards */}
                  <motion.div
                    className="rounded-2xl p-4 flex flex-col justify-between"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.45 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" 
                        style={{ backgroundColor: 'var(--teal-bg)' }}
                      >
                        <CreditCard size={14} style={{ color: 'var(--teal)' }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                        Flashcards
                      </span>
                    </div>
                    <p className="font-mono font-bold" style={{ fontSize: '34px', color: 'var(--text-1)', lineHeight: 1 }}>
                      {isLoading ? '—' : (dashboardData?.metaMensal?.flashcardsDoMes || 0) === 0
                        ? <button onClick={() => navigate('/flashcards')} className="text-xs underline font-sans font-normal" style={{ color: 'var(--text-4)' }}>Criar primeiro →</button>
                        : <><span style={{ color: 'var(--teal)', fontWeight: 700 }}>+</span><AnimatedNumber value={dashboardData?.metaMensal?.flashcardsDoMes || 0} /></>}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>
                      este mês · {dashboardData?.totalFlashcards || 0} no total
                    </p>
                  </motion.div>
                </div>

                {/* Streak — últimos 7 dias (Restaurado e Adaptado) */}
                <motion.div
                  className="rounded-2xl p-4 mt-auto"
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.55 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={14} style={{ color: 'var(--accent)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                        Sequência de acesso
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm" style={{ color: 'var(--accent)' }}>
                      {isLoading ? '—' : `${dashboardData?.offensiveStreak || 0} dias`}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const today = new Date();
                      const dayDate = new Date(today);
                      dayDate.setDate(today.getDate() - (6 - i));
                      const dateStr = dayDate.toISOString().split('T')[0];
                      const history = dashboardData?.streakHistory || [];
                      // streakHistory items are { date: Timestamp, streak, event }
                      const active = history.some(d => {
                        try {
                          const raw = d?.date ?? d; // support both object format and raw date
                          const parsed = raw?.toDate?.() || (raw ? new Date(raw) : null);
                          if (!parsed || isNaN(parsed.getTime())) return false;
                          return parsed.toISOString().split('T')[0] === dateStr;
                        } catch { 
                          return false; 
                        }
                      });
                      const isToday = i === 6;
                      
                      return (
                        <div 
                          key={i} 
                          className="flex-1 flex flex-col items-center gap-1"
                          title={dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                        >
                          <div
                            className="w-full rounded-lg"
                            style={{
                              height: '28px',
                              backgroundColor: active ? 'var(--primary)' : 'var(--border)',
                              border: isToday && !active ? '1.5px solid var(--border-strong)' : 'none',
                              opacity: active ? 1 : isToday ? 0.7 : 0.35,
                            }}
                          />
                          <span style={{ fontSize: '9px', color: 'var(--text-4)', userSelect: 'none' }}>
                            {dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </SectionCard>
            </motion.div>

            {/* ── Meta Mensal — gradient card + circular SVG + Lógicas Omitidas (Restaurado) ── */}
            <motion.div className="lg:col-span-1" variants={fadeUp}>
              <div 
                className="relative overflow-hidden h-full flex flex-col" 
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)', 
                  borderRadius: '16px', 
                  padding: '24px',
                }}
              >
                {/* Decorative */}
                <div 
                  className="absolute pointer-events-none" 
                  style={{ right: '16px', top: '16px', opacity: 0.12 }}
                >
                  <Target size={40} style={{ color: 'var(--text-1)' }} />
                </div>

                <h2 
                  className="font-display text-sm font-bold flex items-center gap-2 mb-4 relative z-10" 
                  style={{ color: 'var(--text-1)' }}
                >
                  <Target size={16} style={{ color: 'var(--primary)' }} />
                  Meta de {dashboardData?.metaMensal?.mesNome || new Date().toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                  <button
                    onClick={() => { setMetaValue(dashboardData?.metaMensal?.meta || 50); setEditingMeta(true); }}
                    className="ml-1 p-1 rounded-md transition-colors hover:bg-gray-500 hover:bg-opacity-10"
                    style={{ color: 'var(--text-4)' }}
                    title="Editar meta"
                  >
                    <Pencil size={12} />
                  </button>
                </h2>

                {editingMeta && (
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={metaValue}
                      onChange={(e) => setMetaValue(Math.max(1, Math.min(500, Number(e.target.value))))}
                      className="w-20 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-center"
                      style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') { persistMetaMensal(metaValue); setEditingMeta(false); } }}
                    />
                    <button
                      onClick={() => { persistMetaMensal(metaValue); setEditingMeta(false); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
                    >
                      OK
                    </button>
                  </div>
                )}

                <div className="flex justify-center mt-2 mb-4 relative z-10">
                  <CircularProgress
                    current={dashboardData?.metaMensal?.atual || 0}
                    total={editingMeta ? metaValue : (dashboardData?.metaMensal?.meta || 50)}
                    size={110}
                    showStartMessage={(dashboardData?.metaMensal?.atual || 0) === 0 && !hasSavedMeta}
                  />
                </div>

                <p 
                  className="text-center text-xs mb-1 font-medium relative z-10" 
                  style={{ color: 'var(--text-3)' }}
                >
                  resumos + flashcards criados
                </p>

                {/* Tip card (Restaurado) */}
                <div 
                  className="mt-4 p-3 rounded-xl relative z-10" 
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {(dashboardData?.offensiveStreak || 0) > 0 ? (
                      <>
                        💡 Você está em uma sequência de <span style={{ color: 'var(--accent)' }}>🔥 {dashboardData.offensiveStreak} dias</span>! Continue estudando hoje.
                      </>
                    ) : (
                      <>
                        💡 Crie um hábito diário. Estude pelo menos <strong style={{ color: 'var(--text-1)' }}>15 minutos</strong> para começar sua sequência!
                      </>
                    )}
                  </p>
                </div>

                {/* Bottom progress bar (Restaurado) */}
                <div className="mt-auto pt-4 relative z-10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>
                      {dashboardData?.metaMensal?.atual || 0}/{editingMeta ? metaValue : (dashboardData?.metaMensal?.meta || 50)}
                    </span>
                    <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-4)' }}>
                      {dashboardData?.metaMensal?.porcentagem || 0}% do mês
                    </span>
                  </div>
                  <div 
                    className="overflow-hidden" 
                    style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)' }}
                  >
                    <motion.div
                      className="h-full relative overflow-hidden"
                      style={{ background: 'linear-gradient(90deg, var(--primary), var(--teal))', borderRadius: '3px' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${dashboardData?.metaMensal?.porcentagem || 0}%` }}
                      transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                    >
                      <div 
                        className="absolute inset-0" 
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s ease infinite' }} 
                      />
                    </motion.div>
                  </div>
                </div>
                
              </div>
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
            <span className="font-semibold" style={{ color: 'var(--text-1)' }}>
              "{confirmDeleteEvento.evento?.titulo || confirmDeleteEvento.evento?.title}"
            </span>
            ?<br />
            <span className="font-medium" style={{ color: 'var(--accent)' }}>
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