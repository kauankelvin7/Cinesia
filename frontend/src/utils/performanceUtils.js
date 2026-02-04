/**
 * 🚀 PERFORMANCE UTILS - Utilitários para Otimização de Performance
 * 
 * Ferramentas para garantir fluidez em dispositivos low-end:
 * - Detecção de dispositivos de baixo desempenho
 * - Throttle/Debounce otimizados
 * - Presets de animação seguros
 * - Monitoramento de FPS
 */

/**
 * Detecta se o dispositivo é de baixo desempenho
 * Baseado em: RAM, cores de CPU, conexão de rede
 */
export const isLowEndDevice = () => {
  // Verifica memória do dispositivo (em GB)
  const memory = navigator.deviceMemory || 4;
  
  // Verifica número de cores de CPU
  const cores = navigator.hardwareConcurrency || 4;
  
  // Verifica tipo de conexão
  const connection = navigator.connection;
  const slowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
  
  // Considera low-end se: pouca RAM, poucos cores, ou conexão lenta
  return memory <= 2 || cores <= 2 || slowConnection;
};

/**
 * Retorna configurações de animação apropriadas para o dispositivo
 * Reduz animações em dispositivos low-end
 */
export const getAnimationConfig = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowEnd = isLowEndDevice();
  
  if (prefersReducedMotion || lowEnd) {
    return {
      // Animações mínimas para dispositivos fracos
      duration: 0.1,
      stiffness: 400,
      damping: 40,
      staggerChildren: 0.02,
      enableAnimations: false,
      enableParallax: false,
      enableBlur: false
    };
  }
  
  return {
    // Animações completas para dispositivos potentes
    duration: 0.3,
    stiffness: 260,
    damping: 20,
    staggerChildren: 0.05,
    enableAnimations: true,
    enableParallax: true,
    enableBlur: true
  };
};

/**
 * Variantes de animação otimizadas (GPU-accelerated)
 * Usa APENAS transform e opacity - nunca width, height, top, left
 */
export const safeAnimationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  
  slideUp: {
    hidden: { opacity: 0, transform: 'translateY(20px)' },
    visible: { opacity: 1, transform: 'translateY(0px)' }
  },
  
  slideDown: {
    hidden: { opacity: 0, transform: 'translateY(-20px)' },
    visible: { opacity: 1, transform: 'translateY(0px)' }
  },
  
  slideLeft: {
    hidden: { opacity: 0, transform: 'translateX(20px)' },
    visible: { opacity: 1, transform: 'translateX(0px)' }
  },
  
  slideRight: {
    hidden: { opacity: 0, transform: 'translateX(-20px)' },
    visible: { opacity: 1, transform: 'translateX(0px)' }
  },
  
  scale: {
    hidden: { opacity: 0, transform: 'scale(0.95)' },
    visible: { opacity: 1, transform: 'scale(1)' }
  },
  
  // Container que staggers children
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }
};

/**
 * Debounce otimizado com requestAnimationFrame
 * Melhor que setTimeout para operações visuais
 */
export const rafDebounce = (callback) => {
  let rafId = null;
  
  return (...args) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      callback(...args);
    });
  };
};

/**
 * Throttle com timestamp
 * Limita execuções por intervalo de tempo
 */
export const throttle = (callback, delay = 100) => {
  let lastCall = 0;
  
  return (...args) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
};

/**
 * Debounce clássico
 * Espera o usuário parar de interagir
 */
export const debounce = (callback, delay = 250) => {
  let timeoutId = null;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
};

/**
 * Lazy load de módulo com retry
 * Útil para conexões instáveis
 */
export const lazyWithRetry = (componentImport, retries = 3, delay = 1000) => {
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber) => {
      componentImport()
        .then(resolve)
        .catch((error) => {
          if (attemptNumber < retries) {
            setTimeout(() => attempt(attemptNumber + 1), delay);
          } else {
            reject(error);
          }
        });
    };
    
    attempt(1);
  });
};

/**
 * Prefetch de rota para navegação mais rápida
 * Pré-carrega o JS da próxima página provável
 */
export const prefetchRoute = (importFn) => {
  // Usa requestIdleCallback se disponível, senão setTimeout
  const scheduleIdleTask = window.requestIdleCallback || 
    ((cb) => setTimeout(cb, 1));
  
  scheduleIdleTask(() => {
    importFn().catch(() => {
      // Ignora erros de prefetch - não é crítico
    });
  });
};

/**
 * Hook para detectar se elemento está visível
 * Usado para pausar animações fora da viewport
 */
export const createVisibilityObserver = (callback, options = {}) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        callback(entry.isIntersecting, entry);
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    }
  );
  
  return observer;
};
