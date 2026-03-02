/**
 * 📱 PWA Utilities
 * 
 * Utilitários para Progressive Web App:
 * - Registro do Service Worker
 * - Detecção de atualizações
 * - Prompt de instalação
 * - Status online/offline
 */

// Detectar se está rodando como PWA instalado
export const isInstalledPWA = () => {
  // iOS
  if (window.navigator.standalone === true) return true;
  
  // Android & Desktop
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  
  // Fallback para verificação via referrer
  if (document.referrer.includes('android-app://')) return true;
  
  return false;
};

// Detectar se está offline
export const isOffline = () => !navigator.onLine;

// Evento de mudança de status online/offline
export const onNetworkChange = (callback) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
  
  // Retorna função de cleanup
  return () => {
    window.removeEventListener('online', () => callback(true));
    window.removeEventListener('offline', () => callback(false));
  };
};

// Variável para guardar o evento de instalação
let deferredPrompt = null;

// Capturar evento de instalação do PWA
export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o prompt automático
    e.preventDefault();
    // Guarda o evento para usar depois
    deferredPrompt = e;
    
    // Dispara evento customizado para a UI
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });
  
  // Detectar quando o app foi instalado
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
};

// Mostrar prompt de instalação
export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('PWA: Prompt de instalação não disponível');
    return { outcome: 'unavailable' };
  }
  
  // Mostra o prompt
  deferredPrompt.prompt();
  
  // Aguarda a resposta do usuário
  const { outcome } = await deferredPrompt.userChoice;
  
  // Limpa o evento
  deferredPrompt = null;
  
  return { outcome };
};

// Verificar se o prompt de instalação está disponível
export const canInstall = () => deferredPrompt !== null;

// Forçar atualização do Service Worker
export const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
  }
  return false;
};

// Limpar cache do PWA (útil para forçar atualização)
export const clearPWACache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    return true;
  }
  return false;
};

// Obter informações do Service Worker
export const getServiceWorkerInfo = async () => {
  if (!('serviceWorker' in navigator)) {
    return { supported: false };
  }
  
  const registration = await navigator.serviceWorker.getRegistration();
  
  if (!registration) {
    return { supported: true, registered: false };
  }
  
  return {
    supported: true,
    registered: true,
    scope: registration.scope,
    active: !!registration.active,
    waiting: !!registration.waiting,
    installing: !!registration.installing
  };
};

// Detectar dispositivo iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Detectar Safari
export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Verificar se deve mostrar banner de instalação para iOS
export const shouldShowIOSInstallBanner = () => {
  // Só mostra no iOS Safari se não estiver instalado
  if (!isIOS() || !isSafari()) return false;
  if (isInstalledPWA()) return false;
  
  // Verifica se usuário já dispensou o banner
  const dismissed = localStorage.getItem('ios-install-banner-dismissed');
  if (dismissed) {
    const dismissedDate = new Date(dismissed);
    const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    // Mostra novamente após 7 dias
    if (daysSinceDismissed < 7) return false;
  }
  
  return true;
};

// Dispensar banner de instalação iOS
export const dismissIOSInstallBanner = () => {
  localStorage.setItem('ios-install-banner-dismissed', new Date().toISOString());
};

// Inicializar todos os listeners do PWA
export const initPWA = () => {
  initInstallPrompt();
  
  // Status PWA silencioso (sem log)
};

export default {
  isInstalledPWA,
  isOffline,
  onNetworkChange,
  initInstallPrompt,
  showInstallPrompt,
  canInstall,
  updateServiceWorker,
  clearPWACache,
  getServiceWorkerInfo,
  isIOS,
  isSafari,
  shouldShowIOSInstallBanner,
  dismissIOSInstallBanner,
  initPWA
};
