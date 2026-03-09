/**
 * SkeletonPulse - Simple loading skeleton with pulse animation
 * Used as a placeholder while data is loading
 */

const SkeletonPulse = ({ className = '' }) => (
  <div 
    className={`animate-pulse rounded-lg bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 ${className}`}
  />
);

export default SkeletonPulse;
