// Script de migração para corrigir perfis de usuários antigos no Firestore
// Execute uma vez em ambiente seguro (Node.js ou Cloud Functions)

import { getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';

export async function corrigirPerfisUsuariosAntigos() {
  const snap = await getDocs(collection(db, 'users'));
  for (const d of snap.docs) {
    const data = d.data();
    const atualizacoes = {};
    if (!data.uid) {
      atualizacoes.uid = d.id;
    }
    if (!data.displayName) {
      atualizacoes.displayName = 'Usuário';
      atualizacoes.displayNameLower = 'usuário';
    }
    if (!data.email) {
      atualizacoes.email = '';
    }
    // Adicione outros campos padrão conforme necessário
    if (Object.keys(atualizacoes).length > 0) {
      await updateDoc(doc(db, 'users', d.id), atualizacoes);
    }
  }
  console.log('Migração concluída. Perfis corrigidos.');
}

// Para executar: importe e chame corrigirPerfisUsuariosAntigos() em um script Node.js
