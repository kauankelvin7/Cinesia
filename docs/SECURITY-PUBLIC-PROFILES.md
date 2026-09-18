# Migração de perfis públicos

**Status:** em andamento  
**Estratégia:** dual-write + leitura preferencial + fallback temporário

## Problema

O social historicamente busca usuários em `users/{uid}`. Essa coleção também contém dados de conta e preferências.

Firestore Security Rules não conseguem liberar somente alguns campos de um documento. Se a leitura do documento é permitida, o documento inteiro fica disponível.

## Destino

```text
users/{uid}
  -> privado

publicProfiles/{uid}
  -> contrato público:
     uid
     displayName
     displayNameLower
     photoURL
     bio
     institution
```

## Etapa atual

A aplicação:

1. cria/atualiza `publicProfiles/{uid}` quando um usuário autenticado inicializa o social;
2. busca primeiro em `publicProfiles`;
3. usa `users` apenas como fallback para perfis antigos ainda não migrados;
4. nunca copia email, preferências, metas ou outros campos privados para o perfil público.

As Rules de `publicProfiles` permitem somente os campos definidos no contrato.

## Critério para remover o fallback

A leitura autenticada ampla de `users/{uid}` só pode ser removida depois de comprovar que a base ativa foi materializada em `publicProfiles`.

Como o projeto não possui hoje um backend administrativo ativo com Firebase Admin, a migração acontece de forma gradual no login.

Opções futuras para fechamento completo:

- script administrativo executado uma vez com credencial segura;
- função server-side autenticada;
- período de migração suficiente para a base ativa.

## Corte final

Quando houver evidência de cobertura:

1. remover fallback em `friendsService.searchUsers`;
2. remover fallback em `friendsService.getUserProfile`;
3. remover o segundo `match /users/{userId}` que permite leitura autenticada;
4. executar testes de Rules com emulador;
5. validar busca, perfil, amizade, chat e desafio.

## Rollback

Se a busca social falhar após o corte:

- restaurar temporariamente o fallback de leitura;
- não apagar `publicProfiles`;
- corrigir materialização/migração antes de tentar o fechamento novamente.
