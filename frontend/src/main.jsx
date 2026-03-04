import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './utils/deviceLayout.js';
import { validateEnv } from './utils/validateEnv';

// Valida variáveis de ambiente antes de inicializar o app
validateEnv();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
