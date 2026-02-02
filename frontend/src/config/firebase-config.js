import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase (Credenciais do Projeto Cinesia)
const firebaseConfig = {
  apiKey: "AIzaSyDNIavnL3RSfiXCy_AyxLNB7fGQNsEtpVQ",
  authDomain: "cinesia-72d45.firebaseapp.com",
  projectId: "cinesia-72d45",
  storageBucket: "cinesia-72d45.firebasestorage.app",
  messagingSenderId: "691649171080",
  appId: "1:691649171080:web:2c7ee3c827a456bf53d93d",
  measurementId: "G-3PGQ93W24W"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializa os serviços
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };

// Configurações adicionais do Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
