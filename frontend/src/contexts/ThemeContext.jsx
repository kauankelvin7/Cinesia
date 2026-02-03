/**
 * 🎨 THEME CONTEXT - Sistema de Temas Robusto
 * 
 * ESTRATÉGIA: Class-Based do Tailwind CSS
 * - Aplica classe 'dark' no <html> (documentElement)
 * - Respeita preferência do sistema operacional
 * - Persiste escolha do usuário no localStorage
 * - Sincroniza com color-scheme do navegador
 * 
 * PRIORIDADE DE INICIALIZAÇÃO:
 * 1. localStorage (escolha explícita do usuário)
 * 2. System Preference (prefers-color-scheme)
 * 3. Fallback: 'light'
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

const STORAGE_KEY = 'cinesia-theme';
const VALID_THEMES = ['light', 'dark'];

/**
 * Hook para acessar o contexto de tema
 * @throws {Error} Se usado fora do ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

/**
 * Provider do sistema de temas
 * Gerencia a lógica de troca entre light/dark mode
 */
export const ThemeProvider = ({ children }) => {
  // Inicialização inteligente do tema
  const [currentTheme, setCurrentTheme] = useState(() => {
    // 1. Tenta recuperar do localStorage
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && VALID_THEMES.includes(savedTheme)) {
      return savedTheme;
    }
    
    // 2. Fallback para preferência do sistema operacional
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // 3. Default: light mode
    return 'light';
  });

  // Aplica o tema no DOM sempre que mudar
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    // Remove ambas as classes (previne conflito)
    htmlElement.classList.remove('light', 'dark');
    
    // Adiciona a classe do tema atual (Tailwind reage a isso)
    htmlElement.classList.add(currentTheme);
    
    // Define color-scheme nativo do navegador (melhora renderização de formulários/scrollbars)
    htmlElement.style.colorScheme = currentTheme;
    
    // Persiste no localStorage
    localStorage.setItem(STORAGE_KEY, currentTheme);
  }, [currentTheme]);

  // Observa mudanças na preferência do sistema (opcional, mas profissional)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (event) => {
      // Só atualiza se o usuário não tiver uma preferência salva
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (!savedTheme) {
        setCurrentTheme(event.matches ? 'dark' : 'light');
      }
    };

    // Modern API (Safari 14+)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback para navegadores antigos
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  /**
   * Alterna entre light/dark mode
   */
  const toggleTheme = () => {
    setCurrentTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  /**
   * Define um tema específico
   * @param {string} newTheme - 'light' ou 'dark'
   */
  const setTheme = (newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setCurrentTheme(newTheme);
    } else {
      console.warn(`Tema inválido: ${newTheme}. Use 'light' ou 'dark'.`);
    }
  };

  const value = {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    isDarkMode: currentTheme === 'dark',
    isLightMode: currentTheme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
