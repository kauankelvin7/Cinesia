import React, { forwardRef, useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const fieldBase = `
  w-full
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-700
  rounded-lg
  text-sm font-medium
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  transition-colors duration-150
  focus:border-indigo-500 dark:focus:border-indigo-400
  focus:ring-2 focus:ring-indigo-500/10
  focus:outline-none
  disabled:bg-slate-50 dark:disabled:bg-slate-950
  disabled:text-slate-400 dark:disabled:text-slate-600
  disabled:cursor-not-allowed
`;

const fieldError = `
  border-red-400 dark:border-red-800
  focus:border-red-500 focus:ring-red-500/10
`;

function FieldMeta({ hint, error, hintId, errorId }) {
  if (error) {
    return (
      <p
        id={errorId}
        role="alert"
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
      >
        <AlertCircle size={14} aria-hidden="true" />
        {error}
      </p>
    );
  }

  if (hint) {
    return (
      <p id={hintId} className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    );
  }

  return null;
}

function FieldLabel({ htmlFor, label, required }) {
  if (!label) return null;

  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[13px] font-semibold text-slate-700 dark:text-slate-300"
    >
      {label}
      {required && (
        <>
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          <span className="sr-only"> obrigatório</span>
        </>
      )}
    </label>
  );
}

export const Input = forwardRef(({
  id,
  label,
  error,
  hint,
  className = '',
  required = false,
  leftIcon: LeftIcon = null,
  ...props
}, ref) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="w-full">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />

      <div className="group relative">
        {LeftIcon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
            {React.isValidElement(LeftIcon)
              ? LeftIcon
              : <LeftIcon size={18} strokeWidth={2} aria-hidden="true" />}
          </div>
        )}

        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`
            ${fieldBase}
            h-11 ${LeftIcon ? 'pl-10' : 'px-3.5'} pr-3.5
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      <FieldMeta hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});

Input.displayName = 'Input';

export const Select = forwardRef(({
  id,
  label,
  error,
  hint,
  children,
  className = '',
  required = false,
  ...props
}, ref) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="w-full">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />

      <div className="group relative">
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${fieldBase} h-11 appearance-none px-3.5 pr-10 ${error ? fieldError : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
        />
      </div>

      <FieldMeta hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});

Select.displayName = 'Select';

export const Textarea = forwardRef(({
  id,
  label,
  error,
  hint,
  className = '',
  required = false,
  rows = 4,
  ...props
}, ref) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="w-full">
      <FieldLabel htmlFor={fieldId} label={label} required={required} />
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${fieldBase} resize-y p-3.5 ${error ? fieldError : ''} ${className}`}
        {...props}
      />
      <FieldMeta hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
