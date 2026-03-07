/**
 * @file firebase-config.js
 * @description Inicialização do Firebase e exportação dos serviços utilizados no Cinesia.
 * Este é o único ponto de inicialização do Firebase na aplicação — todos os outros
 * arquivos devem importar `db`, `auth`, `storage` daqui.
 *
 * @dependencies
 *  - Variáveis de ambiente VITE_FIREBASE_* (definidas em .env ou no Vercel Dashboard)
 *
 * @sideEffects
 *  - Inicializa o Firebase app (singleton — seguro chamar múltiplas vezes)
 *  - Inicializa Firebase Analytics (só funciona em ambiente browser)
 *
 * @notes
 *  - Credenciais do Firebase são públicas por design (protegidas pelas Security Rules)
 *  - NUNCA colocar chaves de API de backend (SendGrid, Stripe, etc.) neste arquivo
 *  - Para adicionar novos serviços Firebase, inicializar aqui e exportar
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, terminate } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Validação básica de variáveis de ambiente críticas
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter((key) => !import.meta.env[key]);
if (missingVars.length > 0) {
  // Loga mas não impede o app de subir — evita travar splash sem feedback
  // eslint-disable-next-line no-console
  console.error('[FIREBASE] Variáveis de ambiente faltando:', missingVars);
}

// Configuração do Firebase — valores via variáveis de ambiente Vite (prefixo VITE_)
// NOTE: o `import.meta.env` é resolvido em build time pelo Vite — não disponível em Node.js puro
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 1. App principal
const app = initializeApp(firebaseConfig);

// 2. Serviços críticos primeiro
/** Instância do Firebase Auth — usada em AuthContext-firebase.jsx */
export const auth = getAuth(app);

/** Provider de OAuth para login com Google */
export const googleProvider = new GoogleAuthProvider();

/** Instância do Firestore — banco principal da aplicação */
export const db = getFirestore(app);

/**
 * Instância do Firebase Storage — usada para upload de imagens de perfil.
 * NOTE: imagens de flashcards são hospedadas no Cloudinary (ver cloudinaryService.js),
 *       não no Firebase Storage, para aproveitar CDN e transformações automáticas.
 */
export const storage = getStorage(app);

/** Instância do Firebase Realtime Database — usado para sistema de presença (online/offline) */
export const rtdb = getDatabase(app);

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 3. Analytics por último, protegido (não crítico para boot)
let analytics = null;
isSupported()
  .then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {});

export { analytics };

export default app;

/**
 * Função de emergência: encerra o Firestore e recarrega a página.
 * Usada pelo firestoreErrorHandler quando detecta INTERNAL ASSERTION FAILED.
 */
export async function restartFirestore() {
  try {
    await terminate(db);
    window.location.reload();
  } catch {
    window.location.reload();
  }
}
