/**
 * @file dashboardService.js
 * @description Serviço de estatísticas do dashboard. Agrega dados de múltiplas
 * coleções Firestore para exibir resumo de progresso do usuário.
 *
 * @dependencies
 *  - Firebase Firestore SDK
 *  - streakService (updateStreak, getStreakStats)
 *  - notificationService (checkMonthlyGoal, checkContentMilestones)
 *
 * @sideEffects
 *  - Lê de: `materias`, `resumos`, `flashcards`, `eventos`, `users/{uid}`
 *  - Efeito secundário: atualiza streak do usuário em cada chamada via updateStreak()
 *  - Efeito secundário: pode criar notificações via checkMonthlyGoal/checkContentMilestones
 *
 * @notes
 *  - PERF: todas as queries usam apenas `where('uid', '==', userId)` (índice simples)
 *    Contagens mensais são calculadas client-side nos docs já baixados para evitar
 *    índices compostos uid+createdAt que requerem deploy manual no Firebase Console
 *  - NOTE: é o ponto canônico de getDashboardStats — firebaseService.js apenas re-exporta
 */

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { updateStreak, getStreakStats } from './streakService';
import { checkMonthlyGoal, checkContentMilestones } from './notificationService';

// ─── Constantes de mês ────────────────────────────────────────────────────────
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Retorna os limites do mês corrente como timestamps em milissegundos.
 */
const getMesAtualRange = () => {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
  const fim    = new Date(agora.getFullYear(), agora.getMonth() + 1, 1, 0, 0, 0, 0);
  return {
    inicioMs: inicio.getTime(),
    fimMs:    fim.getTime(),
    mesNome:  MESES[agora.getMonth()],
    mesIndex: agora.getMonth(),
    ano:      agora.getFullYear(),
  };
};

/**
 * Normaliza qualquer formato de createdAt para milissegundos.
 * Suporta: Firestore Timestamp, Date, number (ms), string ISO.
 */
const toMs = (createdAt) => {
  if (!createdAt) return 0;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis(); // Firestore Timestamp
  if (typeof createdAt.toDate  === 'function') return createdAt.toDate().getTime();
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt === 'number') return createdAt;
  if (typeof createdAt === 'string') return new Date(createdAt).getTime();
  return 0;
};

// ─── getDashboardStats ────────────────────────────────────────────────────────
/**
 * Busca estatísticas completas do dashboard.
 *
 * Estratégia: 1 query por coleção filtrada por uid (índice simples, sem compose).
 * Contagens mensais calculadas client-side nos docs já baixados.
 * Isso elimina a necessidade de índices compostos uid+createdAt no Firestore.
 *
 * @param {string} userId - UID do usuário autenticado
 * @returns {Promise<Object>}
 */
export const getDashboardStats = async (userId) => {
  try {
    const { inicioMs, fimMs, mesNome, ano } = getMesAtualRange();

    // ── 1. Queries em paralelo — todas usam índice SIMPLES (uid == userId) ───
    const [
      streakStats,
      userDoc,
      materiasSnapshot,
      eventosSnapshot,
      resumosSnapshot,
      flashcardsSnapshot,
    ] = await Promise.all([
      // Streak — isolado, nunca bloqueia os demais
      updateStreak(userId)
        .then(() => getStreakStats(userId))
        .catch(err => {
          console.warn('[dashboard] Streak update falhou (não crítico):', err?.message);
          return { currentStreak: 0, longestStreak: 0, totalLoginDays: 0, history: [] };
        }),
      // Documento do usuário (meta mensal)
      getDoc(doc(db, 'users', userId))
        .catch(() => ({ exists: () => false, data: () => ({}) })),
      // Matérias
      getDocs(query(collection(db, 'materias'), where('uid', '==', userId), limit(500)))
        .catch(err => { console.warn('[dashboard] Matérias:', err?.message); return { docs: [] }; }),
      // Eventos
      getDocs(query(collection(db, 'eventos'), where('uid', '==', userId), limit(200)))
        .catch(err => { console.warn('[dashboard] Eventos:', err?.message); return { docs: [] }; }),
      // Resumos — busca todos (contagem total + mensal feita no cliente)
      getDocs(query(collection(db, 'resumos'), where('uid', '==', userId)))
        .catch(err => { console.warn('[dashboard] Resumos:', err?.message); return { docs: [] }; }),
      // Flashcards — busca todos (contagem total + mensal feita no cliente)
      getDocs(query(collection(db, 'flashcards'), where('uid', '==', userId)))
        .catch(err => { console.warn('[dashboard] Flashcards:', err?.message); return { docs: [] }; }),
    ]);

    // ── 2. Contagens calculadas no cliente ────────────────────────────────────
    const totalResumos    = resumosSnapshot.docs.length;
    const totalFlashcards = flashcardsSnapshot.docs.length;

    // Filtro mensal: verifica se createdAt está dentro do mês atual
    const resumosDoMes = resumosSnapshot.docs.filter(d => {
      const ms = toMs(d.data().createdAt);
      return ms >= inicioMs && ms < fimMs;
    }).length;

    const flashcardsDoMes = flashcardsSnapshot.docs.filter(d => {
      const ms = toMs(d.data().createdAt);
      return ms >= inicioMs && ms < fimMs;
    }).length;

    // ── 3. Meta mensal ────────────────────────────────────────────────────────
    const META_PADRAO  = 50;
    const metaUsuario  = userDoc.exists() ? (userDoc.data().metaMensal || META_PADRAO) : META_PADRAO;
    const totalInteracoes = resumosDoMes + flashcardsDoMes;
    const porcentagem  = Math.min(Math.round((totalInteracoes / metaUsuario) * 100), 100);

    const metaMensal = {
      meta:         metaUsuario,
      atual:        totalInteracoes,
      resumosDoMes,
      flashcardsDoMes,
      porcentagem,
      mesNome,
      ano,
      metaAtingida: totalInteracoes >= metaUsuario,
    };

    // ── 4. Notificações (não-bloqueantes) ─────────────────────────────────────
    checkMonthlyGoal(userId, totalInteracoes, metaUsuario, mesNome).catch(() => {});
    checkContentMilestones(userId, totalResumos, totalFlashcards).catch(() => {});

    // ── 5. Matérias ───────────────────────────────────────────────────────────
    const materiasList = materiasSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toMillis?.() || Date.now(),
    }));

    const materiasAtivas    = materiasList.filter(m => !m.concluida);
    const materiasConcluidas = materiasList.filter(m => m.concluida === true);
    const materiasRecentes   = [...materiasList]
      .sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime;
      })
      .slice(0, 6);

    // ── 6. Eventos ────────────────────────────────────────────────────────────
    const eventos = eventosSnapshot.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => {
        const dA = a.data?.toDate?.() || new Date(a.data || 0);
        const dB = b.data?.toDate?.() || new Date(b.data || 0);
        return dA - dB;
      });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const proximosEventos = eventos
      .filter(e => (e.data?.toDate?.() || new Date(e.data)) >= hoje)
      .slice(0, 5);

    // ── 7. Resultado ──────────────────────────────────────────────────────────
    return {
      totalMaterias:   materiasList.length,
      ativas:          materiasAtivas.length,
      concluidas:      materiasConcluidas.length,
      totalResumos,
      totalFlashcards,
      offensiveStreak: streakStats?.currentStreak  || 0,
      longestStreak:   streakStats?.longestStreak  || 0,
      totalLoginDays:  streakStats?.totalLoginDays || 0,
      streakHistory:   streakStats?.history        || [],
      lastLogin:       streakStats?.lastLogin,
      metaMensal,
      materiasAtivas:  materiasAtivas.slice(0, 8),
      materiasRecentes,
      proximosEventos,
      eventos,
      loading: false,
      error:   null,
    };

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
    return {
      totalMaterias:   0,
      ativas:          0,
      concluidas:      0,
      totalResumos:    0,
      totalFlashcards: 0,
      offensiveStreak: 0,
      metaMensal: {
        meta: 50, atual: 0, resumosDoMes: 0, flashcardsDoMes: 0,
        porcentagem: 0, mesNome: 'Este mês', metaAtingida: false,
      },
      materiasAtivas:   [],
      materiasRecentes: [],
      proximosEventos:  [],
      eventos:          [],
      loading: false,
      error:   error.message || 'Erro ao carregar dados',
    };
  }
};

/**
 * Retorna a saudação baseada na hora do dia
 * @returns {string} - Saudação personalizada
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
};

/**
 * Formata a data atual por extenso
 * @returns {string} - Data formatada
 */
export const getCurrentDate = () => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date().toLocaleDateString('pt-BR', options);
};

export default {
  getDashboardStats,
  getGreeting,
  getCurrentDate
};

