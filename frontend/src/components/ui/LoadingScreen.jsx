import React from 'react';
import Logo from '../Logo';

const LoadingScreen = ({ message = 'Preparando seu espaço de estudo…' }) => {
  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-slate-50/96 px-6 dark:bg-slate-950/96"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative grid h-20 w-20 place-items-center">
          <div
            className="absolute inset-0 rounded-[22px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            aria-hidden="true"
          />
          <div
            className="absolute -inset-1 animate-[spin_1.4s_linear_infinite] rounded-[26px] border border-transparent border-t-indigo-500/70"
            aria-hidden="true"
          />
          <div className="relative">
            <Logo size="medium" iconOnly />
          </div>
        </div>

        <p className="mt-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Cinesia
        </p>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
