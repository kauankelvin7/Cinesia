# Arquitetura do Cinesia

## Stack Principal

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| UI | React | 18.2 |
| Build | Vite | 5.x |
| Estilo | Tailwind CSS | 4.x |
| Animações | Framer Motion | 12.x |
| Roteamento | React Router DOM | 6.x |
| Banco de dados | Firebase Firestore | 12.x |
| Autenticação | Firebase Auth | 12.x |
| IA | Google Gemini 2.5 Flash | — |
| Upload de imagens | Cloudinary | — |
| Editor de texto | React Quill | 2.x |

---

## Estrutura de Collections no Firestore

```
materias/{materiaId}
  uid, nome, cor, icone, createdAt, updatedAt

resumos/{resumoId}
  uid, titulo, conteudo (HTML), materiaId, imagens[], createdAt, updatedAt

flashcards/{flashcardId}
  uid, frente, verso, materiaId
  SM-2: intervalo, easeFactor, nextReview, repetitions

simulados/{simuladoId}
  uid, titulo, materiaId, questoes[], pontuacao, createdAt

eventos/{eventoId}
  uid, titulo, date, tipo, materiaId

pomodoro/{uid_YYYY-MM-DD}
  uid, cycles, minutesStudied, date, updatedAt

users/{userId}
  displayName, email, photoURL, streak, lastStudyDate

users/{userId}/stats/{statId}
  streakDays, notificationsSent

users/{userId}/notifications/{notificationId}
  titulo, mensagem, lida, createdAt

users/{userId}/kakabot_memoria/preferencias
  personagem, tom, foco, contexto

users/{userId}/kakabot_sessoes/{sessaoId}
  titulo, historico[], createdAt, updatedAt
```

---

## KakaBot — Arquitetura da IA

- **Modelo:** `gemini-2.5-flash` (fallback `gemini-1.5-flash`)
- **Sessões:** cada conversa é uma sessão separada, persistida no Firestore
- **Memória cross-sessão:** `kakabot_memoria/preferencias` — persiste tom, foco e contexto do usuário
- **Contexto injetado:** dados reais do usuário (matérias, flashcards devidos, resumos recentes) são injetados no system prompt para respostas personalizadas
- **Entrada por voz:** Web Speech API (SpeechRecognition) — funciona em Chrome/Edge

---

## Algoritmo SM-2 (Repetição Espaçada)

Implementado em `src/utils/sm2.js`, baseado no SuperMemo 2 (Piotr Woźniak, 1987).

Campos por flashcard:
- `intervalo` — dias até próxima revisão
- `easeFactor` — fator de facilidade (1.3 a 2.5)
- `repetitions` — quantas vezes foi revisado com sucesso
- `nextReview` — timestamp da próxima revisão

---

## Decisões Técnicas

### Por que Firebase Firestore?
- Integração nativa com React via SDK
- Real-time listeners para sincronização instantânea
- Autenticação integrada (sem backend separado)
- Regras de segurança por documento no próprio banco

### Por que Vite + JSX (não TypeScript)?
- Projeto iniciado em JSX — migração para TS aumentaria custo sem benefício imediato
- Hot Module Replacement ultra-rápido no desenvolvimento
- Code splitting automático por rota via `React.lazy`

### Por que Cloudinary para imagens?
- Upload direto do browser (sem backend)
- CDN global automático
- Preset `ml_default` com otimização automática

### Segurança
- Credenciais Firebase são públicas por design (o SDK do browser sempre expõe a config)
- A proteção real está nas **Firestore Security Rules** — cada usuário só acessa seus próprios documentos
- Variáveis `VITE_*` são incorporadas no bundle em build time — não são segredos
- Chave Gemini AI: ⚠️ exposta no bundle — considerar backend proxy em produção
