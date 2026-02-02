# Cinesia 📚

Sistema web/PWA de estudos para Fisioterapia com suporte a resumos com formatação rica e flashcards com imagens.

## 🚀 Tecnologias

### Backend
- **Java 17**
- **Spring Boot 3.2.2**
  - Spring Web
  - Spring Data JPA
  - Spring Validation
- **PostgreSQL** (Banco de dados)
- **Maven** (Gerenciador de dependências)
- **Lombok** (Redução de boilerplate)

### Frontend
- **React 18**
- **Vite** (Build tool)
- **React Router DOM** (Roteamento)
- **React Quill** (Editor de texto rico)
- **Axios** (Cliente HTTP)
- **React Icons** (Ícones)
- **PWA** (Progressive Web App)

## 📋 Funcionalidades

### ✅ Implementadas
- ✨ **Gerenciamento de Matérias**
  - Criar, editar, listar e excluir matérias
  - Personalização com cores
  - Visualização de estatísticas (total de resumos e flashcards)

- 📝 **Resumos com Editor Rico**
  - Editor WYSIWYG com formatação completa
  - Suporte a imagens, listas, cores e estilos
  - Organização por matérias
  - Busca por título

- 🎴 **Flashcards com Imagens**
  - Criação de flashcards com pergunta e resposta
  - Upload de imagens (ideal para anatomia)
  - Modo de estudo interativo com flip cards
  - Navegação entre flashcards

- 📱 **PWA (Progressive Web App)**
  - Instalável em dispositivos móveis
  - Funciona offline (após primeira carga)
  - Ícones e manifest configurados

## 🏗️ Arquitetura

O projeto segue os princípios **SOLID** com arquitetura em camadas:

```
Backend (Spring Boot)
├── domain/              # Camada de Domínio
│   ├── entity/         # Entidades JPA
│   └── repository/     # Repositórios (acesso a dados)
├── application/         # Camada de Aplicação
│   ├── dto/            # Data Transfer Objects
│   ├── mapper/         # Conversores Entity ↔ DTO
│   └── service/        # Lógica de negócio
├── presentation/        # Camada de Apresentação
│   └── controller/     # Controllers REST
└── infrastructure/      # Infraestrutura
    └── exception/      # Tratamento de exceções

Frontend (React)
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas da aplicação
├── services/           # Comunicação com API
└── App.jsx             # Componente raiz
```

## 🛠️ Configuração e Instalação

### Pré-requisitos
- Java 17 ou superior
- Node.js 18 ou superior
- PostgreSQL 13 ou superior
- Maven 3.8+

### 1️⃣ Configurar Banco de Dados

```sql
-- Criar banco de dados PostgreSQL
CREATE DATABASE cinesia;
```

### 2️⃣ Configurar Backend

```bash
# Navegar para o diretório backend
cd backend

# Editar application.properties com suas credenciais PostgreSQL
# src/main/resources/application.properties
# spring.datasource.url=jdbc:postgresql://localhost:5432/cinesia
# spring.datasource.username=seu_usuario
# spring.datasource.password=sua_senha

# Compilar e executar
mvn clean install
mvn spring-boot:run
```

O backend estará rodando em: `http://localhost:8080`

### 3️⃣ Configurar Frontend

```bash
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
copy .env.example .env

# Executar em modo de desenvolvimento
npm run dev
```

O frontend estará rodando em: `http://localhost:3000`

## 📡 API Endpoints

### Matérias
- `GET /api/materias` - Listar todas as matérias
- `GET /api/materias/{id}` - Buscar matéria por ID
- `POST /api/materias` - Criar nova matéria
- `PUT /api/materias/{id}` - Atualizar matéria
- `DELETE /api/materias/{id}` - Excluir matéria

### Resumos
- `GET /api/resumos` - Listar todos os resumos
- `GET /api/resumos/{id}` - Buscar resumo por ID
- `GET /api/resumos/materia/{materiaId}` - Listar resumos de uma matéria
- `GET /api/resumos/buscar?titulo={titulo}` - Buscar por título
- `POST /api/resumos` - Criar novo resumo
- `PUT /api/resumos/{id}` - Atualizar resumo
- `DELETE /api/resumos/{id}` - Excluir resumo

### Flashcards
- `GET /api/flashcards` - Listar todos os flashcards
- `GET /api/flashcards/{id}` - Buscar flashcard por ID
- `GET /api/flashcards/materia/{materiaId}` - Listar flashcards de uma matéria
- `GET /api/flashcards/buscar?texto={texto}` - Buscar em pergunta ou resposta
- `POST /api/flashcards` - Criar novo flashcard
- `PUT /api/flashcards/{id}` - Atualizar flashcard
- `DELETE /api/flashcards/{id}` - Excluir flashcard

### Upload
- `POST /api/upload/imagem` - Fazer upload de imagem (multipart/form-data)
- `GET /api/upload/imagem/{filename}` - Obter imagem
- `DELETE /api/upload/imagem/{filename}` - Excluir imagem

## 🎨 Estrutura do Banco de Dados

```sql
materias
├── id (PK)
├── nome
├── descricao
├── cor
├── criado_em
└── atualizado_em

resumos
├── id (PK)
├── titulo
├── conteudo (TEXT/HTML)
├── materia_id (FK)
├── criado_em
└── atualizado_em

flashcards
├── id (PK)
├── pergunta
├── resposta
├── imagem_url
├── materia_id (FK)
├── criado_em
└── atualizado_em
```

## 🔒 Princípios SOLID Aplicados

1. **Single Responsibility Principle (SRP)**
   - Cada classe tem uma única responsabilidade
   - Controllers apenas recebem requisições
   - Services contêm lógica de negócio
   - Repositories apenas acessam dados

2. **Open/Closed Principle (OCP)**
   - Uso de interfaces (Repository, Service)
   - Extensível através de herança e composição

3. **Liskov Substitution Principle (LSP)**
   - Implementações podem substituir abstrações
   - Uso correto de herança e interfaces

4. **Interface Segregation Principle (ISP)**
   - Interfaces específicas por contexto
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

Este é um projeto de estudo. Sinta-se livre para:
- Reportar bugs
- Sugerir melhorias
- Fazer fork e criar Pull Requests

## 📄 Licença

Este projeto está sob a licença MIT.

## 👩‍💻 Desenvolvido para

Sistema de estudos para uma estudante de Fisioterapia, focado em facilitar o aprendizado através de resumos organizados e flashcards visuais.

---

**Cinesia** - Estudos de Fisioterapia 📚✨
