/**
 * @file challengeService.js
 * @description Lógica de desafios de flashcards competitivos em tempo real.
 * Gerencia criação, aceitação, respostas e finalização de duelos.
 */

import {
  collection, doc, setDoc, getDoc, updateDoc, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { handleFirestoreError } from '../../../utils/firestoreErrorHandler';
import { chatService } from './chatService';

export const challengeService = {
  /**
   * Cria um novo desafio de flashcards.
   * @returns {string} challengeId
   */
  async createChallenge(inviter, inviteeId, deck, conversationId) {
    const challengeRef = doc(collection(db, 'challenges'));

    // Snapshot das questões, embaralhadas e limitadas a 10
    const allCards = [...deck.cards];
    const selectedCards = [...allCards]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, allCards.length));

    // Extrai todas as respostas (backs) disponíveis para usar como distratores
    const allBacks = allCards
      .map((c) => c.back || c.verso || c.resposta || '')
      .filter(Boolean);

    const questions = selectedCards.map((card, idx) => {
      const front = card.front || card.frente || card.pergunta || '';
      const back = card.back || card.verso || card.resposta || '';

      // Distratores: respostas de outros cards do mesmo deck
      const distractors = allBacks
        .filter((b) => b !== back)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Monta as opções embaralhadas
      const options = [back, ...distractors].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(back);

      return {
        id: card.id || `q_${idx}`,
        front,
        back,
        materia: card.materia || deck.materia || '',
        options,
        correctIndex,
      };
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const challenge = {
      id: challengeRef.id,
      type: 'flashcard_duel',
      status: 'pending',
      inviterId: inviter.uid,
      inviteeId,
      conversationId,
      deckId: deck.id,
      deckName: deck.name || deck.nome || 'Flashcards',
      questions,
      totalQuestions: questions.length,
      players: {
        [inviter.uid]: {
          status: 'ready',
          currentQuestionIndex: 0,
          answers: [],
          score: 0,
          finishedAt: null,
        },
        [inviteeId]: {
          status: 'waiting',
          currentQuestionIndex: 0,
          answers: [],
          score: 0,
          finishedAt: null,
        },
      },
      winnerId: null,
      startedAt: null,
      finishedAt: null,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    await setDoc(challengeRef, challenge);

    // Envia convite como mensagem especial no chat
    await chatService.sendMessage(conversationId, inviter.uid, inviter, {
      type: 'challenge_invite',
      text: `⚡ ${inviter.displayName || 'Alguém'} te desafiou para um duelo de flashcards!`,
      attachedContent: {
        type: 'challenge_invite',
        challengeId: challengeRef.id,
        deckId: deck.id,
        deckName: deck.name || deck.nome || 'Flashcards',
        cardCount: questions.length,
        expiresAt: Timestamp.fromDate(expiresAt),
      },
    });

    return challengeRef.id;
  },

  /**
   * Aceita um desafio pendente e inicia o jogo.
   */
  async acceptChallenge(challengeId, userId) {
    const challengeRef = doc(db, 'challenges', challengeId);
    const snap = await getDoc(challengeRef);
    if (!snap.exists()) throw new Error('Desafio não encontrado');

    const data = snap.data();
    if (data.status !== 'pending') throw new Error('Desafio não está mais pendente');

    // Verifica se o desafio expirou
    if (data.expiresAt?.toDate() < new Date()) {
      await updateDoc(challengeRef, { status: 'expired' });
      throw new Error('Desafio expirou!');
    }

    await updateDoc(challengeRef, {
      status: 'in_progress',
      startedAt: Timestamp.now(),
      [`players.${userId}.status`]: 'playing',
      [`players.${data.inviterId}.status`]: 'playing',
    });
  },

  /**
   * Recusa um desafio.
   */
  async declineChallenge(challengeId) {
    await updateDoc(doc(db, 'challenges', challengeId), {
      status: 'cancelled',
    });
  },

  /**
   * Registra a resposta do jogador para a questão atual.
   */
  async submitAnswer(challengeId, userId, questionId, isCorrect, responseTimeMs) {
    const challengeRef = doc(db, 'challenges', challengeId);
    const snap = await getDoc(challengeRef);
    if (!snap.exists()) throw new Error('Desafio não encontrado');

    const challenge = snap.data();
    const player = challenge.players[userId];
    if (!player) throw new Error('Jogador não encontrado no desafio');

    const newAnswers = [
      ...player.answers,
      {
        questionId,
        answeredAt: Timestamp.now(),
        responseTimeMs,
        isCorrect,
      },
    ];

    const newScore = newAnswers.filter((a) => a.isCorrect).length;
    const newIndex = player.currentQuestionIndex + 1;
    const isFinished = newIndex >= challenge.totalQuestions;

    const updates = {
      [`players.${userId}.answers`]: newAnswers,
      [`players.${userId}.score`]: newScore,
      [`players.${userId}.currentQuestionIndex`]: newIndex,
    };

    if (isFinished) {
      updates[`players.${userId}.status`] = 'finished';
      updates[`players.${userId}.finishedAt`] = Timestamp.now();

      // Verifica se o outro jogador também terminou
      const otherUid = Object.keys(challenge.players).find((uid) => uid !== userId);
      const otherPlayer = challenge.players[otherUid];

      if (otherPlayer?.status === 'finished') {
        updates.status = 'finished';
        updates.finishedAt = Timestamp.now();

        const theirScore = otherPlayer.score;
        const winnerId = newScore > theirScore
          ? userId
          : theirScore > newScore
            ? otherUid
            : 'draw';
        updates.winnerId = winnerId;

        // Envia resultado no chat
        try {
          await chatService.sendMessage(challenge.conversationId, userId, {
            displayName: 'Sistema',
            photoURL: null,
          }, {
            type: 'challenge_result',
            text: winnerId === 'draw'
              ? '🤝 Empate no duelo de flashcards!'
              : `🏆 Duelo de flashcards finalizado!`,
            attachedContent: {
              type: 'challenge_result',
              challengeId,
              deckName: challenge.deckName,
              scores: {
                [userId]: { score: newScore, correct: newScore, total: challenge.totalQuestions },
                [otherUid]: { score: theirScore, correct: theirScore, total: challenge.totalQuestions },
              },
              winnerId,
            },
          });
        } catch {
          // Não bloqueia se falhar o envio da mensagem
        }
      }
    }

    await updateDoc(challengeRef, updates);
  },

  /**
   * Assina atualizações em tempo real de um desafio.
   * @returns {Function} unsubscribe
   */
  subscribeChallenge(challengeId, callback) {
    if (!challengeId) return () => {};
    return onSnapshot(
      doc(db, 'challenges', challengeId),
      (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() });
        }
      },
      (error) => handleFirestoreError(error, 'subscribeChallenge'),
    );
  },

  /**
   * Busca um desafio pelo ID.
   */
  async getChallenge(challengeId) {
    const snap = await getDoc(doc(db, 'challenges', challengeId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },
};
