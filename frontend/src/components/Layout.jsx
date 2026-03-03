import React, { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useFocusMode } from '../contexts/FocusModeContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900 text-center p-8 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Ocorreu um erro inesperado</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Tente recarregar a página.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PomodoroTimer = lazy(() => import('./PomodoroTimer'));
const KakaBot = lazy(() => import('./KakaBot'));

/* ── Mobile Topbar with Avatar ── */
const MobileTopbar = memo(({ onOpenDrawer }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const avatarColors = ['#2563EB','#0D9488','#7C3AED','#059669','#D97706','#DB2777'];
  const avatarBg = avatarColors[(user?.displayName || user?.email || '')?.charCodeAt(0) % avatarColors.length || 0];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 backdrop-blur-xl transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDrawer}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-2)',
          }}
          aria-label="Abrir menu"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-display font-extrabold text-base" style={{ color: 'var(--primary)' }}>
          Cinesia
        </span>
      </div>

      {/* Right: Avatar */}
      {user?.photoURL && !imgError ? (
        <img
          src={user.photoURL}
          alt={user.displayName || ''}
          className="w-9 h-9 rounded-full object-cover shrink-0 cursor-pointer transition-transform hover:scale-105"
          style={{ border: '2px solid var(--primary)' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer"
          style={{ backgroundColor: avatarBg }}
        >
          {initials}
        </div>
      )}
    </header>
  );
});
MobileTopbar.displayName = 'MobileTopbar';

const Layout = memo(({ children }) => {
  const location = useLocation();
  const { focusMode, exitFocusMode } = useFocusMode();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.innerWidth >= 768) {
      const saved = localStorage.getItem('sidebarVisible');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return false;
  });

  // Mobile drawer state (separate from desktop sidebar)
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
      if (saved !== null) {
        setSidebarVisible(JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (isDesktop) {
      localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible));
    }
  }, [sidebarVisible, isDesktop]);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    if (mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'Escape' && focusMode) {
        exitFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, focusMode, exitFocusMode]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen overflow-x-hidden flex flex-col transition-colors duration-200" style={{ backgroundColor: 'var(--bg-page)' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Pular para o conteúdo principal
        </a>

        {/* Mobile header with Avatar */}
        {!isDesktop && !focusMode && (
          <MobileTopbar onOpenDrawer={() => setMobileDrawerOpen(true)} />
        )}

        {/* Mobile sidebar drawer + overlay */}
        {!isDesktop && !focusMode && (
          <>
            <AnimatePresence>
              {mobileDrawerOpen && (
                <motion.div
                  className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[190]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setMobileDrawerOpen(false)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {mobileDrawerOpen && (
                <motion.div
                  className="fixed left-0 top-0 bottom-0 z-[200] w-[280px] max-w-[85vw]"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Sidebar />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Desktop sidebar */}
        {isDesktop && !focusMode && (
          <>
            <button
              className={`
                fixed z-[55] p-2 rounded-lg
                hover:bg-slate-50 dark:hover:bg-slate-700
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                transition-all duration-200 shadow-sm
                top-1/2 -translate-y-1/2
                ${sidebarVisible ? 'left-[252px]' : 'left-4'}
              `}
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? "Ocultar menu (Ctrl+B)" : "Mostrar menu (Ctrl+B)"}
              title={sidebarVisible ? "Ocultar menu (Ctrl+B)" : "Mostrar menu (Ctrl+B)"}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-slate-500 dark:text-slate-400"
              >
                {sidebarVisible ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <AnimatePresence mode="wait">
              {sidebarVisible && (
                <motion.div
                  className="fixed left-0 top-0 bottom-0 z-50"
                  initial={{ x: -264 }}
                  animate={{ x: 0 }}
                  exit={{ x: -264 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Sidebar />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main content */}
        <main
          id="main-content"
          className={`
            flex-1 min-h-0
            transition-[margin] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${!isDesktop && !focusMode ? 'mt-14 mb-16' : ''}
            ${isDesktop && sidebarVisible && !focusMode ? 'ml-64' : 'ml-0'}
            ${!isQuadroBranco ? (isDesktop ? 'pt-8 px-8' : 'px-4 pt-4') : ''}
          `}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className={`w-full ${isQuadroBranco ? 'h-full' : 'max-w-full mx-auto'}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating utilities */}
        {!isDesktop && !isQuadroBranco && !focusMode && (
          <div className="fixed bottom-0 left-0 w-full pointer-events-none z-[60]">
            <div className="absolute right-0 bottom-20 pointer-events-auto">
              <Suspense fallback={null}>
                <PomodoroTimer />
                <KakaBot />
              </Suspense>
            </div>
          </div>
        )}
        {!isDesktop && !focusMode && <BottomNavigation />}
        {isDesktop && !isQuadroBranco && !focusMode && (
          <Suspense fallback={null}>
            <PomodoroTimer />
            <KakaBot />
          </Suspense>
        )}

        {/* Focus Mode exit button */}
        <AnimatePresence>
          {focusMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={exitFocusMode}
              className="fixed top-4 right-4 z-[200] px-3 py-2 rounded-xl bg-slate-900/80 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-medium backdrop-blur-sm shadow-lg hover:bg-slate-900 dark:hover:bg-white transition-colors flex items-center gap-1.5"
              title="Sair do Modo Foco (Esc)"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Sair do Foco
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
});

Layout.displayName = 'Layout';

export default Layout;
