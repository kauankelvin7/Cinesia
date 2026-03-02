import React from 'react';
import { BookOpen } from 'lucide-react';

/**
 * IconWrapper - Componente seguro para renderizar ícones
 * Previne erros de SVG quando o ícone é undefined/null
 */
const IconWrapper = ({ icon: Icon, fallbackIcon: FallbackIcon = BookOpen, className = '', size, ...props }) => {
  // Verifica se o ícone é válido
  if (!Icon || typeof Icon !== 'function') {
    return <FallbackIcon className={className} size={size} {...props} />;
  }

  try {
    return <Icon className={className} size={size} {...props} />;
  } catch (error) {
    console.warn('Erro ao renderizar ícone:', error);
    return <FallbackIcon className={className} size={size} {...props} />;
  }
};

export default IconWrapper;
