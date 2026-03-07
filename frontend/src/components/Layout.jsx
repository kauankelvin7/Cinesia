import React, { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import FABStack from './FABStack';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useFocusMode } from '../contexts/FocusModeContext';
import { useSocial } from '../features/social/context/SocialContext';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

/* ── Error Boundary com Design Premium ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Layout Error:", error, errorInfo); }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-center p-8">
          <div className="w-20 h-20 rounded-[24px] bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6 border border-red-100 dark:border-red-800">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Ops! Algo deu errado</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[15px] mb-8 max-w-xs mx-auto">Não se preocupe, isso acontece. Vamos tentar de novo?</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <RefreshCw size={18} /> Recarregar Sistema
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PomodoroTimer = lazy(() => import('./PomodoroTimer'));
const KakaBot = lazy(() => import('./KakaBot'));
const ChatPanel = lazy(() => import('../features/social/components/chat/ChatPanel'));
const ChallengeRoom = lazy(() => import('../features/social/components/challenges/ChallengeRoom'));

/* ── Mobile Topbar Refinada ── */
const MobileTopbar = memo(({ onOpenDrawer }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const avatarColors = ['#6366F1', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];
  const avatarBg = avatarColors[(user?.displayName || user?.email || '')?.charCodeAt(0) % avatarColors.length || 0];

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between h-16 px-5 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 transition-all">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenDrawer}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-90 transition-all"
          aria-label="Menu"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size="small" iconOnly />
          <span className="font-black text-[18px] tracking-tighter text-slate-900 dark:text-white">Cinesia</span>
        </div>
      </div>

      <div className="relative">
        {user?.photoURL && !imgError ? (
          <img
            src={user.photoURL}
            alt="Perfil"
            className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white dark:border-slate-700" style={{ backgroundColor: avatarBg }}>
            {initials}
          </div>
        )}
      </div>
    </header>
  );
});

const Layout = memo(({ children }) => {
  const location = useLocation();
  const { focusMode, exitFocusMode } = useFocusMode();
  const { activeChallengeId, endChallenge } = useSocial();
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sidebarVisible');
    return isDesktop ? (saved !== null ? JSON.parse(saved) : true) : false;
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isQuadroBranco = location.pathname === '/quadro-branco';

  const handleResize = useCallback(() => {
    const desktop = window.innerWidth >= 768;
    setIsDesktop(desktop);
    if (!desktop) {
      setSidebarVisible(false);
    } else {
      setMobileDrawerOpen(false);
      const saved = localStorage.getItem('sidebarVisible');
      if (saved !== null) setSidebarVisible(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (isDesktop) localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible));
  }, [sidebarVisible, isDesktop]);

  const toggleSidebar = useCallback(() => setSidebarVisible(p => !p), []);

  useEffect(() => { if (mobileDrawerOpen) setMobileDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      if (e.key === 'Escape' && focusMode) exitFocusMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, focusMode, exitFocusMode]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
        
        {/* Mobile View */}
        {!isDesktop && !focusMode && (
          <>
            <MobileTopbar onOpenDrawer={() => setMobileDrawerOpen(true)} />
            <AnimatePresence>
              {mobileDrawerOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70]"
                    onClick={() => setMobileDrawerOpen(false)}
                  />
                  <motion.div 
                    initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed left-0 top-0 bottom-0 z-[80] w-[280px] shadow-2xl"
                  >
                    <Sidebar />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Desktop Sidebar + Toggle */}
        {isDesktop && !focusMode && (
          <>
            <button
              onClick={toggleSidebar}
              className={`fixed z-[55] w-8 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl shadow-sm hover:bg-slate-50 transition-all top-1/2 -translate-y-1/2 ${sidebarVisible ? 'left-64' : 'left-0'}`}
            >
              {sidebarVisible ? <ChevronLeft size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            </button>
            <AnimatePresence mode="wait">
              {sidebarVisible && (
                <motion.div 
                  initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="fixed left-0 top-0 bottom-0 z-50 w-64 shadow-xl border-r border-slate-200/50 dark:border-slate-800/50"
                >
                  <Sidebar />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main Area */}
        <main 
          id="main-content"
          className={`flex-1 transition-all duration-300 ease-in-out ${!isDesktop && !focusMode ? 'mt-16 mb-20' : ''} ${isDesktop && sidebarVisible && !focusMode ? 'ml-64' : 'ml-0'}`}
        >
          <div className={`${!isQuadroBranco ? (isDesktop ? 'p-8' : 'p-4') : 'h-full'}`}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Widgets Flutuantes */}
        <Suspense fallback={null}>
          {!isDesktop && !focusMode && <BottomNavigation />}
        </Suspense>

        {/* Floating Actions (Bottom-Right) */}
        {!focusMode && (
          <Suspense fallback={null}>
            <FABStack>
              <PomodoroTimer />
              <ChatPanel showButton={isDesktop} />
              {!isQuadroBranco && <KakaBot />}
            </FABStack>
          </Suspense>
        )}

        {/* Focus Mode Overlay */}
        <AnimatePresence>
          {focusMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={exitFocusMode}
              className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 font-bold text-[13px] backdrop-blur-md shadow-2xl border border-white/10"
            >
              <X size={16} strokeWidth={3} /> Sair do Foco (Esc)
            </motion.button>
          )}
        </AnimatePresence>

        {/* Global Challenge Overlay */}
        {activeChallengeId && (
          <Suspense fallback={null}>
            <ChallengeRoom challengeId={activeChallengeId} currentUserId={user?.uid} onClose={endChallenge} />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
});

Layout.displayName = 'Layout';
export default Layout;