/**
 * THEME CONTEXT — 3-way theme (light / dark / system)
 * Applies 'dark' class on <html>, syncs with OS preference when mode=system.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext(undefined);

const STORAGE_KEY = 'cinesia-theme';
const VALID_MODES = ['light', 'dark', 'system'];

const getSystemPreference = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  // mode = user preference: 'light' | 'dark' | 'system'
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && VALID_MODES.includes(saved) ? saved : 'system';
  });

  // resolved = actual applied theme: 'light' | 'dark'
  const [resolved, setResolved] = useState(() =>
    mode === 'system' ? getSystemPreference() : mode
  );

  // Apply class + color-scheme on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(resolved);
    html.style.colorScheme = resolved;
  }, [resolved]);

  // Persist mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    if (mode !== 'system') setResolved(mode);
    else setResolved(getSystemPreference());
  }, [mode]);

  // Watch OS changes when mode=system
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setResolved(e.matches ? 'dark' : 'light');
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      mq.addListener?.(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener?.(handler);
      }
    };
  }, [mode]);

  const setMode = useCallback((m) => {
    if (VALID_MODES.includes(m)) setModeState(m);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => (prev === 'dark' || (prev === 'system' && resolved === 'dark') ? 'light' : 'dark'));
  }, [resolved]);

  const value = useMemo(() => ({
    mode,          // 'light' | 'dark' | 'system'
    theme: resolved,   // 'light' | 'dark' (actual)
    setMode,
    setTheme: setMode, // alias
    toggleTheme,
    isDarkMode: resolved === 'dark',
    isLightMode: resolved === 'light',
  }), [mode, resolved, setMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
