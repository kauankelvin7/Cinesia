/**
 * 🏷️ BADGE
 * * Tags semânticas com suporte a ícones, pontos indicadores,
 * cores dinâmicas e tipografia refinada para máxima legibilidade.
 */

import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  color = null, // Aceita HEX customizado
  size = 'md',
  dot = false,
  icon: Icon = null, // Suporte a ícones do Lucide
  className = '',
  ...props
}) => {
  // Variantes semânticas com bordas translúcidas
  const variants = {
    default: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
    accent: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    accent: 'bg-purple-500',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-[11px] gap-1.5',
    lg: 'px-3 py-1 text-[13px] gap-2',
  };

  // Lógica de cor customizada vinda do banco (ex: cor da matéria)
  const customStyle = color ? {
    backgroundColor: `${color}15`, // 15% de opacidade
    color: color,
    borderColor: `${color}30`, // 30% de opacidade na borda
  } : {};

  return (
    <span
      className={`
        inline-flex items-center 
        font-bold uppercase tracking-wider
        rounded-full border shadow-sm
        transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      style={customStyle}
      {...props}
    >
      {/* Ponto indicador */}
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || 'bg-slate-400'}`} 
          style={color ? { backgroundColor: color } : {}}
        />
      )}

      {/* Ícone opcional */}
      {Icon && <Icon size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} strokeWidth={3} />}

      <span className="leading-none">{children}</span>
    </span>
  );
};

export default Badge;