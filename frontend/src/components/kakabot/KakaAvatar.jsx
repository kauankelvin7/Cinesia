import React from 'react';
import { Dna } from 'lucide-react';

const sizes = {
  sm: { container: 32, icon: 16, radius: 10 },
  md: { container: 46, icon: 22, radius: 14 },
  lg: { container: 58, icon: 26, radius: 18 },
};

const KakaAvatar = ({ size = 'md', speaking = false, showStatus = false }) => {
  const s = sizes[size];
  return (
    <div className="relative flex-shrink-0" style={{ width: s.container, height: s.container }}>
      {/* Anel pulsante quando o bot está respondendo */}
      {speaking && (
        <div
          className="absolute inset-0 animate-ping"
          style={{
            borderRadius: s.radius,
            background: 'rgba(13,148,136,0.3)',
          }}
        />
      )}
      <div
        className="w-full h-full flex items-center justify-center shadow-md"
        style={{
          borderRadius: s.radius,
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #0891b2 100%)',
          border: size === 'md' ? '1.5px solid rgba(255,255,255,0.28)' : 'none',
        }}
      >
        <Dna size={s.icon} color="#fff" strokeWidth={1.6} />
      </div>
      {/* Bolinha de status online */}
      {showStatus && (
        <span
          className="absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"
          style={{ width: 12, height: 12, background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.7)' }}
        />
      )}
    </div>
  );
};

export default KakaAvatar;
