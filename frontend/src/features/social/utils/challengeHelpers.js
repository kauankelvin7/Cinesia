/**
 * @file challengeHelpers.js
 * @description Utilitários para lógica de pontuação e timer dos desafios.
 */

/**
 * Calcula a pontuação baseada em acertos e tempo de resposta.
 * Respostas mais rápidas ganham mais pontos.
 */
export function calculateScore(answers) {
  if (!answers?.length) return 0;
  return answers.filter((a) => a.isCorrect).length;
}

/**
 * Calcula tempo médio de resposta em ms.
 */
export function averageResponseTime(answers) {
  if (!answers?.length) return 0;
  const total = answers.reduce((sum, a) => sum + (a.responseTimeMs || 0), 0);
  return Math.round(total / answers.length);
}

/**
 * Formata tempo em segundos para display mm:ss.
 */
export function formatTimer(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Calcula o progresso do jogador (0-100%).
 */
export function calculateProgress(currentIndex, total) {
  if (!total) return 0;
  return Math.round((currentIndex / total) * 100);
}

/**
 * Determina o vencedor e retorna dados formatados.
 */
export function getResultData(challenge, currentUserId) {
  if (!challenge || challenge.status !== 'finished') return null;

  const players = Object.entries(challenge.players || {});
  const myEntry = players.find(([uid]) => uid === currentUserId);
  const opponentEntry = players.find(([uid]) => uid !== currentUserId);

  if (!myEntry || !opponentEntry) return null;

  const [, myData] = myEntry;
  const [opponentUid, opponentData] = opponentEntry;

  const myCorrect = myData?.score || 0;
  const opponentCorrect = opponentData?.score || 0;
  const totalQ = challenge.totalQuestions || challenge.questions?.length || 0;

  return {
    myScore: myCorrect,
    opponentScore: opponentCorrect,
    myCorrect,
    opponentCorrect,
    totalQ,
    myAvgTime: averageResponseTime(myData?.answers),
    opponentAvgTime: averageResponseTime(opponentData?.answers),
    totalQuestions: totalQ,
    winnerId: challenge.winnerId,
    isDraw: challenge.winnerId === 'draw',
    isWinner: challenge.winnerId === currentUserId,
    isLoser: challenge.winnerId !== currentUserId && challenge.winnerId !== 'draw',
    deckName: challenge.deckName,
    opponentName: opponentUid === challenge.inviterId ? 'Oponente' : 'Oponente',
    opponentPhoto: null,
  };
}
