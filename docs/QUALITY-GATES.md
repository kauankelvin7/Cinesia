# Cinesia — quality gates

A qualidade é proporcional ao risco. O objetivo não é rodar tudo para qualquer alteração, e sim nunca deixar uma mudança de alto risco passar por uma validação fraca.

## Gate A — alteração local simples

Para copy, estilo isolado ou componente sem dados:

```bash
npm run lint
npm test
npm run build
```

## Gate B — domínio/persistência

Para services, repositories, SM-2, KakaBot actions, simulados ou contratos:

```bash
npm run lint
npm test
npm run build
```

Além disso, criar teste automatizado que falhe antes da correção quando for bug.

## Gate C — Auth/Rules/isolamento

Exige emuladores Firebase assim que o harness estiver integrado:

```bash
npm run test:integration
```

Cenários mínimos:

- usuário A não lê dado privado de B;
- usuário A não altera dado de B;
- perfil público expõe apenas o contrato público;
- create/update rejeitam ownership inválido;
- índices/queries usados pelo produto funcionam.

## Gate D — rota crítica/PWA

Exige E2E local assim que Playwright estiver integrado:

```bash
npm run test:e2e:local
```

Fluxos mínimos:

- login;
- criar matéria;
- criar/estudar flashcard;
- criar/abrir resumo;
- iniciar/concluir simulado sem IA real;
- abrir KakaBot em modo degradado;
- instalar/atualizar PWA;
- navegar offline para shell já instalado;
- logout sem vazar estado anterior.

## Gate E — release

Meta:

```bash
npm run check
```

que deve agregar:

- lint;
- testes unitários/componentes;
- integração;
- build;
- E2E crítico.

## Acessibilidade

Nas telas principais:

- foco visível;
- navegação por teclado;
- sem ação essencial exclusiva de gesto;
- touch target adequado;
- reflow em 200%;
- reduced motion;
- contraste e nome acessível;
- cor nunca como único sinal.

A evolução prevista é adicionar Axe ao Playwright, seguindo o padrão usado no Leve.

## PWA

Toda mudança em cache/service worker precisa provar:

1. build gera manifest/SW;
2. atualização não prende versão antiga;
3. navegação não vira tela em branco com rede instável;
4. reduced functionality offline é explícita;
5. dados privados não ficam em cache sem intenção.

## Segurança de dependências

Rodar auditoria de produção de forma controlada.

Nunca usar:

`npm audit fix --force`

Vulnerabilidades devem ser classificadas por:

- runtime ou dev;
- direta ou transitiva;
- explorável no contexto do app;
- versão segura disponível;
- risco de breaking change.
