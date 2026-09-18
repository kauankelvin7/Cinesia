import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import {
  requireDocumentId,
  requireUserId,
} from '../../../shared/validation/domain';
import { parseEventoCreate } from '../domain/eventoSchema';

export async function salvarEvento(evento, userId) {
  const uid = requireUserId(userId);
  const input = parseEventoCreate(evento);

  try {
    const data = {
      ...input,
      data: Timestamp.fromDate(input.data),
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'eventos'), data);
    return { id: ref.id, ...data };
  } catch (error) {
    console.error('[AGENDA] Falha ao salvar evento:', error);
    throw new Error('Não consegui salvar o evento. Confira os dados e tente de novo.');
  }
}

export async function listarEventos(userId) {
  const uid = requireUserId(userId);

  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'eventos'),
        where('uid', '==', uid),
        orderBy('data', 'asc'),
      ),
    );

    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error('[AGENDA] Falha ao listar eventos:', error);
    throw new Error('Não consegui carregar sua agenda.');
  }
}

export async function deletarEvento(eventoId) {
  const id = requireDocumentId(eventoId);

  try {
    await deleteDoc(doc(db, 'eventos', id));
  } catch (error) {
    console.error('[AGENDA] Falha ao excluir evento:', error);
    throw new Error('Não consegui excluir o evento.');
  }
}
