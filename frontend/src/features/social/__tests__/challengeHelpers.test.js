/**
 * @file challengeHelpers.test.js
 * @description Testes para utilitários de desafio.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  averageResponseTime,
  formatTimer,
  calculateProgress,
  getResultData,
} from '../utils/challengeHelpers';

describe('challengeHelpers', () => {
  describe('calculateScore', () => {
    it('retorna pontuação correta', () => {
      const answers = {
        0: { correct: true, timeMs: 5000 },
        1: { correct: false, timeMs: 10000 },
        2: { correct: true, timeMs: 3000 },
      };
      const score = calculateScore(answers);
      expect(score).toBe(2);
    });

    it('retorna 0 para respostas vazias', () => {
      expect(calculateScore({})).toBe(0);
      expect(calculateScore(null)).toBe(0);
    });
  });

  describe('averageResponseTime', () => {
    it('calcula média corretamente', () => {
      const answers = {
        0: { correct: true, timeMs: 4000 },
        1: { correct: false, timeMs: 6000 },
      };
      const avg = averageResponseTime(answers);
      expect(avg).toBe(5000);
    });

    it('retorna 0 para respostas vazias', () => {
      expect(averageResponseTime({})).toBe(0);
    });
  });

  describe('formatTimer', () => {
    it('formata segundos em MM:SS', () => {
      expect(formatTimer(90)).toBe('01:30');
      expect(formatTimer(0)).toBe('00:00');
      expect(formatTimer(3661)).toBe('61:01');
    });
  });

  describe('calculateProgress', () => {
    it('calcula percentual de progresso', () => {
      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(0, 10)).toBe(0);
      expect(calculateProgress(10, 10)).toBe(100);
    });

    it('retorna 0 para total 0', () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });
  });

  describe('getResultData', () => {
    const challenge = {
      challengerId: 'user1',
      challengedId: 'user2',
      challengerName: 'João',
      challengedName: 'Maria',
      challengerPhoto: null,
      challengedPhoto: null,
      participants: ['user1', 'user2'],
      questions: Array.from({ length: 5 }, (_, i) => ({ id: i })),
      answers: {
        user1: {
          0: { correct: true, timeMs: 3000 },
          1: { correct: true, timeMs: 4000 },
          2: { correct: false, timeMs: 8000 },
          3: { correct: true, timeMs: 2000 },
          4: { correct: false, timeMs: 12000 },
        },
        user2: {
          0: { correct: true, timeMs: 5000 },
          1: { correct: false, timeMs: 6000 },
          2: { correct: true, timeMs: 3000 },
          3: { correct: false, timeMs: 9000 },
          4: { correct: false, timeMs: 15000 },
        },
      },
    };

    it('identifica vencedor corretamente', () => {
      const result = getResultData(challenge, 'user1');
      expect(result.isWinner).toBe(true);
      expect(result.myCorrect).toBe(3);
      expect(result.opponentCorrect).toBe(2);
    });

    it('identifica derrota corretamente', () => {
      const result = getResultData(challenge, 'user2');
      expect(result.isWinner).toBe(false);
      expect(result.myCorrect).toBe(2);
      expect(result.opponentCorrect).toBe(3);
    });

    it('identifica empate', () => {
      const tieChallenge = {
        ...challenge,
        answers: {
          user1: {
            0: { correct: true, timeMs: 3000 },
            1: { correct: false, timeMs: 4000 },
          },
          user2: {
            0: { correct: true, timeMs: 5000 },
            1: { correct: false, timeMs: 6000 },
          },
        },
        questions: [{ id: 0 }, { id: 1 }],
      };
      const result = getResultData(tieChallenge, 'user1');
      expect(result.isDraw).toBe(true);
    });

    it('retorna nomes corretos do oponente', () => {
      const result = getResultData(challenge, 'user1');
      expect(result.opponentName).toBe('Maria');
    });

    it('retorna null para challenge nulo', () => {
      expect(getResultData(null, 'user1')).toBeNull();
    });
  });
});
