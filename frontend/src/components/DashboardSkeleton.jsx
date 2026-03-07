/**
 * 💀 DASHBOARD SKELETON - Loading State Premium v2.0
 * * Skeleton screens refinados para combinar com a nova UI arredondada.
 * Evita o "pulo" visual e mantém a identidade Cinesia durante o load.
 */

import React from 'react';

const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[22px] p-6 shadow-sm ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-20 mb-3"></div>
          <div className="h-10 bg-slate-100 dark:bg-slate-700/80 rounded-xl w-14"></div>
        </div>
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-[14px]"></div>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full w-full"></div>
    </div>
  </div>
);

const SkeletonMateriaCard = () => (
  <div className="bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40 rounded-[20px] p-5">
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-[14px]"></div>
        <div className="flex-1">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded-full w-1/2"></div>
        </div>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5"></div>
    </div>
  </div>
);

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen pb-32 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500">
      {/* Header Skeleton Premium */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1 animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-64 mb-3"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-80"></div>
            </div>
            <div className="w-44 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-[16px] animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton Area */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Matérias List */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-[28px] p-6 sm:p-8">
              <div className="animate-pulse mb-8 flex items-center justify-between">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-40"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-20"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonMateriaCard key={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Study Streak / Calendar */}
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-[28px] p-6 sm:p-8">
              <div className="animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-[16px]"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Outro widget skeleton se houver */}
            <div className="h-40 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-[28px] animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;