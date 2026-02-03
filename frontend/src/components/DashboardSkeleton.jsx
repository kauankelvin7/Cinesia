/**
 * 💀 DASHBOARD SKELETON - Loading State Premium
 * 
 * Skeleton screens para evitar FOUC (Flash of Unstyled Content)
 * e melhorar a percepção de performance
 */

import { motion } from 'framer-motion';

const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white border border-slate-100 rounded-xl p-6 shadow-sm ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gradient-to-r from-teal-200 to-emerald-200 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-xl"></div>
      </div>
    </div>
  </div>
);

const SkeletonMateriaCard = () => (
  <div className="bg-white border border-slate-100 rounded-xl p-4">
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
        <div className="flex-1">
          <div className="h-5 bg-slate-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2"></div>
    </div>
  </div>
);

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 pb-32 transition-colors duration-200">
      {/* Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 animate-pulse">
              <div className="h-9 bg-gradient-to-r from-teal-200 to-emerald-200 rounded-lg w-64 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-96"></div>
            </div>
            <div className="w-40 h-12 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Matérias */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <div className="animate-pulse mb-6">
                <div className="h-6 bg-slate-300 rounded w-48"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonMateriaCard key={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Calendar */}
          <div>
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-slate-300 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-slate-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
