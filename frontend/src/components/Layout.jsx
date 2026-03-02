import React, { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

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

const Layout = memo(({ children }) => {
  const location = useLocation();
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden flex flex-col transition-colors duration-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Pular para o conteúdo principal
        </a>

        {/* Mobile header */}
        {!isDesktop && (
          <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800/80 z-30 px-4 py-3 transition-colors">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Abrir menu"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Logo size="small" />
              <div className="w-9" />
            </div>
          </header>
        )}

        {/* Mobile sidebar drawer + overlay */}
        {!isDesktop && (
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
        {isDesktop && (
          <>
            <button
              className={`
                fixed z-[100] p-2 rounded-lg
                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                hover:border-slate-300 dark:hover:border-slate-600
                hover:bg-slate-50 dark:hover:bg-slate-700
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                transition-all duration-200 shadow-sm
                top-1/2 -translate-y-1/2
                ${sidebarVisible ? 'left-[252px]' : 'left-4'}
              `}
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
            ${!isDesktop ? 'mt-14 mb-16' : ''}
            ${isDesktop && sidebarVisible ? 'ml-64' : 'ml-0'}
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
        {!isDesktop && !isQuadroBranco && (
          <div className="fixed bottom-0 left-0 w-full pointer-events-none z-[60]">
            <div className="absolute right-0 bottom-20 pointer-events-auto">
              <Suspense fallback={null}>
                <PomodoroTimer />
                <KakaBot />
              </Suspense>
            </div>
          </div>
        )}
        {!isDesktop && <BottomNavigation />}
        {isDesktop && !isQuadroBranco && (
          <Suspense fallback={null}>
            <PomodoroTimer />
            <KakaBot />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
});

Layout.displayName = 'Layout';

export default Layout;
