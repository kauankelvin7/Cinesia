import React, { memo } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as FiIcons from 'react-icons/fi';
import * as MdIcons from 'react-icons/md';
import * as BiIcons from 'react-icons/bi';

/**
 * 🛡️ SafeIcon Premium
 * Resolve dinamicamente ícones salvos como string no banco de dados.
 * Otimizado para performance com React.memo.
 */
const SafeIcon = memo(({ 
  name, 
  size = 20, 
  className = '', 
  color, 
  fallback: FallbackIcon = FaIcons.FaBook,
  style,
  ...props 
}) => {
  // 1. Fallback imediato se não houver nome
  if (!name) {
    return <FallbackIcon size={size} className={className} color={color} style={style} {...props} />;
  }

  const getIcon = () => {
    try {
      // 2. Busca otimizada por prefixo
      if (name.startsWith('Fa')) return FaIcons[name];
      if (name.startsWith('Fi')) return FiIcons[name];
      if (name.startsWith('Md')) return MdIcons[name];
      if (name.startsWith('Bi')) return BiIcons[name];

      // 3. Varredura global se o prefixo falhar
      return (
        FaIcons[name] || 
        FiIcons[name] || 
        MdIcons[name] || 
        BiIcons[name] || 
        FallbackIcon
      );
    } catch (error) {
      return FallbackIcon;
    }
  };

  const IconComponent = getIcon();

  // 4. Verificação de segurança final: garante que é um componente válido
  const isValid = IconComponent && (typeof IconComponent === 'function' || typeof IconComponent === 'object');
  const FinalIcon = isValid ? IconComponent : FallbackIcon;

  return (
    <FinalIcon 
      size={size} 
      className={className} 
      style={{ 
        color: color, 
        flexShrink: 0, // Garante que o ícone não amasse em layouts flex
        ...style 
      }} 
      {...props} 
    />
  );
});

SafeIcon.displayName = 'SafeIcon';

export default SafeIcon;