import React, { memo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiBookOpen, FiLayers, FiCreditCard, FiEdit3, FiClipboard, FiCpu, FiMoreHorizontal, FiX } from 'react-icons/fi';

const BottomNavigation = memo(() => {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();

  // Itens principais (sempre visíveis na barra)
  const mainNavItems = [
    { path: '/', icon: FiHome, label: 'Início' },
    { path: '/materias', icon: FiBookOpen, label: 'Matérias' },
    { path: '/resumos', icon: FiLayers, label: 'Resumos' },
    { path: '/flashcards', icon: FiCreditCard, label: 'Cards' },
  ];

  // Itens extras (visíveis no menu expandido)
  const extraNavItems = [
    { path: '/simulado', icon: FiCpu, label: 'Simulados' },
    { path: '/consulta-rapida', icon: FiClipboard, label: 'Consultas' },
    { path: '/quadro-branco', icon: FiEdit3, label: 'Desenhar' },
  ];

  // Verifica se algum item extra está ativo
  const isExtraActive = extraNavItems.some(item => location.pathname === item.path);

  return (
    <>
      {/* Overlay para fechar o menu */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu expandido com itens extras */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 min-w-[280px] max-w-[320px]"
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Links de navegação */}
            <div className="flex flex-col gap-2">
              {extraNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-teal-50 text-teal-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de navegação principal */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-2 py-2 flex items-center justify-around z-50 safe-area-bottom"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {mainNavItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-teal-600'
                  : 'text-slate-500 hover:text-teal-600'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.95 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-semibold whitespace-nowrap">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-0.5 w-1 h-1 bg-teal-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}

        {/* Botão "Mais" para abrir menu extra */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative transition-all duration-200 min-w-[60px] ${
            showMore || isExtraActive
              ? 'text-teal-600'
              : 'text-slate-500 hover:text-teal-600'
          }`}
        >
          <motion.div
            className="flex flex-col items-center gap-0.5"
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: showMore ? 90 : 0 }}
          >
            {showMore ? (
              <FiX size={22} strokeWidth={2.5} />
            ) : (
              <FiMoreHorizontal size={22} strokeWidth={isExtraActive ? 2.5 : 2} />
            )}
            <span className="text-[10px] font-semibold whitespace-nowrap">
              {showMore ? 'Fechar' : 'Mais'}
            </span>
            {isExtraActive && !showMore && (
              <motion.div
                className="absolute -bottom-0.5 w-1 h-1 bg-teal-600 rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </motion.div>
        </button>
      </motion.nav>
    </>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;

