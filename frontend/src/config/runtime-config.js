/**
 * Configuração pública do cliente.
 *
 * Firebase Web config identifica o projeto, mas não é um segredo. A proteção dos
 * dados continua sendo responsabilidade das regras do Firestore/Storage/Auth.
 * Mantemos fallback apenas para os dados públicos já versionados no projeto para
 * impedir que um deploy sem variáveis VITE_* derrube o boot inteiro.
 */

export const FIREBASE_PUBLIC_FALLBACK = Object.freeze({
  apiKey: 'AIzaSyDNIavnL3RSfiXCy_AyxLNB7fGQNsEtpVQ',
  authDomain: 'cinesia-72d45.firebaseapp.com',
  projectId: 'cinesia-72d45',
  storageBucket: 'cinesia-72d45.firebasestorage.app',
  messagingSenderId: '691649171080',
  appId: '1:691649171080:web:2c7ee3c827a456bf53d93d',
});

function env(name) {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const firebaseClientConfig = Object.freeze({
  apiKey: env('VITE_FIREBASE_API_KEY') || FIREBASE_PUBLIC_FALLBACK.apiKey,
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN') || FIREBASE_PUBLIC_FALLBACK.authDomain,
  projectId: env('VITE_FIREBASE_PROJECT_ID') || FIREBASE_PUBLIC_FALLBACK.projectId,
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET') || FIREBASE_PUBLIC_FALLBACK.storageBucket,
  messagingSenderId:
    env('VITE_FIREBASE_MESSAGING_SENDER_ID') || FIREBASE_PUBLIC_FALLBACK.messagingSenderId,
  appId: env('VITE_FIREBASE_APP_ID') || FIREBASE_PUBLIC_FALLBACK.appId,
  measurementId: env('VITE_FIREBASE_MEASUREMENT_ID'),
});

export function getRuntimeConfigHealth() {
  const missingCritical = Object.entries(firebaseClientConfig)
    .filter(([key, value]) => key !== 'measurementId' && !value)
    .map(([key]) => key);

  return {
    missingCritical,
    optionalFeatures: {
      gemini: Boolean(env('VITE_GEMINI_API_KEY')),
      cloudinary: Boolean(
        env('VITE_CLOUDINARY_CLOUD_NAME') && env('VITE_CLOUDINARY_UPLOAD_PRESET'),
      ),
      analytics: Boolean(firebaseClientConfig.measurementId),
    },
  };
}
