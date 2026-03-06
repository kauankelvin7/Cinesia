/**
 * @file useKakabotContext.js
 * @description Hook que carrega estatísticas do sistema em tempo real para injetar
 * no system prompt do Gemini (KakaBot). Garante que o agente tenha consciência do
 * estado atual do usuário: matérias, flashcards, revisoes pendentes, streak etc.
 *
 * @dependencies
 *  - Firebase Firestore (getDocs com queries filtradas por uid)
 *  - streakService.getStreakStats — dados de ofensiva diária
 *  - sm2.isDueForReview — filtro de flashcards pendentes de revisão
 *
 * @sideEffects
 *  - Realiza múltiplas leituras no Firestore a cada chamada (matérias, resumos, flashcards)
 *  - Re-executa quando eventos 'cinesia:*' são disparados (via CustomEvent)
 *
 * @notes
 *  - Os custom events permitem que o KakaBot tenha dados atualizados após executar ações
 *  - Não usa onSnapshot (tempo real do Firestore) para economizar leituras — usa polling por evento
 *  - PERF: limit(500) em cada query — usuários com muito conteúdo podem ter dados truncados
 */

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { isDueForReview } from '../utils/sm2';
import { getStreakStats } from '../services/streakService';

/**
 * @param {string|null} uid - UID do usuário logado
 * @returns {{ dadosSistema: object, materiasLista: Array, isLoadingContext: boolean }}
 */
const useKakabotContext = (uid) => {
  const [dadosSistema, setDadosSistema] = useState({
    materias: [],
    totalFlashcards: 0,
    totalResumos: 0,
    cardsParaRevisarHoje: 0,
    streakAtual: 0,
    longestStreak: 0,
  });
  const [materiasLista, setMateriasLista] = useState([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  useEffect(() => {
    if (!uid) {
      setIsLoadingContext(false);
      return;
    }

    let cancelled = false;

    const fetchContext = async () => {
      try {
        // Buscar tudo em paralelo
        const [materiasSnap, resumosSnap, flashcardsSnap, streakStats] = await Promise.all([
          getDocs(query(collection(db, 'materias'), where('uid', '==', uid), limit(500))),
          getDocs(query(collection(db, 'resumos'), where('uid', '==', uid), limit(500))),
          getDocs(query(collection(db, 'flashcards'), where('uid', '==', uid), limit(500))),
          getStreakStats(uid).catch(() => ({ currentStreak: 0, longestStreak: 0 })),
        ]);

        if (cancelled) return;

        const materias = materiasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const flashcards = flashcardsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Contar flashcards pendentes de revisão SM-2
        const cardsParaRevisarHoje = flashcards.filter((fc) => isDueForReview(fc)).length;

        setMateriasLista(materias);
        setDadosSistema({
          materias,
          totalFlashcards: flashcardsSnap.size,
          totalResumos: resumosSnap.size,
          cardsParaRevisarHoje,
          streakAtual: streakStats?.currentStreak || 0,
          longestStreak: streakStats?.longestStreak || 0,
        });
      } catch (err) {
        if (err?.message?.includes('INTERNAL ASSERTION FAILED')) {
          console.warn('[useKakabotContext] Firestore temporariamente indisponível');
        } else {
          console.warn('[useKakabotContext] Erro ao carregar contexto:', err?.message);
        }
      } finally {
        if (!cancelled) setIsLoadingContext(false);
      }
    };

    fetchContext();

    // Listener para atualizar quando dados mudam
    const handlers = [
      'cinesia:resumo:alterado',
      'cinesia:flashcard:alterado',
      'cinesia:materia:alterada',
      'cinesia:evento:alterado',
    ];
    const refresh = () => fetchContext();
    handlers.forEach((evt) => window.addEventListener(evt, refresh));

    return () => {
      cancelled = true;
      handlers.forEach((evt) => window.removeEventListener(evt, refresh));
    };
  }, [uid]);

  return { dadosSistema, materiasLista, isLoadingContext };
};

export default useKakabotContext;
