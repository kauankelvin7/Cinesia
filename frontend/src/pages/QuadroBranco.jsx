/**
 * 🎨 QUADRO DIGITAL DE ANATOMIA - v3.5
 * Responsivo automaticamente com o Layout
 * Dark mode aware, proper screen fit
 * Fix: Trata erro de migração de schema do IndexedDB
 */

import React, { useState, useEffect } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { useTheme } from '../contexts/ThemeContext';

const PERSISTENCE_KEY = 'quadro-anatomia-cinesia';

export default function QuadroBranco() {
  const [isMobile, setIsMobile] = useState(false);
  const [storeKey, setStoreKey] = useState(PERSISTENCE_KEY);
  const [hasError, setHasError] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Limpa dados corrompidos do IndexedDB se houver erro de migração
  const handleStoreError = async () => {
    try {
      const databases = await window.indexedDB.databases?.();
      if (databases) {
        for (const db of databases) {
          if (db.name && db.name.includes('TLDRAW')) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
      // Força remount com nova key
      setStoreKey(`${PERSISTENCE_KEY}-${Date.now()}`);
      setHasError(false);
    } catch {
      // Fallback: desabilita persistência
      setStoreKey(`temp-${Date.now()}`);
    }
  };

  // Error boundary inline para tldraw
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
      className="w-full flex flex-col transition-colors duration-200 bg-slate-50 dark:bg-slate-900 overflow-hidden"
      style={{
        height: isMobile ? 'calc(100dvh - 64px)' : 'calc(100dvh - 64px)',
        minHeight: 0,
      }}
    >
      {hasError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm px-4 py-2 rounded-xl shadow-sm">
          Dados do quadro foram resetados por incompatibilidade.
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
      <Tldraw
        key={storeKey}
        inferDarkMode={false}
        persistenceKey={storeKey}
        autoFocus
        onMount={(editor) => {
          try {
            editor.updateInstanceState({ isGridMode: true });
          } catch (error) {
            // silently ignore grid config errors
          }
        }}
      />
      </div>

      <style>{`
        /* === CORREÇÕES DE LAYOUT === */
        .tl-ui-layout__bottom__main {
          margin-bottom: 0px !important;
          margin-right: 20px !important;
        }

        .tl-watermark {
          display: none !important;
        }

        /* === VISUAL === */
        .tl-toolbar {
          backdrop-filter: blur(12px) !important;
          background: ${isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'} !important;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} !important;
          box-shadow: 0 4px 16px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'} !important;
          border-radius: 12px !important;
        }

        .tl-toolbar button {
          color: ${isDarkMode ? '#e2e8f0' : 'inherit'} !important;
        }

        .tl-toolbar button[data-state="selected"] {
          background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%) !important;
          color: white !important;
        }

        .tl-menu {
          backdrop-filter: blur(12px) !important;
          background: ${isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)'} !important;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} !important;
          box-shadow: 0 8px 24px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.12)'} !important;
          color: ${isDarkMode ? '#e2e8f0' : 'inherit'} !important;
        }

        /* === MOBILE === */
        @media (max-width: 768px) {
          .tl-toolbar {
            bottom: 16px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }

          .tl-ui-layout__bottom__main {
            margin-right: 10px !important;
          }
        }

        .tl-container {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}