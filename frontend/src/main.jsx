import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Remove PWA Splash Screen App Shell
function removeSplash() {
  const splash = document.getElementById('pwa-splash');
  if (splash) {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.4s ease';
    setTimeout(() => splash.remove(), 400);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
removeSplash();

// Remove App Shell Splash Screen
function removeSplash() {
  const splash = document.getElementById('app-shell-splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 600);
  }
}

// Remove splash as soon as React mounts
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
removeSplash();
import './utils/deviceLayout.js';
import { validateEnv } from './utils/validateEnv';

// PWA update handler
import { registerSW } from 'virtual:pwa-register';

// registra service worker com atualização automática
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // força atualização automática quando houver nova versão
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App pronto para uso offline');
  }
});

// Valida variáveis de ambiente antes de inicializar o app
validateEnv();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
    
  // Verificação periódica de atualização
  import { checkForUpdate } from './utils/checkForUpdate';
  setInterval(() => {
    checkForUpdate();
  }, 30000); // verifica a cada 30 segundos
