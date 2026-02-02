/**
 * Formata timestamps do Firestore ou Date do JS em PT-BR.
 * @param {any} timestamp
 * @returns {string}
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return 'Recente';
  }

  let date;

  try {
    if (typeof timestamp?.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      date = Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (!date) {
      return 'Recente';
    }

    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Recente';
  }
};
