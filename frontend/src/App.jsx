/**
 * 🚀 CINESIA APP - Performance Optimized + PWA
 * 
 * Otimizações aplicadas:
 * - Route-based Code Splitting (React.lazy)
 * - Suspense com LoadingScreen elegante
 * - Transições suaves entre páginas
 * - PWA com suporte offline
 * 
 * Resultado: Bundle inicial menor, navegação 60fps, instalável
 */

import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext-firebase';
import { DashboardDataProvider, useDashboardData } from './contexts/DashboardDataContext';
import { FocusModeProvider } from './contexts/FocusModeContext';
import { SocialProvider } from './features/social/context/SocialContext';
import { ensureUserProfileOnAuth } from './features/social/services/friendsService';
import Layout from './components/Layout';
import LoadingScreen from './components/ui/LoadingScreen';
import PWAInstallBanner from './components/PWAInstallBanner';
import OnboardingFlow from './components/OnboardingFlow';
import { initPWA } from './utils/pwaUtils';
import { useFontSize } from './utils/useFontSize';


// 🔥 LAZY LOADING - Páginas carregadas sob demanda
// Cada página vira um chunk separado no build
const LoginMinimal = lazy(() => import('./pages/LoginMinimal'));
const Home = lazy(() => import('./pages/Home'));
const Materias = lazy(() => import('./pages/Materias'));
const Resumos = lazy(() => import('./pages/Resumos'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Simulado = lazy(() => import('./pages/Simulado'));
const ConsultaRapida = lazy(() => import('./pages/ConsultaRapida'));
const QuadroBranco = lazy(() => import('./pages/QuadroBranco'));
const Atlas3D = lazy(() => import('./pages/Atlas3D'));
const Notificacoes = lazy(() => import('./pages/Notificacoes'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil'));
const HistoricoSimulados = lazy(() => import('./pages/HistoricoSimulados'));
const Conquistas = lazy(() => import('./pages/Conquistas'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Amigos = lazy(() => import('./pages/Amigos'));

// ⚡ PREFETCH - Pré-carrega todos os chunks no idle para navegação instantânea
const PAGE_IMPORTS = [
  () => import('./pages/Home'),
  () => import('./pages/Materias'),
  () => import('./pages/Resumos'),
  () => import('./pages/Flashcards'),
  () => import('./pages/Simulado'),
  () => import('./pages/ConsultaRapida'),
  () => import('./pages/QuadroBranco'),
  () => import('./pages/Atlas3D'),
  () => import('./pages/Notificacoes'),
  () => import('./pages/Configuracoes'),
  () => import('./pages/MeuPerfil'),
  () => import('./pages/HistoricoSimulados'),
  () => import('./pages/Conquistas'),
  () => import('./pages/Analytics'),
  () => import('./pages/Amigos'),
];

function usePrefetchRoutes() {
  useEffect(() => {
    const run = () => PAGE_IMPORTS.forEach((fn) => fn().catch(() => {}));
    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 3000 });
    } else {
      setTimeout(run, 1500);
    }
  }, []);
}

// FIX-003: Clear dashboard cache on logout to prevent cross-user data leaks
function CacheCleaner() {
  const { user } = useAuth();
  const { clearCache } = useDashboardData();
  const prevUserRef = useRef(null);
  useEffect(() => {
    if (prevUserRef.current !== null && user === null) {
      clearCache();
    }
    prevUserRef.current = user;
  }, [user, clearCache]);
  return null;
}

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Spinner leve para transições entre páginas (não bloqueia o layout)
function PageSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-64">
      <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  // ⚡ Pré-carrega todos os chunks de rota no idle após o app montar
  usePrefetchRoutes();

  // 🔍 Hook de Acessibilidade - Controle de tamanho de fonte
  // Inicializa o hook para aplicar font-size no <html> element
  useFontSize();

  useEffect(() => {
    if (!user) return;
    ensureUserProfileOnAuth(user);
  }, [user]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginMinimal />} 
        />
        
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <DashboardDataProvider>
              <FocusModeProvider>
              <SocialProvider>
              <CacheCleaner />
              <OnboardingFlow />
              <Layout>
                {/* Suspense interno para transições entre páginas protegidas */}
                <Suspense fallback={<PageSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/materias" element={<Materias />} />
                    <Route path="/resumos" element={<Resumos />} />
                    <Route path="/flashcards" element={<Flashcards />} />
                    <Route path="/simulado" element={<Simulado />} />
                    <Route path="/consulta-rapida" element={<ConsultaRapida />} />
                    <Route path="/quadro-branco" element={<QuadroBranco />} />
                    <Route path="/atlas-3d" element={<Atlas3D />} />
                    <Route path="/notificacoes" element={<Notificacoes />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/meu-perfil" element={<MeuPerfil />} />
                    <Route path="/historico-simulados" element={<HistoricoSimulados />} />
                    <Route path="/conquistas" element={<Conquistas />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/amigos" element={<Amigos />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
              </SocialProvider>
              </FocusModeProvider>
              </DashboardDataProvider>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  // Inicializar PWA (listeners de instalação e status)
  useEffect(() => {
    initPWA();
  }, []);


  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          {/* Banner de instalação PWA */}
          <PWAInstallBanner />
          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            expand={false}
            richColors={false}
            closeButton
            toastOptions={{
              duration: 5000,
              classNames: {
                toast:   'cinesia-toast',
                success: 'cinesia-toast--success',
                error:   'cinesia-toast--error',
                warning: 'cinesia-toast--warning',
                info:    'cinesia-toast--info',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
