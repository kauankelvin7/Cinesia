import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingLabel = 'Carregando…',
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
    rounded-lg
    transition-colors duration-150 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-45 disabled:cursor-not-allowed
    cursor-pointer select-none
  `;

  const variants = {
    primary: `
      bg-indigo-600 dark:bg-indigo-500
      text-white
      border border-indigo-600 dark:border-indigo-500
      shadow-sm
      hover:bg-indigo-700 dark:hover:bg-indigo-400
      focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-950
    `,
    secondary: `
      bg-white dark:bg-slate-900
      text-slate-700 dark:text-slate-200
      border border-slate-200 dark:border-slate-700
      shadow-sm
      hover:bg-slate-50 dark:hover:bg-slate-800
      hover:border-slate-300 dark:hover:border-slate-600
      focus-visible:ring-slate-400
    `,
    ghost: `
      bg-transparent
      text-slate-600 dark:text-slate-300
      border border-transparent
      hover:bg-slate-100 dark:hover:bg-slate-800
      hover:text-slate-900 dark:hover:text-white
      focus-visible:ring-slate-400
    `,
    danger: `
      bg-red-600 dark:bg-red-500
      text-white
      border border-red-600 dark:border-red-500
      shadow-sm
      hover:bg-red-700 dark:hover:bg-red-400
      focus-visible:ring-red-500
    `,
    glass: `
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
      text-slate-700 dark:text-slate-100
      border border-slate-200/80 dark:border-slate-700/80
      shadow-sm
      hover:bg-white dark:hover:bg-slate-800
      focus-visible:ring-indigo-500
    `,
  };

  const sizes = {
    xs: 'min-h-8 px-2.5 py-1.5 text-xs',
    sm: 'min-h-9 px-3.5 py-2 text-[13px]',
    md: 'min-h-10 px-5 py-2.5 text-sm',
    lg: 'min-h-12 px-6 py-3 text-[15px]',
    xl: 'min-h-13 px-7 py-3.5 text-base',
  };

  const Spinner = () => (
    <svg
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      whileHover={!disabled && !loading ? { y: -1 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export const ButtonGroup = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/60 ${className}`}>
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
    md: 'p-2.5',
    lg: 'p-3',
  };

  return (
    <Button
      variant={variant}
      className={`${iconPadding[size] || iconPadding.md} !min-h-0 !rounded-lg !px-0 !py-0 aspect-square ${className}`}
      aria-label={label}
      title={props.title || label}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;
