import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
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
