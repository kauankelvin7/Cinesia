# Cinesia — Engenharia de Software

> Documento canônico de produto, arquitetura e modernização.  
> Baseado no código real da `main` em 18/09/2026.  
> O objetivo é evoluir o sistema sem reescrever o que já funciona.

## 1. Visão do produto

O Cinesia é uma plataforma de estudo voltada à Fisioterapia. Ele reúne organização de conteúdo, revisão espaçada, simulados, IA assistiva, recursos sociais e ferramentas visuais em uma PWA.

A proposta de produto é reduzir a troca constante entre aplicativos durante o estudo. Em vez de tratar cada recurso como um miniapp isolado, o Cinesia conecta matéria, resumo, flashcard, revisão, simulado, rotina e colaboração.

### Capacidades atuais

- autenticação por e-mail/senha e Google;
- matérias;
- resumos com editor rico;
- flashcards com SM-2;
- simulados com apoio de IA e PDF;
- histórico de simulados;
- agenda;
- pomodoro;
- conquistas e métricas;
- KakaBot com memória, sessões, contexto e voz;
- amigos, grupos, chat, presença e desafios;
- Atlas 3D;
- quadro branco com tldraw;
- notificações;
- PWA instalável.

## 2. Princípios

### 2.1 Refatorar sem interromper o produto

A modernização é incremental. Cada etapa deve deixar a aplicação utilizável e com caminho simples de rollback.

### 2.2 Domínio antes de framework

Regras como SM-2, cálculo de resultados, limites e validações devem ser funções testáveis fora de React/Firebase sempre que possível.

### 2.3 Persistência com fronteira clara

A UI pode consumir hooks/services, mas não deve espalhar detalhes de collections, paths e invariantes por dezenas de componentes.

### 2.4 Segurança por desenho

Auth identifica o usuário; Rules confirmam acesso; validação no cliente melhora UX, mas não substitui Rules.

### 2.5 PWA é produto

Instalação, atualização e comportamento com conexão instável fazem parte dos requisitos, não são acabamento posterior.

### 2.6 Linguagem humana

A interface deve explicar estados sem jargão. Mensagens técnicas ficam em logs de desenvolvimento; a pessoa vê ação clara, contexto suficiente e próximos passos.

## 3. Stack observada

| Camada | Tecnologia | Papel |
| --- | --- | --- |
| UI | React 18.3.1 | composição da aplicação |
| Build | Vite 5 | dev/build/code splitting |
| Rotas | React Router 6 | navegação SPA |
| Estilo | Tailwind 4 + CSS | layout e tokens atuais |
| Motion | Framer Motion | transições pontuais |
| Auth | Firebase Auth | identidade/sessão |
| Dados | Firestore | persistência principal |
| Presence | Firebase RTDB | status online |
| Arquivos | Firebase Storage | avatar/perfil |
| Mídia | Cloudinary | imagens de resumos |
| IA | Gemini | KakaBot/simulados/desafios |
| 3D | Three.js + R3F + Drei | Atlas |
| Whiteboard | tldraw | quadro branco |
| Editor | Quill/React Quill | resumos |
| Gráficos | Recharts | analytics |
| Testes | Vitest + Testing Library | unidade/componentes |
| PWA | vite-plugin-pwa + Workbox | instalação/cache/update |
| Deploy | Vercel + Firebase opcional | publicação |

## 4. Arquitetura atual

Hoje a arquitetura é híbrida:

```text
pages/components
      │
      ├── contexts
      ├── hooks
      ├── services
      ├── utils
      └── Firebase SDK direto em alguns pontos

features/social
      ├── components
      ├── hooks
      ├── services
      ├── utils
      └── tests
```

O módulo social já demonstra uma organização por feature melhor que o restante do app.

O principal problema não é a tecnologia escolhida. É o crescimento de responsabilidades dentro de arquivos grandes e o acesso direto à infraestrutura a partir da UI.

## 5. Arquitetura-alvo

```text
frontend/src/
├── app/
│   ├── bootstrap/
│   ├── providers/
│   └── routes/
├── shared/
│   ├── ui/
│   ├── hooks/
│   ├── utils/
│   └── validation/
├── infrastructure/
│   ├── firebase/
│   ├── ai/
│   ├── media/
│   └── pwa/
└── features/
    ├── auth/
    ├── dashboard/
    ├── materias/
    ├── flashcards/
    ├── resumos/
    ├── simulados/
    ├── agenda/
    ├── pomodoro/
    ├── analytics/
    ├── onboarding/
    ├── kakabot/
    ├── social/
    ├── atlas/
    └── whiteboard/
```

Não existe obrigação de todas as features terem todas as subpastas. Uma feature pequena deve continuar pequena.

### Fluxo desejado

```text
UI
 ↓
hook/use case
 ↓
domínio / validação
 ↓
repository
 ↓
Firebase/serviço externo
```

## 6. Domínios

### Study Core

Responsável por matérias, resumos, flashcards e revisão.

Invariantes:

- conteúdo pertence a um `uid`;
- referências entre matéria e conteúdo precisam ser do mesmo usuário;
- SM-2 não pode gerar ease factor abaixo do limite adotado;
- datas de revisão devem ser serializáveis e previsíveis;
- remoção de matéria precisa definir política para conteúdo dependente.

### Simulados

Responsável por geração, execução e histórico.

A IA pode gerar questões, mas o resultado final persistido deve ter schema conhecido.

### KakaBot

Responsável por conversa, memória, sessões, contexto e ações.

A UI do bot não deve carregar toda a lógica de prompt, persistência, voz e ações num único componente.

### Social

Responsável por amizades, chat, grupos, desafios, notificações e presença.

Este é o domínio mais próximo da estrutura-alvo hoje.

### Atlas

Responsável por experiência 3D. Precisa tratar lifecycle de WebGL, dispose de geometrias/materials e fallback para dispositivos sem capacidade suficiente.

### Whiteboard

Responsável por tldraw, persistência local e recuperação.

## 7. Arquivos de maior risco

Na baseline:

| Arquivo | Tamanho aproximado | Risco |
| --- | ---: | --- |
| `components/Logo.jsx` | 188 KB | asset/componente fora de escala |
| `pages/Atlas3D.jsx` | 151 KB | UI + dados + WebGL + lifecycle |
| `components/KakaBot.jsx` | 108 KB | IA + estado + persistência + voz |
| `pages/Home.jsx` | 63 KB | dashboard + widgets + animação |
| `pages/Resumos.jsx` | 59 KB | editor + persistência + mídia |
| `pages/Simulado.jsx` | 54 KB | IA + PDF + fluxo de prova |
| `pages/Flashcards.jsx` | 54 KB | CRUD + estudo + SM-2 |

Tamanho por si só não é bug, mas aqui ele acompanha mistura de responsabilidades.

## 8. Segurança

### 8.1 Perfil público

A regra atual permite leitura autenticada de `users/{uid}` para viabilizar o social. Como Rules são aditivas, isso amplia a leitura do documento inteiro.

Direção planejada:

```text
users/{uid}          -> privado
publicProfiles/{uid} -> somente campos públicos
```

A migração deve ser dual-write/dual-read temporariamente para não apagar usuários existentes.

### 8.2 IA

`VITE_GEMINI_API_KEY` chega ao bundle do navegador.

Direção:

```text
browser -> endpoint autenticado -> Gemini
```

A migração precisa preservar custo e evitar infraestrutura paga inesperada.

### 8.3 Uploads

Avatar e mídia devem validar tamanho, tipo e path de ownership antes do upload.

## 9. Performance

Prioridades:

1. reduzir módulos monolíticos;
2. manter rotas pesadas lazy;
3. Atlas somente quando necessário;
4. limitar queries Firestore;
5. evitar baixar coleções inteiras só para contar;
6. manter listeners somente enquanto a tela precisa deles;
7. revisar chunking manual depois de medir, não por estética.

## 10. UX

Direção visual:

- menos containers redundantes;
- hierarquia clara entre tarefa principal e informação auxiliar;
- estados vazios úteis;
- feedback de salvamento/carregamento consistente;
- motion curto e funcional;
- foco visível;
- mobile como primeira restrição;
- textos sem tom robótico.

Exemplo de mensagem:

**Evitar:** “Erro de autenticação: operação inválida.”

**Preferir:** “Não consegui entrar com essa conta. Confira os dados e tente de novo.”

Logs técnicos podem manter código/stack; a interface não precisa expô-los.

## 11. Estratégia de modernização

### Fase 1 — Fundação

Documentação, regras de trabalho, inventário e limpeza segura.

### Fase 2 — Higiene

Remover artefatos de build, arquivos temporários, dependências sem uso e documentar backend legado.

### Fase 3 — Contratos e validação

Criar validadores comuns para IDs, strings, datas e payloads de domínio. Cobrir regras puras com testes.

### Fase 4 — Data layer

Extrair repositories por feature e reduzir Firestore direto em páginas.

### Fase 5 — Segurança

Separar perfil público/privado, revisar Rules e preparar IA server-side.

### Fase 6 — Componentização

KakaBot, Atlas, Flashcards, Simulados e Resumos por partes menores com boundaries.

### Fase 7 — UX

Revisar navegação, vazios, erros, feedback, acessibilidade e copy com abordagem humanizer.

### Fase 8 — Qualidade operacional

E2E, emuladores, PWA, performance budget, dependências e runbook.

## 12. Definition of Done

Uma etapa só é concluída quando:

- comportamento esperado está implementado;
- lint passa;
- testes pertinentes passam;
- build passa;
- testes de integração/E2E passam quando o risco exigir;
- documentação foi atualizada;
- não existe regressão conhecida escondida;
- preview/deploy só é declarado quando realmente verificado.

## 13. O que não faremos

- rewrite completo;
- migração de framework sem necessidade;
- TypeScript em massa apenas por estética;
- dependência nova para resolver problema simples;
- `npm audit fix --force`;
- mudança de schema sem compatibilidade/migração;
- esconder erro com `try/catch` vazio;
- transformar toda tela em cards;
- usar IA como substituto de validação de domínio.
