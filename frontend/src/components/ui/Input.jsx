/**
 * 📝 INPUT
 * * Features: Focus glow dinâmico, suporte a ícones, estados de erro semânticos
 * Exports: Input, Select, Textarea
 */

import React, { forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const fieldBase = `
  w-full
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-800
  rounded-xl
  text-[14px] font-medium
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-600
  transition-all duration-300 ease-in-out
  focus:border-indigo-400 dark:focus:border-indigo-500
  focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/5
  focus:outline-none
  disabled:bg-slate-50 dark:disabled:bg-slate-950
  disabled:text-slate-400 dark:disabled:text-slate-600
  disabled:cursor-not-allowed
  shadow-sm
`;

const fieldError = `
  border-red-300 dark:border-red-900/50 
  bg-red-50/30 dark:bg-red-950/10 
  focus:border-red-500 focus:ring-red-500/10
`;

/* ─── Input Component ─── */
export const Input = forwardRef(({ 
  label, 
  error, 
  hint,
  className = '', 
  required = false,
  leftIcon: LeftIcon = null,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 tracking-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {LeftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300 pointer-events-none">
            {React.isValidElement(LeftIcon) ? LeftIcon : <LeftIcon size={18} strokeWidth={2.5} />}
          </div>
        )}
        <input
          ref={ref}
          className={`
            ${fieldBase}
            h-12 ${LeftIcon ? 'pl-11' : 'px-4'} pr-4
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-2 ml-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">{hint}</p>
      )}
      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
          className="mt-2 ml-1 text-[12px] font-bold text-red-500 flex items-center gap-1.5"
        >
          <AlertCircle size={14} strokeWidth={3} />
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/* ─── Select Component ─── */
export const Select = forwardRef(({ 
  label, 
  error, 
  children, 
  className = '', 
  required = false,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 tracking-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        <select
          ref={ref}
          className={`
            ${fieldBase}
            h-12 px-4 pr-10
            appearance-none cursor-pointer
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>
      </div>
      {error && (
        <p className="mt-2 ml-1 text-[12px] font-bold text-red-500 flex items-center gap-1.5">
          <AlertCircle size={14} strokeWidth={3} />
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

/* ─── Textarea Component ─── */
export const Textarea = forwardRef(({ 
  label, 
  error, 
  hint,
  className = '', 
  required = false,
  rows = 4,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 tracking-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          ${fieldBase}
          p-4
          resize-none
          ${error ? fieldError : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p className="mt-2 ml-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">{hint}</p>
      )}
      {error && (
        <p className="mt-2 ml-1 text-[12px] font-bold text-red-500 flex items-center gap-1.5">
          <AlertCircle size={14} strokeWidth={3} />
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;