/**
 * 📲 PWA Install Banner
 * 
 * Componente que exibe banner para instalação do app:
 * - Banner customizado para Android/Desktop
 * - Banner com instruções para iOS
 * - Persiste escolha do usuário
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone, Zap, Wifi } from 'lucide-react';
import { canInstall, showInstallPrompt, shouldShowIOSInstallBanner, dismissIOSInstallBanner, isIOS } from '../utils/pwaUtils';

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowIOSInstallBanner()) {
        setShowIOSBanner(true);
        return;
      }

      const handleInstallAvailable = () => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
          const dismissedDate = new Date(dismissed);
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 3) return;
        }
        setShowBanner(true);
      };

      if (canInstall()) {
        handleInstallAvailable();
      }

      window.addEventListener('pwa-install-available', handleInstallAvailable);
      return () => {
        window.removeEventListener('pwa-install-available', handleInstallAvailable);
      };
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    const result = await showInstallPrompt();
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowBanner(false);
  };

  const handleDismissIOS = () => {
    dismissIOSInstallBanner();
    setShowIOSBanner(false);
  };

  // Banner para iOS (instruções manuais)
  if (showIOSBanner) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl">
              {/* Efeito de brilho no fundo */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10" />
              
              {/* Padrão decorativo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative p-6">
                {/* Botão de fechar */}
                <button
                  onClick={handleDismissIOS}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                  aria-label="Dispensar"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Cabeçalho */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1.5">
                      Instalar Cinesia
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Adicione à tela inicial para acesso rápido e experiência completa
                    </p>
                  </div>
                </div>

                {/* Benefícios */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span>Acesso rápido</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <span>Funciona offline</span>
                  </div>
                </div>

                {/* Instruções iOS */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      1
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <p className="text-white text-sm font-medium">
                        Toque em
                      </p>
                      <div className="px-2.5 py-1.5 bg-white/20 rounded-lg flex items-center gap-1.5">
                        <Share className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">Compartilhar</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/20" />

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      2
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <p className="text-white text-sm font-medium">
                        Selecione
                      </p>
                      <div className="px-2.5 py-1.5 bg-white/20 rounded-lg flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">Tela Inicial</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Banner para Android/Desktop
  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
      >
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 shadow-2xl">
            {/* Efeito de brilho no fundo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10" />
            
            {/* Padrão decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative p-11">
              {/* Botão de fechar */}
              <button
                onClick={handleDismiss}
                className="absolute top-1 right-4 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                aria-label="Dispensar"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Ícone */}
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Download className="w-7 h-7 text-white" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-1.5">
                    Instalar Cinesia
                  </h3>
                  <p className="text-emerald-50 text-sm leading-relaxed mb-4 sm:mb-0">
                    Acesse mais rápido e use offline. Experiência completa de app nativo!
                  </p>
                  
                  {/* Benefícios mobile */}
                  <div className="flex flex-wrap gap-2 mt-3 sm:hidden">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                      <Zap className="w-3 h-3" />
                      Mais rápido
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                      <Wifi className="w-3 h-3" />
                      Offline
                    </span>
                  </div>
                </div>

                {/* Botão de instalação */}
                <button
                  onClick={handleInstall}
                  className="w-full sm:w-auto flex-shrink-0 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 active:bg-emerald-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Instalar App
                  </span>
                </button>
              </div>

              {/* Benefícios desktop */}
              <div className="hidden sm:flex items-center gap-4 mt-4 pt-4 border-t border-white/15">
                <div className="flex items-center gap-2 text-emerald-50 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Carregamento instantâneo</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-50 text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>Funciona sem internet</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-50 text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Ícone na tela inicial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallBanner;