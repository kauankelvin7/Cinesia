/**
 * 📝 INPUT - Componentes de Formulário Premium
 * 
 * Inputs e Selects estilizados no padrão Clean HealthTech
 */

import React from 'react';

export const Input = ({ 
  label, 
  error, 
  className = '', 
  required = false,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          w-full h-11 px-4 
          bg-white border-2 border-slate-200 
          rounded-xl 
          text-slate-900 placeholder-slate-400
          transition-all duration-200
          focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

export const Select = ({ 
  label, 
  error, 
  children, 
  className = '', 
  required = false,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full h-11 px-4 
          bg-white border-2 border-slate-200 
          rounded-xl 
          text-slate-900
          transition-all duration-200
          focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          appearance-none cursor-pointer
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({ 
  label, 
  error, 
  className = '', 
  required = false,
  rows = 4,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full px-4 py-3 
          bg-white border-2 border-slate-200 
          rounded-xl 
          text-slate-900 placeholder-slate-400
          transition-all duration-200
          focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;
