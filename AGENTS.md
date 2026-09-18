# Cinesia — instruções para agentes

## Fontes de verdade

Antes de implementar, alterar persistência, regras, autenticação, IA, PWA ou fluxo social, leia nesta ordem:

1. `CONTINUAR.md`
2. `docs/CINESIA-ENGENHARIA-DE-SOFTWARE.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/QUALITY-GATES.md`
6. ADRs em `docs/adr/`
7. `README.md`

Quando houver divergência, prevalecem: pedido mais recente do usuário, `CONTINUAR.md`, documentação canônica vigente e, por último, documentação histórica.

## Estado do produto

- A aplicação principal está em `frontend/`.
- O produto ativo é React/Vite + Firebase; `backend/legacy/` é histórico e não participa do fluxo principal.
- Firebase Auth identifica o usuário.
- Firestore persiste conteúdo de estudo, perfis e social.
- Realtime Database é usado para presença.
- Firebase Storage é usado para avatar/perfil; Cloudinary ainda atende imagens de resumos.
- Gemini é usado por KakaBot, simulados e desafios, mas a chamada client-side é dívida de segurança conhecida.
- O PWA é parte do produto e precisa continuar funcionando depois de qualquer refatoração.

## Princípios de engenharia

- Mudanças pequenas, reversíveis e com causa raiz clara.
- Não fazer rewrite completo quando extração incremental resolve.
- Não criar abstrações sem dono de domínio.
- Preferir módulos por feature a pastas genéricas com responsabilidades misturadas.
- UI não deve conhecer detalhes de Firestore além do necessário durante a migração; a direção é concentrar persistência em services/repositories por domínio.
- Regras de domínio puras devem ser testáveis sem Firebase.
- Toda escrita persistente precisa validar os invariantes mínimos antes de chegar ao SDK.
- IDs de usuário vêm do Firebase Auth; nunca confiar em `uid` fornecido por campo editável da UI.
- Dados privados devem permanecer isolados por usuário e regras explícitas.
- Não usar `localStorage` como substituto de persistência remota.
- Não introduzir dependência nova sem justificar manutenção, bundle, segurança e necessidade real.
- Não executar `npm audit fix --force`.

## Estrutura-alvo

A migração é incremental. Novos módulos devem seguir, quando fizer sentido:

```text
src/
├── app/                 # bootstrap, routes e providers
├── shared/              # UI e utilidades sem domínio
├── infrastructure/      # Firebase, PWA, IA e storage
└── features/
    └── <dominio>/
        ├── components/
        ├── domain/
        ├── hooks/
        ├── repositories/
        ├── services/
        └── tests/
```

Não mover um arquivo só para “encaixar” na estrutura. A mudança deve reduzir acoplamento ou tornar contrato/teste mais claro.

## Dados e Firebase

- Coleções atuais e ownership estão documentados em `docs/DATA_MODEL.md`.
- Alterações em Firestore Rules exigem teste com emulador antes de serem consideradas prontas.
- Queries de listas devem ter paginação ou limite explícito.
- Listeners em tempo real precisam sempre retornar unsubscribe e ter lifecycle claro.
- Não misturar perfil público social com dados privados sem uma regra documentada.
- Migração de schema precisa ser retrocompatível ou vir acompanhada de script de migração e rollback.

## IA

- Não adicionar novas chaves secretas em `VITE_*`.
- A chave Gemini no browser é uma dívida conhecida; a direção é proxy server-side.
- IA não pode ser fonte da verdade para notas, progresso, resultados ou permissões.
- Respostas de IA que virarem dados persistidos devem passar por validação antes da gravação.

## PWA

- Preserve `registerType: autoUpdate`, `skipWaiting`, `clientsClaim` e limpeza de caches antigos.
- Navegação deve permanecer resiliente a conexão instável.
- Alterações de service worker exigem validação de atualização, reload e instalação.
- Não cachear conteúdo privado indefinidamente.

## UI/UX e linguagem

- Priorize tarefas de estudo; decoração não pode disputar atenção.
- Evite excesso de cards, gradientes, pills e elementos sem função.
- Hierarquia, espaço, tipografia e movimento devem comunicar estado e prioridade.
- Animações precisam ser sutis e respeitar `prefers-reduced-motion`.
- Drag/swipe nunca pode ser o único caminho para ação importante.
- Preserve foco visível, navegação por teclado, touch targets adequados e reflow em 200%.
- Cor não pode ser o único sinal de estado.
- Textos exibidos ao usuário devem seguir a abordagem humanizer: linguagem direta, natural e curta; sem jargão técnico exposto, caixa alta desnecessária, frases motivacionais genéricas ou tom de “assistente de IA”.
- Mensagens de erro devem dizer o que aconteceu e o que a pessoa pode fazer agora.

## Validação

Use a menor prova suficiente e aumente o gate conforme o risco.

Baseline obrigatório para PRs de código:

```bash
npm ci
npm run lint
npm test
npm run build
```

Quando aplicável, também:

```bash
npm run test:integration
npm run test:e2e:local
npm run check
```

Mudanças em Auth, Firestore Rules, isolamento de conta, migração ou persistência exigem integração/emuladores. Mudanças em rotas críticas, PWA e fluxos principais exigem E2E quando a infraestrutura estiver disponível.

Nunca declare um teste, preview, deploy ou comportamento como aprovado sem evidência real.

## Segurança

- Não registrar token, senha, conteúdo privado ou payload sensível em logs.
- Config Firebase Web pode ser pública; segredos de servidor não.
- Upload deve validar tipo/tamanho e ownership.
- Perfis sociais públicos devem expor apenas campos intencionalmente públicos.
- Ações destrutivas precisam de confirmação e caminho de recuperação quando possível.

## Trabalho no repositório

- Preserve comportamento funcional durante refatorações.
- Não force-push, reset destrutivo ou rebase da `main`.
- Preferir branch + PR para mudanças relevantes.
- Corrija no módulo dono do problema.
- Remova código morto somente depois de provar ausência de consumidores.
- Atualize `CONTINUAR.md` e documentação canônica quando uma etapa for concluída.
