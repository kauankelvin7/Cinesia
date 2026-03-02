/**
 * 🎨 BUTTON — Premium SaaS Design System
 * 
 * Variants: primary (gradient), secondary (outlined), ghost, danger, accent
 * Features: loading spinner, icons, scale micro-interaction, dark mode
 */

import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold
    rounded-[10px]
    transition-all duration-150 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    cursor-pointer select-none
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600
      text-white
      shadow-sm hover:shadow-glow-primary
      hover:from-primary-600 hover:to-primary-700
      focus-visible:ring-primary-500
      active:from-primary-700 active:to-primary-800
    `,
    secondary: `
      bg-transparent
      text-primary-600 dark:text-primary-400
      border-[1.5px] border-primary-200 dark:border-primary-800
      hover:bg-primary-50 dark:hover:bg-primary-950
      hover:border-primary-300 dark:hover:border-primary-700
      focus-visible:ring-primary-500
    `,
    ghost: `
      bg-transparent
      text-slate-600 dark:text-slate-300
      hover:bg-slate-100 dark:hover:bg-slate-800
      hover:text-slate-900 dark:hover:text-slate-100
      focus-visible:ring-slate-400
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600
      text-white
      shadow-sm
      hover:from-red-600 hover:to-red-700
      focus-visible:ring-red-500
      active:from-red-700 active:to-red-800
    `,
    accent: `
      bg-gradient-to-r from-accent-500 to-accent-600
      text-white
      shadow-sm hover:shadow-glow-accent
      hover:from-accent-600 hover:to-accent-700
      focus-visible:ring-accent-500
    `,
    glass: `
      bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
      text-slate-700 dark:text-slate-200
      border border-slate-200/60 dark:border-slate-700/60
      shadow-sm
      hover:bg-white dark:hover:bg-slate-800 hover:shadow-md
      focus-visible:ring-primary-500
    `,
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Aguarde...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0 -ml-0.5">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0 -mr-0.5">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export const ButtonGroup = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {children}
  </div>
);

export const IconButton = ({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  ...props
}) => {
  const iconSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  return (
    <Button
      variant={variant}
      className={`${iconSizes[size]} !rounded-xl ${className}`}
      aria-label={label}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;
