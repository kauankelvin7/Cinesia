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
    primary: 'bg-teal-600 text-black hover:bg-teal-700 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-slate-900 hover:bg-teal-50 border border-slate-200',
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
  const baseClasses = 'bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300';
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
