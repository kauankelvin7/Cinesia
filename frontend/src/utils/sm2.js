/**
 * @file sm2.js
 * @description Implementação do algoritmo SM-2 de repetição espaçada.
 *
 * Baseado no algoritmo original de Piotr Woźniak (SuperMemo 2, 1987).
 * Referência: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * Escala de qualidade (quality) usada no Cinesia:
 *   0-2 → resposta incorreta → reinicia intervalo (interval=1, repetitions=0)
 *   3   → correto com dificuldade alta (‼ Difícil)
 *   4   → correto com dificuldade moderada
 *   5   → correto sem dificuldade (😄 Fácil)
 *
 * Mapeamento dos botões do Cinesia:
 *   😰 Difícil → quality = 1 (reset)
 *   😐 Médio  → quality = 3 (correto, difícil)
 *   😄 Fácil  → quality = 5 (perfeito)
 *
 * Fórmula do novo EaseFactor:
 *   EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 *   Mínimo: 1.3 — abaixo disso o intervalo nunca cresce adequadamente.
 *
 * @dependencies
 *  - Nenhuma (funções puras, sem efeitos colaterais externos)
 *
 * @sideEffects
 *  - Nenhum
 *
 * @notes
 *  - WARN: Não alterar os coeficientes (0.08, 0.02) sem revisar a literatura do SM-2
 *  - WARN: EaseFactor mínimo é 1.3 — alterar afeta cards muito difíceis que nunca cresceriam
 */

/**
 * Calculate next review parameters using SM-2 algorithm.
 * 
 * @param {number} quality - User's self-assessment (0-5)
 * @param {number} repetitions - Number of consecutive correct reviews
 * @param {number} interval - Current interval in days
 * @param {number} easeFactor - Current ease factor (minimum 1.3)
 * @returns {{ interval: number, repetitions: number, easeFactor: number, nextReviewDate: string }}
 */
export function calculateSM2(quality, repetitions, interval, easeFactor) {
  // Clamp quality to valid range
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  
  let newInterval;
  let newRepetitions;
  let newEaseFactor;

  if (q < 3) {
    // Incorrect response → reset
    newRepetitions = 0;
    newInterval = 1;
    // EF doesn't change on failure (some variants do decrease it)
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Correct response → apply SM-2 formula
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);
  }

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  const nextReviewDate = nextDate.toISOString().split('T')[0]; // YYYY-MM-DD

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: Math.round(newEaseFactor * 100) / 100, // 2 decimal places
    nextReviewDate,
  };
}

/**
 * Get today's date as YYYY-MM-DD string.
 * @returns {string}
 */
export function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a flashcard is due for review today or earlier.
 * @param {Object} flashcard - Flashcard document from Firestore
 * @returns {boolean}
 */
export function isDueForReview(flashcard) {
  if (!flashcard.nextReviewDate) return true; // Never reviewed → due now
  
  const today = getTodayDateString();
  
  // Handle Firestore Timestamp objects
  let reviewDate;
  if (flashcard.nextReviewDate?.toDate) {
    reviewDate = flashcard.nextReviewDate.toDate().toISOString().split('T')[0];
  } else if (typeof flashcard.nextReviewDate === 'string') {
    reviewDate = flashcard.nextReviewDate.split('T')[0];
  } else {
    return true; // Unknown format → due
  }
  
  return reviewDate <= today;
}

/**
 * Get the human-readable interval description.
 * @param {number} interval - Interval in days
 * @returns {string}
 */
export function getIntervalLabel(interval) {
  if (!interval || interval <= 0) return 'Agora';
  if (interval === 1) return 'Amanhã';
  if (interval < 7) return `${interval} dias`;
  if (interval < 30) return `${Math.round(interval / 7)} sem`;
  if (interval < 365) return `${Math.round(interval / 30)} meses`;
  return `${Math.round(interval / 365)} anos`;
}

/**
 * Get the estimated next review date label from SM-2 params.
 * Useful for showing "Próxima revisão: em X dias" on buttons.
 * @param {number} quality - Quality to simulate
 * @param {number} repetitions - Current repetitions
 * @param {number} interval - Current interval
 * @param {number} easeFactor - Current ease factor
 * @returns {string}
 */
export function getNextReviewLabel(quality, repetitions, interval, easeFactor) {
  const result = calculateSM2(quality, repetitions, interval, easeFactor);
  return getIntervalLabel(result.interval);
}
