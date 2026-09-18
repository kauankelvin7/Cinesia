import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { uploadImage } from '../../../services/cloudinaryService';
import {
  cleanWritePayload,
  requireDocumentId,
  requireUserId,
} from '../../../shared/validation/domain';
import {
  parseFlashcardCreate,
  parseFlashcardUpdate,
} from '../domain/flashcardSchema';

const IMMUTABLE_FIELDS = ['id', 'uid', 'createdAt', 'updatedAt'];

export async function criarFlashcard(flashcard, imageFile, userId) {
  const uid = requireUserId(userId);
  const input = parseFlashcardCreate(flashcard);

  try {
    const data = {
      ...input,
      tags: input.tags || [],
      imagemUrl: input.imagemUrl || null,
      nextReviewDate: input.nextReviewDate || serverTimestamp(),
      interval: input.interval ?? 0,
      easeFactor: input.easeFactor ?? 2.5,
      repetitions: input.repetitions ?? 0,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (imageFile) {
      data.imagemUrl = await uploadImage(imageFile);
    }

    const ref = await addDoc(collection(db, 'flashcards'), data);
    return { id: ref.id, ...data };
  } catch (error) {
    console.error('[FLASHCARDS] Falha ao criar flashcard:', error);
    throw new Error(
      error?.name === 'DomainValidationError'
        ? error.message
        : 'Não consegui salvar o flashcard. Tente de novo.',
    );
  }
}

export async function listarFlashcards(userId, materiaId = null) {
  const uid = requireUserId(userId);

  try {
    const constraints = [
      where('uid', '==', uid),
      ...(materiaId ? [where('materiaId', '==', materiaId)] : []),
      orderBy('createdAt', 'desc'),
    ];

    const snapshot = await getDocs(query(collection(db, 'flashcards'), ...constraints));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error('[FLASHCARDS] Falha ao listar flashcards:', error);
    throw new Error('Não consegui carregar seus flashcards.');
  }
}

export async function atualizarFlashcard(flashcardId, updates, imageFile = null) {
  const id = requireDocumentId(flashcardId);
  const safeUpdates = cleanWritePayload(updates, IMMUTABLE_FIELDS);
  const input = parseFlashcardUpdate(safeUpdates);

  try {
    const data = {
      ...input,
      updatedAt: serverTimestamp(),
    };

    if (imageFile) {
      data.imagemUrl = await uploadImage(imageFile);
    }

    await updateDoc(doc(db, 'flashcards', id), data);
  } catch (error) {
    console.error('[FLASHCARDS] Falha ao atualizar flashcard:', error);
    throw new Error('Não consegui atualizar o flashcard.');
  }
}

export async function deletarFlashcard(flashcardId) {
  const id = requireDocumentId(flashcardId);

  try {
    await deleteDoc(doc(db, 'flashcards', id));
  } catch (error) {
    console.error('[FLASHCARDS] Falha ao excluir flashcard:', error);
    throw new Error('Não consegui excluir o flashcard.');
  }
}
