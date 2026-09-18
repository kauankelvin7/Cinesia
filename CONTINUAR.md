# Cinesia — ponto exato de retomada

**Atualizado em:** 18/09/2026  
**Branch funcional:** `main`  
**HEAD antes da modernização:** `bdbea4b391434a1ea8a8fba6607211cddeea5461`  
**Estado:** aplicação voltou a abrir; baseline de engenharia em preparação

## Situação consolidada

O Cinesia é uma plataforma de estudos para Fisioterapia. A aplicação ativa é um frontend React/Vite com Firebase como backend serverless.

O último bloco de estabilização corrigiu:

- boot recuperável em vez de splash infinito;
- autenticação que sempre encerra `loading`;
- configuração Firebase tolerante a integrações opcionais;
- navegação PWA resiliente;
- compatibilidade de desafios antigos e atuais;
- testes sociais desatualizados;
- crash de runtime do KakaBot causado por Temporal Dead Zone.

Baseline validado antes desta refatoração:

```text
ESLint        PASS
Vitest        53/53 PASS
Vite build    PASS
Vercel        funcional após liberação do rate limit
```

## Arquitetura atual

```text
React 18 + Vite
├── Firebase Auth
├── Firestore
├── Realtime Database (presence)
├── Firebase Storage (perfil)
├── Cloudinary (imagens de resumos)
├── Gemini no cliente (dívida conhecida)
├── PWA / Workbox
├── Three.js / R3F / Drei (Atlas)
└── tldraw (Quadro Branco)
```

`backend/legacy/` não participa do fluxo principal.

## Objetivo autorizado

Modernizar o repositório usando o Leve como referência de disciplina de engenharia, sem copiar arquitetura que não combina com o Cinesia.

A modernização deve cobrir:

1. documentação canônica;
2. higiene de legado;
3. fronteiras por domínio;
4. validação de dados;
5. segurança;
6. testes e CI;
7. UI/UX e linguagem humanizada;
8. hardening final.

## Regras de execução

- refatoração incremental;
- sem big-bang rewrite;
- cada etapa em branch/PR;
- só integrar com lint, testes e build verdes;
- mudanças de Rules/Auth/dados exigem gate maior;
- não usar `npm audit fix --force`;
- não esconder regressão para “passar” CI;
- preservar dados já existentes.

## Dívidas conhecidas prioritárias

- `KakaBot.jsx`, `Atlas3D.jsx`, `Home.jsx`, `Resumos.jsx`, `Simulado.jsx` e `Flashcards.jsx` são grandes demais;
- perfil social e documento privado de `users/{uid}` compartilham fronteira de leitura;
- chave Gemini chega ao browser via `VITE_GEMINI_API_KEY`;
- documentação histórica contém afirmações já obsoletas;
- existem resíduos de build e arquivos legados versionados;
- cobertura automatizada ainda é pequena fora do social/KakaBot;
- backend Java e cliente Axios antigos precisam ser classificados e isolados;
- UI ainda mistura regras, persistência e renderização em várias páginas.

## Etapa em andamento

**Etapa 1 — Fundação de engenharia**

Entregas:

- `AGENTS.md`;
- este `CONTINUAR.md`;
- `docs/CINESIA-ENGENHARIA-DE-SOFTWARE.md`;
- `docs/DATA_MODEL.md`;
- `docs/QUALITY-GATES.md`;
- ADR da arquitetura-alvo;
- limpeza de resíduos comprovadamente mortos;
- CI baseline preservado.

Não iniciar migração agressiva de dados na mesma etapa.
