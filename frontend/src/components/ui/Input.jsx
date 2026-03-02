/**
 * 📝 INPUT — Premium SaaS Design System
 * 
 * Features: focus glow, left icon, dark mode, error states
 * Exports: Input, Select, Textarea
 */

import React, { forwardRef } from 'react';

const fieldBase = `
  w-full
  bg-white dark:bg-slate-800
  border border-slate-200 dark:border-slate-700
  rounded-[10px]
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  transition-all duration-200 ease-out
  focus:border-primary-500 dark:focus:border-primary-400
  focus:ring-[3px] focus:ring-primary-500/15 dark:focus:ring-primary-400/20
  focus:outline-none
  disabled:bg-slate-50 dark:disabled:bg-slate-900
  disabled:text-slate-400 dark:disabled:text-slate-600
  disabled:cursor-not-allowed
`;

const fieldError = 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/15';

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
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative group">
        {LeftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors">
            {React.isValidElement(LeftIcon) ? LeftIcon : <LeftIcon size={18} />}
          </div>
        )}
        <input
          ref={ref}
          className={`
            ${fieldBase}
            h-10 ${LeftIcon ? 'pl-11' : 'px-3.5'} pr-3.5
            text-sm
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

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
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            ${fieldBase}
            h-10 px-3.5 pr-10
            text-sm
            appearance-none cursor-pointer
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({ 
  label, 
  error, 
  hint,
  className = '', 
  required = false,
  rows = 4,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          ${fieldBase}
          px-3.5 py-2.5
          text-sm
          resize-none
          ${error ? fieldError : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
