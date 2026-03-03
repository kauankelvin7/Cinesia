/**
 * SIDEBAR — Premium SaaS Navigation
 * Dark mode, collapsible, modern styling
 * Avatar com foto real do usuário no rodapé
 */

import React, { useState, memo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Layers, 
  Brain,
  ClipboardList,
  PenTool,
  Bone,
  ChevronRight,
  Trophy,
  BarChart3,
  History,
} from 'lucide-react';
import Logo from './Logo';
import ProfileModal from './ProfileModal';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext-firebase';

const Sidebar = memo(() => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/materias', icon: BookOpen, label: 'Matérias' },
    { to: '/resumos', icon: FileText, label: 'Resumos' },
    { to: '/flashcards', icon: Layers, label: 'Flashcards' },
    { to: '/simulado', icon: Brain, label: 'Simulados' },
    { to: '/consulta-rapida', icon: ClipboardList, label: 'Consulta Rápida' },
    { to: '/quadro-branco', icon: PenTool, label: 'Quadro Branco' },
    { to: '/atlas-3d', icon: Bone, label: 'Atlas 3D' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/conquistas', icon: Trophy, label: 'Conquistas' },
    { to: '/historico-simulados', icon: History, label: 'Histórico' },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-colors duration-200">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <Logo size="small" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Menu principal">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                  <span>{link.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section with real photo */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <UserMenu onOpenProfile={() => setIsProfileOpen(true)} />

          <p className="mt-2 text-center text-[11px] text-slate-300 dark:text-slate-600 font-medium">
            Cinesia · 2026
          </p>
        </div>
      </aside>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;