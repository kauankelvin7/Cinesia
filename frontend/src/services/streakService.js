/**
 * @file streakService.js
 * @description Serviço de rastreamento de dias consecutivos de estudo (streak/ofensiva).
 *
 * @dependencies
 *  - Firebase Firestore SDK
 *  - notificationService.checkStreakMilestones — notificações de marcos (3, 7, 30 dias)
 *
 * @sideEffects
 *  - Lê/escreve em `users/{uid}/stats/streak`
 *  - Pode criar notificações via checkStreakMilestones()
 *
 * @notes
 *  - Datas normalizadas para meia-noite no timezone local (evita falsos resets por fuso horário)
 *  - WARN: a função updateStreak() deve ser chamada apenas UMA vez por sessão diária —
 *          chamadas duplas no mesmo dia são ignoradas (idempotente), mas geram reads desnecessários
 *  - NOTE: resetar o streak manualmente via Console Firebase apaga também o streakHistory
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { checkStreakMilestones } from './notificationService';


/**
 * Normaliza data para meia-noite (00:00:00) no timezone local
 * Isso garante que comparações sejam feitas por DIA e não por timestamp exato
 */
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Calcula diferença em dias entre duas datas
 */
const getDaysDifference = (date1, date2) => {
  const normalized1 = normalizeDate(date1);
  const normalized2 = normalizeDate(date2);
  const diffTime = Math.abs(normalized1 - normalized2);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Verifica se duas datas são do mesmo dia
 */
const isSameDay = (date1, date2) => {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() === d2.getTime();
};

/**
 * Verifica se date2 é o dia seguinte a date1
 */
const isNextDay = (date1, date2) => {
  return getDaysDifference(date1, date2) === 1 && date2 > date1;
};

/**
 * Inicializa ou recupera dados de streak do usuário
 */
export const getStreakData = async (userId) => {
  try {
    const streakRef = doc(db, 'users', userId, 'stats', 'streak');
    const streakDoc = await getDoc(streakRef);

    if (!streakDoc.exists()) {
      // Primeira vez - inicializa
      const initialData = {
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalLoginDays: 0,
        streakHistory: []
      };
      
      await setDoc(streakRef, initialData);
      return initialData;
    }

    const data = streakDoc.data();
    
    // Converte Timestamp do Firestore para Date
    if (data.lastLoginDate?.toDate) {
      data.lastLoginDate = data.lastLoginDate.toDate();
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: null,
      totalLoginDays: 0
    };
  }
};

/**
 * Atualiza streak com base no login atual
 * LÓGICA:
 * 1. Mesmo dia = não faz nada (já contou hoje)
 * 2. Dia seguinte = incrementa streak
 * 3. Pulou dias = ZERA streak e começa do 1
 */
export const updateStreak = async (userId) => {
  try {
    const streakData = await getStreakData(userId);
    const today = new Date();
    const lastLogin = streakData.lastLoginDate;

    // Se é o primeiro login ou não tem data anterior
    if (!lastLogin) {
      const newData = {
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: Timestamp.fromDate(today),
        updatedAt: serverTimestamp(),
        totalLoginDays: 1,
        streakHistory: [{
          date: Timestamp.fromDate(today),
          streak: 1,
          event: 'first_login'
        }]
      };

      const streakRef = doc(db, 'users', userId, 'stats', 'streak');
      await updateDoc(streakRef, newData);

      // Sincroniza streakDays no perfil público (não-bloqueante)
      updateDoc(doc(db, 'users', userId), { streakDays: 1 }).catch(() => {});

      // Notificação de boas-vindas no primeiro login (não-bloqueante)
      checkStreakMilestones(userId, 1, true).catch(() => {});
      
      return newData;
    }

    // Se já logou HOJE, não faz nada
    if (isSameDay(lastLogin, today)) {
      return {
        ...streakData,
        currentStreak: streakData.currentStreak || 0,
        longestStreak: streakData.longestStreak || 0
      };
    }

    // Se logou ONTEM (streak continua!)
    if (isNextDay(lastLogin, today)) {
      const newStreak = (streakData.currentStreak || 0) + 1;
      const newLongest = Math.max(newStreak, streakData.longestStreak || 0);

      const newData = {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastLoginDate: Timestamp.fromDate(today),
        updatedAt: serverTimestamp(),
        totalLoginDays: (streakData.totalLoginDays || 0) + 1,
        streakHistory: [
          ...(streakData.streakHistory || []).slice(-29), // Mantém últimos 30 dias
          {
            date: Timestamp.fromDate(today),
            streak: newStreak,
            event: 'continued'
          }
        ]
      };

      const streakRef = doc(db, 'users', userId, 'stats', 'streak');
      await updateDoc(streakRef, newData);

      // Sincroniza streakDays no perfil público (não-bloqueante)
      updateDoc(doc(db, 'users', userId), { streakDays: newStreak }).catch(() => {});

      // Verifica marcos de streak (não-bloqueante)
      checkStreakMilestones(userId, newStreak, false).catch(() => {});

      return newData;
    }

    // Se pulou dias (PERDEU A STREAK!)
    const daysMissed = getDaysDifference(lastLogin, today);
    
    const newData = {
      currentStreak: 1, // Recomeça do 1
      longestStreak: streakData.longestStreak || 0, // Mantém o recorde
      lastLoginDate: Timestamp.fromDate(today),
      updatedAt: serverTimestamp(),
      totalLoginDays: (streakData.totalLoginDays || 0) + 1,
      streakHistory: [
        ...(streakData.streakHistory || []).slice(-29),
        {
          date: Timestamp.fromDate(today),
          streak: 1,
          event: 'streak_broken',
          daysMissed,
          previousStreak: streakData.currentStreak || 0
        }
      ]
    };

    const streakRef = doc(db, 'users', userId, 'stats', 'streak');
    await updateDoc(streakRef, newData);

    // Sincroniza streakDays no perfil público (não-bloqueante)
    updateDoc(doc(db, 'users', userId), { streakDays: 1 }).catch(() => {});

    return newData;

  } catch (error) {
    console.error('Erro ao atualizar streak:', error);
    // Não propagar: falhas de streak não devem bloquear o carregamento do dashboard
    return null;
  }
};

/**
 * Verifica se o usuário está em risco de perder a streak
 * (útil para notificações/alertas)
 */
export const checkStreakRisk = async (userId) => {
  try {
    const streakData = await getStreakData(userId);
    const today = new Date();
    const lastLogin = streakData.lastLoginDate;

    if (!lastLogin) return { atRisk: false, streak: 0 };

    // Se não logou hoje ainda
    if (!isSameDay(lastLogin, today)) {
      // Se foi ontem, está em risco (precisa logar hoje!)
      if (isNextDay(lastLogin, today)) {
        return {
          atRisk: true,
          hoursRemaining: 24 - new Date().getHours(),
          currentStreak: streakData.currentStreak || 0,
          message: 'Faça login hoje para manter sua sequência!'
        };
      }
      
      // Se passou de ontem, já perdeu
      return {
        atRisk: false,
        streakLost: true,
        currentStreak: 0,
        previousStreak: streakData.currentStreak || 0,
        message: 'Sua sequência foi perdida. Comece uma nova hoje!'
      };
    }

    // Já logou hoje, tudo certo
    return {
      atRisk: false,
      safe: true,
      currentStreak: streakData.currentStreak || 0,
      message: 'Sequência mantida hoje! Continue amanhã.'
    };

  } catch (error) {
    console.error('Erro ao checar risco de streak:', error);
    return { atRisk: false, error: true };
  }
};

/**
 * Obtém estatísticas completas de streak
 */
export const getStreakStats = async (userId) => {
  try {
    const streakData = await getStreakData(userId);
    
    return {
      currentStreak: streakData.currentStreak || 0,
      longestStreak: streakData.longestStreak || 0,
      totalLoginDays: streakData.totalLoginDays || 0,
      lastLogin: streakData.lastLoginDate,
      history: streakData.streakHistory || [],
      createdAt: streakData.createdAt
    };
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    return null;
  }
};

/**
 * Hook/função para usar no App.jsx ou layout principal
 * Chama automaticamente updateStreak quando o usuário loga
 */
export const initializeStreakTracking = async (userId) => {
  if (!userId) return null;
  
  try {
    // Atualiza streak automaticamente no login
    const streakData = await updateStreak(userId);
    
    // Opcional: salvar no localStorage para não recalcular toda hora
    localStorage.setItem('lastStreakCheck', new Date().toISOString());
    
    return streakData;
  } catch (error) {
    console.error('Erro ao inicializar tracking:', error);
    return null;
  }
};
