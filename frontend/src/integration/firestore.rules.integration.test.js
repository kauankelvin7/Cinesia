import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-cinesia';
const RULES = readFileSync(
  path.resolve(process.cwd(), '../infra/firebase/firestore.rules'),
  'utf8',
);

let testEnv;

function firestoreFor(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

describe('Firestore Rules — isolamento e contratos', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: RULES,
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('permite ao dono criar e ler a própria matéria', async () => {
    const db = firestoreFor('user-a');
    const ref = doc(db, 'materias', 'materia-a');

    await assertSucceeds(
      setDoc(ref, {
        uid: 'user-a',
        nome: 'Anatomia',
      }),
    );

    await assertSucceeds(getDoc(ref));
  });

  it('impede outro usuário de ler ou alterar matéria privada', async () => {
    const ownerDb = firestoreFor('user-a');
    const otherDb = firestoreFor('user-b');
    const ownerRef = doc(ownerDb, 'materias', 'materia-a');
    const otherRef = doc(otherDb, 'materias', 'materia-a');

    await assertSucceeds(
      setDoc(ownerRef, {
        uid: 'user-a',
        nome: 'Anatomia',
      }),
    );

    await assertFails(getDoc(otherRef));
    await assertFails(updateDoc(otherRef, { nome: 'Tentativa' }));
  });

  it('impede o dono de trocar o uid de um documento existente', async () => {
    const db = firestoreFor('user-a');
    const ref = doc(db, 'flashcards', 'card-a');

    await assertSucceeds(
      setDoc(ref, {
        uid: 'user-a',
        pergunta: 'Pergunta',
        resposta: 'Resposta',
      }),
    );

    await assertFails(updateDoc(ref, { uid: 'user-b' }));
  });

  it('permite leitura autenticada do perfil público', async () => {
    const ownerDb = firestoreFor('user-a');
    const viewerDb = firestoreFor('user-b');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'publicProfiles', 'user-a'), {
        uid: 'user-a',
        displayName: 'Ana',
        displayNameLower: 'ana',
        photoURL: null,
        bio: '',
        institution: '',
      }),
    );

    const snapshot = await assertSucceeds(
      getDoc(doc(viewerDb, 'publicProfiles', 'user-a')),
    );

    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data().displayName).toBe('Ana');
  });

  it('rejeita campo privado em publicProfiles', async () => {
    const db = firestoreFor('user-a');

    await assertFails(
      setDoc(doc(db, 'publicProfiles', 'user-a'), {
        uid: 'user-a',
        displayName: 'Ana',
        displayNameLower: 'ana',
        photoURL: null,
        bio: '',
        institution: '',
        email: 'ana@example.com',
      }),
    );
  });

  it('impede um usuário de editar o perfil público de outro', async () => {
    const ownerDb = firestoreFor('user-a');
    const otherDb = firestoreFor('user-b');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'publicProfiles', 'user-a'), {
        uid: 'user-a',
        displayName: 'Ana',
        displayNameLower: 'ana',
        photoURL: null,
        bio: '',
        institution: '',
      }),
    );

    await assertFails(
      updateDoc(doc(otherDb, 'publicProfiles', 'user-a'), {
        displayName: 'Alterado',
        displayNameLower: 'alterado',
      }),
    );
  });

  it('impede leitura anônima de perfil público', async () => {
    const ownerDb = firestoreFor('user-a');

    await assertSucceeds(
      setDoc(doc(ownerDb, 'publicProfiles', 'user-a'), {
        uid: 'user-a',
        displayName: 'Ana',
        displayNameLower: 'ana',
        photoURL: null,
        bio: '',
        institution: '',
      }),
    );

    const anonymousDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonymousDb, 'publicProfiles', 'user-a')));
  });

  it.todo(
    'bloqueia leitura de users/{uid} por terceiros após o corte final da migração de publicProfiles',
  );
});
