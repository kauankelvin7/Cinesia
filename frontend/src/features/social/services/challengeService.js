/**
 * @file challengeService.js
 * @description Lógica de desafios de flashcards competitivos em tempo real.
 * Gerencia criação, aceitação, respostas e finalização de duelos.
 */

import {
  collection, doc, setDoc, getDoc, updateDoc, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../../../config/firebase-config';
import { handleFirestoreError } from '../../../utils/firestoreErrorHandler';
import { chatService } from './chatService';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueNonEmpty(items) {
  return [...new Set((items || []).map((v) => String(v || '').trim()).filter(Boolean))];
}

function getCardFront(card) {
  return card.front || card.frente || card.pergunta || '';
}

function getCardBack(card) {
  return card.back || card.verso || card.resposta || '';
}

function generateHeuristicDistractors(correctAnswer, theme) {
  const base = String(correctAnswer || '').trim();
  if (!base) return [];

  const t = theme || 'fisioterapia';
  const variants = [
    `Conduta focada apenas na fase aguda em ${t}`,
    `Abordagem prioritariamente compensatória em ${t}`,
    `Intervenção de suporte sem foco no mecanismo principal em ${t}`,
  ];

  // Se houver número na resposta, cria distrações numéricas plausíveis
  const numMatch = base.match(/\d+/);
  if (numMatch) {
    const n = Number(numMatch[0]);
    variants.push(base.replace(numMatch[0], String(Math.max(1, n - 1))));
    variants.push(base.replace(numMatch[0], String(n + 1)));
  }

  return uniqueNonEmpty(variants).slice(0, 3);
}

async function generateDistractorsWithGemini(question, correctAnswer, theme, excluded = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return [];

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `
Você é um gerador de alternativas de múltipla escolha para fisioterapia.

Pergunta: "${question}"
Resposta correta: "${correctAnswer}"
Tema: "${theme || 'fisioterapia'}"

Gere EXATAMENTE 3 alternativas erradas, plausíveis e no mesmo formato da resposta correta.
Não repita a resposta correta e não repita entre si.
Responda APENAS com JSON válido:
{"distractors": ["alt1", "alt2", "alt3"]}
  `.trim();

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      const blocked = new Set(uniqueNonEmpty([correctAnswer, ...excluded]));
      return uniqueNonEmpty(parsed?.distractors || []).filter((d) => !blocked.has(d)).slice(0, 3);
    } catch {
      // tenta o próximo modelo
    }
  }

  return [];
}

export const challengeService = {
  /**
   * Cria um novo desafio de flashcards.
   * @returns {string} challengeId
   */
  async createChallenge(inviter, invitee, deck, conversationId) {
    const challengeRef = doc(collection(db, 'challenges'));
    const inviteeId = typeof invitee === 'string' ? invitee : invitee?.uid;

    if (!inviteeId) {
      throw new Error('Convite inválido: usuário desafiado não encontrado.');
    }

    // Snapshot das questões, embaralhadas e limitadas a 10
    const allCards = [...(deck.cards || [])]
      .map((card, idx) => ({
        id: card.id || `q_${idx}`,
        front: getCardFront(card),
        back: getCardBack(card),
        materia: card.materia || deck.materia || deck.name || 'Geral',
      }))
      .filter((c) => c.front && c.back);

    const selectedCards = shuffleArray(allCards).slice(0, Math.min(10, allCards.length));

    if (!selectedCards.length) {
      throw new Error('Este deck não possui flashcards válidos com pergunta e resposta.');
    }

    const questions = await Promise.all(selectedCards.map(async (card, idx) => {
      // Estratégia 1: IA Gemini
      let distractors = await generateDistractorsWithGemini(
        card.front,
        card.back,
        card.materia,
        []
      );

      // Estratégia 2: fallback inteligente
      if (!distractors || distractors.length < 3) {
        // Busca respostas de outros cards do mesmo deck, priorizando sub-tema
        const candidatos = allCards
          .filter(c => c.id !== card.id)
          .filter(c => c.back && c.back.trim() !== '')
          .filter(c => c.back.trim() !== card.back.trim());

        const palavrasChave = card.front
          .toLowerCase()
          .replace(/[?.,!]/g, '')
          .split(' ')
          .filter(p => p.length > 4);

        const relacionados = candidatos.filter(c =>
          palavrasChave.some(palavra =>
            c.front.toLowerCase().includes(palavra) ||
            c.back.toLowerCase().includes(palavra)
          )
        );

        const pool = relacionados.length >= 3 ? relacionados : candidatos;

        distractors = pool
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(c => c.back.trim());
      }

      // Garantia final: preenche se ainda faltar
      while (distractors.length < 3) {
        distractors.push(`Opção ${distractors.length + 1}`);
      }

      const opcoes = [card.back.trim(), ...distractors.slice(0, 3)]
        .sort(() => Math.random() - 0.5);

      return {
        id: card.id || `q_${idx}`,
        front: card.front,
        back: card.back,
        materia: card.materia,
        options: opcoes,
        correctIndex: opcoes.indexOf(card.back.trim()),
      };
    }));

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const challenge = {
      id: challengeRef.id,
      type: 'flashcard_duel',
      status: 'pending',
      inviterId: inviter.uid,
      inviteeId,
      inviterName: inviter.displayName || 'Você',
      inviterPhoto: inviter.photoURL || null,
      inviteeName: (typeof invitee === 'object' ? invitee?.displayName : null) || 'Oponente',
      inviteePhoto: (typeof invitee === 'object' ? invitee?.photoURL : null) || null,
      conversationId,
      deckId: deck.id,
      deckName: deck.name || deck.nome || 'Flashcards',
      questions,
      totalQuestions: questions.length,
      players: {
        [inviter.uid]: {
          displayName: inviter.displayName || 'Você',
          photoURL: inviter.photoURL || null,
          status: 'ready',
          currentQuestionIndex: 0,
          answers: [],
          score: 0,
          finishedAt: null,
        },
        [inviteeId]: {
          displayName: (typeof invitee === 'object' ? invitee?.displayName : null) || 'Oponente',
          photoURL: (typeof invitee === 'object' ? invitee?.photoURL : null) || null,
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
