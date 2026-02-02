import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiBook, FiFileText, FiLayers, FiSun, FiMoon } from 'react-icons/fi';
import Logo from './Logo';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();

  const links = [
    { to: '/', icon: FiHome, label: 'Home' },
    { to: '/materias', icon: FiBook, label: 'Matérias' },
    { to: '/resumos', icon: FiFileText, label: 'Resumos' },
    { to: '/flashcards', icon: FiLayers, label: 'Flashcards' },
  ];

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border z-50 flex flex-col"
      initial={{ x: -264 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Logo size="medium" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link, index) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-light text-brand-primary font-semibold'
                  : 'text-text-secondary hover:bg-brand-light/50'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex items-center gap-3 w-full"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <link.icon
                  size={20}
                  className={isActive ? 'text-brand-primary' : ''}
                />
                <span className="font-semibold">{link.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border">
        <motion.button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-brand-light text-brand-primary hover:bg-brand-hover/20 transition-all duration-200 font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </motion.div>
          <span className="font-semibold">
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </motion.button>

        {/* Info Footer */}
        <div className="mt-4 text-center text-xs text-text-tertiary">
          Cinesia © 2026
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
