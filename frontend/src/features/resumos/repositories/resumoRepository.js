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
import {
  cleanWritePayload,
  requireDocumentId,
  requireUserId,
} from '../../../shared/validation/domain';
import {
  parseResumoCreate,
  parseResumoUpdate,
} from '../domain/resumoSchema';

const IMMUTABLE_FIELDS = ['id', 'uid', 'createdAt', 'updatedAt'];

export async function createResumo(resumo, userId) {
  const uid = requireUserId(userId);
  const input = parseResumoCreate(resumo);

  const data = {
    ...input,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'resumos'), data);
  return { id: ref.id, ...data };
}

export async function listResumos(userId, materiaId = null) {
  const uid = requireUserId(userId);
  const constraints = [
    where('uid', '==', uid),
    ...(materiaId ? [where('materiaId', '==', materiaId)] : []),
    orderBy('createdAt', 'desc'),
  ];

  const snapshot = await getDocs(query(collection(db, 'resumos'), ...constraints));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function updateResumo(resumoId, updates) {
  const id = requireDocumentId(resumoId);
  const safeUpdates = cleanWritePayload(updates, IMMUTABLE_FIELDS);
  const input = parseResumoUpdate(safeUpdates);

  await updateDoc(doc(db, 'resumos', id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteResumo(resumoId) {
  const id = requireDocumentId(resumoId);
  await deleteDoc(doc(db, 'resumos', id));
}
