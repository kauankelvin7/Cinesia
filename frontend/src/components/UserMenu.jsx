/**
 * USER MENU — Premium dropdown with profile, theme, logout
 * Segmented theme control (Light / System / Dark)
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';

/* ── helpers ─────────────────────────────────── */
const Divider = () => (
  <div className="my-1 h-px bg-slate-200/80 dark:bg-slate-700/80" />
);

/* ── Segmented Theme Control ──────────────────── */
const ThemeSegmented = memo(() => {
  const { mode, setMode } = useTheme();

  const options = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'system', icon: Monitor, label: 'Sistema' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
  ];

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-700/60">
        {options.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              onClick={(e) => { e.stopPropagation(); setMode(opt.value); }}
              className={`
                relative flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                ${active
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }
              `}
              aria-pressed={active}
            >
              <opt.icon size={13} strokeWidth={active ? 2.2 : 1.8} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
ThemeSegmented.displayName = 'ThemeSegmented';

/* ── Menu Item ───────────────────────────────── */
const MenuItem = memo(({ icon: Icon, label, onClick, danger, badge, children }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150
      ${danger
        ? 'text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 group'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 group'
      }
    `}
  >
    <Icon
      size={18}
      strokeWidth={1.8}
      className={`flex-shrink-0 transition-colors duration-150 ${
        danger
          ? 'text-slate-400 dark:text-slate-500 group-hover:text-red-600 dark:group-hover:text-red-400'
          : 'text-slate-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400'
      }`}
    />
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold leading-none bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
        {badge}
      </span>
    )}
    {children}
  </button>
));
MenuItem.displayName = 'MenuItem';

/* ── Main Component ──────────────────────────── */
const UserMenu = ({ onOpenProfile, className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="w-full p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 group text-left"
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${user?.displayName || 'Usuário'} — ${user?.email || ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {/* Avatar com foto real do usuário (user.photoURL) ou fallback com gradiente */}
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-cyan-500/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {initial}
              </div>
            )}
            {/* Indicador de status online */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {user?.email || ''}
            </p>
          </div>
          <ChevronRight
            size={14}
            className={`text-slate-300 dark:text-slate-600 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="menu"
            className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-slate-900/40 overflow-hidden z-[200]"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* User header inside dropdown */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.displayName || 'Usuário'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {user?.email}
              </p>
            </div>

            <div className="p-1.5">
              <MenuItem icon={User} label="Meu Perfil" onClick={() => { setOpen(false); navigate('/meu-perfil'); }} />
              <MenuItem icon={Settings} label="Configurações" onClick={() => { setOpen(false); navigate('/configuracoes'); }} />
            </div>

            {/* Theme segmented */}
            <div className="border-t border-slate-100 dark:border-slate-700/60">
              <div className="px-3 pt-2 pb-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Aparência</span>
              </div>
              <ThemeSegmented />
            </div>

            <Divider />

            <div className="p-1.5">
              <MenuItem icon={Bell} label="Notificações" onClick={() => { setOpen(false); navigate('/notificacoes'); }} />
            </div>

            <Divider />

            <div className="p-1.5">
              <MenuItem icon={LogOut} label="Sair" danger onClick={() => { setOpen(false); logout(); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(UserMenu);
