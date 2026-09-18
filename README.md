<div align="center">

# Cinesia

**Estudo de Fisioterapia em um só lugar.**

Organize matérias, crie resumos e flashcards, revise com repetição espaçada, faça simulados e estude com recursos sociais e IA assistiva.

</div>

## O produto

O Cinesia é uma PWA de estudos construída para reduzir a troca entre várias ferramentas durante a rotina acadêmica.

Hoje ele reúne:

- matérias, resumos e flashcards;
- revisão espaçada com SM-2;
- simulados e histórico de desempenho;
- KakaBot com contexto de estudo, memória e voz;
- agenda, pomodoro, conquistas e analytics;
- amigos, grupos, chat, presença e desafios;
- Atlas 3D;
- quadro branco com tldraw;
- instalação como PWA.

## Arquitetura atual

A aplicação ativa é serverless:

```text
React + Vite
   │
   ├── Firebase Auth
   ├── Firestore
   ├── Realtime Database
   ├── Firebase Storage
   ├── Cloudinary
   └── Gemini
```

O backend Spring Boot em `backend/legacy/` é histórico e não participa do runtime atual.

## Stack

| Área | Tecnologia |
| --- | --- |
| Interface | React 18 |
| Build | Vite 5 |
| Rotas | React Router 6 |
| Estilo | Tailwind CSS 4 + CSS |
| Dados | Firebase Firestore |
| Autenticação | Firebase Auth |
| Presença | Firebase Realtime Database |
| Arquivos | Firebase Storage + Cloudinary |
| IA | Google Gemini |
| 3D | Three.js + React Three Fiber |
| Quadro branco | tldraw |
| Editor | React Quill |
| Testes | Vitest + Testing Library |
| PWA | vite-plugin-pwa / Workbox |

## Começando

### Requisitos

- Node.js compatível com o projeto;
- npm;
- configuração Firebase.

### Instalação

```bash
npm ci
```

### Desenvolvimento

```bash
npm run dev
```

### Qualidade

```bash
npm run lint
npm test
npm run build
```

## Variáveis

Use `.env.example` como referência.

A configuração Web do Firebase identifica o projeto e pode existir no bundle do navegador. Segredos de servidor não devem ser colocados em variáveis `VITE_*`.

A chave Gemini ainda é usada no cliente em partes do sistema; isso está registrado como dívida de segurança e faz parte da modernização arquitetural em andamento.

## Engenharia

A documentação canônica está aqui:

- [Engenharia de Software](docs/CINESIA-ENGENHARIA-DE-SOFTWARE.md)
- [Modelo de dados](docs/DATA_MODEL.md)
- [Quality gates](docs/QUALITY-GATES.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Deploy](docs/DEPLOY.md)
- [ADRs](docs/adr/)
- [Ponto de retomada](CONTINUAR.md)

Para agentes e automações, leia também [AGENTS.md](AGENTS.md).

## Deploy

Vercel é suportada e usada no fluxo atual. Firebase Hosting continua disponível quando a credencial de service account estiver configurada.

Consulte [docs/DEPLOY.md](docs/DEPLOY.md) antes de alterar build, root directory ou cache.

## Estado da modernização

O projeto está passando por uma refatoração incremental inspirada na disciplina de engenharia usada no Leve:

- sem rewrite completo;
- mudanças pequenas e reversíveis;
- documentação antes de migrações grandes;
- testes como gate;
- segurança e dados tratados como arquitetura, não acabamento.

O comportamento funcional existente deve ser preservado durante cada etapa.
