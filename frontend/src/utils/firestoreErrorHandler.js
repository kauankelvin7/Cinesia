/**
 * @file firestoreErrorHandler.js
 * @description Tratamento centralizado de erros do Firestore.
 * Detecta INTERNAL ASSERTION FAILED e reinicia o Firestore automaticamente.
 * Previne cascata de erros quando listeners falham simultaneamente.
 */

let assertionFailedCount = 0;
let restartScheduled = false;

/**
 * Handler centralizado para erros do Firestore em listeners (onSnapshot).
 * @param {Error} error - O erro do Firestore
 * @param {string} context - Nome do listener/componente para log
 */
export function handleFirestoreError(error, context = '') {
  const isAssertionFailed = error?.message?.includes('INTERNAL ASSERTION FAILED');
  const isPermissionDenied = error?.code === 'permission-denied';
  const isPrecondition = error?.code === 'failed-precondition';

  if (isAssertionFailed) {
    assertionFailedCount++;
    console.error(`[Firestore] ASSERTION FAILED em ${context} (${assertionFailedCount}x)`);

    // Se aconteceu mais de 2 vezes, reinicia a página
    if (assertionFailedCount >= 2 && !restartScheduled) {
      restartScheduled = true;
      console.warn('[Firestore] Estado corrompido detectado. Reiniciando em 2s...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    return;
  }

  if (isPermissionDenied) {
    console.warn(`[Firestore] Permission denied em ${context}. Verifique as Security Rules.`);
    return;
  }

  if (isPrecondition) {
    console.warn(`[Firestore] Índice faltando em ${context}. Crie o índice no Firebase Console.`);
    return;
  }

  console.error(`[Firestore] Erro em ${context}:`, error);
}
