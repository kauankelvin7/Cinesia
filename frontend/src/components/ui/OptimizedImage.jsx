/**
 * 🖼️ IMAGES
 * * Otimizado para evitar Layout Shift e economizar dados.
 * Efeito Blur-in suave para carregamento de alta fidelidade.
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OptimizedImage = memo(({
  src,
  alt = '',
  className = '',
  width,
  height,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"%3E%3Crect fill="%23f1f5f9" width="10" height="10"/%3E%3C/svg%3E',
  fallback = 'https://via.placeholder.com/400x300?text=Imagem+Indisponível',
  eager = false,
  onLoad,
  onError,
  style = {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(eager);
  const imgRef = useRef(null);

  useEffect(() => {
    if (eager || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 } // Margem maior para melhor UX
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/50 ${className}`}
      style={{
        width: width || '100%',
        aspectRatio: width && height ? `${width}/${height}` : 'auto',
        ...style
      }}
    >
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
          >
            {/* Skeleton Pulse */}
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <img
        src={hasError ? fallback : (isInView ? src : placeholder)}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`
          w-full h-full object-cover transition-all duration-700 ease-out
          ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'}
        `}
        style={{ willChange: 'transform, opacity, filter' }}
        {...props}
      />
    </div>
  );
});

/**
 * 👤 AVATAR IMAGE PREMIUM
 * Fallback elegante com gradiente e iniciais
 */
export const AvatarImage = memo(({ src, name = '', size = 40, className = '', ...props }) => {
  const [hasError, setHasError] = useState(false);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-white font-black shadow-inner ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        {...props}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={`rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      {...props}
    />
  );
});

export default OptimizedImage;