/**
 * HOME — Cinesia
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
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import { salvarEvento, deletarEvento, listarFlashcards, atualizarMetaMensal } from '../services/firebaseService';
import { isDueForReview } from '../utils/sm2';
import { useTheme } from '../contexts/ThemeContext';
import AddEventModal from '../components/modals/AddEventModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import SkeletonPulse from '../components/ui/SkeletonPulse';

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
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-inner"
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
            className="rounded-full object-cover shrink-0 shadow-sm"
            style={{ width: size, height: size }}
            onError={() => setError(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size + 8, height: size + 8 }}>
      <div
        className="absolute inset-0 rounded-full opacity-80"
        style={{
          background: 'conic-gradient(from 0deg, #2563EB, #0D9488, #34D399, #2563EB)',
          animation: 'spin-ring 4s linear infinite',
        }}
      />
      <div className="absolute rounded-full" style={{ inset: '2px', background: 'var(--bg-app)' }} />
      <div className="absolute" style={{ inset: '4px' }}>
        {(error || !src) ? (
          <div
            className="rounded-full flex items-center justify-center text-white font-bold w-full h-full shadow-inner"
            style={{ backgroundColor: bgColor, fontSize: size * 0.35 }}
          >{initials}</div>
        ) : (
          <img
            src={src} alt={name || ''}
            className="rounded-full object-cover w-full h-full shadow-inner"
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
      className="relative overflow-hidden cursor-pointer group"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px', // Mais arredondado (Premium)
        padding: '20px 16px', // Mais respiro
        boxShadow: isDarkMode 
          ? '0 8px 32px rgba(0,0,0,0.4)' 
          : '0 8px 32px rgba(37,99,235,0.08)',
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -4,
        borderColor: color,
        boxShadow: `0 12px 40px ${color}25`,
      }}
      whileTap={{ y: 0, scale: 0.98 }}
    >
      {/* Top color line (Soft glow) */}
      <div 
        className="absolute pointer-events-none transition-opacity duration-300 opacity-80 group-hover:opacity-100" 
        style={{ top: 0, left: '20px', right: '20px', height: '3px', borderRadius: '0 0 6px 6px', background: color, filter: 'blur(1px)' }} 
      />
      <div 
        className="absolute pointer-events-none" 
        style={{ top: 0, left: '20px', right: '20px', height: '3px', borderRadius: '0 0 6px 6px', background: color }} 
      />

      {/* Icon + label row */}
      <div className="flex items-center gap-2.5 mb-3 mt-1">
        <div className="p-1.5 rounded-lg transition-colors duration-300" style={{ backgroundColor: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span 
          className="uppercase font-extrabold tracking-widest" 
          style={{ fontSize: '10px', color: 'var(--text-3)' }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      {loading ? (
        <div 
          className="animate-pulse rounded-md mt-1" 
          style={{ height: '36px', width: '60%', backgroundColor: 'var(--bg-elevated)' }} 
        />
      ) : (
        <AnimatedNumber
          value={value}
          duration={1.5}
          className="mt-1 block"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: 'clamp(28px, 4vw, 36px)',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: 'var(--text-1)'
          }}
        />
      )}

      {/* Sub-label */}
      <span className="font-medium" style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '6px', display: 'block', lineHeight: 1 }}>
        {sublabel}
      </span>
    </motion.div>
  );
});
KpiCard.displayName = 'KpiCard';

/* ═══════════════════════════════════════════
   CIRCULAR PROGRESS (SVG) for Meta Mensal
   ═══════════════════════════════════════════ */
const CircularProgress = memo(({ current = 0, total = 50, size = 100, showStartMessage = false }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {/* Background Track */}
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        {/* Glow Layer */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#cpGradHome)"
          strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          style={{ filter: 'blur(4px)', opacity: 0.5 }}
        />
        {/* Main Progress */}
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
          <span className="font-display font-bold" style={{ fontSize: '14px', color: 'var(--primary)', lineHeight: 1.2, textAlign: 'center' }}>Comece!</span>
        ) : (
          <>
            <span className="font-mono font-black" style={{ fontSize: '24px', color: 'var(--text-1)', lineHeight: 1 }}>
              <AnimatedNumber value={current} duration={1.5} />
            </span>
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: '9px', color: 'var(--text-4)', marginTop: '4px' }}>de {total}</span>
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
        borderRadius: '24px', // Mais arredondado
        boxShadow: isDarkMode
          ? '0 4px 20px rgba(0,0,0,0.2)'
          : '0 4px 24px rgba(37,99,235,0.04)',
      }}
      onClick={onClick}
      whileHover={hover && onClick ? { y: -2, borderColor: 'var(--border-strong)', boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(37,99,235,0.08)' } : undefined}
    >
      {children}
    </motion.div>
  );
});
SectionCard.displayName = 'SectionCard';


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
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const location = useLocation();

  const persistMetaMensal = useCallback((value) => {
    const userId = user?.id || user?.uid;
    if (!userId) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSavingMeta(true);
    
    // Chamada ao Firebase para persistir a meta
    atualizarMetaMensal(userId, value)
      .then((result) => {
        const safe = result.metaSalva;
        // Salva também no localStorage como fallback
        try {
          localStorage.setItem('cinesia:meta:mensal', String(safe));
          setHasSavedMeta(true);
        } catch {
          setHasSavedMeta(false);
        }
        setMetaValue(safe);
        toast.success('📈 Meta mensal salva com sucesso!');
        
        // Recarrega o dashboard para refletir a nova meta
        refreshData(userId)
          .then(updatedData => {
            setDashboardData(updatedData);
          })
          .catch(err => {
            console.error('Erro ao recarregar dashboard:', err);
          });
      })
      .catch((error) => {
        console.error('Erro ao salvar meta:', error);
        toast.error('❌ Não foi possível salvar a meta. Tente novamente.');
      })
      .finally(() => {
        setIsSavingMeta(false);
      });
  }, [user, refreshData]);

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
        
        // Sincroniza a meta do Firebase com o estado local
        if (data?.metaMensal?.meta) {
          setMetaValue(data.metaMensal.meta);
          setHasSavedMeta(true);
        }
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
    { Icon: Target,     label: 'Simulados',   path: '/simulados',      onClick: () => navigate('/simulados'), color: '#059669', rgb: '5,150,105' },
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
        className="relative overflow-hidden mx-3 sm:mx-5 mt-2 sm:mt-4 pb-16 sm:pb-24 shadow-xl"
        style={{
          borderRadius: '28px', // Premium rounding
          backgroundImage: isDarkMode ? [
            'radial-gradient(circle at 70% 30%, rgba(37,99,235,0.20) 0%, transparent 60%)',
            'linear-gradient(135deg, #0f1f3d 0%, #0d2540 35%, #0a3040 65%, #083c3c 100%)',
          ].join(', ') : [
            'radial-gradient(circle at 70% 30%, rgba(37,99,235,0.12) 0%, transparent 60%)',
            'linear-gradient(135deg, #1e3a8a 0%, #1e40af 35%, #0e7490 65%, #0f766e 100%)',
          ].join(', '),
          paddingTop: 'clamp(28px, 5vw, 40px)',
          paddingLeft: 'clamp(24px, 5vw, 40px)',
          paddingRight: 'clamp(24px, 5vw, 40px)',
        }}
      >
        {/* Decorative glow — teal, top-right */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            top: '-80px', 
            right: '-80px', 
            width: '300px', 
            height: '300px', 
            background: isDarkMode ? 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(13,148,136,0.4) 0%, transparent 70%)',
            filter: 'blur(20px)'
          }} 
        />
        {/* Bright bottom border line */}
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none" 
          style={{ 
            height: '2px', 
            background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.5), rgba(96,165,250,0.4), transparent)' 
          }} 
        />

        {/* Avatar + Greeting row (Ajustado gap para evitar cortes no mobile) */}
        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
          >
            <Avatar 
              src={user?.photoURL} 
              name={user?.displayName || user?.email} 
              size={68} 
              ring 
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* Título com text-wrap ajustado para não cortar nomes no mobile */}
            <motion.h1
              className="font-display tracking-tight leading-tight break-words"
              style={{
                fontSize: 'clamp(20px, 5vw, 32px)', // Limite inferior reduzido para evitar transbordo excessivo
                fontWeight: 900,
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
                animate={{ rotate: [0, 15, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5 }}
              >
                <greeting.Icon size={28} style={{ color: greeting.color, filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.3))' }} />
              </motion.span>
            </motion.h1>

            <motion.p
              className="italic mt-1.5 line-clamp-2 hidden sm:block font-medium"
              style={{ fontSize: '15px', color: isDarkMode ? 'rgba(199,210,254,0.85)' : 'rgba(219,234,254,0.95)' }}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.3 }}
            >
              &ldquo;{motivational}&rdquo;
            </motion.p>

            {/* Streak badge Premium */}
            <motion.div 
              className="mt-3 sm:mt-4" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
            >
              <div 
                className="inline-flex items-center gap-2 rounded-full font-bold shadow-lg" 
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.15)', 
                  color: '#FFFFFF', 
                  padding: '6px 16px', 
                  fontSize: '13px', 
                  backdropFilter: 'blur(8px)' 
                }}
              >
                <motion.span 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🔥
                </motion.span>
                <span className="font-mono tabular-nums text-orange-400 text-sm">
                  {isLoading ? '—' : <AnimatedNumber value={dashboardData?.offensiveStreak || 0} />}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 'normal' }}>
                  {(dashboardData?.offensiveStreak || 0) === 0 ? 'Comece hoje!' : 'dias consecutivos'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
         ② FLOATING KPIs (Efeito de Sobreposição)
         ═══════════════════════════════════════════ */}
      <div className="relative z-20 max-w-[1280px] mx-auto px-5 sm:px-8 -mt-12 sm:-mt-16">
        <div className="grid grid-cols-3 gap-4 sm:gap-6" role="list">
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
      <div className="max-w-[1280px] mx-auto px-3 sm:px-5 mt-10">
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          animate="show" 
          className="flex flex-col gap-8"
        >

          {/* ═══════════════════════════════
             ③ ZONA DE FOCO (Revisão + Agenda)
             ═══════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* ── Revisão de Hoje (SM-2) ── */}
            <div className="lg:col-span-2 flex flex-col justify-center">
              {isLoading ? (
                <SkeletonPulse className="h-full min-h-[140px]" />
              ) : pendingReviews > 0 ? (
                <motion.div variants={fadeUp} className="h-full">
                  <motion.div
                    className="relative overflow-hidden cursor-pointer h-full flex items-center shadow-md"
                    style={{
                      background: isDarkMode ? 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(234,88,12,0.05) 100%)' : 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(234,88,12,0.02) 100%)',
                      border: '1px solid rgba(251,146,60,0.3)',
                      borderRadius: '24px',
                      padding: '24px 32px',
                    }}
                    onClick={() => navigate('/flashcards', { state: { reviewMode: true } })}
                    whileHover={{ y: -2, borderColor: 'rgba(251,146,60,0.6)', boxShadow: '0 10px 30px rgba(251,146,60,0.15)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-5 w-full">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-orange-500/20" 
                        style={{ backgroundColor: '#EA580C15' }}
                      >
                        <BookOpen size={32} style={{ color: '#EA580C' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-xl tracking-tight" style={{ color: 'var(--text-1)' }}>
                          Sua Revisão Diária
                        </h3>
                        <p className="text-[15px] mt-1 font-medium" style={{ color: 'var(--text-3)' }}>
                          Você tem <span className="font-black font-mono text-orange-500 text-lg mx-1">{pendingReviews}</span> flashcards te esperando.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        className="bg-orange-500 hover:bg-orange-600 shrink-0 font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/30 text-[15px]"
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
                    className="flex items-center gap-5 h-full rounded-[24px]"
                    style={{
                      padding: '24px 32px',
                      backgroundColor: isDarkMode ? 'rgba(13,148,136,0.05)' : 'rgba(13,148,136,0.03)',
                      border: '1px dashed rgba(13,148,136,0.3)',
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border border-teal-500/20" 
                      style={{ backgroundColor: 'rgba(13,148,136,0.1)' }}
                    >
                      <Sparkles size={28} style={{ color: 'var(--teal)' }} />
                    </div>
                    <div>
                      <span className="text-lg font-extrabold block mb-1 tracking-tight" style={{ color: 'var(--teal)' }}>
                        Tudo em dia!
                      </span>
                      <span className="text-[15px] font-medium" style={{ color: 'var(--text-3)' }}>
                        Você completou todas as revisões programadas para hoje.
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Agenda Compacta ── */}
            <motion.div className="lg:col-span-1" variants={fadeUp}>
              <SectionCard className="p-6 h-full flex flex-col" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-[15px] font-bold flex items-center gap-2.5 uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--primary-bg)' }}>
                      <Calendar size={16} style={{ color: 'var(--primary)' }} strokeWidth={2.5} />
                    </div>
                    Próximos Eventos
                  </h2>
                  <button
                    onClick={() => handleOpenEventModal()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: 'var(--primary)', color: 'white', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}
                    title="Adicionar Evento"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>

                <div className="flex-1">
                  {isLoading ? (
                    <div className="space-y-3">
                      <SkeletonPulse className="h-12 w-full" />
                      <SkeletonPulse className="h-12 w-full" />
                    </div>
                  ) : proximosEventos.length > 0 ? (
                    <div className="space-y-3">
                      {proximosEventos.map((evento, index) => (
                        <motion.div
                          key={evento.id || index}
                          className="group flex items-center gap-3.5 p-3 rounded-[16px] transition-all"
                          style={{ backgroundColor: 'transparent', border: '1px solid var(--border)' }}
                          whileHover={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-strong)', x: 4 }}
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: 0.3 + index * 0.08 }}
                        >
                          <div 
                            className="shrink-0 w-12 h-12 rounded-[12px] flex flex-col items-center justify-center border border-blue-500/20" 
                            style={{ backgroundColor: 'var(--primary-bg)' }}
                          >
                            <span className="font-mono text-[16px] font-black" style={{ color: 'var(--primary)', lineHeight: 1 }}>
                              {evento.dataObj.getDate()}
                            </span>
                            <span className="uppercase font-bold mt-0.5" style={{ fontSize: '9px', color: 'var(--primary)', opacity: 0.8, letterSpacing: '0.05em' }}>
                              {evento.dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[14px] font-bold truncate tracking-tight" style={{ color: 'var(--text-1)' }}>
                              {evento.titulo || evento.title}
                            </p>
                            {evento.tipo && (
                              <p className="font-medium mt-0.5" style={{ fontSize: '11px', color: 'var(--text-4)' }}>
                                {evento.tipo}
                              </p>
                            )}
                          </div>
                          {evento.id && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvento(evento); }} 
                              className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shrink-0 hover:bg-red-500 hover:bg-opacity-10 hover:text-red-500" 
                              style={{ color: 'var(--text-4)' }} 
                              title="Excluir evento"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="text-center py-6 h-full flex flex-col items-center justify-center" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.3 }}
                    >
                      <div 
                        className="w-14 h-14 rounded-[16px] flex items-center justify-center mx-auto mb-4 border border-dashed" 
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-strong)' }}
                      >
                        <CalendarDays size={24} style={{ color: 'var(--text-4)' }} />
                      </div>
                      <p className="text-[15px] font-bold mb-1" style={{ color: 'var(--text-2)' }}>
                        Nenhum evento
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
                        Organize suas provas e trabalhos.
                      </p>
                    </motion.div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="font-semibold uppercase tracking-widest" style={{ fontSize: '10px', color: 'var(--text-4)' }}>
                    Hoje é {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </SectionCard>
            </motion.div>
          </div>

          {/* ═══════════════════════════════
             ④ FERRAMENTAS (Acesso Rápido Estilo Linear)
             ═══════════════════════════════ */}
          <motion.div variants={fadeUp}>
            <h2 className="font-display text-[15px] font-bold flex items-center gap-2.5 mb-4 ml-2 uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
              <Zap size={16} className="text-amber-500" /> Acesso Rápido
            </h2>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {quickActions.map((action, idx) => {
                const isActive = location.pathname === action.path;
                return (
                  <motion.button
                    key={action.label}
                    onClick={action.onClick}
                    className="group flex flex-col items-center justify-center gap-3 rounded-[20px] transition-all relative overflow-hidden"
                    style={{
                      padding: '20px 10px',
                      backgroundColor: isActive ? `rgba(${action.rgb}, 0.08)` : 'var(--bg-card)',
                      border: isActive ? `1px solid rgba(${action.rgb}, 0.3)` : '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                    whileHover={{
                      backgroundColor: `rgba(${action.rgb}, 0.04)`,
                      borderColor: `rgba(${action.rgb}, 0.3)`,
                      y: -2,
                      boxShadow: `0 10px 20px rgba(${action.rgb}, 0.1)`
                    }}
                    whileTap={{ scale: 0.96 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                  >
                    {/* Glow de fundo no hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                      style={{ background: `radial-gradient(circle at 50% 0%, rgba(${action.rgb}, 0.1) 0%, transparent 70%)` }} 
                    />
                    
                    <action.Icon 
                      size={24} 
                      style={{ color: isActive ? action.color : 'var(--text-3)' }} 
                      className="group-hover:scale-110 transition-transform duration-300 relative z-10" 
                    />
                    {/* Forçar cor no hover via estilo injetado */}
                    <style>{`.group:hover .group-hover\\:scale-110 { color: ${action.color} !important; }`}</style>
                    
                    <span 
                      className="font-bold relative z-10" 
                      style={{ fontSize: '13px', color: isActive ? 'var(--text-1)' : 'var(--text-2)' }}
                    >
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ═══════════════════════════════
             ⑤ PROGRESSO GERAL E ESTE MÊS
             ═══════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Progresso e Matérias Recentes ── */}
            <motion.div variants={fadeUp} className="flex flex-col">
              {isLoading ? (
                <SkeletonPulse className="h-full min-h-[300px]" />
              ) : (
                <SectionCard className="overflow-hidden h-full flex flex-col" hover={false}>
                  {/* Header */}
                  <div 
                    className="flex items-center justify-between px-6 py-5 shrink-0" 
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <h2 className="font-display text-[14px] font-bold flex items-center gap-2 uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
                      <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                      Progresso
                    </h2>
                    <button 
                      onClick={() => navigate('/materias')} 
                      className="group flex items-center gap-1 text-[13px] font-bold transition-colors px-2.5 py-1 rounded-md hover:bg-blue-500 hover:bg-opacity-10" 
                      style={{ color: 'var(--primary)' }}
                    >
                      Ver todas
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Total bar */}
                  <div className="px-6 pt-5 pb-2 shrink-0">
                    <p className="text-[14px] font-medium flex items-baseline gap-1.5" style={{ color: 'var(--text-2)' }}>
                      <span className="font-black font-mono text-2xl tracking-tighter" style={{ color: 'var(--text-1)' }}>
                        {dashboardData?.concluidas || 0}
                      </span>
                      <span style={{ color: 'var(--text-4)' }}>
                        / {dashboardData?.totalMaterias || 0} matérias
                      </span>
                    </p>
                    <div 
                      className="relative mt-3 mb-2 overflow-hidden" 
                      style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated)' }}
                    >
                      <motion.div
                        className="h-full relative overflow-hidden"
                        style={{ background: 'linear-gradient(90deg, var(--primary), var(--teal))', borderRadius: '4px' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <div 
                          className="absolute inset-0" 
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s ease infinite' }} 
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Subject rows */}
                  <div className="flex-1 overflow-y-auto mt-2">
                    {dashboardData?.materiasRecentes?.length > 0 ? (
                      <div className="px-2 pb-2">
                        {dashboardData.materiasRecentes.slice(0, 4).map((materia, idx) => (
                          <motion.div
                            key={materia.id || idx}
                            className="flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors cursor-pointer group"
                            onClick={() => navigate('/materias')}
                            whileHover={{ backgroundColor: 'var(--bg-elevated)' }}
                            initial={{ opacity: 0, x: -15 }} 
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.07 }}
                          >
                            <div 
                              className="w-12 h-12 rounded-[14px] flex items-center justify-center font-bold text-[16px] shrink-0 border shadow-sm transition-transform group-hover:scale-105"
                              style={{ 
                                backgroundColor: `${materia.cor || '#2563EB'}15`, 
                                color: materia.cor || 'var(--primary)', 
                                borderColor: `${materia.cor || '#2563EB'}30` 
                              }}
                            >
                              {materia.nome?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <h3 className="font-extrabold text-[15px] truncate tracking-tight" style={{ color: 'var(--text-1)' }}>
                                {materia.nome}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 font-semibold uppercase tracking-wider" style={{ fontSize: '10px', color: 'var(--text-4)' }}>
                                <span>{materia.totalFlashcards || 0} cards</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span>{materia.totalResumos || 0} resumos</span>
                              </div>
                            </div>
                            {/* Progress bar minificada */}
                            {materia.progresso != null && (
                              <div 
                                className="hidden sm:block shrink-0" 
                                style={{ width: '50px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-elevated)', overflow: 'hidden' }}
                              >
                                <motion.div 
                                  className="h-full" 
                                  style={{ backgroundColor: materia.cor || 'var(--primary)', borderRadius: '3px' }} 
                                  initial={{ width: 0 }} 
                                  animate={{ width: `${Math.min(materia.progresso, 100)}%` }} 
                                  transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }} 
                                />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center px-6 pb-6 text-center">
                        <Bookmark size={32} style={{ color: 'var(--text-4)', marginBottom: '12px', opacity: 0.5 }} />
                        <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--text-2)' }}>Nenhuma matéria criada</p>
                        <p className="text-[13px] font-medium" style={{ color: 'var(--text-4)' }}>Crie sua primeira matéria para ver o progresso aqui.</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}
            </motion.div>

            {/* ── Este Mês + Meta ── */}
            <motion.div className="lg:col-span-2" variants={fadeUp}>
              {isLoading ? (
                <SkeletonPulse className="h-full min-h-[300px]" />
              ) : (
                <SectionCard className="p-6 sm:p-8 h-full flex flex-col" hover={false}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="font-display text-[14px] font-bold flex items-center gap-2 uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--teal-bg)' }}>
                        <TrendingUp size={16} style={{ color: 'var(--teal)' }} strokeWidth={2.5} />
                      </div>
                      Produção Mensal
                    </h2>
                    <span className="inline-flex px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                      {dashboardData?.metaMensal?.mesNome || new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                    
                    {/* Coluna Esquerda: Cards de Resumo e Flashcard */}
                    <div className="flex flex-col gap-4 justify-center">
                      <div
                        className="rounded-[20px] p-5 flex flex-col justify-center relative overflow-hidden group"
                        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 border border-blue-500/20" style={{ backgroundColor: 'var(--primary-bg)' }}>
                            <FileText size={18} style={{ color: 'var(--primary)' }} />
                          </div>
                          <span className="text-[13px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Resumos</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="font-mono font-black tracking-tighter" style={{ fontSize: '42px', color: 'var(--text-1)', lineHeight: 1 }}>
                            {(dashboardData?.metaMensal?.resumosDoMes || 0) === 0 ? '0' : <AnimatedNumber value={dashboardData?.metaMensal?.resumosDoMes || 0} />}
                          </p>
                          <span className="text-[13px] font-medium" style={{ color: 'var(--text-4)' }}>criados</span>
                        </div>
                      </div>

                      <div
                        className="rounded-[20px] p-5 flex flex-col justify-center relative overflow-hidden group"
                        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 border border-teal-500/20" style={{ backgroundColor: 'var(--teal-bg)' }}>
                            <CreditCard size={18} style={{ color: 'var(--teal)' }} />
                          </div>
                          <span className="text-[13px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Flashcards</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="font-mono font-black tracking-tighter" style={{ fontSize: '42px', color: 'var(--text-1)', lineHeight: 1 }}>
                            {(dashboardData?.metaMensal?.flashcardsDoMes || 0) === 0 ? '0' : <AnimatedNumber value={dashboardData?.metaMensal?.flashcardsDoMes || 0} />}
                          </p>
                          <span className="text-[13px] font-medium" style={{ color: 'var(--text-4)' }}>criados</span>
                        </div>
                      </div>
                    </div>

                    {/* Coluna Direita: Meta Circular */}
                    <div 
                      className="rounded-[24px] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-dashed"
                      style={{ borderColor: 'var(--border-strong)', backgroundColor: 'transparent' }}
                    >
                      {/* Meta Header */}
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={() => { setMetaValue(dashboardData?.metaMensal?.meta || 50); setEditingMeta(true); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-sm border border-slate-200 dark:border-slate-700"
                          title="Editar meta mensal"
                        >
                          <Pencil size={14} style={{ color: 'var(--text-3)' }} />
                        </button>
                      </div>

                      {editingMeta ? (
                        <div className="flex flex-col items-center gap-3 relative z-10 w-full max-w-[200px] mx-auto py-8">
                          <label className="text-[13px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Nova Meta</label>
                          <input
                            type="number"
                            min={1} max={500}
                            value={metaValue}
                            onChange={(e) => setMetaValue(Math.max(1, Math.min(500, Number(e.target.value))))}
                            disabled={isSavingMeta}
                            className="w-full h-14 rounded-2xl px-4 text-2xl font-mono font-black text-center border-2 transition-colors focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter' && !isSavingMeta) { persistMetaMensal(metaValue); setEditingMeta(false); } }}
                          />
                          <Button 
                            onClick={() => { persistMetaMensal(metaValue); setEditingMeta(false); }} 
                            variant="primary" 
                            fullWidth 
                            disabled={isSavingMeta}
                            className="h-12 rounded-xl mt-2"
                          >
                            {isSavingMeta ? '⏳ Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="relative z-10 mb-4 scale-110 mt-4">
                            <CircularProgress
                              current={dashboardData?.metaMensal?.atual || 0}
                              total={dashboardData?.metaMensal?.meta || 50}
                              size={120}
                              showStartMessage={(dashboardData?.metaMensal?.atual || 0) === 0 && !hasSavedMeta}
                            />
                          </div>
                          <p className="text-[12px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--text-3)' }}>
                            Meta Atingida
                          </p>
                          <p className="font-mono font-black text-[20px]" style={{ color: 'var(--primary)' }}>
                            {dashboardData?.metaMensal?.porcentagem || 0}%
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dica de Estudo (Tip) */}
                  <div 
                    className="mt-6 p-4 rounded-[16px] relative overflow-hidden" 
                    style={{ 
                      backgroundColor: (dashboardData?.offensiveStreak || 0) > 0 ? 'rgba(234,88,12,0.05)' : 'var(--bg-elevated)', 
                      border: (dashboardData?.offensiveStreak || 0) > 0 ? '1px solid rgba(234,88,12,0.2)' : '1px solid var(--border)' 
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        <Lightbulb size={18} style={{ color: (dashboardData?.offensiveStreak || 0) > 0 ? '#EA580C' : 'var(--text-4)' }} />
                      </div>
                      <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        {(dashboardData?.offensiveStreak || 0) > 0 ? (
                          <>Você está em uma sequência de <span className="font-bold text-orange-500">🔥 {dashboardData.offensiveStreak} dias</span>! Não quebre a corrente, revise seus cards hoje.</>
                        ) : (
                          <>Estude pelo menos <strong style={{ color: 'var(--text-1)' }}>15 minutos</strong> hoje para começar sua sequência de foco (Streak).</>
                        )}
                      </p>
                    </div>
                  </div>

                </SectionCard>
              )}
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
            <span className="font-medium mt-2 block" style={{ color: 'var(--accent)' }}>
              Essa ação não pode ser desfeita.
            </span>
          </>
        }
        confirmText="Excluir Evento"
        type="danger"
        isLoading={isDeletingEvento}
      />

      <style>{`
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
};

export default Home;