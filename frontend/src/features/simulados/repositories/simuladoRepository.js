import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { requireUserId } from '../../../shared/validation/domain';
import { parseSimuladoResult } from '../domain/simuladoSchema';

export async function salvarSimulado(simulado, userId) {
  const uid = requireUserId(userId);
  const input = parseSimuladoResult(simulado);

  try {
    const data = {
      ...input,
      data: new Date().toISOString(),
      uid,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'simulados'), data);
    return { id: ref.id, ...data };
  } catch (error) {
    console.error('[SIMULADOS] Falha ao salvar resultado:', error);
    throw new Error('Não consegui salvar o resultado do simulado.');
  }
}

export async function listarSimulados(userId, maxResults = 50) {
  const uid = requireUserId(userId);
  const safeLimit = Math.max(1, Math.min(100, Number(maxResults) || 50));

  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'simulados'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(safeLimit),
      ),
    );

    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error('[SIMULADOS] Falha ao listar histórico:', error);
    throw new Error('Não consegui carregar o histórico de simulados.');
  }
}
