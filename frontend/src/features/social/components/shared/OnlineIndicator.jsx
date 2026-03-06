/**
 * @file OnlineIndicator.jsx
 * @description Bolinha verde/cinza que indica status online/offline do usuário.
 */

import React, { memo } from 'react';

const OnlineIndicator = memo(({ isOnline, isStudying, size = 'sm', className = '' }) => {
  const sizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  const colors = isStudying
    ? 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
    : isOnline
      ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
      : 'bg-slate-400 dark:bg-slate-600';

  return (
    <span
      className={`
        ${sizes[size] || sizes.sm}
        rounded-full inline-block shrink-0
        ${colors}
        ${isOnline || isStudying ? 'animate-pulse' : ''}
        ${className}
      `}
      title={isStudying ? 'Estudando agora' : isOnline ? 'Online' : 'Offline'}
      aria-label={isStudying ? 'Estudando agora' : isOnline ? 'Online' : 'Offline'}
    />
  );
});

OnlineIndicator.displayName = 'OnlineIndicator';
export default OnlineIndicator;
