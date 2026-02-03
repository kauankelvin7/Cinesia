import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiBookOpen, FiLayers, FiCreditCard, FiEdit3 } from 'react-icons/fi';

const BottomNavigation = memo(() => {
  const navItems = [
    { path: '/', icon: FiHome, label: 'Início' },
    { path: '/materias', icon: FiBookOpen, label: 'Matérias' },
    { path: '/resumos', icon: FiLayers, label: 'Resumos' },
    { path: '/flashcards', icon: FiCreditCard, label: 'Cards' },
    { path: '/quadro-branco', icon: FiEdit3, label: 'Desenhar' },
  ];

  return (
    <motion.nav 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-2xl shadow-lg px-6 py-3 flex items-center gap-6 z-50 bottom-nav-safe"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {navItems.map((item, index) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 px-3 py-2 rounded-xl relative transition-all duration-200 ${
              isActive 
                ? 'text-teal-600' 
                : 'text-slate-500 hover:text-teal-600'
            }`
          }
        >
          {({ isActive }) => (
            <motion.div
              className="flex flex-col items-center gap-1"
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1.5 w-1 h-1 bg-teal-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.div>
          )}
        </NavLink>
      ))}
    </motion.nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;

