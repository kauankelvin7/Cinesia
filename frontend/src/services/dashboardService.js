import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase-config';

/**
 * Busca estatísticas completas do dashboard para um usuário
 * @param {string} uid - ID do usuário autenticado
 * @returns {Promise<Object>} Objeto com todas as estatísticas do dashboard
 */
export const getDashboardStats = async (uid) => {
  try {
    if (!uid) {
      console.warn('UID do usuário não foi fornecido');
      throw new Error('UID do usuário é obrigatório');
    }

    console.log('Buscando dados para uid:', uid);

    // Busca paralela de todas as coleções usando Promise.all
    // Tenta com ambos userId e uid para compatibilidade
    let materiasSnapshot, resumosSnapshot, flashcardsSnapshot, eventosSnapshot;
    
    try {
      console.log('Tentando query com uid em materias');
      materiasSnapshot = await getDocs(query(collection(db, 'materias'), where('uid', '==', uid)));
      console.log('Sucesso em materias com uid');
    } catch (err) {
      console.log('Falhou uid em materias, tentando userId:', err.message);
      try {
        materiasSnapshot = await getDocs(query(collection(db, 'materias'), where('userId', '==', uid)));
        console.log('Sucesso em materias com userId');
      } catch (err2) {
        console.log('Falhou userId em materias, buscando tudo:', err2.message);
        materiasSnapshot = await getDocs(collection(db, 'materias'));
        console.log('Buscou todas as materias (sem filtro)');
      }
    }

    try {
      resumosSnapshot = await getDocs(query(collection(db, 'resumos'), where('uid', '==', uid)));
    } catch {
      try {
        resumosSnapshot = await getDocs(query(collection(db, 'resumos'), where('userId', '==', uid)));
      } catch {
        resumosSnapshot = await getDocs(collection(db, 'resumos'));
      }
    }

    try {
      flashcardsSnapshot = await getDocs(query(collection(db, 'flashcards'), where('uid', '==', uid)));
    } catch {
      try {
        flashcardsSnapshot = await getDocs(query(collection(db, 'flashcards'), where('userId', '==', uid)));
      } catch {
        flashcardsSnapshot = await getDocs(collection(db, 'flashcards'));
      }
    }

    try {
      eventosSnapshot = await getDocs(query(collection(db, 'eventos'), where('uid', '==', uid)));
    } catch {
      try {
        eventosSnapshot = await getDocs(query(collection(db, 'eventos'), where('userId', '==', uid)));
      } catch {
        eventosSnapshot = await getDocs(collection(db, 'eventos'));
      }
    }

    // Processa matérias
    const materias = materiasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Encontrados ${materias.length} materias`);

    const materiasAtivas = materias.filter(m => !m.concluida);
    const materiasConcluidas = materias.filter(m => m.concluida === true);

    // Pega as 4 matérias ativas mais recentes
    const materiasAtivasRecentes = materiasAtivas
      .sort((a, b) => {
        const dateA = a.criadoEm?.toDate?.() || new Date(a.criadoEm || 0);
        const dateB = b.criadoEm?.toDate?.() || new Date(b.criadoEm || 0);
        return dateB - dateA;
      })
      .slice(0, 4);

    // Processa eventos e ordena por data
    const eventos = eventosSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        const dateA = a.data?.toDate?.() || new Date(a.data || 0);
        const dateB = b.data?.toDate?.() || new Date(b.data || 0);
        return dateA - dateB;
      });

    const resultado = {
      totalMaterias: materias.length,
      qtdAtivas: materiasAtivas.length,
      qtdConcluidas: materiasConcluidas.length,
      materiasAtivasRecentes,
      totalResumos: resumosSnapshot.size,
      totalFlashcards: flashcardsSnapshot.size,
      eventos
    };

    console.log('Stats calculados:', resultado);
    return resultado;

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    
    // Retorna objeto padrão em caso de erro
    return {
      totalMaterias: 0,
      qtdAtivas: 0,
      qtdConcluidas: 0,
      materiasAtivasRecentes: [],
      totalResumos: 0,
      totalFlashcards: 0,
      eventos: []
    };
  }
};
