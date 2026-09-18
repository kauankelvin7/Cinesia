import { z } from 'zod';
import { validateDomain } from '../../../shared/validation/domain';

export const publicProfileSchema = z.object({
  uid: z.string().trim().min(1),
  displayName: z.string().trim().min(1).max(120),
  displayNameLower: z.string().trim().min(1).max(120),
  photoURL: z.string().trim().url().nullable().optional(),
  bio: z.string().trim().max(500).optional().default(''),
  institution: z.string().trim().max(180).optional().default(''),
}).passthrough();

export function parsePublicProfile(input) {
  return validateDomain(
    publicProfileSchema,
    input,
    'Não consegui validar os dados públicos do perfil.',
  );
}

export function projectPublicProfile(user, existing = {}) {
  const displayName =
    user?.displayName ||
    user?.nome ||
    existing?.displayName ||
    user?.email?.split('@')[0] ||
    'Usuário';

  return parsePublicProfile({
    uid: user?.uid || user?.id,
    displayName,
    displayNameLower: displayName.toLocaleLowerCase('pt-BR'),
    photoURL: user?.photoURL ?? existing?.photoURL ?? null,
    bio: existing?.bio || '',
    institution: existing?.institution || '',
  });
}
