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
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';
import {
  canInstall,
  showInstallPrompt,
  shouldShowIOSInstallBanner,
  dismissIOSInstallBanner,
  isIOS
} from '../utils/pwaUtils';

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    // Verificar após um delay para não atrapalhar carregamento inicial
    const timer = setTimeout(() => {
      // Banner iOS
      if (shouldShowIOSInstallBanner()) {
        setShowIOSBanner(true);
        return;
      }

      // Listener para banner Android/Desktop
      const handleInstallAvailable = () => {
        // Verificar se usuário já dispensou recentemente
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
          const dismissedDate = new Date(dismissed);
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 3) return; // Não mostrar por 3 dias após dispensar
        }
        setShowBanner(true);
      };

      // Verificar se já está disponível
      if (canInstall()) {
        handleInstallAvailable();
      }

      // Ouvir evento
      window.addEventListener('pwa-install-available', handleInstallAvailable);
      
      return () => {
        window.removeEventListener('pwa-install-available', handleInstallAvailable);
      };
    }, 3000); // Espera 3 segundos

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
          className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-md mx-auto"
        >
          <button
            onClick={handleDismissIOS}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="text-white" size={24} />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-1">
                Instalar Cinesia
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Adicione à tela inicial para acesso rápido
              </p>
              
              {/* Instruções iOS */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold">1</span>
                  <span>Toque em</span>
                  <Share size={16} className="text-blue-500" />
                  <span>(Compartilhar)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold">2</span>
                  <span>Selecione</span>
                  <Plus size={16} className="text-slate-600" />
                  <span>"Adicionar à Tela Inicial"</span>
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
        className="fixed bottom-20 left-4 right-4 z-50 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl shadow-2xl p-4 max-w-md mx-auto"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-white/70 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="text-white" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-white mb-0.5">
              Instalar Cinesia
            </h3>
            <p className="text-sm text-white/80 mb-2">
              Acesse offline e mais rápido!
            </p>
            
            <button
              onClick={handleInstall}
              className="bg-white text-teal-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors"
            >
              Instalar App
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
