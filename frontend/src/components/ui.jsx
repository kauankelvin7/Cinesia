import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick, 
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'px-6 py-3.5 rounded-xl font-semibold transition-all duration-200';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-hover shadow-md hover:shadow-lg',
    secondary: 'bg-surface-elevated text-text-primary hover:bg-brand-light border border-border',
  };

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Card = ({ children, className = '', interactive = false, as: Component = 'div', ...props }) => {
  const baseClasses = 'bg-surface rounded-2xl shadow-sm border border-border p-6 transition-all duration-300';
  const interactiveClasses = interactive ? 'cursor-pointer hover:shadow-md hover:border-brand-primary hover:scale-[1.01] active:scale-[0.99]' : '';

  return (
    <Component className={`${baseClasses} ${interactiveClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all ${className}`}
      {...props}
    />
  );
};

export const TextArea = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none ${className}`}
      {...props}
    />
  );
};
