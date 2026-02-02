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
    <div className="min-h-screen bg-white">
      {/* Desktop: Sidebar */}
      {isDesktop && <Sidebar />}

      {/* Mobile/Tablet: Header com Logo e Theme Toggle */}
      {!isDesktop && (
        <motion.header
          className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Logo size="small" />
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
