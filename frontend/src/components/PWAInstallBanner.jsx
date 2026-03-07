/**
 * 📲 PWA Install Banner Premium v2.0
 * * Componente refinado para instalação do app:
 * - Design flutuante com Glassmorphism
 * - Guia visual interativo para iOS
 * - Cores consistentes com o Brand Book Cinesia
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone, Zap, Wifi, Sparkles } from 'lucide-react';
import { canInstall, showInstallPrompt, shouldShowIOSInstallBanner, dismissIOSInstallBanner } from '../utils/pwaUtils';

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    // Delay de 4s para não assustar o usuário assim que ele entra
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
      return () => window.removeEventListener('pwa-install-available', handleInstallAvailable);
    }, 4000);

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

  // ─── Estilo do Container Base ───
  const bannerContainerProps = {
    initial: { y: 100, opacity: 0, scale: 0.9 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: 100, opacity: 0, scale: 0.9 },
    transition: { type: "spring", damping: 25, stiffness: 350 },
    className: "fixed bottom-20 sm:bottom-8 left-0 right-0 z-[100] px-4 pointer-events-none"
  };

  const CardWrapper = ({ children, gradient }) => (
    <div className={`max-w-md mx-auto pointer-events-auto relative overflow-hidden rounded-[28px] p-6 shadow-2xl border border-white/20 backdrop-blur-xl bg-gradient-to-br ${gradient}`}>
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">{children}</div>
    </div>
  );

  // 🍎 BANNER IOS
  if (showIOSBanner) {
    return (
      <AnimatePresence>
        <motion.div {...bannerContainerProps}>
          <CardWrapper gradient="from-indigo-600 via-indigo-700 to-purple-800">
            <button onClick={handleDismissIOS} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X size={16} strokeWidth={3} />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
                <Smartphone className="text-white" size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight">Instalar Cinesia</h3>
                <p className="text-[13px] font-medium text-indigo-100 opacity-80">Experiência nativa no seu iPhone</p>
              </div>
            </div>

            <div className="space-y-3 bg-black/10 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-black text-white shadow-sm">1</div>
                <p className="text-white text-[13px] font-bold">Toque no ícone <span className="inline-flex p-1 bg-white/20 rounded-md mx-1"><Share size={14} /></span> abaixo</p>
              </div>
              <div className="h-px bg-white/10 ml-9" />
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-black text-white shadow-sm">2</div>
                <p className="text-white text-[13px] font-bold">Selecione <span className="inline-flex p-1 bg-white/20 rounded-md mx-1"><Plus size={14} /> Tela Inicial</span></p>
              </div>
            </div>
          </CardWrapper>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 🤖 BANNER ANDROID / DESKTOP
  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div {...bannerContainerProps}>
        <CardWrapper gradient="from-teal-600 via-teal-700 to-indigo-800">
          <button onClick={handleDismiss} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={16} strokeWidth={3} />
          </button>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shadow-lg relative">
              <Download className="text-white" size={28} strokeWidth={2.5} />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles size={16} className="text-teal-300" fill="currentColor" />
              </motion.div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white tracking-tight">Estude Offline</h3>
              <p className="text-teal-50 text-[14px] leading-snug font-medium mt-1">
                Instale o Cinesia e acesse seus flashcards mesmo sem internet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleInstall}
              variant="primary"
              className="flex-1 h-12 bg-white text-teal-800 hover:bg-teal-50 border-none font-bold text-[14px] shadow-xl"
            >
              Instalar Agora
            </Button>
            <div className="flex items-center gap-2 px-3 py-2 bg-black/10 rounded-xl">
              <Wifi size={14} className="text-teal-300" />
              <Zap size={14} className="text-teal-300" />
            </div>
          </div>
        </CardWrapper>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallBanner;