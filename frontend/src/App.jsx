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

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext-firebase';
import { DashboardDataProvider } from './contexts/DashboardDataContext';
import Layout from './components/Layout';
import LoadingScreen from './components/ui/LoadingScreen';
import PWAInstallBanner from './components/PWAInstallBanner';
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

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  // 🔍 Hook de Acessibilidade - Controle de tamanho de fonte
  // Inicializa o hook para aplicar font-size no <html> element
  useFontSize();

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
              <Layout>
                {/* Suspense interno para transições entre páginas protegidas */}
                <Suspense fallback={<LoadingScreen />}>
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
                  </Routes>
                </Suspense>
              </Layout>
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
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
            richColors
            closeButton
          />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
