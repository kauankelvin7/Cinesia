/**
 * 🎨 QUADRO DIGITAL DE ANATOMIA - v3.8
 * Responsivo, Premium UI, Dark Mode Integrado
 * Fix: Tratamento de schema e persistência robusta
 */

import React, { useState, useEffect, useRef } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Trash2, Maximize2 } from 'lucide-react';

const PERSISTENCE_KEY = 'quadro-anatomia-cinesia';

export default function QuadroBranco() {
  const [isMobile, setIsMobile] = useState(false);
  const [storeKey, setStoreKey] = useState(PERSISTENCE_KEY);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Limpa dados corrompidos do IndexedDB
  const handleStoreError = async () => {
    try {
      if (typeof window.indexedDB?.databases === 'function') {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name && db.name.includes('TLDRAW')) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
      setStoreKey(`${PERSISTENCE_KEY}-${Date.now()}`);
      setHasError(false);
    } catch {
      setStoreKey(`temp-${Date.now()}`);
    }
  };

  useEffect(() => {
    const handler = (event) => {
      if (event.message?.includes('migration-error') || event.message?.includes('Failed to migrate store')) {
        event.preventDefault();
        setHasError(true);
        handleStoreError();
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  return (
    <div
      className="w-full flex flex-col relative transition-colors duration-500 bg-slate-50 dark:bg-slate-950 overflow-hidden"
      style={{
        height: isMobile ? 'calc(100dvh - 64px)' : 'calc(100dvh - 56px)',
        minHeight: 0,
      }}
    >
      {/* ── Overlay de Carregamento Premium ── */}
      <AnimatePresence>
        {!isReady && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950"
          >
            <div className="relative mb-6">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={24} className="text-indigo-500" />
              </div>
            </div>
            <p className="text-[15px] font-bold text-slate-500 dark:text-slate-400 tracking-tight">
              Preparando seu Quadro Digital...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notificação de Reset ── */}
      {hasError && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-bold px-5 py-3 rounded-[16px] shadow-2xl flex items-center gap-3 backdrop-blur-xl"
        >
          <Trash2 size={16} />
          Dados do quadro resetados por incompatibilidade.
        </motion.div>
      )}

      {/* ── Canvas tldraw ── */}
      <div className="flex-1 min-h-0 relative z-10">
        <Tldraw
          key={storeKey}
          persistenceKey={storeKey}
          autoFocus
          inferDarkMode={isDarkMode}
          onMount={(editor) => {
            try {
              editor.updateInstanceState({ isGridMode: true });
              setIsReady(true);
            } catch (error) {
              setIsReady(true);
            }
          }}
        />
      </div>

      {/* ── Estilização Injetada (Override da UI nativa do tldraw) ── */}
      <style>{`
        /* Remove o fundo padrão para usar o do sistema */
        .tl-canvas {
          background-color: transparent !important;
        }

        /* Watermark oculta */
        .tl-watermark {
          display: none !important;
        }

        /* Estilo Premium para Toolbars */
        .tl-ui-layout {
          padding: 8px !important;
        }

        .tl-toolbar, .tl-menu, .tl-ui-button, .tl-popover {
          backdrop-filter: blur(16px) saturate(180%) !important;
          background: ${isDarkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)'} !important;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'} !important;
          box-shadow: 0 12px 24px -10px rgba(0,0,0,0.2) !important;
          border-radius: 16px !important;
          transition: all 0.2s ease !important;
        }

        /* Botão selecionado com gradiente Cinesia */
        .tl-toolbar button[data-state="selected"], 
        .tl-ui-button[data-state="selected"] {
          background: linear-gradient(135deg, #6366f1 0%, #0d9488 100%) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
        }

        /* Melhoria de tipografia e botões */
        .tl-ui-button {
          font-weight: 600 !important;
          color: ${isDarkMode ? '#cbd5e1' : '#475569'} !important;
        }

        .tl-ui-button:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} !important;
        }

        /* Ajustes Mobile */
        @media (max-width: 768px) {
          .tl-toolbar {
            bottom: 24px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: fit-content !important;
          }
          
          .tl-ui-layout__bottom__main {
            margin-right: 0 !important;
            margin-bottom: 0 !important;
          }
        }

        /* Foco no desenho: Esconde menus laterais excessivos se desejar um look mais clean */
        /* .tl-ui-layout__top__left, .tl-ui-layout__top__right { opacity: 0.5; transition: opacity 0.2s; } */
        /* .tl-ui-layout__top__left:hover, .tl-ui-layout__top__right:hover { opacity: 1; } */
      `}</style>
    </div>
  );
}