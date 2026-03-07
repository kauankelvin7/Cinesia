/**
 * 🧭 SIDEBAR
 * Dark mode, collapsible, sections organized
 * Foco em hierarquia visual e tipografia moderna
 */

import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
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
  Users,
  Sparkles
} from 'lucide-react';
import Logo from './Logo';
import ProfileModal from './ProfileModal';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useSocial } from '../features/social/context/SocialContext';

const Sidebar = memo(() => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const social = useSocial?.() || {};
  const pendingCount = social.pendingRequestsCount || 0;

  // Organização por seções para melhor UX
  const menuGroups = [
    {
      title: 'Principal',
      links: [
        { to: '/', icon: Home, label: 'Dashboard' },
        { to: '/amigos', icon: Users, label: 'Amigos', badge: pendingCount },
      ]
    },
    {
      title: 'Estudo Ativo',
      links: [
        { to: '/materias', icon: BookOpen, label: 'Matérias' },
        { to: '/resumos', icon: FileText, label: 'Resumos' },
        { to: '/flashcards', icon: Layers, label: 'Flashcards' },
      ]
    },
    {
      title: 'Ferramentas Práticas',
      links: [
        { to: '/simulado', icon: Brain, label: 'Simulados IA' },
        { to: '/quadro-branco', icon: PenTool, label: 'Lousa Digital' },
        { to: '/atlas-3d', icon: Bone, label: 'Anatomia 3D' },
        { to: '/consulta-rapida', icon: ClipboardList, label: 'Consulta Rápida' },
      ]
    },
    {
      title: 'Desempenho',
      links: [
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/conquistas', icon: Trophy, label: 'Conquistas' },
        { to: '/historico-simulados', icon: History, label: 'Histórico' },
      ]
    }
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-all duration-300">
        
        {/* Branding Area */}
        <div className="px-6 py-8">
          <Logo size="small" />
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-7 pb-8" role="navigation">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {group.title}
              </h3>
              
              <div className="space-y-1">
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 border border-transparent ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <link.icon 
                          size={18} 
                          strokeWidth={isActive ? 2.5 : 2} 
                          className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-500' : ''}`} 
                        />
                        <span className="flex-1 truncate">{link.label}</span>
                        
                        {link.badge > 0 && (
                          <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black shadow-lg shadow-red-500/20">
                            {link.badge > 9 ? '9+' : link.badge}
                          </span>
                        )}
                        
                        {isActive && !link.badge && (
                          <motion.div 
                            layoutId="activeDot"
                            className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Profile Section */}
        <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <UserMenu onOpenProfile={() => setIsProfileOpen(true)} />
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            <Sparkles size={10} />
            Cinesia Health v2.0
          </div>
        </div>
      </aside>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(148, 163, 184, 0.2); 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(148, 163, 184, 0.4); 
        }
      `}</style>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;