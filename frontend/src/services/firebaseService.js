/**
 * @file firebaseService.js
 * @description Camada de serviço Firestore para CRUD das coleções principais.
 * Substitui a API REST Java Spring Boot, tornando o backend 100% serverless.
 *
 * @dependencies
 *  - Firebase Firestore SDK
 *  - cloudinaryService.js — upload de imagens (URLs salvas nos docs do Firestore)
 *  - dashboardService.js — re-exportado via alias para compatibilidade legada
 *
 * @sideEffects
 *  - Escreve/lê nas coleções Firestore: `materias`, `resumos`, `flashcards`, `simulados`, `eventos`
 *  - Upload de imagens de flashcard no Cloudinary (CDN externo)
 *
 * @notes
 *  - WARN: operações de delete/update em doc individual NÃO verificam `uid` no cliente —
 *          a segurança é garantida pelas Firestore Security Rules
 *  - NOTE: imagens ficam no Cloudinary, não no Firebase Storage, para aproveitar CDN e transformações
 *  - NOTE: getDashboardStats foi migrado para dashboardService.js — re-exportado aqui para backcompat
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { uploadImage } from './cloudinaryService';
import { db } from '../config/firebase-config';

// ⚠️ getDashboardStats CANÔNICA está em dashboardService.js (inclui streak + metaMensal)
// Esta re-exportação existe para compatibilidade com imports legados
export { getDashboardStats } from './dashboardService';

// ==================== USUÁRIO - META MENSAL ====================

/**
 * Salva a meta mensal do usuário no Firestore.
 * Persiste a meta no documento do usuário (users/{userId}/metaMensal).
 *
 * @param {string} userId - UID do usuário autenticado
 * @param {number} metaValue - Novo valor da meta (1-500)
 * @returns {Promise<void>}
 */
export const atualizarMetaMensal = async (userId, metaValue) => {
  try {
    const safe = Math.max(1, Math.min(500, Number(metaValue) || 50));
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      metaMensal: safe,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, metaSalva: safe };
  } catch (error) {
    console.error('Erro ao atualizar meta mensal:', error);
    throw new Error('Não foi possível salvar a meta. Tente novamente.');
  }
};

// ==================== MATÉRIAS ====================

/**
 * Cria uma nova matéria no Firestore.
 *
 * @param {Object} materia - Objeto com dados da matéria (nome, descricao, cor, semestre, icone)
 * @param {string} userId - UID do usuário autenticado
 * @returns {Promise<Object>} - Matéria criada com ID
 *
 * Exemplo de uso:
 *   await criarMateria({ nome: 'Anatomia', cor: '#0D9488' }, 'uid123');
 */
export const criarMateria = async (materia, userId) => {
  try {
    const materiaData = {
      ...materia,
      concluida: materia.concluida ?? false,
      uid: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'materias'), materiaData);
    
    return {
      id: docRef.id,
      ...materiaData
    };
  } catch (error) {
    console.error('Erro ao criar matéria:', error);
    throw new Error('Não foi possível criar a matéria. Tente novamente.');
  }
};

/**
 * Lista todas as matérias do usuário, incluindo contadores de resumos e flashcards por matéria.
 *
 * @param {string} userId - UID do usuário autenticado
 * @returns {Promise<Array>} - Lista de matérias com totalResumos e totalFlashcards
 */
export const listarMaterias = async (userId) => {
  try {
    // Buscar matérias (limite para evitar reads ilimitados)
    const materiasQuery = query(
      collection(db, 'materias'),
      where('uid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
    
    // Buscar resumos e flashcards em paralelo para contar por matéria
    const resumosQuery = query(
      collection(db, 'resumos'),
      where('uid', '==', userId),
      limit(500)
    );
    
    const flashcardsQuery = query(
      collection(db, 'flashcards'),
      where('uid', '==', userId),
      limit(500)
    );
    
    const [materiasSnapshot, resumosSnapshot, flashcardsSnapshot] = await Promise.all([
      getDocs(materiasQuery),
      getDocs(resumosQuery),
      getDocs(flashcardsQuery)
    ]);
    
    // Contar resumos por matéria
    const resumosPorMateria = {};
    resumosSnapshot.docs.forEach(doc => {
      const materiaId = doc.data().materiaId;
      if (materiaId) {
        resumosPorMateria[materiaId] = (resumosPorMateria[materiaId] || 0) + 1;
      }
    });
    
    // Contar flashcards por matéria
    const flashcardsPorMateria = {};
    flashcardsSnapshot.docs.forEach(doc => {
      const materiaId = doc.data().materiaId;
      if (materiaId) {
        flashcardsPorMateria[materiaId] = (flashcardsPorMateria[materiaId] || 0) + 1;
      }
    });
    
    // Retornar matérias com contadores
    return materiasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      totalResumos: resumosPorMateria[doc.id] || 0,
      totalFlashcards: flashcardsPorMateria[doc.id] || 0
    }));
  } catch (error) {
    console.error('Erro ao listar matérias:', error);
    throw new Error('Não foi possível carregar as matérias.');
  }
};

/**
 * Lista apenas as matérias do usuário sem carregar resumos/flashcards (BUG-022).
 * Use este em Flashcards.jsx, Resumos.jsx — consome apenas 1 query Firestore.
 * @param {string} userId - UID do usuário
 * @returns {Promise<Array>} - Lista de matérias (sem contadores)
 */
export const listarMateriasSimples = async (userId) => {
  try {
    const q = query(
      collection(db, 'materias'),
      where('uid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erro ao listar matérias simples:', error);
    throw new Error('Não foi possível carregar as matérias.');
  }
};

/**
 * Busca uma matéria por ID
 * @param {string} materiaId - ID da matéria
 * @returns {Promise<Object>} - Dados da matéria
 */
export const buscarMateria = async (materiaId) => {
  try {
    const docRef = doc(db, 'materias', materiaId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Matéria não encontrada');
    }
  } catch (error) {
    console.error('Erro ao buscar matéria:', error);
    throw error;
  }
};

/**
 * Atualiza uma matéria existente
 * @param {string} materiaId - ID da matéria
 * @param {Object} updates - Campos a serem atualizados
 * @returns {Promise<void>}
 */
export const atualizarMateria = async (materiaId, updates) => {
  try {
    const docRef = doc(db, 'materias', materiaId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar matéria:', error);
    throw new Error('Não foi possível atualizar a matéria.');
  }
};

/**
 * Deleta uma matéria
 * @param {string} materiaId - ID da matéria
 * @returns {Promise<void>}
 */
export const deletarMateria = async (materiaId) => {
  try {
    const docRef = doc(db, 'materias', materiaId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar matéria:', error);
    throw new Error('Não foi possível deletar a matéria.');
  }
};

// ==================== FLASHCARDS ====================

/**
 * Cria um novo flashcard no Firestore com imagem hospedada no Cloudinary
 * @param {Object} flashcard - { pergunta, resposta, materiaId, materiaNome, materiaCor }
 * @param {File|null} imageFile - Arquivo de imagem (opcional)
 * @param {string} userId - UID do usuário autenticado
 * @returns {Promise<Object>} - Flashcard criado com ID
 */
export const criarFlashcard = async (flashcard, imageFile, userId) => {
  try {
    const flashcardData = {
      pergunta: flashcard.pergunta,
      resposta: flashcard.resposta,
      materiaId: flashcard.materiaId,
      materiaNome: flashcard.materiaNome || null,
      materiaCor: flashcard.materiaCor || null,
      tags: flashcard.tags || [],
      imagemUrl: null,  // Será preenchido com URL do Cloudinary se houver imagem
      // SM-2 fields (BUG-008)
      nextReviewDate: serverTimestamp(), // revisar imediatamente
      interval: 0,       // dias até próxima revisão
      easeFactor: 2.5,   // fator de facilidade (SM-2 default)
      repetitions: 0,    // número de repetições bem-sucedidas
      uid: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Se houver imagem, fazer upload para Cloudinary
    if (imageFile) {
      try {
        const imageUrl = await uploadImage(imageFile);
        flashcardData.imagemUrl = imageUrl;
      } catch (imageError) {
        console.error('⚠️ Erro ao fazer upload da imagem:', imageError);
        throw new Error(`Erro ao processar imagem: ${imageError.message}`);
      }
    }
    
    const docRef = await addDoc(collection(db, 'flashcards'), flashcardData);
    
    return {
      id: docRef.id,
      ...flashcardData
    };
  } catch (error) {
    console.error('Erro ao criar flashcard:', error);
    throw new Error(`Não foi possível criar o flashcard: ${error.message}`);
  }
};

/**
 * Lista flashcards do usuário (opcionalmente filtrados por matéria)
 * @param {string} userId - UID do usuário
 * @param {string|null} materiaId - ID da matéria (opcional)
 * @returns {Promise<Array>} - Lista de flashcards
 */
export const listarFlashcards = async (userId, materiaId = null) => {
  try {
    let q;
    
    if (materiaId) {
      q = query(
        collection(db, 'flashcards'),
        where('uid', '==', userId),
        where('materiaId', '==', materiaId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'flashcards'),
        where('uid', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao listar flashcards:', error);
    throw new Error('Não foi possível carregar os flashcards.');
  }
};

/**
 * Atualiza um flashcard existente com ou sem nova imagem
 * @param {string} flashcardId - ID do flashcard
 * @param {Object} updates - Campos a serem atualizados
 * @param {File|null} imageFile - Nova imagem (opcional)
 * @returns {Promise<void>}
 */
export const atualizarFlashcard = async (flashcardId, updates, imageFile = null) => {
  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // Se houver nova imagem, fazer upload para Cloudinary
    if (imageFile) {
      try {
        const imageUrl = await uploadImage(imageFile);
        updateData.imagemUrl = imageUrl;
      } catch (imageError) {
        console.error('⚠️ Erro ao fazer upload da imagem:', imageError);
        throw new Error(`Erro ao processar imagem: ${imageError.message}`);
      }
    }
    
    const docRef = doc(db, 'flashcards', flashcardId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar flashcard:', error);
    throw new Error(`Não foi possível atualizar o flashcard: ${error.message}`);
  }
};

/**
 * Deleta um flashcard
 * @param {string} flashcardId - ID do flashcard
 * @returns {Promise<void>}
 */
export const deletarFlashcard = async (flashcardId) => {
  try {
    const docRef = doc(db, 'flashcards', flashcardId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar flashcard:', error);
    throw new Error('Não foi possível deletar o flashcard.');
  }
};

// ==================== RESUMOS ====================

/**
 * Cria um novo resumo no Firestore
 * @param {Object} resumo - { titulo, conteudo, materiaId }
 * @param {string} userId - UID do usuário autenticado
 * @returns {Promise<Object>} - Resumo criado com ID
 */
export const criarResumo = async (resumo, userId) => {
  try {
    const resumoData = {
      ...resumo,
      uid: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'resumos'), resumoData);
    window.dispatchEvent(new CustomEvent('cinesia:resumo:alterado'));
    return {
      id: docRef.id,
      ...resumoData
    };
  } catch (error) {
    console.error('Erro ao criar resumo:', error);
    throw new Error('Não foi possível criar o resumo.');
  }
};

/**
 * Lista resumos do usuário (opcionalmente filtrados por matéria)
 * @param {string} userId - UID do usuário
 * @param {string|null} materiaId - ID da matéria (opcional)
 * @returns {Promise<Array>} - Lista de resumos
 */
export const listarResumos = async (userId, materiaId = null) => {
  try {
    let q;
    
    if (materiaId) {
      q = query(
        collection(db, 'resumos'),
        where('uid', '==', userId),
        where('materiaId', '==', materiaId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'resumos'),
        where('uid', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao listar resumos:', error);
    throw new Error('Não foi possível carregar os resumos.');
  }
};

/**
 * Atualiza um resumo existente
 * @param {string} resumoId - ID do resumo
 * @param {Object} updates - Campos a serem atualizados
 * @returns {Promise<void>}
 */
export const atualizarResumo = async (resumoId, updates) => {
  try {
    const docRef = doc(db, 'resumos', resumoId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    window.dispatchEvent(new CustomEvent('cinesia:resumo:alterado'));
  } catch (error) {
    console.error('Erro ao atualizar resumo:', error);
    throw new Error('Não foi possível atualizar o resumo.');
  }
};

/**
 * Deleta um resumo
 * @param {string} resumoId - ID do resumo
 * @returns {Promise<void>}
 */
export const deletarResumo = async (resumoId) => {
  try {
    const docRef = doc(db, 'resumos', resumoId);
    await deleteDoc(docRef);
    window.dispatchEvent(new CustomEvent('cinesia:resumo:alterado'));
  } catch (error) {
    console.error('Erro ao deletar resumo:', error);
    throw new Error('Não foi possível deletar o resumo.');
  }
};

// ==================== UTILITÁRIOS ====================

/**
 * Comprime uma imagem para Base64 (usado internamente)
 * Não é exportado para uso direto - use nos componentes via criarFlashcard()
 * 
 * IMPORTANTE: Imagens são armazenadas como Base64 diretamente no Firestore
 * - Limite: ~1MB por documento Firestore
 * - Tamanho típico: 300-600KB para anatomia
 * - Formato: JPEG 60% de qualidade
 * - Redimensionamento: máximo 800px de largura
 */

/**
 * Remove a data URI de uma string Base64 se necessário
 * @param {string} base64String - String com ou sem prefixo 'data:image/...'
 * @returns {string} - String Base64 pura
 */
export const getBase64Pure = (base64String) => {
  if (!base64String) return null;
  const parts = base64String.split(',');
  return parts.length > 1 ? parts[1] : base64String;
};

/**
 * Restaura o prefixo de data URI para uma string Base64 pura
 * @param {string} pureBase64 - String Base64 pura (sem prefixo)
 * @returns {string} - Data URI completo
 */
export const getDataURI = (pureBase64) => {
  if (!pureBase64) return null;
  // Verificar se já tem prefixo
  if (pureBase64.startsWith('data:')) return pureBase64;
  return `data:image/jpeg;base64,${pureBase64}`;
};

// ==================== SIMULADOS (Histórico) ====================

/**
 * Salva resultado de um simulado no Firestore.
 * @param {Object} simulado - Dados do simulado completado
 * @param {string} userId - UID do usuário
 * @returns {Promise<Object>} - Simulado salvo com ID
 */
export const salvarSimulado = async (simulado, userId) => {
  try {
    const simuladoData = {
      tema: simulado.tema,
      score: simulado.score,
      acertos: simulado.acertos,
      total: simulado.total,
      tempoSegundos: simulado.tempoSegundos || 0,
      data: new Date().toISOString(),
      questoes: simulado.questoes || [],
      uid: userId,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'simulados'), simuladoData);
    return { id: docRef.id, ...simuladoData };
  } catch (error) {
    console.error('Erro ao salvar simulado:', error);
    throw new Error('Não foi possível salvar o resultado do simulado.');
  }
};

/**
 * Lista histórico de simulados do usuário, ordenados por data.
 * @param {string} userId - UID do usuário
 * @param {number} maxResults - Máximo de resultados (padrão 50)
 * @returns {Promise<Array>}
 */
export const listarSimulados = async (userId, maxResults = 50) => {
  try {
    const q = query(
      collection(db, 'simulados'),
      where('uid', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erro ao listar simulados:', error);
    throw new Error('Não foi possível carregar o histórico de simulados.');
  }
};

// ==================== EVENTOS/AGENDA ====================

/**
 * Salva um evento na agenda (prova, trabalho, etc)
 * @param {Object} evento - { titulo, data, tipo ('prova'|'trabalho'|'outro') }
 * @param {string} userId - UID do usuário
 * @returns {Promise<Object>} - Evento criado com ID
 */
export const salvarEvento = async (evento, userId) => {
  try {
    const eventoData = {
      titulo: evento.titulo,
      data: Timestamp.fromDate(new Date(evento.data)),
      tipo: evento.tipo || 'outro',
      uid: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'eventos'), eventoData);
    
    return {
      id: docRef.id,
      ...eventoData
    };
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    throw new Error('Não foi possível salvar o evento.');
  }
};

/**
 * Lista eventos do usuário ordenados por data
 * @param {string} userId - UID do usuário
 * @returns {Promise<Array>} - Lista de eventos
 */
export const listarEventos = async (userId) => {
  try {
    const q = query(
      collection(db, 'eventos'),
      where('uid', '==', userId),
      orderBy('data', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    throw new Error('Não foi possível carregar os eventos.');
  }
};

/**
 * Deleta um evento
 * @param {string} eventoId - ID do evento
 * @returns {Promise<void>}
 */
export const deletarEvento = async (eventoId) => {
  try {
    const docRef = doc(db, 'eventos', eventoId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    throw new Error('Não foi possível deletar o evento.');
  }
};

// ==================== EXPORTAÇÃO ====================

export default {
  // Matérias
  criarMateria,
  listarMaterias,
  listarMateriasSimples,
  buscarMateria,
  atualizarMateria,
  deletarMateria,
  
  // Flashcards
  criarFlashcard,
  listarFlashcards,
  atualizarFlashcard,
  deletarFlashcard,
  
  // Resumos
  criarResumo,
  listarResumos,
  atualizarResumo,
  deletarResumo,
  
  // Eventos/Agenda
  salvarEvento,
  listarEventos,
  deletarEvento
};

