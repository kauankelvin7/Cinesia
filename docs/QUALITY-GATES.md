# Cinesia — quality gates

**Status:** canônico  
**Atualizado em:** 18/09/2026

Os gates do Cinesia seguem a mesma disciplina usada no Leve, adaptada ao runtime serverless deste projeto.

O objetivo não é rodar a suíte mais cara para qualquer mudança. O objetivo é impedir que alterações de risco alto sejam validadas apenas com lint ou inspeção visual.

## 1. Baseline obrigatório

Toda mudança de código deve passar por:

```bash
npm run lint
npm test
npm run build
```

Na raiz do repositório, os mesmos comandos são encaminhados para o workspace `frontend`.

## 2. Gate de domínio

Use quando a mudança altera:

- regras de negócio;
- schemas Zod;
- repositories;
- SM-2;
- simulados;
- ações do KakaBot;
- transformação de dados.

Além do baseline, deve existir teste automatizado do comportamento alterado.

Bug corrigido deve, sempre que possível, ganhar um teste que falharia antes da correção.

## 3. Gate de segurança e Firestore Rules

Mudanças em:

- ownership;
- Firestore Rules;
- perfil público/privado;
- Auth;
- isolamento de conta;
- formato persistido sensível;

exigem:

```bash
npm run test:integration
```

Esse comando:

1. inicia o Firestore Emulator;
2. carrega as Rules reais de `infra/firebase/firestore.rules`;
3. executa a suíte `*.integration.test.js`;
4. encerra o emulador automaticamente.

Cenários cobertos na primeira versão:

- dono cria/lê a própria matéria;
- outro usuário não lê nem altera matéria privada;
- `uid` de documento privado não pode ser trocado;
- `publicProfiles` pode ser lido por usuário autenticado;
- `publicProfiles` rejeita campos fora do contrato público;
- terceiros não editam perfil público alheio;
- leitura anônima de perfil público é rejeitada.

### Dívida explicitamente não normalizada

A leitura ampla temporária de `users/{uid}` continua existindo enquanto a migração gradual de `publicProfiles` não terminar.

Existe um teste `todo` para o corte final. Não escreveremos um teste aprovando a exposição temporária como comportamento desejado.

## 4. Gate E2E

Para mudanças em fluxo crítico, navegação, acessibilidade ou PWA:

```bash
npm run test:e2e:local
```

Na primeira execução local, instale o browser de teste:

```bash
npm run test:e2e:install
```

A suíte inicial roda Chromium em desktop e mobile e cobre:

- renderização do login;
- labels acessíveis;
- alternância login/cadastro;
- Axe para violações serious/critical;
- ausência de overflow horizontal em viewport móvel.

Novos fluxos críticos devem entrar nessa suíte à medida que a infraestrutura de Auth/Firebase para E2E for amadurecida.

## 5. Gate completo local

```bash
npm run check
```

O comando agrega:

1. ESLint;
2. testes unitários/componentes;
3. build de produção;
4. testes de integração com Firestore Emulator;
5. E2E Playwright.

## 6. CI

Pull requests para `main` executam:

- `npm ci --include=dev`;
- auditoria das dependências de produção;
- ESLint;
- Vitest;
- build;
- Firestore Rules integration tests.

Java 21 é instalado no runner porque o Firebase Emulator precisa dele.

### Auditoria de dependências

Durante a etapa de hardening, `npm audit --omit=dev --audit-level=high` é **diagnóstico, não bloqueante**.

Isso é temporário.

A auditoria só vira gate obrigatório depois que as vulnerabilidades high/critical atuais forem classificadas e reduzidas sem `npm audit fix --force`.

## 7. PWA

Alteração em Workbox, manifest, service worker ou cache precisa provar:

1. build gera manifest e service worker;
2. atualização não prende versão antiga;
3. navegação instalada não vira tela branca com rede instável;
4. conteúdo privado não entra em cache sem intenção;
5. `prefers-reduced-motion` e acessibilidade continuam funcionais onde aplicável.

## 8. Acessibilidade

Nas telas principais:

- foco visível;
- teclado;
- nome acessível;
- erros anunciáveis;
- touch target adequado;
- reflow em 200%;
- reduced motion;
- contraste suficiente;
- cor não é o único sinal;
- gesto não é o único caminho para ação importante.

## 9. Regras de integridade do gate

Nunca:

- remover teste para fazer CI passar;
- marcar falha real como sucesso;
- usar `npm audit fix --force`;
- dizer que E2E passou sem executar E2E;
- dizer que preview/deploy está aprovado sem evidência;
- alterar Rules sem integração quando o emulador estiver disponível.

## 10. Definition of Done

Uma etapa técnica só pode ser integrada quando:

- lint passou;
- testes pertinentes passaram;
- build passou;
- integração passou quando há dados/Rules;
- E2E passou quando o escopo exige fluxo visual crítico;
- documentação canônica foi atualizada;
- dívidas restantes estão explicitamente registradas.
