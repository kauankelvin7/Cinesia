# ADR 001 — Arquitetura incremental orientada a features

**Status:** aceito  
**Data:** 18/09/2026

## Contexto

O Cinesia cresceu a partir de páginas React e services compartilhados. O produto funciona, mas várias telas concentram renderização, estado, regras de negócio e persistência.

Uma reescrita completa aumentaria risco e não entregaria valor proporcional.

## Decisão

Adotar migração incremental para arquitetura orientada a features.

```text
app -> features -> shared/infrastructure
```

Cada feature passa a possuir suas regras, services/repositories, hooks e componentes quando isso reduzir acoplamento.

O Firebase continua sendo a infraestrutura principal. Não será introduzido backend tradicional apenas para uniformizar a arquitetura.

## Consequências

### Positivas

- módulos menores;
- testes mais simples;
- domínio menos acoplado a React/Firebase;
- refatoração reversível;
- ownership técnico mais claro.

### Custos

- período temporário com estrutura antiga e nova convivendo;
- imports serão migrados aos poucos;
- alguns adapters de compatibilidade serão necessários.

## Regras

- não mover código sem motivo funcional/arquitetural;
- manter comportamento durante extrações;
- não alterar schema e estrutura de pasta na mesma mudança quando puderem ser separados;
- cada etapa passa pelos quality gates.
