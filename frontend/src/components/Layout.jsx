import React, { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

// Error Boundary para capturar erros de componentes filhos
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o estado para exibir a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Você pode logar o erro em um serviço externo aqui
    // console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Ocorreu um erro inesperado 😢</h2>
          <p className="mb-2">Tente recarregar a página ou entre em contato com o suporte se o problema persistir.</p>
          <details className="text-xs text-slate-500 whitespace-pre-wrap max-w-xl mx-auto" style={{ marginTop: 16 }}>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// LAZY LOADING - Widgets pesados carregados sob demanda
const PomodoroTimer = lazy(() => import('./PomodoroTimer'));
const KakaBot = lazy(() => import('./KakaBot'));

const Layout = memo(({ children }) => {
  const location = useLocation();
  // 📱 Detecta se é desktop
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  
  // 🎯 Estado da sidebar com persistência
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Desktop: carrega preferência salva ou usa true como padrão
    if (window.innerWidth >= 768) {
      const saved = localStorage.getItem('sidebarVisible');
      return saved !== null ? JSON.parse(saved) : true;
    }
    
    // Mobile: sempre começa fechada
    return false;
  });
  
  // 🎯 Detecta se o componente filho é QuadroBranco
  const isQuadroBranco = location.pathname === '/quadro-branco';

  // Injeta CSS para mover o botão só no QuadroBranco e só em telas médias
  useEffect(() => {
    const styleId = 'quadrobranco-hamburger-style';
    let style = document.getElementById(styleId);
    if (isQuadroBranco) {
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        @media (min-width: 768px) and (max-width: 1023px) {
          .quadrobranco-hamburger {
            top: 80px !important;
          }
        }
      `;
    } else if (style) {
      style.remove();
    }
    return () => {
      const style = document.getElementById(styleId);
      if (style) style.remove();
    };
  }, [isQuadroBranco]);

  // 🔄 Handler de resize otimizado
  const handleResize = useCallback(() => {
    const desktop = window.innerWidth >= 768;
    setIsDesktop(desktop);
    
    // No mobile, sidebar sempre fechada
    if (!desktop) {
      setSidebarVisible(false);
    } else {
      // No desktop, restaura preferência salva
      const saved = localStorage.getItem('sidebarVisible');
      if (saved !== null) {
        setSidebarVisible(JSON.parse(saved));
      }
    }
  }, []);

  // 👂 Listener de resize
  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 💾 Persiste estado da sidebar (só no desktop)
  useEffect(() => {
    if (isDesktop) {
      localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible));
    }
  }, [sidebarVisible, isDesktop]);

  // 🎛️ Toggle unificado para sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  // ⌨️ Atalho de teclado: Ctrl/Cmd + B para toggle
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

  // 🎯 Detecta se o componente filho é QuadroBranco
  // Detecta se está na rota do QuadroBranco
  // (Removido: declaração duplicada de isQuadroBranco)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 overflow-x-hidden flex flex-col">
        {/* Header Mobile */}
        {!isDesktop && (
          <motion.header
            className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30 px-4 py-3 shadow-sm"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <Logo size="small" />
            </div>
          </motion.header>
        )}

        {/* Botão e Sidebar só no desktop */}
        {isDesktop && (
          <>
            <motion.button
              className={`
                fixed z-[100] p-2.5 rounded-lg bg-white shadow-lg 
                border border-slate-200 hover:border-teal-500 
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2
                transition-all duration-300 hover:shadow-xl
                group
                top-1/2
                ${sidebarVisible ? 'left-[248px]' : 'left-4'}
              `}
              style={{ transform: 'translateY(-50%)' }}

              onClick={toggleSidebar}
              aria-label={sidebarVisible ? "Ocultar menu (Ctrl+B)" : "Mostrar menu (Ctrl+B)"}
              title={sidebarVisible ? "Ocultar menu (Ctrl+B)" : "Mostrar menu (Ctrl+B)"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-slate-700 group-hover:text-teal-600 transition-colors"
                animate={{ rotate: sidebarVisible ? 0 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {sidebarVisible ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </motion.svg>
            </motion.button>
            <AnimatePresence mode="wait">
              {sidebarVisible && (
                <motion.div
                  className="fixed left-0 top-0 bottom-0 z-50"
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    mass: 0.8
                  }}
                >
                  <Sidebar 
                    isOpen={false} 
                    onClose={() => setSidebarVisible(false)} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Overlay mobile removido, Sidebar nunca aparece no mobile */}

        {/* Main Content */}
        <motion.main
          className={`
            flex-1 min-h-0
            transition-all duration-300 ease-in-out
            ${!isDesktop ? 'mt-16 mb-20' : ''}
            ${isDesktop && sidebarVisible ? 'ml-64' : 'ml-0'}
            ${!isQuadroBranco ? (isDesktop ? 'pt-20 px-8' : 'px-4') : ''}
          `}
          layout
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <motion.div
            className={`w-full ${isQuadroBranco ? 'h-full' : 'max-w-full mx-auto'}`}
            layout
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </motion.main>

        {/* 🎮 Widgets Flutuantes - Lazy Loaded */}
        {!isDesktop && !isQuadroBranco && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: 60 }}>
            <div style={{ position: 'absolute', right: 0, bottom: 80, pointerEvents: 'auto' }}>
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