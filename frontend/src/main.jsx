import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './utils/deviceLayout.js';
import { validateEnv } from './utils/validateEnv';
import { registerSW } from 'virtual:pwa-register';

// PWA update handler
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App pronto para uso offline');
  }
});

// Valida variáveis de ambiente antes de inicializar o app
validateEnv();

// Verificação periódica de atualização
import { checkForUpdate } from './utils/checkForUpdate';
setInterval(() => {
  checkForUpdate();
}, 30000);

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

setTimeout(removeSplash, 0);
