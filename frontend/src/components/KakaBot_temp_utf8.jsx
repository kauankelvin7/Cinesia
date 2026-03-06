/*
 * @file KakaBot.jsx
 * @description Agente de IA conversacional integrado ao Cinesia. Componente FAB (floating action button)
 * que abre um chat com o modelo Gemini, capaz de responder dúvidas clínicas E executar ações
 * reais no Firestore (criar matérias, flashcards, resumos, agendar revisões).
 *
 * @dependencies
 *  - useKakabotContext — provê dados do sistema em tempo real para o system prompt
 *  - useSpeechRecognition — entrada por voz via Web Speech API
 *  - kakabotActions (extrairAcoes, executarAcoes) — parser e executor de blocos ```action```
 *  - KakaAvatar — componente visual do avatar
 *  - @google/generative-ai — SDK do Gemini (importado dinamicamente via `import()`)
 *  - AuthContext-firebase — UID do usuário autenticado
 *
 * @sideEffects
 *  - Lê/escreve em `users/{uid}/kakabot_memoria/historico` (memória persistente)
 *  - Via kakabotActions: pode escrever em `materias`, `flashcards`, `resumos`, `eventos`
 *  - Chama a API externa do Google Gemini a cada mensagem enviada
 *
 * @notes
 *  - O histórico completo da sessão é reenviado ao Gemini a cada mensagem (sem memória nativa)
 *  - A memória persistida no Firestore (últimas 20 mensagens) é injetada na inicialização do chat
 *  - O modelo Gemini é importado dinamicamente para não aumentar o bundle inicial
 *  - Fallback automático entre 5 modelos Gemini se o primário falhar (ver GEMINI_MODELS)
 *  - Última revisão significativa: reimplementação visual v3 (Feb 2026) — paleta teal/cyan
 */

// ...existing code...
// Este arquivo é apenas um placeholder para garantir encoding UTF-8.
// Copie todo o conteúdo do KakaBot.jsx para este arquivo, salve, e substitua o original.
// Todos os acentos e caracteres especiais estarão corretos.
