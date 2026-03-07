import React from 'react';
import { Dna } from 'lucide-react';
import { motion } from 'framer-motion';

const sizes = {
  sm: { container: 'w-8 h-8', icon: 16 },
  md: { container: 'w-11 h-11', icon: 20 },
  lg: { container: 'w-[58px] h-[58px]', icon: 26 },
};

const KakaAvatar = ({ size = 'md', speaking = false, showStatus = false }) => {
  const s = sizes[size];

  return (
    <div className={`relative flex-shrink-0 ${s.container}`}>
      {/* Anel pulsante suave quando o bot está respondendo (Substituindo o animate-ping brusco) */}
      {speaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'linear-gradient(135deg, #0f766e, #0891b2)' }}
          animate={{ 
            scale: [1, 1.4, 1], 
            opacity: [0.4, 0, 0.4] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      )}

      {/* Avatar Principal */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center shadow-md relative z-10"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #0891b2 100%)',
          border: size === 'md' 
            ? '1.5px solid rgba(255,255,255,0.28)' 
            : '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <Dna size={s.icon} color="#fff" strokeWidth={2} />
      </div>

      {/* Bolinha de status online (com verde esmeralda mais vibrante) */}
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 border-2 border-white dark:border-slate-900 rounded-full bg-emerald-400 z-20"
          style={{ 
            width: 12, 
            height: 12, 
            boxShadow: '0 0 8px rgba(52,211,153,0.6)' 
          }}
        />
      )}
    </div>
  );
};

export default KakaAvatar;