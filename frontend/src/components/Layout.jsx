import React, { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

// 🔥 LAZY LOADING - Widgets pesados carregados sob demanda
// Reduz o bundle inicial e melhora TBT em mobile
const PomodoroTimer = lazy(() => import('./PomodoroTimer'));
const KakaBot = lazy(() => import('./KakaBot'));

const Layout = memo(({ children }) => {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  // useCallback para handler estável
  const handleResize = useCallback(() => {
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    // Passive listener para melhor performance de scroll
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop: Sidebar Fixa */}
      {isDesktop && <Sidebar />}

      {/* Mobile/Tablet: Header */}
      {!isDesktop && (
        <motion.header
          className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40 px-4 py-3 shadow-sm"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Logo size="small" />
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <main
        className={`
          transition-all duration-200
          ${isDesktop ? 'ml-64' : 'mt-16 pb-20'}
        `}
      >
        {children}
      </main>

      {/* Mobile/Tablet: Bottom Navigation */}
      {!isDesktop && <BottomNavigation />}

      {/* Widgets Flutuantes - Lazy Loaded */}
      <Suspense fallback={null}>
        <PomodoroTimer />
        <KakaBot />
      </Suspense>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
