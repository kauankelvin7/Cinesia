/**
 * 🚀 CINESIA APP - Performance Optimized
 * 
 * Otimizações aplicadas:
 * - Route-based Code Splitting (React.lazy)
 * - Suspense com LoadingScreen elegante
 * - Transições suaves entre páginas
 * 
 * Resultado: Bundle inicial menor, navegação 60fps
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext-firebase';
import Layout from './components/Layout';
import LoadingScreen from './components/ui/LoadingScreen';

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
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
