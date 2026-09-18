/**
 * @file challengeHelpers.js
 * @description Utilitários tolerantes a dados atuais e legados de desafios.
 */

function toAnswerList(answers) {
  if (!answers) return [];
  if (Array.isArray(answers)) return answers;
  if (typeof answers === 'object') return Object.values(answers);
  return [];
}

function isCorrectAnswer(answer) {
  return Boolean(answer?.isCorrect ?? answer?.correct);
}

function responseTime(answer) {
  const value = answer?.responseTimeMs ?? answer?.timeMs ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

/**
 * Calcula quantidade de acertos.
 * Aceita o schema atual (array + isCorrect) e o legado (objeto + correct).
 */
export function calculateScore(answers) {
  return toAnswerList(answers).filter(isCorrectAnswer).length;
}

/**
 * Calcula tempo médio de resposta em ms.
 * Aceita responseTimeMs (atual) e timeMs (legado).
 */
export function averageResponseTime(answers) {
  const list = toAnswerList(answers);
  if (!list.length) return 0;

  const total = list.reduce((sum, answer) => sum + responseTime(answer), 0);
  return Math.round(total / list.length);
}

export function formatTimer(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function calculateProgress(currentIndex, total) {
  if (!total) return 0;
  return Math.round((currentIndex / total) * 100);
}

function modernPlayer(challenge, uid) {
  const player = challenge?.players?.[uid];
  if (!player) return null;

  return {
    uid,
    answers: player.answers || [],
    score: Number.isFinite(Number(player.score))
      ? Number(player.score)
      : calculateScore(player.answers),
    name:
      player.displayName ||
      (uid === challenge.inviterId ? challenge.inviterName : challenge.inviteeName) ||
      'Oponente',
    photo:
      player.photoURL ||
      (uid === challenge.inviterId ? challenge.inviterPhoto : challenge.inviteePhoto) ||
      null,
  };
}

function legacyPlayer(challenge, uid) {
  const isChallenger = uid === challenge?.challengerId;
  const isChallenged = uid === challenge?.challengedId;
  if (!isChallenger && !isChallenged) return null;

  const answers = challenge?.answers?.[uid] || [];

  return {
    uid,
    answers,
    score: calculateScore(answers),
    name: isChallenger
      ? challenge.challengerName || 'Oponente'
      : challenge.challengedName || 'Oponente',
    photo: isChallenger
      ? challenge.challengerPhoto || null
      : challenge.challengedPhoto || null,
  };
}

function resolvePlayer(challenge, uid) {
  return modernPlayer(challenge, uid) || legacyPlayer(challenge, uid);
}

function resolveParticipantIds(challenge) {
  const modernIds = Object.keys(challenge?.players || {});
  if (modernIds.length) return modernIds;

  if (Array.isArray(challenge?.participants) && challenge.participants.length) {
    return challenge.participants;
  }

  return [challenge?.challengerId, challenge?.challengedId].filter(Boolean);
}

/**
 * Normaliza resultados de desafios atuais e registros legados.
 *
 * O schema atual grava challenge.players + winnerId. Registros antigos usavam
 * answers/challengerId/challengedId. Aceitar ambos evita quebrar histórico.
 */
export function getResultData(challenge, currentUserId) {
  if (!challenge || !currentUserId) return null;

  const participantIds = resolveParticipantIds(challenge);
  if (!participantIds.includes(currentUserId) || participantIds.length < 2) return null;

  const opponentId = participantIds.find((uid) => uid !== currentUserId);
  const me = resolvePlayer(challenge, currentUserId);
  const opponent = resolvePlayer(challenge, opponentId);

  if (!me || !opponent) return null;

  const myCorrect = me.score;
  const opponentCorrect = opponent.score;
  const totalQ =
    Number(challenge.totalQuestions) ||
    challenge.questions?.length ||
    Math.max(toAnswerList(me.answers).length, toAnswerList(opponent.answers).length);

  let winnerId = challenge.winnerId;
  if (!winnerId) {
    winnerId =
      myCorrect === opponentCorrect
        ? 'draw'
        : myCorrect > opponentCorrect
          ? currentUserId
          : opponentId;
  }

  return {
    myScore: myCorrect,
    opponentScore: opponentCorrect,
    myCorrect,
    opponentCorrect,
    totalQ,
    myAvgTime: averageResponseTime(me.answers),
    opponentAvgTime: averageResponseTime(opponent.answers),
    totalQuestions: totalQ,
    winnerId,
    isDraw: winnerId === 'draw',
    isWinner: winnerId === currentUserId,
    isLoser: winnerId !== currentUserId && winnerId !== 'draw',
    deckName: challenge.deckName || challenge.deck?.name || '',
    opponentName: opponent.name,
    opponentPhoto: opponent.photo,
  };
}
