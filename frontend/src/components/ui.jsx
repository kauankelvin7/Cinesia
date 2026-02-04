import React from 'react';
import { motion } from 'framer-motion';
import { hapticClick, hapticSuccess, hapticError, hapticHeavy } from '../utils/haptics';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick,
  haptic = 'click', // 'click' | 'success' | 'error' | 'heavy' | 'none'
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'px-6 py-3.5 rounded-xl font-semibold transition-all duration-200';
  
  const variants = {
    primary: 'bg-teal-600 text-black hover:bg-teal-700 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-slate-900 hover:bg-teal-50 border border-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg',
  };

  // Haptic feedback handlers
  const hapticHandlers = {
    click: hapticClick,
    success: hapticSuccess,
    error: hapticError,
    heavy: hapticHeavy,
    none: () => {},
  };

  const handleClick = (e) => {
    // Trigger haptic feedback
    const hapticFn = hapticHandlers[haptic] || hapticClick;
    hapticFn();
    
    // Call original onClick
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Card = ({ children, className = '', interactive = false, as: Component = 'div', onClick, ...props }) => {
  const baseClasses = 'bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300';
  const interactiveClasses = interactive ? 'cursor-pointer hover:shadow-md hover:border-brand-primary' : '';

  const handleClick = (e) => {
    if (interactive) {
      hapticClick();
    }
    if (onClick) onClick(e);
  };

  // Use motion.div for interactive cards
  if (interactive) {
    return (
      <motion.div 
        className={`${baseClasses} ${interactiveClasses} ${className}`} 
        onClick={handleClick}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Component className={`${baseClasses} ${className}`} onClick={onClick} {...props}>
      {children}
    </Component>
  );
};

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all ${className}`}
      {...props}
    />
  );
};

export const TextArea = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all resize-none ${className}`}
      {...props}
    />
  );
};
