/**
 * 🎨 QUADRO DIGITAL DE ANATOMIA - v2.0
 * 
 * Integrado ao Dashboard Cinesia
 * Corrigido para conviver com Sidebar + Chat Widget
 * 
 * FEATURES:
 * • Layout responsivo (adapta-se à Sidebar)
 * • Sem conflitos de z-index
 * • Botões reposicionados para evitar Chat Widget
 * • Nome customizável ao exportar
 * • Auto-save inteligente
 * 
 * @version 2.0.0
 * @author Cinesia Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tldraw, exportAs, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';

/**
 * Modal para escolher nome do arquivo ao exportar
 */
function FileNameModal({ isOpen, onClose, onConfirm, defaultName, format }) {
  const [fileName, setFileName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) {
      setFileName(defaultName);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(fileName || defaultName);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#0f172a'
        }}>
          💾 Salvar Desenho
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '8px'
            }}>
              Nome do arquivo:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Digite o nome do arquivo"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingRight: '60px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#14b8a6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                }}
              />
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                fontWeight: '600',
                color: '#94a3b8'
              }}>
                .{format}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #e2e8f0',
                background: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
              }}
            >
              💾 Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Componente de controles de exportação
 */
function ToolbarControls() {
  const editor = useEditor();
  const [isMobile, setIsMobile] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFileNameModal, setShowFileNameModal] = useState(false);
  const [pendingExport, setPendingExport] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showExportMenu && !e.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  /**
   * Inicia processo de exportação (abre modal para escolher nome)
   */
  const initiateExport = (format) => {
    const shapeIds = editor.getCurrentPageShapeIds();
    
    if (shapeIds.size === 0) {
      showNotification('⚠️ Canvas vazio! Desenhe algo primeiro.', 'warning');
      setShowExportMenu(false);
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    setPendingExport({ format, defaultName: `anatomia-${timestamp}` });
    setShowFileNameModal(true);
    setShowExportMenu(false);
  };

  /**
   * Executa exportação com nome customizado
   */
  const executeExport = async (fileName) => {
    if (!pendingExport) return;

    try {
      const shapeIds = editor.getCurrentPageShapeIds();
      const { format } = pendingExport;

      await exportAs(editor, [...shapeIds], format, fileName, {
        background: true,
        padding: 40,
        scale: format === 'png' ? 2 : 1
      });

      showNotification(`✅ ${format.toUpperCase()} exportado: ${fileName}.${format}`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      showNotification('❌ Erro ao exportar. Tente novamente.', 'error');
    } finally {
      setShowFileNameModal(false);
      setPendingExport(null);
    }
  };

  const saveToLocal = () => {
    try {
      const snapshot = editor.store.getSnapshot();
      const timestamp = new Date().toLocaleString('pt-BR');
      localStorage.setItem('quadro_anatomia_backup', JSON.stringify({
        snapshot,
        savedAt: timestamp
      }));
      showNotification(`💾 Rascunho salvo em ${timestamp}`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showNotification('❌ Erro ao salvar rascunho.', 'error');
    }
    setShowExportMenu(false);
  };

  const loadFromLocal = () => {
    try {
      const saved = localStorage.getItem('quadro_anatomia_backup');
      if (!saved) {
        showNotification('ℹ️ Nenhum rascunho encontrado.', 'info');
        return;
      }

      const { snapshot, savedAt } = JSON.parse(saved);
      editor.store.loadSnapshot(snapshot);
      showNotification(`📂 Rascunho de ${savedAt} restaurado!`);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      showNotification('❌ Erro ao carregar rascunho.', 'error');
    }
    setShowExportMenu(false);
  };

  const clearCanvas = () => {
    const shapeIds = editor.getCurrentPageShapeIds();
    
    if (shapeIds.size === 0) {
      showNotification('ℹ️ Canvas já está vazio.', 'info');
      setShowExportMenu(false);
      return;
    }

    if (confirm('🗑️ Tem certeza que deseja limpar todo o desenho?\n\nEsta ação não pode ser desfeita.')) {
      editor.selectAll();
      editor.deleteShapes(editor.getSelectedShapeIds());
      showNotification('🗑️ Canvas limpo!');
    }
    setShowExportMenu(false);
  };

  return (
    <>
      {/* Modal de nome de arquivo */}
      <FileNameModal
        isOpen={showFileNameModal}
        onClose={() => {
          setShowFileNameModal(false);
          setPendingExport(null);
        }}
        onConfirm={executeExport}
        defaultName={pendingExport?.defaultName || ''}
        format={pendingExport?.format || 'png'}
      />

      {/* Notificações */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99998,
          background: notification.type === 'error' ? 
            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
            notification.type === 'warning' ?
            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
            notification.type === 'info' ?
            'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: isMobile ? '12px 20px' : '14px 28px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: '600',
          animation: 'slideInDown 0.3s ease-out',
          maxWidth: isMobile ? '90%' : '500px',
          textAlign: 'center'
        }}>
          {notification.message}
        </div>
      )}

      {/* Botão de exportar */}
      <div className="export-menu-container" style={{
        position: 'absolute',
        bottom: isMobile ? '16px' : '24px',
        right: isMobile ? '16px' : '100px',
        zIndex: 9998,
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          aria-label="Menu de exportação"
          style={{
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            color: 'white',
            border: 'none',
            padding: isMobile ? '10px 14px' : '11px 18px',
            borderRadius: '10px',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            transition: 'all 0.2s ease',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {!isMobile && 'Exportar'}
        </button>

        {/* Menu dropdown */}
        {showExportMenu && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '8px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            minWidth: isMobile ? '240px' : '280px',
            animation: 'slideUpFade 0.2s ease-out',
            zIndex: 99999
          }}>
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Exportar Desenho
              </div>
            </div>

            <div style={{ padding: '4px' }}>
              <button onClick={() => initiateExport('png')} style={menuItemStyle}>
                <span style={{ fontSize: '20px' }}>🖼️</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>Exportar PNG</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Alta qualidade (2x)</div>
                </div>
              </button>

              <button onClick={() => initiateExport('svg')} style={menuItemStyle}>
                <span style={{ fontSize: '20px' }}>📐</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>Exportar SVG</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Vetorial escalável</div>
                </div>
              </button>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '6px 8px' }}></div>

              <button onClick={saveToLocal} style={menuItemStyle}>
                <span style={{ fontSize: '20px' }}>💾</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>Salvar Rascunho</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Guardar no navegador</div>
                </div>
              </button>

              <button onClick={loadFromLocal} style={menuItemStyle}>
                <span style={{ fontSize: '20px' }}>📂</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>Carregar Rascunho</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Último salvamento</div>
                </div>
              </button>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '6px 8px' }}></div>

              <button onClick={clearCanvas} style={{...menuItemStyle, color: '#ef4444'}}>
                <span style={{ fontSize: '20px' }}>🗑️</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Limpar Canvas</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Apagar tudo</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const menuItemStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  padding: '10px 12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '13px',
  color: '#0f172a',
  transition: 'background 0.15s ease',
  borderRadius: '6px',
  margin: '2px 0'
};

/**
 * Componente Principal - Quadro Branco
 */
export default function QuadroBranco() {
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isReady, setIsReady] = useState(false);

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
      // CRITICAL: Respeita a largura da Sidebar (260px)
      width: isMobile ? '100%' : 'calc(100% - 260px)',
      left: isMobile ? 0 : 'auto',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1
    }}>
     




      {/* Canvas Principal */}
      <Tldraw
        hideUi={false}
        inferDarkMode={false}
        onMount={(editor) => {
          console.log('✅ Quadro Digital de Anatomia inicializado');
          editor.updateInstanceState({ isGridMode: true });
          editor.setCameraOptions({
            wheelBehavior: 'zoom',
            isLocked: false,
            panSpeed: 1,
            zoomSpeed: 1,
            zoomSteps: [0.1, 0.25, 0.5, 1, 2, 4, 8]
          });
          setIsReady(true);
          const autoSaveInterval = setInterval(() => {
            try {
              const snapshot = editor.store.getSnapshot();
              localStorage.setItem('quadro_anatomia_autosave', JSON.stringify({
                snapshot,
                savedAt: new Date().toISOString()
              }));
            } catch (e) {
              console.warn('Auto-save falhou:', e);
            }
          }, 60000);
          return () => {
            clearInterval(autoSaveInterval);
          };
        }}
      />

      {/* CSS Global - Correções de Layout */}
      <style>{`
        /* === ANIMAÇÕES === */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        /* === CORREÇÕES DE Z-INDEX === */
        /* Garante que menus dropdown funcionem */
        .tl-context-menu,
        .tl-menu,
        .tl-popover,
        .export-menu-container > div {
          z-index: 99999 !important;
        }

        /* === REPOSICIONAMENTO DOS CONTROLES NATIVOS DO TLDRAW === */
        /* Move botões do canto inferior direito para evitar Chat Widget */
        .tl-ui-layout__bottom__main {
          margin-bottom: 0px !important;
          margin-right: 90px !important;
        }

        /* Ajusta zoom controls */
        .tl-zoom-menu {
          margin-right: 90px !important;
        }

        /* === MOBILE ADJUSTMENTS === */
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

        /* === REMOVE ELEMENTOS DESNECESSÁRIOS === */
        .tl-help-menu,
        .tl-onboarding,
        .tl-tutorial,
        .tl-watermark {
          display: none !important;
        }

        /* === MELHORA VISUAL DA TOOLBAR === */
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

        /* === MENUS CONTEXTUAIS === */
        .tl-menu {
          backdrop-filter: blur(12px) !important;
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }

        /* === HOVER NOS BOTÕES DO MENU === */
        button:hover {
          background: rgba(20, 184, 166, 0.06) !important;
        }

        /* === SCROLLBAR PERSONALIZADA === */
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

        /* === GARANTE QUE CANVAS OCUPA TODO ESPAÇO === */
        .tl-container {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}