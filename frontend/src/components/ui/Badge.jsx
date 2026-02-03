/**
 * 🏷️ BADGE - Etiquetas Coloridas Premium
 * 
 * Pequenas tags para categorização visual
 */

import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  color = null,
  size = 'md',
  className = '' 
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // Se uma cor customizada for passada
  const customStyle = color ? {
    backgroundColor: `${color}15`,
    color: color,
    borderColor: `${color}40`
  } : {};

  return (
    <span
      className={`
        inline-flex items-center gap-1 
        font-semibold 
        rounded-full 
        border
        transition-all
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      style={color ? customStyle : {}}
    >
      {children}
    </span>
  );
};

export default Badge;
