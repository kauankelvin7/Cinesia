/**
 * 🏷️ BADGE — Premium SaaS Design System
 * 
 * Semantic color tags with dot indicator and dark mode support.
 */

import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  color = null,
  size = 'md',
  dot = false,
  className = '' 
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    primary: 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    accent: 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    accent: 'bg-accent-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const customStyle = color ? {
    backgroundColor: `${color}12`,
    color: color,
  } : {};

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 
        font-medium 
        rounded-full
        transition-colors
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      style={color ? customStyle : {}}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
