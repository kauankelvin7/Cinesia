/**
 * 🖼️ OPTIMIZED IMAGE - Imagem Otimizada com Lazy Loading
 * 
 * Otimizações para dispositivos móveis:
 * - Lazy loading nativo (loading="lazy")
 * - Placeholder de baixa qualidade (LQIP)
 * - Fallback para erros de carregamento
 * - Suporte a srcset para diferentes densidades
 * - Decode assíncrono para não bloquear main thread
 * 
 * Performance:
 * - Imagens abaixo da dobra só carregam quando visíveis
 * - Usa IntersectionObserver para detecção eficiente
 */

import React, { useState, useRef, useEffect, memo } from 'react';

const OptimizedImage = memo(({
  src,
  alt = '',
  className = '',
  width,
  height,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3C/svg%3E',
  fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14"%3EImagem indisponível%3C/text%3E%3C/svg%3E',
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

  // IntersectionObserver para lazy loading customizado
  useEffect(() => {
    if (eager || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Preload 100px antes de entrar na viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [eager]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  const imageSrc = hasError ? fallback : (isInView ? src : placeholder);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        ...style
      }}
    >
      {/* Placeholder/Skeleton */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-slate-100 animate-pulse"
          style={{ 
            backgroundImage: `url("${placeholder}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Imagem real */}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          willChange: 'opacity',
          contentVisibility: 'auto'
        }}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

/**
 * 🎭 AVATAR IMAGE - Avatar otimizado com fallback de iniciais
 */
export const AvatarImage = memo(({
  src,
  name = '',
  size = 40,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-primary-600 text-white font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        {...props}
      >
        {initials || '?'}
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
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      {...props}
    />
  );
});

AvatarImage.displayName = 'AvatarImage';
