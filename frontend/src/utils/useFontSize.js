/**
 * 🔍 useFontSize Hook - Acessibilidade a11y
 * 
 * Sistema de controle de tamanho de fonte baseado em root font-size.
 * Como o Tailwind usa `rem` units, alterar o font-size do <html>
 * escala todo o layout proporcionalmente.
 * 
 * Níveis:
 * - Normal: 16px (padrão)
 * - Grande: 18px (+12.5%)
 * - Extra Grande: 20px (+25%)
 * 
 * Persistência: localStorage
 */

import { useState, useEffect } from 'react';

const FONT_SIZES = {
  normal: 16,
  grande: 18,
  extraGrande: 20,
};

const STORAGE_KEY = 'cinesia-font-size';

export const useFontSize = () => {
  const [fontSize, setFontSize] = useState(() => {
    // Carregar do localStorage ou usar padrão
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || 'normal';
  });

  useEffect(() => {
    // Aplicar o tamanho de fonte no elemento <html>
    const htmlElement = document.documentElement;
    const size = FONT_SIZES[fontSize];
    
    htmlElement.style.fontSize = `${size}px`;
    
    // Salvar no localStorage
    localStorage.setItem(STORAGE_KEY, fontSize);
  }, [fontSize]);

  const increaseFontSize = () => {
    setFontSize(current => {
      if (current === 'normal') return 'grande';
      if (current === 'grande') return 'extraGrande';
      return 'extraGrande'; // já está no máximo
    });
  };

  const decreaseFontSize = () => {
    setFontSize(current => {
      if (current === 'extraGrande') return 'grande';
      if (current === 'grande') return 'normal';
      return 'normal'; // já está no mínimo
    });
  };

  const resetFontSize = () => {
    setFontSize('normal');
  };

  const setSpecificSize = (size) => {
    if (FONT_SIZES[size]) {
      setFontSize(size);
    }
  };

  return {
    fontSize,
    fontSizeValue: FONT_SIZES[fontSize],
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    setSpecificSize,
    isMinSize: fontSize === 'normal',
    isMaxSize: fontSize === 'extraGrande',
  };
};

export default useFontSize;
