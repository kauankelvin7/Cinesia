/**
 * 🎨 BUTTON
 * * Variants: primary (gradient), secondary (outlined), ghost, danger, glass
 * Features: loading spinner, haptic feedback integration, scale micro-interaction.
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
    inline-flex items-center justify-center gap-2.5
    font-bold tracking-tight
    rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
    cursor-pointer select-none
  `;

  const variants = {
    primary: `
      bg-gradient-to-br from-indigo-500 via-indigo-600 to-teal-500
      text-white
      shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]
      hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)]
      hover:brightness-110
      focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900
    `,
    secondary: `
      bg-white dark:bg-slate-800
      text-slate-700 dark:text-slate-200
      border border-slate-200 dark:border-slate-700
      shadow-sm
      hover:bg-slate-50 dark:hover:bg-slate-700/50
      hover:border-slate-300 dark:hover:border-slate-600
      focus-visible:ring-slate-400
    `,
    ghost: `
      bg-transparent
      text-slate-500 dark:text-slate-400
      hover:bg-slate-100 dark:hover:bg-slate-800
      hover:text-slate-900 dark:hover:text-slate-100
      focus-visible:ring-slate-400
    `,
    danger: `
      bg-gradient-to-br from-red-500 to-rose-600
      text-white
      shadow-[0_4px_14px_0_rgba(239,68,68,0.3)]
      hover:shadow-[0_6px_20px_rgba(239,68,68,0.2)]
      hover:brightness-110
      focus-visible:ring-red-500
    `,
    glass: `
      bg-white/10 dark:bg-slate-800/20 backdrop-blur-md
      text-slate-700 dark:text-white
      border border-white/20 dark:border-slate-700/50
      shadow-xl
      hover:bg-white/20 dark:hover:bg-slate-800/40
      focus-visible:ring-indigo-500
    `,
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-[11px] uppercase tracking-widest',
    sm: 'px-4 py-2 text-[13px]',
    md: 'px-6 py-3 text-[14px]',
    lg: 'px-8 py-3.5 text-[16px]',
    xl: 'px-10 py-4.5 text-[18px]',
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
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.96, y: 0 } : {}}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="font-bold">Aguarde...</span>
        </div>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0 opacity-90 transition-transform group-hover:scale-110">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="flex-shrink-0 opacity-90 transition-transform group-hover:scale-110">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export const ButtonGroup = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800 ${className}`}>
    {children}
  </div>
);

export const IconButton = ({
  icon,
  variant = 'secondary',
  size = 'md',
  label,
  className = '',
  ...props
}) => {
  const iconPadding = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <Button
      variant={variant}
      className={`${iconPadding[size]} !rounded-xl min-w-0 ${className}`}
      aria-label={label}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;