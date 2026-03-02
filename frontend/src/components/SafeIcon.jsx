import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as FiIcons from 'react-icons/fi';
import * as MdIcons from 'react-icons/md';
import * as BiIcons from 'react-icons/bi';

/**
 * SafeIcon - Componente seguro para renderização de ícones
 * Previne erros "Expected moveto path command" quando o ícone é inválido
 * 
 * @param {string} name - Nome do ícone (ex: "FaBook", "FiHome", "MdSchool")
 * @param {number} size - Tamanho do ícone em pixels
 * @param {string} className - Classes CSS adicionais
 * @param {string} color - Cor do ícone
 * @param {React.Component} fallback - Ícone de fallback customizado
 */
const SafeIcon = ({ 
  name, 
  size = 20, 
  className = '', 
  color, 
  fallback: FallbackIcon = FaIcons.FaBook,
  style,
  ...props 
}) => {
  // Se name não for fornecido, usa fallback
  if (!name) {
    return <FallbackIcon size={size} className={className} color={color} style={style} {...props} />;
  }

  // Tenta encontrar o ícone nas bibliotecas
  let IconComponent = null;

  try {
    // Verifica qual biblioteca usar baseado no prefixo
    if (name.startsWith('Fa')) {
      IconComponent = FaIcons[name];
    } else if (name.startsWith('Fi')) {
      IconComponent = FiIcons[name];
    } else if (name.startsWith('Md')) {
      IconComponent = MdIcons[name];
    } else if (name.startsWith('Bi')) {
      IconComponent = BiIcons[name];
    }

    // Se não encontrou com prefixo, tenta buscar em todas
    if (!IconComponent) {
      IconComponent = FaIcons[name] || FiIcons[name] || MdIcons[name] || BiIcons[name];
    }

    // Se ainda não encontrou, usa fallback
    if (!IconComponent || (typeof IconComponent !== 'function' && typeof IconComponent !== 'object')) {
      IconComponent = FallbackIcon;
    }

    return <IconComponent size={size} className={className} color={color} style={style} {...props} />;
  } catch (error) {
    console.error(`Erro ao renderizar ícone "${name}":`, error);
    return <FallbackIcon size={size} className={className} color={color} style={style} {...props} />;
  }
};

export default SafeIcon;
