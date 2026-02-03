/**
 * 🎨 BUTTON - Componente Hero Premium
 * 
 * Design System HealthTech - Botões modernos com gradientes e animações
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth - Se true, ocupa 100% da largura
 * @param {boolean} loading - Estado de carregamento
 * @param {boolean} disabled - Estado desabilitado
 * @param {ReactNode} leftIcon - Ícone à esquerda
 * @param {ReactNode} rightIcon - Ícone à direita
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
  // Estilos base
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-xl
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  // Variantes de estilo
  const variants = {
    primary: `
      bg-gradient-to-r from-teal-500 to-emerald-500
      text-white
      shadow-lg shadow-teal-500/25
      hover:shadow-xl hover:shadow-teal-500/30
      hover:from-teal-600 hover:to-emerald-600
      focus:ring-teal-500
      active:shadow-md
    `,
    secondary: `
      bg-white
      text-slate-700
      border-2 border-slate-200
      shadow-sm
      hover:border-teal-300 hover:text-teal-700
      hover:shadow-md hover:bg-teal-50/50
      focus:ring-teal-500
    `,
    ghost: `
      bg-transparent
      text-slate-600
      hover:bg-slate-100 hover:text-slate-900
      focus:ring-slate-400
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-rose-500
      text-white
      shadow-lg shadow-red-500/25
      hover:shadow-xl hover:shadow-red-500/30
      hover:from-red-600 hover:to-rose-600
      focus:ring-red-500
    `,
    glass: `
      bg-white/80 backdrop-blur-md
      text-slate-700
      border border-white/50
      shadow-lg
      hover:bg-white/90 hover:shadow-xl
      focus:ring-teal-500
    `,
  };

  // Tamanhos
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  // Spinner de loading
  const Spinner = () => (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
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
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Carregando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

// Exportar componentes auxiliares
export const ButtonGroup = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {children}
  </div>
);

export const IconButton = ({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <Button
      variant={variant}
      className={`${sizes[size]} !rounded-xl ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;
