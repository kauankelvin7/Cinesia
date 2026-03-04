
<div align="center">

# 🧬 Cinesia

**Sistema inteligente de estudos para fisioterapeutas**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?logo=google&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8)

</div>

---

**Cinesia** é um sistema web e PWA inteligente criado para potencializar os estudos de estudantes de Fisioterapia. Centraliza resumos, flashcards com SM-2, simulados por IA, KakaBot, atlas 3D e pomodoro — tudo com sync em tempo real via Firebase.

> 📖 **Documentação completa:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DEPLOY.md](docs/DEPLOY.md) · [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)



## 🧠 Contexto e Propósito

Estudar Fisioterapia exige organização, revisão constante e acesso rápido a conteúdos confiáveis. O Cinesia foi desenvolvido para:
- Centralizar materiais de estudo (resumos, flashcards, simulados, quadros brancos)
- Ajudar estudantes a revisar, praticar e fixar conteúdos de forma ativa
- Oferecer recursos inteligentes, como geração automática de questões e resumos com IA
- Tornar o aprendizado mais dinâmico, visual e acessível em qualquer dispositivo (PWA)

## 👩‍⚕️ Público-Alvo

Estudantes de graduação em Fisioterapia, cursinhos, residentes e profissionais que desejam revisar conteúdos de forma prática e moderna.

## 🤖 Inteligência Artificial Integrada

O sistema já conta com integração a LLMs (Google Gemini, OpenAI, Claude, Vertex AI), permitindo:
- Geração automática de simulados e questões a partir de temas ou PDFs
- Respostas didáticas e adaptativas via chat (KakaBot)
- Futuramente: agentes de IA personalizados para tutoria, correção automática, sugestões de estudo e acompanhamento de progresso

## 🚀 Visão de Futuro: Sistema com Agente de IA

O Cinesia está sendo preparado para evoluir além de um simples organizador de estudos. A visão é transformar a plataforma em um **agente de IA educacional**:
- Capaz de entender o perfil do estudante, sugerir trilhas de estudo, identificar dificuldades e adaptar conteúdos
- Interagir de forma natural, proativa e personalizada
- Automatizar tarefas repetitivas (resumos, revisões, geração de questões, feedback)
- Integrar-se a outros sistemas e bancos de dados acadêmicos

---

## 🚀 Arquitetura

### ⚡ Serverless (Firebase)
- **Firebase Authentication** (Login com Google + Email/Senha)
- **Firestore Database** (NoSQL em tempo real)
- **Firebase Storage** (Upload de imagens)
- **Sem backend local** - Infraestrutura gerenciada pelo Google

### Frontend
- **React 18**
- **Vite** (Build tool)
- **React Router DOM** (Roteamento)
- **React Quill** (Editor de texto rico)
- **Firebase SDK** (Auth + Firestore + Storage)
- **Framer Motion** (Animações)
- **React Icons** (Ícones)
- **PWA** (Progressive Web App)

## 📋 Funcionalidades

### ✅ Implementadas
- 🔐 **Autenticação Firebase**
  - Login com Google
  - Login com Email/Senha
  - Registro de novos usuários
  - Estado persistente (auto-login)

- ✨ **Gerenciamento de Matérias**
  - Criar, editar, listar e excluir matérias
  - Personalização com 8 cores diferentes
  - Dados salvos no Firestore
  - Isolamento por usuário (uid)

- 📝 **Resumos com Editor Rico**
  - Editor WYSIWYG com formatação completa
  - Suporte a imagens, listas, cores e estilos
  - Organização por matérias
  - Armazenamento no Firestore

- 🎴 **Flashcards com Imagens**
  - Criação de flashcards com pergunta e resposta
  - Upload de imagens no Firebase Storage
  - Modo de estudo interativo com flip cards 3D
  - Navegação entre flashcards
  - URLs públicas de imagens

- 📱 **PWA (Progressive Web App)**
  - Instalável em dispositivos móveis
  - Funciona offline (com cache do Firestore)
  - Ícones e manifest configurados
## 🏗️ Arquitetura Serverless

O projeto usa **Firebase** como backend completo, eliminando a necessidade de servidores próprios:

```
Frontend (React + Firebase SDK)
├── config/
│   └── firebase-config.js      # Configuração Firebase (Auth, Firestore, Storage)
├── services/
│   └── firebaseService.js      # Camada de serviço (CRUD completo)
├── contexts/
│   └── AuthContext-firebase.jsx # Context de autenticação
├── components/                  # Componentes reutilizáveis
├── pages/                      # Páginas da aplicação
│   ├── Materias.jsx
│   ├── Flashcards.jsx
│   └── Resumos.jsx
└── App.jsx                     # Componente raiz

Firebase (Backend Gerenciado)
├── Authentication              # Login/Registro de usuários
├── Firestore Database         # Banco NoSQL
│   ├── materias/              # Coleção de matérias
│   ├── flashcards/            # Coleção de flashcards
│   └── resumos/               # Coleção de resumos
└── Storage                     # Armazenamento de imagens
    └── flashcards/{userId}/   # Imagens organizadas por usuário
```

## 🛠️ Configuração e Instalação

### Pré-requisitos
- Node.js 18 ou superior
- Conta no [Firebase](https://firebase.google.com)

### 1️⃣ Configurar Firebase

#### Criar Projeto Firebase:
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Nome: **Cinesia** (ou outro de sua escolha)
4. Desative Google Analytics (opcional)

#### Configurar Authentication:
1. No menu lateral → **Authentication**
2. Clique em "Começar"
3. Ative os métodos:
   - ✅ **Google** (configure OAuth)
   - ✅ **Email/Senha**

#### Configurar Firestore Database:
1. No menu lateral → **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha **Modo de produção**
4. Região: **us-central** (ou mais próxima)
5. Vá em **Regras** e cole:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null 
                    && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

#### Configurar Storage:
1. No menu lateral → **Storage**
2. Clique em "Começar"
3. Modo de produção → **us-central**
4. Vá em **Regras** e cole:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /flashcards/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Obter Credenciais:
1. ⚙️ **Configurações do Projeto** (ícone de engrenagem)
2. Role até "Seus apps" → Clique no ícone **Web** (`</>`)
3. Registre o app: **Cinesia Web**
4. Copie o objeto `firebaseConfig`
5. Cole em `frontend/src/config/firebase-config.js`

### 2️⃣ Configurar Frontend

```bash
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev
```

O frontend estará rodando em: `http://localhost:5173` (porta padrão do Vite)

## 🔥 Estrutura de Dados Firestore

### Coleção: `materias`
```javascript
{
  id: "auto-id",
  nome: "Anatomia Humana",
  descricao: "Estudo do corpo",
  cor: "#0D9488",
  uid: "firebase-user-id",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Coleção: `flashcards`
```javascript
{
  id: "auto-id",
  pergunta: "O que é a escápula?",
  resposta: "Osso triangular...",
  imagemUrl: "https://firebasestorage...",
  materiaId: "id-da-materia",
  uid: "firebase-user-id",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Coleção: `resumos`
```javascript
{
  id: "auto-id",
  titulo: "Sistema Esquelético",
  conteudo: "<p>HTML do editor...</p>",
  materiaId: "id-da-materia",
  uid: "firebase-user-id",
  createdAt: Timestamp,
  updatedAt: Timestamp
```

## 🚀 Como Usar

### 1. Fazer Login
- Clique em "Entrar com Google" ou
- Registre-se com email/senha

### 2. Criar Matérias
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

- [MIGRACAO_FIREBASE.md](MIGRACAO_FIREBASE.md) - Detalhes da migração para Firebase
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

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Autor

Desenvolvido com ❤️ para estudantes de Fisioterapia

---

**Stack:** React + Firebase (Serverless)  
**Última atualização:** 2 de Fevereiro de 2026
   - Repositories com métodos específicos

5. **Dependency Inversion Principle (DIP)**
   - Injeção de dependências com Spring
   - Dependência de abstrações, não implementações

## 📱 PWA - Instalação

### Android/iOS
1. Abra o aplicativo no navegador
2. Clique no menu (⋮)
3. Selecione "Adicionar à tela inicial"
4. O app será instalado como aplicativo nativo

### Desktop
1. Abra no Chrome/Edge
2. Clique no ícone de instalação na barra de endereço
3. Confirme a instalação

## 🚀 Build para Produção

### Backend
```bash
cd backend
mvn clean package
java -jar target/cinesia-1.0.0.jar
```

### Frontend
```bash
cd frontend
npm run build
# Os arquivos estarão em dist/
```

## 🤝 Contribuindo

Ver [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) para fluxo de trabalho, convenção de commits e padrões de código.

## 🚀 Deploy

Ver [docs/DEPLOY.md](docs/DEPLOY.md) para instruções de deploy no Firebase Hosting e Vercel, incluindo configuração do GitHub Actions automático.

## 📄 Licença

Este projeto está sob a licença MIT.

## 👩‍💻 Desenvolvido para

Sistema de estudos para estudantes de Fisioterapia.

---

<div align="center">🧬 Cinesia — Estudos de Fisioterapia 📚</div>

