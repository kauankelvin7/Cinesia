/**
 * Inicialização centralizada do Firebase.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, terminate } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseClientConfig } from './runtime-config';

const app = initializeApp(firebaseClientConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let analytics = null;

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported && firebaseClientConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    })
    .catch((error) => {
      console.warn('[ANALYTICS] Inicialização ignorada:', error?.message || error);
    });
}

export { analytics };
export default app;

export async function restartFirestore() {
  try {
    await terminate(db);
  } catch (error) {
    console.warn('[FIRESTORE] Falha ao encerrar instância antes do reload:', error);
  } finally {
    window.location.reload();
  }
}
