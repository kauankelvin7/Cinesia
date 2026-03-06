/**
 * @file NotificationBadge.jsx
 * @description Contador de notificações não lidas (bolinha vermelha com número).
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBadge = memo(({ count, size = 'md', className = '' }) => {
  const sizeClasses = size === 'sm'
    ? 'min-w-4 h-4 text-[8px]'
    : 'min-w-4.5 h-4.5 text-[10px]';

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={`
            absolute flex items-center justify-center
            ${sizeClasses} px-1
            font-bold text-white
            bg-red-500 rounded-full
            shadow-[0_0_8px_rgba(239,68,68,0.5)]
            ${className}
          `}
        >
          {count > 99 ? '99+' : count > 9 ? '9+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
});

NotificationBadge.displayName = 'NotificationBadge';
export default NotificationBadge;
