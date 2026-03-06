/**
 * @file StreakComparison.jsx
 * @description Card de comparação de ofensiva: "Você: 5🔥 vs Amigo: 12🔥"
 */

import React, { memo } from 'react';

const StreakComparison = memo(({ myStreak = 0, friendStreak = 0, friendName = 'Amigo' }) => {
  const myWinning = myStreak > friendStreak;
  const tied = myStreak === friendStreak;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <div className={`flex items-center gap-1.5 ${myWinning ? 'font-bold' : ''}`}>
        <span className="text-sm text-slate-700 dark:text-slate-300">Você</span>
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {myStreak} 🔥
        </span>
      </div>

      <span className="text-xs text-slate-400 font-medium">vs</span>

      <div className={`flex items-center gap-1.5 ${!myWinning && !tied ? 'font-bold' : ''}`}>
        <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-20">
          {friendName}
        </span>
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {friendStreak} 🔥
        </span>
      </div>

      {myWinning && (
        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium ml-auto">
          +{myStreak - friendStreak}
        </span>
      )}
      {!myWinning && !tied && (
        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium ml-auto">
          -{friendStreak - myStreak}
        </span>
      )}
    </div>
  );
});

StreakComparison.displayName = 'StreakComparison';
export default StreakComparison;
