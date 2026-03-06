/**
 * @file BottomNavigation.jsx
 * @description Bottom tab bar — 4 itens fixos + Bottom Sheet para "Mais".
 * Desktop: oculto (sidebar lateral cuida da navegação).
 *
 * Layout: Início | Matérias | Perfil | Mais
 * "Mais" desliza um bottom sheet com grid 3 colunas.
 */
import React, { memo, useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home, BookOpen, Layers, CreditCard, PenLine,
  ClipboardList, Cpu, Bone, MoreHorizontal, X,
  Trophy, BarChart3, History, MessageCircle, Settings,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useSocial } from '../features/social/context/SocialContext';
import ProfileModal from './ProfileModal';

/* ── Avatar ─────────────────────────────────────────────────── */
const NavAvatar = memo(({ user }) => {
  const [imgError, setImgError] = useState(false);
  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  if (user?.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt="avatar"
        onError={() => setImgError(true)}
        className="w-6 h-6 rounded-full object-cover ring-1 ring-primary-400"
      />
    );
  }
  return (
    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-semibold text-[11px]">
      {initial}
    </span>
  );
});
NavAvatar.displayName = 'NavAvatar';

/* ── Itens fixos da tab bar ──────────────────────────────────── */
const MAIN_ITEMS = [
  { path: '/',         icon: Home,     label: 'Início'   },
  { path: '/materias', icon: BookOpen, label: 'Matérias' },
];

/* ── Itens do Bottom Sheet "Mais" ────────────────────────────── */
const MORE_ITEMS = [
  { path: '/resumos',            icon: Layers,        label: 'Resumos'    },
  { path: '/flashcards',         icon: CreditCard,    label: 'Cards'      },
  { path: '/simulado',           icon: Cpu,           label: 'Simulados'  },
  { key:  'messages',            icon: MessageCircle, label: 'Mensagens', isChatTrigger: true },
  { path: '/consulta-rapida',    icon: ClipboardList, label: 'Consultas'  },
  { path: '/quadro-branco',      icon: PenLine,       label: 'Quadro'     },
  { path: '/atlas-3d',           icon: Bone,          label: 'Atlas 3D'   },
  { path: '/analytics',          icon: BarChart3,     label: 'Analytics'  },
  { path: '/conquistas',         icon: Trophy,        label: 'Conquistas' },
  { path: '/historico-simulados',icon: History,       label: 'Histórico'  },
  { path: '/configuracoes',      icon: Settings,      label: 'Config.'    },
];

/* ── Bottom Sheet ────────────────────────────────────────────── */
const MoreBottomSheet = memo(({ isOpen, onClose, totalUnread, onChatOpen }) => {
  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Travar scroll do body enquanto o sheet está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[70]"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed bottom-0 left-0 right-0 z-[71] rounded-t-2xl shadow-2xl"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border)',
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Handle visual */}
            <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'var(--border)' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                Mais opções
              </span>
              <button
                onClick={onClose}
                aria-label="Fechar menu"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-2)' }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Grid 3 colunas */}
            <div className="grid grid-cols-3 gap-1 px-3 pb-2" role="list">
              {MORE_ITEMS.map((item) => {
                const badge = item.isChatTrigger && totalUnread > 0 ? Math.min(totalUnread, 9) : 0;

                if (item.isChatTrigger) {
                  return (
                    <button
                      key={item.key}
                      role="listitem"
                      aria-label={badge ? `${item.label}, ${totalUnread} não lidas` : item.label}
                      onClick={() => { onChatOpen(); onClose(); }}
                      className="relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl min-h-[72px] transition-colors active:scale-95"
                      style={{ color: 'var(--text-2)' }}
                    >
                      <div className="relative">
                        <item.icon size={22} strokeWidth={1.8} aria-hidden="true" />
                        {badge > 0 && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none"
                          >
                            {badge === 9 && totalUnread > 9 ? '9+' : badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight" style={{ color: 'var(--text-2)' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    role="listitem"
                    aria-label={item.label}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl min-h-[72px] transition-colors active:scale-95 ${
                        isActive ? 'bg-primary-50 dark:bg-primary-950/60' : ''
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={22}
                          strokeWidth={1.8}
                          aria-hidden="true"
                          className={isActive ? 'text-primary-600 dark:text-primary-400' : ''}
                          style={!isActive ? { color: 'var(--text-2)' } : {}}
                        />
                        <span
                          className={`text-[11px] font-medium text-center leading-tight ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}
                          style={!isActive ? { color: 'var(--text-2)' } : {}}
                        >
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
MoreBottomSheet.displayName = 'MoreBottomSheet';

/* ── Componente principal ────────────────────────────────────── */
const BottomNavigation = memo(() => {
  const [showMore, setShowMore] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { totalUnread, toggleChat } = useSocial();

  // Detecta se o chat está ativo pela rota
  const chatAtivo = location.pathname.startsWith('/chat');

  const isExtraActive = MORE_ITEMS.some(
    (item) => item.path && location.pathname === item.path,
  );

  const handleCloseMore = useCallback(() => setShowMore(false), []);
  const handleChatOpen  = useCallback(() => toggleChat(), [toggleChat]);

  return (
    <>
      <MoreBottomSheet
        isOpen={showMore}
        onClose={handleCloseMore}
        totalUnread={totalUnread ?? 0}
        onChatOpen={handleChatOpen}
      />

      <nav
        role="navigation"
        aria-label="Navegação principal"
        className={`fixed bottom-0 left-0 right-0 z-10 flex items-stretch backdrop-blur-xl transition-colors`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-surface) 95%, transparent)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Início + Matérias */}
        {MAIN_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-150 ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
                <span className="text-[10px] font-medium whitespace-nowrap max-[374px]:hidden">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Perfil */}
        <button
          onClick={() => setIsProfileOpen(true)}
          aria-label="Abrir perfil"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-slate-400 dark:text-slate-500 transition-colors duration-150"
        >
          <NavAvatar user={user} />
          <span className="text-[10px] font-medium whitespace-nowrap max-[374px]:hidden">Perfil</span>
        </button>

        {/* Mais */}
        <button
          onClick={() => setShowMore((v) => !v)}
          aria-label={showMore ? 'Fechar menu extra' : 'Abrir menu extra'}
          aria-expanded={showMore}
          aria-haspopup="dialog"
          className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-150 ${
            showMore || isExtraActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <div className="relative">
            {showMore ? (
              <X size={22} strokeWidth={2} aria-hidden="true" />
            ) : (
              <MoreHorizontal size={22} strokeWidth={isExtraActive ? 2.2 : 1.8} aria-hidden="true" />
            )}
            {/* Badge de mensagens não lidas */}
            {!showMore && (totalUnread ?? 0) > 0 && (
              <span
                aria-label={`${totalUnread} mensagens não lidas`}
                className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none"
              >
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium whitespace-nowrap max-[374px]:hidden">
            {showMore ? 'Fechar' : 'Mais'}
          </span>
        </button>
      </nav>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;