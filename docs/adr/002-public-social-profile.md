# ADR 002 — Separar perfil social público do documento privado do usuário

**Status:** aceito  
**Data:** 18/09/2026

## Contexto

O Cinesia usa `users/{uid}` tanto para informações privadas da conta quanto para descoberta social.

Firestore Rules autorizam documentos inteiros, não campos isolados. Portanto, liberar leitura de `users/{uid}` para busca social amplia o acesso além do necessário.

## Decisão

Criar `publicProfiles/{uid}` com contrato mínimo e migrar de forma gradual.

A aplicação passa a:

- dual-write do perfil público;
- preferir `publicProfiles` nas leituras sociais;
- manter fallback temporário para registros antigos;
- fechar `users/{uid}` somente depois de comprovar a migração.

## Campos públicos

- uid
- displayName
- displayNameLower
- photoURL
- bio
- institution

Email, preferências, metas, tokens, histórico e configurações não pertencem ao perfil público.

## Consequências

### Positivas

- fronteira de privacidade explícita;
- menor risco de exposição acidental;
- social deixa de depender do documento privado;
- migração sem interrupção da base existente.

### Custo

Durante a transição ainda existe a leitura ampla antiga. É uma dívida temporária rastreada em `docs/SECURITY-PUBLIC-PROFILES.md`.
