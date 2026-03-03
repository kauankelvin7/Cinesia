/**
 * 🎯 FOCUS MODE CONTEXT
 * 
 * Modo foco: esconde sidebar, bottom nav e utilitários flutuantes.
 * Usado durante sessões de estudo para minimizar distrações.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const FocusModeContext = createContext({
  focusMode: false,
  enterFocusMode: () => {},
  exitFocusMode: () => {},
  toggleFocusMode: () => {},
});

export const FocusModeProvider = ({ children }) => {
  const [focusMode, setFocusMode] = useState(false);

  const enterFocusMode = useCallback(() => setFocusMode(true), []);
  const exitFocusMode = useCallback(() => setFocusMode(false), []);
  const toggleFocusMode = useCallback(() => setFocusMode(f => !f), []);

  return (
    <FocusModeContext.Provider value={{ focusMode, enterFocusMode, exitFocusMode, toggleFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => useContext(FocusModeContext);

export default FocusModeContext;
