import React, { memo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import ProfileModal from './ProfileModal';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, BookOpen, Layers, CreditCard, PenLine, ClipboardList, Cpu, Bone, MoreHorizontal, X, User, Trophy, BarChart3, History } from 'lucide-react';

const NavAvatar = ({ user }) => {
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
};

const BottomNavigation = memo(() => {
  const [showMore, setShowMore] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const mainNavItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/materias', icon: BookOpen, label: 'Matérias' },
    { path: '/resumos', icon: Layers, label: 'Resumos' },
    { path: '/flashcards', icon: CreditCard, label: 'Cards' },
  ];

  const extraNavItems = [
    { path: '/simulado', icon: Cpu, label: 'Simulados' },
    { path: '/consulta-rapida', icon: ClipboardList, label: 'Consultas' },
    { path: '/quadro-branco', icon: PenLine, label: 'Desenhar' },
    { path: '/atlas-3d', icon: Bone, label: 'Atlas 3D' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/conquistas', icon: Trophy, label: 'Conquistas' },
    { path: '/historico-simulados', icon: History, label: 'Histórico' },
  ];

  const isExtraActive = extraNavItems.some(item => location.pathname === item.path);

  return (
    <>
      <AnimatePresence>
        {showMore && (
          <motion.div
            className="fixed inset-0 bg-black/15 dark:bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMore && (
          <motion.div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-xl shadow-float p-2 z-50 min-w-[240px]"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            initial={{ y: 12, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex flex-col gap-0.5">
              {extraNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        role="navigation"
        aria-label="Navegação principal"
        className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around z-50 safe-area-bottom transition-colors"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg relative transition-colors duration-150 min-w-[56px] ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => setIsProfileOpen(true)}
          aria-label="Abrir perfil"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg relative transition-colors duration-150 min-w-[56px] text-slate-400 dark:text-slate-500"
        >
          <NavAvatar user={user} />
          <span className="text-[10px] font-medium whitespace-nowrap">Perfil</span>
        </button>

        <button
          onClick={() => setShowMore(!showMore)}
          aria-label={showMore ? 'Fechar menu extra' : 'Abrir menu extra'}
          aria-expanded={showMore}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg relative transition-colors duration-150 min-w-[56px] ${
            showMore || isExtraActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {showMore ? (
            <X size={20} strokeWidth={2} />
          ) : (
            <MoreHorizontal size={20} strokeWidth={isExtraActive ? 2.2 : 1.8} />
          )}
          <span className="text-[10px] font-medium whitespace-nowrap">
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