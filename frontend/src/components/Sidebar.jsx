/**
 * SIDEBAR PREMIUM - Navegação Principal (Desktop)
 * 
 * Design System HealthTech Premium - Light Mode Only
 * Features:
 * - Glassmorphism sutil
 * - Ícones Lucide elegantes
 * - Trigger para ProfileModal
 * - Animações fluidas
 */

import React, { useState, memo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Layers, 
  LogOut, 
  Settings,
  ChevronRight,
  Sparkles,
  BrainCircuit,
  ClipboardList,
  PenTool
} from 'lucide-react';
import Logo from './Logo';
import ProfileModal from './ProfileModal';
import { useAuth } from '../contexts/AuthContext-firebase';

// Utility function outside component
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const Sidebar = memo(() => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/materias', icon: BookOpen, label: 'Matérias' },
    { to: '/resumos', icon: FileText, label: 'Resumos' },
    { to: '/flashcards', icon: Layers, label: 'Flashcards' },
    { to: '/simulado', icon: BrainCircuit, label: 'Simulados' },
    { to: '/consulta-rapida', icon: ClipboardList, label: 'Consulta Rápida' },
    { to: '/quadro-branco', icon: PenTool, label: 'Quadro Branco' },
  ];

  return (
    <>
      <motion.aside
        className="fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 flex flex-col shadow-xl shadow-slate-200/50 z-50"
        initial={{ x: -264, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <Logo size="medium" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                    : 'text-slate-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:text-teal-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileHover={{ rotate: isActive ? 0 : 10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  <span className="font-medium">{link.label}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <ChevronRight size={16} />
                    </motion.div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-100">
          {/* User Profile Card */}
          <motion.button
            onClick={() => setIsProfileOpen(true)}
            className="w-full p-4 bg-gradient-to-br from-slate-50 to-teal-50/50 hover:from-teal-50 hover:to-emerald-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition-all duration-300 group text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/25">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <Sparkles className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {getGreeting()} 
                </p>
              </div>

              <Settings 
                size={18} 
                className="text-slate-400 group-hover:text-teal-600 group-hover:rotate-90 transition-all duration-500" 
              />
            </div>

            <div className="text-xs text-slate-400 group-hover:text-teal-600 transition-colors flex items-center gap-1">
              <span>Clique para editar perfil</span>
              <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.button>

          <motion.button
            onClick={logout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition-all duration-300 font-medium shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={18} />
            <span className="text-sm">Sair da Conta</span>
          </motion.button>

          {/* Branding & Créditos */}
          <div className="mt-4 text-center space-y-2">
            <p className="text-xs text-slate-400">
              <span className="font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Cinesia
              </span>
              {' '} 2026
            </p>
            
            {/* 💝 Dedicatória */}
            <p className="text-xs text-slate-400">
              Feito com{' '}
              <span className="inline-block text-red-500 animate-pulse">❤️</span>
              {' '}por{' '}
              <span 
                className="font-medium text-slate-500 hover:text-teal-600 cursor-pointer transition-colors duration-300"
                title="Para a futura melhor Fisioterapeuta do mundo!"
              >
                Kauan Kelvin
              </span>
            </p>
          </div>
        </div>
      </motion.aside>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
});

// Display name for DevTools
Sidebar.displayName = 'Sidebar';

export default Sidebar;
