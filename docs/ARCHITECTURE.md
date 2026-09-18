# Arquitetura do Cinesia

> Documento de referência rápida. A visão completa e o plano de modernização estão em [CINESIA-ENGENHARIA-DE-SOFTWARE.md](CINESIA-ENGENHARIA-DE-SOFTWARE.md).

## Runtime atual

```text
frontend React/Vite
├── Firebase Auth
├── Firestore
├── Realtime Database
├── Firebase Storage
├── Cloudinary
├── Gemini
├── PWA / Workbox
├── Three.js / R3F
└── tldraw
```

`backend/legacy/` não participa do runtime.

## Fronteiras atuais

- `pages/`: telas ainda monolíticas em alguns domínios;
- `components/`: componentes compartilhados e alguns subsistemas antigos;
- `services/`: persistência do núcleo de estudo;
- `features/social/`: domínio social já organizado por feature;
- `hooks/`: principalmente KakaBot;
- `config/`: Firebase e runtime config.

## Direção

A evolução é incremental para:

```text
app/
shared/
infrastructure/
features/
```

com regras puras e validação próximas do domínio, repositories próximos da infraestrutura e UI sem espalhar paths Firestore.

## Domínios

- auth;
- dashboard;
- matérias;
- flashcards/revisão;
- resumos;
- simulados;
- agenda/pomodoro;
- analytics/conquistas;
- KakaBot;
- social;
- Atlas;
- whiteboard;
- onboarding/configurações.

## Dados

Consulte [DATA_MODEL.md](DATA_MODEL.md).

## Qualidade

Consulte [QUALITY-GATES.md](QUALITY-GATES.md).

## Decisões

Consulte [adr/](adr/).
