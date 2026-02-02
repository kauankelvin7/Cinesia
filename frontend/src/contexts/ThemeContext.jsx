import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Inicialização: localStorage > system preference > 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('cinesia-theme');
    if (savedTheme) return savedTheme;
    
    // Fallback para preferência do sistema
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Aplica o tema no documentElement quando muda
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove todas as possíveis classes de tema
    root.classList.remove('light', 'dark');
    
    // Adiciona a classe do tema atual
    root.classList.add(theme);
    
    // Define color-scheme para melhor compatibilidade do navegador
    root.style.colorScheme = theme;
    
    // Persiste no localStorage
    localStorage.setItem('cinesia-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
