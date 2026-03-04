/**
 * @file validateEnv.js
 * @description Valida variáveis de ambiente obrigatórias na inicialização.
 * Lança erro descritivo se alguma estiver faltando, evitando falhas silenciosas
 * (ex: Firebase inicializar sem API key e só quebrar mais tarde).
 *
 * @usage Chamar antes de ReactDOM.createRoot() em main.jsx
 */

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GEMINI_API_KEY',
];

/**
 * Valida que todas as variáveis de ambiente obrigatórias estão definidas.
 * Em desenvolvimento lança um erro claro; em produção apenas loga um aviso
 * para evitar quebrar o app inteiramente caso alguma variável opcional falte.
 */
export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    const msg = [
      '[Cinesia] Variáveis de ambiente faltando:',
      ...missing.map((k) => `  • ${k}`),
      '',
      'Copie .env.example para .env e preencha os valores.',
      'Na Vercel/Firebase Hosting: configure em Settings → Environment Variables.',
    ].join('\n');

    if (import.meta.env.DEV) {
      throw new Error(msg);
    } else {
      console.error(msg);
    }
  }
};
