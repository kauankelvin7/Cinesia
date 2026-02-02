import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';

const Layout = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Desktop: Sidebar */}
      {isDesktop && <Sidebar />}

      {/* Mobile/Tablet: Header com Logo e Theme Toggle */}
      {!isDesktop && (
        <motion.header
          className="fixed top-0 left-0 right-0 bg-surface border-b border-border z-40 px-4 py-3"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Logo size="small" />
            
            <motion.button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-brand-light text-brand-primary hover:bg-brand-hover/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                key={theme}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
              </motion.div>
            </motion.button>
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <main
        className={`
          transition-all duration-200
          ${isDesktop ? 'ml-64' : 'mt-16'}
        `}
      >
        {children}
      </main>

      {/* Mobile/Tablet: Bottom Navigation */}
      {!isDesktop && <BottomNavigation />}
    </div>
  );
};

export default Layout;
