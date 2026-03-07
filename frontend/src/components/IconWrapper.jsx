import React from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * IconWrapper Premium - Componente seguro e animado para ícones
 * Previne erros de renderização e padroniza o visual do sistema.
 */
const IconWrapper = ({ 
  icon: Icon, 
  fallbackIcon: FallbackIcon = BookOpen, 
  className = '', 
  size = 20, 
  strokeWidth = 2,
  animate = false, // Ativa animações de entrada/interação
  ...props 
}) => {
  
  // Lógica de renderização segura
  const renderIcon = (Component) => {
    try {
      return (
        <Component 
          className={className} 
          size={size} 
          strokeWidth={strokeWidth} 
          {...props} 
        />
      );
    } catch (error) {
      console.warn('Erro ao renderizar ícone:', error);
      return (
        <FallbackIcon 
          className={className} 
          size={size} 
          strokeWidth={strokeWidth} 
          {...props} 
        />
      );
    }
  };

  // Se o ícone não for válido, retorna o fallback imediatamente
  if (!Icon || typeof Icon !== 'function') {
    return renderIcon(FallbackIcon);
  }

  // Se 'animate' for true, envolvemos em motion para efeitos premium
  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="inline-flex items-center justify-center"
      >
        {renderIcon(Icon)}
      </motion.div>
    );
  }

  return renderIcon(Icon);
};

export default IconWrapper;