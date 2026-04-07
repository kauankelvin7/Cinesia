
<div align="center">

# Cinesia

Plataforma de estudos para Fisioterapia com foco em organização, revisão espaçada, IA assistiva e experiência PWA.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8)

</div>

---

## Visão Geral

O Cinesia é um monorepo com frontend React/Vite e um backend Java legado mantido para compatibilidade histórica. A experiência principal da aplicação está no `frontend/`, com Firebase como camada de persistência e autenticação.

O sistema foi desenhado para apoiar estudos de Fisioterapia com:
- resumos editor rich text
- flashcards com repetição espaçada SM-2
- simulados gerados com IA
- KakaBot para apoio conversacional
- atlas 3D, lousa digital e pomodoro
- recursos sociais com grupos, chat e desafios
- PWA instalável e sincronização em tempo real

## Stack

| Camada | Tecnologia |
| --- | --- |
| Interface | React 18 + Vite |
| Estilo | Tailwind CSS 4 + Framer Motion |
| Estado e dados | Firebase Auth, Firestore e Storage |
| IA | Google Gemini |
| Navegação | React Router DOM |
| Testes | Vitest + Testing Library |
| Build | Vite PWA |

## Estrutura do Repositório

```text
.
├── frontend/              # Aplicação principal
├── backend/               # Backend Java legado
├── docs/                  # Arquitetura, deploy e contribuição
├── firebase.json          # Configuração do hosting
├── firestore.rules        # Regras do Firestore
├── firestore.indexes.json  # Índices do Firestore
└── scripts/               # Utilitários e scripts auxiliares
```

## Principais Funcionalidades

- autenticação com Google e email/senha
- matérias, resumos e flashcards por usuário
- revisão espaçada com SM-2
- simulados e apoio de IA
- comunidade com amigos, grupos, chat e desafios
- quadro branco e atlas 3D
- notificações, conquistas e métricas de estudo
- suporte a PWA e uso em dispositivos móveis

## Como Executar

### Pré-requisitos

- Node.js 18+
- npm
- conta Firebase com projeto configurado

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev:frontend
```

Ou, diretamente no frontend:

```bash
cd frontend
npm run dev
```

### Build

```bash
npm run build:frontend
```

### Lint

```bash
npm run lint
```

### Testes

```bash
cd frontend
npm run test
```

## Configuração Firebase

As credenciais do Firebase devem ser fornecidas nas variáveis `VITE_*` usadas em `frontend/src/config/firebase-config.js`.

Campos esperados:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_GEMINI_API_KEY`

## Deploy

O fluxo oficial de deploy está documentado em [docs/DEPLOY.md](docs/DEPLOY.md).

Resumo rápido:
- Firebase Hosting é o caminho recomendado
- GitHub Actions automatiza o deploy na branch principal
- Vercel também é suportado com `frontend/` como root directory

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Deploy](docs/DEPLOY.md)
- [Contribuição](docs/CONTRIBUTING.md)

## Observações

- O backend Java existente é legado e foi mantido para compatibilidade com partes antigas do ecossistema.
- O fluxo principal de produto está concentrado no frontend e nos serviços Firebase.
- Variáveis `VITE_*` entram no bundle no build e não devem conter segredos sensíveis fora do escopo esperado para frontend.

## Contribuição

Antes de abrir PR ou enviar alterações:
1. rode `npm run lint`
2. rode `npm run build:frontend`
3. valide o comportamento das rotas principais no navegador

Consulte [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) para o processo completo.
1. Vá em "Matérias"
2. Clique em "Nova Matéria"
3. Preencha nome, cor e descrição
4. Dados salvos automaticamente no Firestore

### 3. Criar Flashcards
1. Vá em "Flashcards"
2. Clique em "Novo Flashcard"
3. Adicione pergunta e resposta
4. (Opcional) Faça upload de imagem
5. Associe a uma matéria

### 4. Modo de Estudo
1. Em Flashcards, clique em "Iniciar Estudo"
2. Clique no card para revelar resposta
3. Navegue com setas < >

### 5. Criar Resumos
1. Vá em "Resumos"
2. Use o editor rico para formatar conteúdo
3. Suporta negrito, listas, cores, imagens inline

## 🔒 Segurança Firebase

✅ **Regras de Firestore:**
- Usuários só acessam seus próprios dados
- Validação de `uid` em todas operações

✅ **Regras de Storage:**
- Upload apenas na pasta do próprio usuário
- Leitura permitida para usuários autenticados

✅ **Autenticação:**
- Tokens JWT gerenciados pelo Firebase
- Auto-refresh de tokens
- Logout seguro

## 🎯 Vantagens da Arquitetura Serverless

| Aspecto | Firebase | Backend Tradicional |
|---------|----------|---------------------|
| **Infraestrutura** | ✅ Gerenciada pelo Google | ❌ Você configura tudo |
| **Escalabilidade** | ✅ Automática | ❌ Manual |
| **Custo Inicial** | ✅ Grátis até 1GB | ❌ Servidor sempre ligado |
| **Manutenção** | ✅ Zero | ❌ Alta |
| **Deploy** | ✅ Apenas frontend | ❌ Backend + Frontend |
| **Tempo Real** | ✅ Nativo | ❌ Requer WebSockets |

## 📦 Scripts Disponíveis

```bash
# Frontend
npm run dev          # Desenvolvimento (Vite)
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linter

# Firebase (após instalar firebase-tools)
firebase deploy      # Deploy completo
firebase serve       # Teste local
```

## 🌐 Deploy (Opcional)

### Hospedar no Firebase Hosting:
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Build do frontend
cd frontend
npm run build

# Deploy
firebase deploy --only hosting
```

Seu app estará em: `https://cinesia-72d45.web.app`

## 📚 Documentação Adicional

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitetura e organização técnica
- [docs/DEPLOY.md](docs/DEPLOY.md) - Deploy em Firebase Hosting e Vercel
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) - Fluxo de contribuição
- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## 🆘 Solução de Problemas

### ❌ Erro: "Missing or insufficient permissions"
**Solução:** Verifique as regras de segurança do Firestore/Storage

### ❌ Erro: "Storage bucket not configured"  
**Solução:** Crie o Storage no Firebase Console

### ❌ Erro: "The query requires an index"
**Solução:** Clique no link do erro, Firebase cria índice automaticamente

### ❌ Upload de imagem não funciona
**Solução:** 
- Verifique regras de Storage
- Limite de 5MB por imagem
- Apenas imagens permitidas (jpg, png, gif)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## ✨ Autor

Desenvolvido com ❤️ para estudantes de Fisioterapia

---

**Stack:** React + Firebase (Serverless)  
**Última atualização:** Abril de 2026

