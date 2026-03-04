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
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

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

// Inicializa o app Firebase (singleton)
const app = initializeApp(firebaseConfig);

// Analytics — só funciona em ambiente browser; não disponivel durante SSR ou testes
const analytics = getAnalytics(app);

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

export { analytics };

// Configura a seleção de conta ao fazer login com Google
// NOTE: 'select_account' força o seletor de conta mesmo se já houver sessão ativa
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
