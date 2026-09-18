import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import {
  cleanWritePayload,
  requireDocumentId,
  requireUserId,
} from '../../../shared/validation/domain';
import {
  parseMateriaCreate,
  parseMateriaUpdate,
} from '../domain/materiaSchema';

const IMMUTABLE_FIELDS = [
  'id',
  'uid',
  'createdAt',
  'updatedAt',
  'totalResumos',
  'totalFlashcards',
];

export async function criarMateria(materia, userId) {
  const uid = requireUserId(userId);
  const input = parseMateriaCreate(materia);

  try {
    const data = {
      ...input,
      concluida: input.concluida ?? false,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'materias'), data);
    return { id: ref.id, ...data };
  } catch (error) {
    console.error('[MATERIAS] Falha ao criar matéria:', error);
    throw new Error('Não consegui salvar a matéria. Tente de novo.');
  }
}

export async function listarMaterias(userId) {
  const uid = requireUserId(userId);

  try {
    const materiasQuery = query(
      collection(db, 'materias'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(500),
    );

    const resumosQuery = query(
      collection(db, 'resumos'),
      where('uid', '==', uid),
      limit(500),
    );

    const flashcardsQuery = query(
      collection(db, 'flashcards'),
      where('uid', '==', uid),
      limit(500),
    );

    const [materiasSnapshot, resumosSnapshot, flashcardsSnapshot] = await Promise.all([
      getDocs(materiasQuery),
      getDocs(resumosQuery),
      getDocs(flashcardsQuery),
    ]);

    const resumosPorMateria = {};
    for (const resumo of resumosSnapshot.docs) {
      const materiaId = resumo.data().materiaId;
      if (materiaId) {
        resumosPorMateria[materiaId] = (resumosPorMateria[materiaId] || 0) + 1;
      }
    }

    const flashcardsPorMateria = {};
    for (const flashcard of flashcardsSnapshot.docs) {
      const materiaId = flashcard.data().materiaId;
      if (materiaId) {
        flashcardsPorMateria[materiaId] = (flashcardsPorMateria[materiaId] || 0) + 1;
      }
    }

    return materiasSnapshot.docs.map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data(),
      totalResumos: resumosPorMateria[snapshot.id] || 0,
      totalFlashcards: flashcardsPorMateria[snapshot.id] || 0,
    }));
  } catch (error) {
    console.error('[MATERIAS] Falha ao listar matérias:', error);
    throw new Error('Não consegui carregar suas matérias.');
  }
}

export async function listarMateriasSimples(userId) {
  const uid = requireUserId(userId);

  try {
    const materiasQuery = query(
      collection(db, 'materias'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(500),
    );

    const snapshot = await getDocs(materiasQuery);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error('[MATERIAS] Falha ao listar matérias:', error);
    throw new Error('Não consegui carregar suas matérias.');
  }
}

export async function buscarMateria(materiaId) {
  const id = requireDocumentId(materiaId);

  try {
    const snapshot = await getDoc(doc(db, 'materias', id));

    if (!snapshot.exists()) {
      throw new Error('NOT_FOUND');
    }

    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error('[MATERIAS] Falha ao buscar matéria:', error);
    throw new Error(
      error?.message === 'NOT_FOUND'
        ? 'Essa matéria não existe mais.'
        : 'Não consegui abrir essa matéria.',
    );
  }
}

export async function atualizarMateria(materiaId, updates) {
  const id = requireDocumentId(materiaId);
  const safeUpdates = cleanWritePayload(updates, IMMUTABLE_FIELDS);
  const input = parseMateriaUpdate(safeUpdates);

  try {
    await updateDoc(doc(db, 'materias', id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[MATERIAS] Falha ao atualizar matéria:', error);
    throw new Error('Não consegui atualizar a matéria.');
  }
}

export async function deletarMateria(materiaId) {
  const id = requireDocumentId(materiaId);

  try {
    await deleteDoc(doc(db, 'materias', id));
  } catch (error) {
    console.error('[MATERIAS] Falha ao excluir matéria:', error);
    throw new Error('Não consegui excluir a matéria.');
  }
}
