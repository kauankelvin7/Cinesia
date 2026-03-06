/**
 * @file UserAvatar.jsx
 * @description Componente reutilizável de avatar de usuário com fallback gracioso.
 * 
 * Resolve o problema de imagens bloqueadas por Tracking Prevention (Edge/Safari)
 * quando a foto vem do Cloudinary, usando `referrerPolicy="no-referrer"`.
 * 
 * Se a imagem falhar (blocked, 404, CORS), mostra as iniciais do nome
 * com um gradiente consistente baseado no nome do usuário.
 */

import React, { useState, memo } from 'react';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-green-500 to-teal-600',
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-cyan-600',
];

/**
 * @param {Object} props
 * @param {string} [props.photoURL] - URL da foto do usuário
 * @param {string} [props.displayName] - Nome de exibição do usuário
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md'] - Tamanho do avatar
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {React.CSSProperties} [props.style] - Estilos inline adicionais
 */
const UserAvatar = memo(({ photoURL, displayName, size = 'md', className = '', style }) => {
  const [imgError, setImgError] = useState(false);

  const initial = displayName?.[0]?.toUpperCase() ?? '?';
  const sizeClass = SIZES[size] || SIZES.md;

  // Gradiente determinístico baseado no nome (mesmo nome = mesma cor)
  const gradientIndex = (displayName?.charCodeAt(0) ?? 0) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        style={style}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-linear-to-br ${gradient} flex items-center justify-center font-bold text-white shrink-0 ${className}`}
      style={style}
      aria-label={displayName || 'Avatar'}
    >
      {initial}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
