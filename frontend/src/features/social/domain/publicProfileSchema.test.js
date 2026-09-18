import { describe, expect, it } from 'vitest';
import {
  parsePublicProfile,
  projectPublicProfile,
} from './publicProfileSchema';

describe('public profile contract', () => {
  it('projeta apenas campos públicos necessários ao social', () => {
    const result = projectPublicProfile(
      {
        uid: 'user-1',
        displayName: '  Ana Silva  ',
        email: 'ana@example.com',
        photoURL: null,
        token: 'não deve sair',
      },
      {
        bio: 'Estudante',
        institution: 'Universidade',
        email: 'privado@example.com',
        metaMensal: 50,
      },
    );

    expect(result).toMatchObject({
      uid: 'user-1',
      displayName: 'Ana Silva',
      displayNameLower: 'ana silva',
      bio: 'Estudante',
      institution: 'Universidade',
    });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('metaMensal');
  });

  it('usa o email apenas como fallback do nome e não o persiste', () => {
    const result = projectPublicProfile({
      uid: 'user-2',
      email: 'maria.souza@example.com',
    });

    expect(result.displayName).toBe('maria.souza');
    expect(result).not.toHaveProperty('email');
  });

  it('rejeita perfil sem uid', () => {
    expect(() =>
      parsePublicProfile({
        uid: '',
        displayName: 'Usuário',
        displayNameLower: 'usuário',
      }),
    ).toThrow();
  });
});
