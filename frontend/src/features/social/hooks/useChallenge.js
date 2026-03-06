/**
 * @file useChallenge.js
 * @description Hook para desafios de flashcards competitivos em tempo real.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext-firebase';
import { challengeService } from '../services/challengeService';

/**
 * @param {string|null} challengeId
 */
export function useChallenge(challengeId) {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(!!challengeId);

  // Assina atualizações em tempo real
  useEffect(() => {
    if (!challengeId) {
      setChallenge(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    return challengeService.subscribeChallenge(challengeId, (data) => {
      setChallenge(data);
      setLoading(false);
    });
  }, [challengeId]);

  const submitAnswer = useCallback(
    async (questionIndex, selectedOption, isCorrect, responseTimeMs) => {
      if (!challenge || !user?.uid) return;
      const question = challenge.questions?.[questionIndex];
      if (!question) return;
      await challengeService.submitAnswer(
        challengeId,
        user.uid,
        question.id,
        isCorrect,
        responseTimeMs,
      );
    },
    [challenge, user?.uid, challengeId],
  );

  const acceptChallenge = useCallback(async () => {
    if (!challengeId || !user?.uid) return;
    await challengeService.acceptChallenge(challengeId, user.uid);
  }, [challengeId, user?.uid]);

  const declineChallenge = useCallback(async () => {
    if (!challengeId) return;
    await challengeService.declineChallenge(challengeId);
  }, [challengeId]);

  // Derive player data from challenge.players
  const myData = challenge?.players?.[user?.uid] || null;
  const opponentId = challenge
    ? Object.keys(challenge.players || {}).find((uid) => uid !== user?.uid)
    : null;
  const opponentData = opponentId ? challenge?.players?.[opponentId] : null;
  const isFinished = challenge?.status === 'finished';
  const isWinner = isFinished && challenge?.winnerId === user?.uid;

  return {
    challenge,
    loading,
    myData,
    opponentData,
    opponentId,
    submitAnswer,
    acceptChallenge,
    declineChallenge,
    isFinished,
    isWinner,
  };
}
