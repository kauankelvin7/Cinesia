import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { cleanUndefined } from '../../../utils/firestoreHelpers';
import { parsePublicProfile, projectPublicProfile } from '../domain/publicProfileSchema';

const COLLECTION = 'publicProfiles';

export async function upsertPublicProfile(user, privateProfile = {}) {
  if (!user?.uid && !user?.id) return null;

  const profile = projectPublicProfile(user, privateProfile);

  await setDoc(
    doc(db, COLLECTION, profile.uid),
    cleanUndefined(profile),
    { merge: true },
  );

  return profile;
}

export async function getPublicProfile(userId) {
  if (!userId) return null;

  const snapshot = await getDoc(doc(db, COLLECTION, userId));
  if (!snapshot.exists()) return null;

  return parsePublicProfile({ id: snapshot.id, ...snapshot.data() });
}

export async function searchPublicProfiles(searchTerm, currentUserId) {
  const trimmed = searchTerm?.trim().toLocaleLowerCase('pt-BR');
  if (!trimmed || trimmed.length < 2) return [];

  const publicQuery = query(
    collection(db, COLLECTION),
    where('displayNameLower', '>=', trimmed),
    where('displayNameLower', '<=', trimmed + '\uf8ff'),
    orderBy('displayNameLower'),
    limit(20),
  );

  const snapshot = await getDocs(publicQuery);

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((profile) => profile.uid !== currentUserId)
    .map(parsePublicProfile);
}
