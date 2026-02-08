/**
 * 🎨 QUADRO DIGITAL DE ANATOMIA - v3.1 
 * Com configurações para produção
 */

import React, { useState, useEffect } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

export default function QuadroBranco() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      bottom: 0,
      right: 0,
      width: isMobile ? '100%' : 'calc(100% - 260px)',
      left: isMobile ? 0 : 'auto',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1
    }}>
      <Tldraw
        inferDarkMode={false}
        // Configurações importantes para produção
        persistenceKey="quadro-anatomia-cinesia"
        autoFocus
        onMount={(editor) => {
          console.log('✅ Quadro Digital de Anatomia inicializado');
          
          try {
            editor.updateInstanceState({ isGridMode: true });
          } catch (error) {
            console.warn('Erro ao configurar grid:', error);
          }
        }}
      />

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
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
          border-radius: 12px !important;
        }

        .tl-toolbar button[data-state="selected"] {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
          color: white !important;
        }

        .tl-menu {
          backdrop-filter: blur(12px) !important;
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
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

        /* === SCROLLBAR === */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(20, 184, 166, 0.4);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(20, 184, 166, 0.6);
        }

        .tl-container {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}