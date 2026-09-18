import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { requireUserId } from '../../../shared/validation/domain';

export async function atualizarMetaMensal(userId, metaValue) {
  const uid = requireUserId(userId);
  const meta = Math.max(1, Math.min(500, Number(metaValue) || 50));

  try {
    await updateDoc(doc(db, 'users', uid), {
      metaMensal: meta,
      updatedAt: serverTimestamp(),
    });

    return { success: true, metaSalva: meta };
  } catch (error) {
    console.error('[DASHBOARD] Falha ao salvar meta mensal:', error);
    throw new Error('Não consegui salvar sua meta. Tente de novo.');
  }
}
