/**
 * @file notificationService.js
 * @description Sistema de notificações automáticas do Cinesia.
 * Cria notificações no Firestore e verifica marcos de streak, metas e conteúdo.
 *
 * @dependencies
 *  - Firebase Firestore SDK
 *
 * @sideEffects
 *  - Escreve em `users/{uid}/notifications/{docId}` (coleção de notificações)
 *  - Lê/escreve em `users/{uid}/stats/notifications_sent` (flags de dedupl.) 
 *
 * @notes
 *  - Tipos de notificação: 'info', 'alerta', 'estudo', 'conquista'
 *  - Dedupl. via flags dinâmicas em `notifications_sent` (ex: 'streak_7', 'goal_100_2026-03')
 *  - WARN: todas as funções são silenciosas em caso de erro — não bloqueiam o fluxo principal
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

/* ═══════════════════════════════════════════
   PRIMITIVAS
   ═══════════════════════════════════════════ */

/**
 * Cria uma notificação no Firestore.
 * Silencioso em caso de erro — não deve bloquear o fluxo principal.
 */
export const createNotification = async (userId, { type = 'info', title, message }) => {
  if (!userId || !title) return;
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      type,
      title,
      message: message || '',
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Falhas de notificação são não-críticas
    console.warn('[notificationService] Erro ao criar notificação:', err?.message);
  }
};

/**
 * Verifica se uma notificação já foi enviada (evita duplicatas).
 * Usa o documento users/{uid}/stats/notifications_sent como flag store.
 */
const hasSent = async (userId, key) => {
  try {
    const ref = doc(db, 'users', userId, 'stats', 'notifications_sent');
    const snap = await getDoc(ref);
    return snap.exists() && snap.data()[key] === true;
  } catch {
    return false;
  }
};

/**
 * Marca uma notificação como enviada.
 */
const markSent = async (userId, key) => {
  try {
    const ref = doc(db, 'users', userId, 'stats', 'notifications_sent');
    await setDoc(ref, { [key]: true }, { merge: true });
  } catch {
    // silencioso
  }
};

/* ═══════════════════════════════════════════
   TEXTOS DOS MARCOS DE STREAK
   ═══════════════════════════════════════════ */
const STREAK_MESSAGES = {
  3:   'Três dias seguidos! Você está criando um hábito de estudo. Continue!',
  7:   'Uma semana ininterrupta de estudos! Seu comprometimento é inspirador.',
  14:  'Duas semanas seguidas! A consistência é o segredo dos melhores alunos.',
  21:  '21 dias — a neurociência confirma: o hábito está formado! Parabéns.',
  30:  'Um mês inteiro de sequência! Seus pacientes futuros terão um profissional dedicado.',
  60:  'Dois meses seguidos! Você está no top 1% dos estudantes mais disciplinados.',
  100: '100 dias consecutivos! Uma conquista histórica. Você é referência de dedicação.',
};

/* ═══════════════════════════════════════════
   VERIFICADORES — chamados pelo stream principal
   ═══════════════════════════════════════════ */

/**
 * Verifica marcos de streak (3, 7, 14, 21, 30, 60, 100 dias).
 * Também envia notificação de boas-vindas na primeira vez.
 *
 * @param {string} userId
 * @param {number} currentStreak  Streak atual após atualização
 * @param {boolean} isFirstLogin  True quando é o primeiro login
 */
export const checkStreakMilestones = async (userId, currentStreak, isFirstLogin = false) => {
  if (!userId) return;

  // Boas-vindas no primeiro login
  if (isFirstLogin) {
    const key = 'welcome';
    if (!(await hasSent(userId, key))) {
      await createNotification(userId, {
        type: 'info',
        title: '🎉 Bem-vindo ao Cinesia!',
        message:
          'Sua plataforma de estudos de fisioterapia está pronta. Explore os flashcards, resumos, Atlas 3D, simulados e muito mais!',
      });
      await markSent(userId, key);
    }
  }

  // Marcos de streak
  const milestones = [3, 7, 14, 21, 30, 60, 100];
  for (const m of milestones) {
    if (currentStreak === m) {
      const key = `streak_${m}`;
      if (!(await hasSent(userId, key))) {
        await createNotification(userId, {
          type: 'conquista',
          title: `🔥 ${m} dias de sequência!`,
          message: STREAK_MESSAGES[m] ?? `${m} dias consecutivos de estudo!`,
        });
        await markSent(userId, key);
      }
    }
  }
};

/**
 * Verifica a meta mensal (50% e 100% de conclusão).
 * A chave inclui ano+mês para resetar a cada novo mês.
 *
 * @param {string} userId
 * @param {number} atual     Total de resumos + flashcards criados no mês
 * @param {number} meta      Meta definida pelo usuário (padrão 50)
 * @param {string} mesNome   Nome do mês em português (ex: "Março")
 */
export const checkMonthlyGoal = async (userId, atual, meta, mesNome) => {
  if (!userId || !meta) return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Meta 100% atingida
  if (atual >= meta) {
    const key = `goal_100_${monthKey}`;
    if (!(await hasSent(userId, key))) {
      await createNotification(userId, {
        type: 'conquista',
        title: `🎯 Meta de ${mesNome} atingida!`,
        message: `Parabéns! Você criou ${atual} itens de estudo este mês — meta de ${meta} completamente alcançada!`,
      });
      await markSent(userId, key);
    }
    return;
  }

  // Meta 50% atingida
  if (atual >= Math.ceil(meta * 0.5)) {
    const key = `goal_50_${monthKey}`;
    if (!(await hasSent(userId, key))) {
      await createNotification(userId, {
        type: 'info',
        title: `📈 Metade da meta de ${mesNome}!`,
        message: `Você completou ${atual} de ${meta} itens — 50% da meta mensal. Continue, você está no caminho certo!`,
      });
      await markSent(userId, key);
    }
  }
};

/**
 * Verifica marcos de conteúdo (quantidade de resumos e flashcards).
 *
 * @param {string} userId
 * @param {number} totalResumos
 * @param {number} totalFlashcards
 */
export const checkContentMilestones = async (userId, totalResumos, totalFlashcards) => {
  if (!userId) return;

  // Marcos de resumos: 1, 5, 10, 25, 50, 100
  const resumoMilestones = [100, 50, 25, 10, 5, 1];
  for (const m of resumoMilestones) {
    if (totalResumos >= m) {
      const key = `resumos_${m}`;
      if (!(await hasSent(userId, key))) {
        await createNotification(userId, {
          type: 'estudo',
          title: m === 1 ? '📝 Primeiro resumo criado!' : `📝 ${m} resumos criados!`,
          message:
            m === 1
              ? 'Você criou seu primeiro resumo. Continue construindo seu material de estudo — cada nota conta!'
              : `Você já tem ${m} resumos salvos. Seu banco de conhecimento está crescendo de forma sólida!`,
        });
        await markSent(userId, key);
      }
      break; // Notifica apenas o marco mais alto ainda não enviado
    }
  }

  // Marcos de flashcards: 1, 5, 10, 50, 100, 200
  const flashcardMilestones = [200, 100, 50, 10, 5, 1];
  for (const m of flashcardMilestones) {
    if (totalFlashcards >= m) {
      const key = `flashcards_${m}`;
      if (!(await hasSent(userId, key))) {
        await createNotification(userId, {
          type: 'estudo',
          title: m === 1 ? '🃏 Primeiro flashcard criado!' : `🃏 ${m} flashcards criados!`,
          message:
            m === 1
              ? 'Você criou seu primeiro flashcard! A repetição espaçada é a técnica mais eficaz para memorização.'
              : `Você tem ${m} flashcards no seu deck. Revise regularmente para maximizar a retenção!`,
        });
        await markSent(userId, key);
      }
      break;
    }
  }
};
