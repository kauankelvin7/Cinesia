/**
 * 🧠 DASHBOARD SERVICE - Camada de Lógica de Negócio
 * 
 * Responsável por:
 * - Agregar dados de múltiplas coleções Firestore
 * - Calcular métricas (Streak de estudos, Meta Mensal)
 * - Tratar erros e retornar dados prontos para a UI
 * - Cachear dados quando possível
 */

import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

/**
 * 🎯 META MENSAL - Calcula o progresso da meta de estudos do mês
 * @param {string} userId - UID do usuário
 * @param {QuerySnapshot} resumosSnapshot - Snapshot dos resumos
 * @param {QuerySnapshot} flashcardsSnapshot - Snapshot dos flashcards
 * @returns {Object} - { meta, atual, porcentagem, mesNome }
 */
const calculateMonthlyGoal = async (userId, resumosSnapshot, flashcardsSnapshot) => {
  try {
    // Configuração da meta (padrão: 50 interações por mês)
    const META_PADRAO = 50;
    
    // Obter meta personalizada do usuário (se existir)
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const metaUsuario = userDoc.exists() ? (userDoc.data().metaMensal || META_PADRAO) : META_PADRAO;
    
    // Calcular início e fim do mês atual
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
    
    // Contar resumos criados este mês
    const resumosDoMes = resumosSnapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt || 0);
      return createdAt >= inicioMes && createdAt <= fimMes;
    }).length;
    
    // Contar flashcards criados este mês
    const flashcardsDoMes = flashcardsSnapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt || 0);
      return createdAt >= inicioMes && createdAt <= fimMes;
    }).length;
    
    // Total de interações (resumos + flashcards)
    const totalInteracoes = resumosDoMes + flashcardsDoMes;
    
    // Calcular porcentagem (máximo 100%)
    const porcentagem = Math.min(Math.round((totalInteracoes / metaUsuario) * 100), 100);
    
    // Nome do mês
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mesNome = meses[agora.getMonth()];
    
    return {
      meta: metaUsuario,
      atual: totalInteracoes,
      resumosDoMes,
      flashcardsDoMes,
      porcentagem,
      mesNome,
      metaAtingida: totalInteracoes >= metaUsuario
    };
  } catch (error) {
    console.error('Erro ao calcular meta mensal:', error);
    return {
      meta: 50,
      atual: 0,
      resumosDoMes: 0,
      flashcardsDoMes: 0,
      porcentagem: 0,
      mesNome: 'Este mês',
      metaAtingida: false
    };
  }
};

/**
 * Calcula o streak (ofensiva) de dias consecutivos de estudo
 * @param {string} userId - UID do usuário
 * @returns {Promise<number>} - Número de dias consecutivos
 */
const calculateStudyStreak = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Primeiro acesso, cria o documento
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        studyStreak: 1
      }).catch(() => {
        // Se o documento não existe, não faz nada (será criado no cadastro)
      });
      return 1;
    }

    const userData = userDoc.data();
    const lastLogin = userData.lastLogin?.toDate();
    const currentStreak = userData.studyStreak || 0;

    if (!lastLogin) {
      // Primeira vez com lastLogin
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        studyStreak: 1
      });
      return 1;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const diffTime = today - lastLoginDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = currentStreak;

    if (diffDays === 0) {
      // Login no mesmo dia, mantém streak
      newStreak = currentStreak;
    } else if (diffDays === 1) {
      // Login em dia consecutivo, aumenta streak
      newStreak = currentStreak + 1;
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        studyStreak: newStreak
      });
    } else {
      // Login após quebra de sequência, reseta
      newStreak = 1;
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        studyStreak: 1
      });
    }

    return newStreak;
  } catch (error) {
    console.error('❌ Erro ao calcular streak:', error);
    return 1; // Fallback seguro
  }
};

/**
 * Busca estatísticas completas do dashboard
 * @param {string} userId - UID do usuário autenticado
 * @returns {Promise<Object>} - Dados agregados do dashboard
 */
export const getDashboardStats = async (userId) => {
  try {
    // Queries paralelas para performance
    // Nota: eventos SEM orderBy para evitar necessidade de índice composto
    const [materiasSnapshot, resumosSnapshot, flashcardsSnapshot, eventosSnapshot, streakDays] = await Promise.all([
      getDocs(query(collection(db, 'materias'), where('uid', '==', userId))),
      getDocs(query(collection(db, 'resumos'), where('uid', '==', userId))),
      getDocs(query(collection(db, 'flashcards'), where('uid', '==', userId))),
      getDocs(query(collection(db, 'eventos'), where('uid', '==', userId))),
      calculateStudyStreak(userId)
    ]);

    // Mapear matérias
    const materiasList = materiasSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toMillis?.() || Date.now()
    }));

    // Filtrar ativas e concluídas
    const materiasAtivas = materiasList.filter(m => !m.concluida);
    const materiasConcluidas = materiasList.filter(m => m.concluida === true);

    // Ordenar matérias por data de atualização (mais recentes primeiro)
    const materiasRecentes = [...materiasList]
      .sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime;
      })
      .slice(0, 6);

    // Mapear eventos e ordenar por data (já que removemos orderBy da query)
    const eventos = eventosSnapshot.docs
      .map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .sort((a, b) => {
        const dateA = a.data?.toDate?.() || new Date(a.data || 0);
        const dateB = b.data?.toDate?.() || new Date(b.data || 0);
        return dateA - dateB; // Ordem crescente (mais antigos primeiro)
      });

    // Filtrar apenas próximos eventos (futuro + hoje)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const proximosEventos = eventos
      .filter(evento => {
        const eventDate = evento.data?.toDate?.() || new Date(evento.data);
        return eventDate >= hoje;
      })
      .slice(0, 5);

    // Calcular Meta Mensal
    const metaMensal = await calculateMonthlyGoal(userId, resumosSnapshot, flashcardsSnapshot);

    const resultado = {
      // Métricas principais
      totalMaterias: materiasList.length,
      ativas: materiasAtivas.length,
      concluidas: materiasConcluidas.length,
      totalResumos: resumosSnapshot.size,
      totalFlashcards: flashcardsSnapshot.size,
      offensiveStreak: streakDays,

      // Meta Mensal
      metaMensal,

      // Listas
      materiasAtivas: materiasAtivas.slice(0, 8),
      materiasRecentes,
      proximosEventos,
      eventos,

      // Estado
      loading: false,
      error: null
    };

    return resultado;

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
    
    // Retorna estado de erro com valores padrão
    return {
      totalMaterias: 0,
      ativas: 0,
      concluidas: 0,
      totalResumos: 0,
      totalFlashcards: 0,
      offensiveStreak: 0,
      materiasAtivas: [],
      materiasRecentes: [],
      proximosEventos: [],
      eventos: [],
      loading: false,
      error: error.message || 'Erro ao carregar dados'
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

