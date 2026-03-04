/**
 * @file KakaBot.jsx
 * @description Agente de IA conversacional integrado ao Cinesia. Componente FAB (floating action button)
 * que abre um chat com o modelo Gemini, capaz de responder dúvidas clínicas E executar ações
 * reais no Firestore (criar matérias, flashcards, resumos, agendar revisões).
 *
 * @dependencies
 *  - useKakabotContext  — provê dados do sistema em tempo real para o system prompt
 *  - useSpeechRecognition — entrada por voz via Web Speech API
 *  - kakabotActions (extrairAcao, executarAcao) — parser e executor de blocos ```action```
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

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  X,
  Zap,
  FileText,
  FolderPlus,
  Lightbulb,
  BarChart2,
  CheckCircle2,
  Dna,
  User,
  Loader,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Database,
  Activity,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import useKakabotContext from '../hooks/useKakabotContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { extrairAcao, executarAcao } from '../utils/kakabotActions';
import KakaAvatar from './kakabot/KakaAvatar';

// ─── Configuração ────────────────────────────────────────────────────────────

/**
 * Tamanho máximo de uma mensagem do usuário em caracteres.
 * WARN: aumentar muito pode causar erros de token no Gemini (contexto máx ~30k tokens).
 */
const MAX_USER_CHARS = 2000;

/**
 * Intervalo mínimo (ms) entre mensagens consecutivas.
 * WARN: reduzir abaixo de 1000ms aumenta risco de erros 429 (rate limit do Gemini Free).
 */
const MIN_MESSAGE_INTERVAL_MS = 2000;

/**
 * Máximo de mensagens por minuto permitidas ao KakaBot.
 * NOTE: o plano gratuito do Gemini permite ~15 RPM (requests per minute) por projeto.
 */
const MAX_MESSAGES_PER_MINUTE = 15;

/**
 * Número máximo de mensagens persistidas na memória do Firestore.
 * NOTE: o histórico injetado no chat inicial usa as últimas 6 (ver createChatWithPersona).
 * WARN: aumentar este valor incrementa o tamanho do contexto enviado ao Gemini.
 */
const MEMORY_MAX_MESSAGES = 20;

/**
 * Cadeia de fallback de modelos Gemini tentados em ordem.
 * NOTE: se o modelo primário (2.5-flash) retornar erro não-429, tenta o próximo.
 * WARN: erros 429 (quota) não fazem fallback — disparam retry com backoff exponencial.
 */
const GEMINI_MODELS = [
  { name: 'gemini-2.5-flash', description: 'Rápido e eficiente' },
  { name: 'gemini-2.5-flash-lite', description: 'Mais leve' },
  { name: 'gemini-1.5-flash', description: 'Substituto' },
  { name: 'gemini-1.5-pro', description: 'Tarefas complexas' },
  { name: 'gemini-1.0-pro', description: 'Versão anterior' },
];

/* ── Contexto por página ── */
const PAGE_CONTEXTS = {
  '/': 'O aluno está na página inicial (Dashboard). Pode querer dicas gerais de estudo ou orientação.',
  '/flashcards': 'O aluno está na página de Flashcards. Pode querer ajuda para criar perguntas, entender conceitos, ou melhorar revisão.',
  '/resumos': 'O aluno está na página de Resumos. Pode querer ajuda para sintetizar conteúdo, fazer anotações ou estruturar um caso clínico.',
  '/simulado': 'O aluno está na página de Simulado. Pode querer dicas para se preparar para provas, explicar questões erradas.',
  '/consulta-rapida': 'O aluno está na página de Consulta Rápida (tabelas de referência). Pode querer explicações sobre escalas, testes ortopédicos ou sinais vitais.',
  '/materias': 'O aluno está organizando suas matérias. Pode querer dicas de organização de estudo.',
  '/atlas-3d': 'O aluno está no Atlas 3D de anatomia. Pode querer explicações sobre estruturas anatômicas.',
  '/analytics': 'O aluno está vendo suas estatísticas de estudo. Pode querer dicas de como melhorar seu desempenho.',
  '/conquistas': 'O aluno está vendo suas conquistas. Pode querer motivação ou dicas para desbloquear mais.',
};

/* ── Quick actions contextuais por página (com ícones) ── */
const QUICK_ACTIONS_BY_PAGE = {
  '/': [
    { icon: <BarChart2 size={12} />, label: 'Meu progresso', prompt: 'Como está meu progresso de estudos?' },
    { icon: <Lightbulb size={12} />, label: 'Dica clínica', prompt: 'Me dê uma dica clínica relevante para hoje' },
    { icon: <Zap size={12} />, label: 'O que estudar?', prompt: 'O que devo priorizar para estudar hoje?' },
  ],
  '/flashcards': [
    { icon: <Zap size={12} />, label: 'Gerar flashcards', prompt: 'Gere 5 flashcards sobre o tema que estou estudando' },
    { icon: <Lightbulb size={12} />, label: 'Explicar card', prompt: 'Me explique meu flashcard mais difícil' },
    { icon: <FileText size={12} />, label: 'Flashcards do resumo', prompt: 'Gere flashcards baseados no meu resumo mais recente' },
  ],
  '/resumos': [
    { icon: <FileText size={12} />, label: 'Criar resumo', prompt: 'Me ajude a criar um resumo estruturado' },
    { icon: <Zap size={12} />, label: 'Gerar flashcards', prompt: 'Gere flashcards baseados no meu resumo' },
    { icon: <Lightbulb size={12} />, label: 'Pontos-chave', prompt: 'Quais os pontos mais importantes do meu resumo?' },
  ],
  '/simulado': [
    { icon: <BarChart2 size={12} />, label: 'Analisar erros', prompt: 'Me ajude a entender os erros do meu último simulado' },
    { icon: <Lightbulb size={12} />, label: 'Dicas de prova', prompt: 'Me dê dicas para melhorar no simulado' },
  ],
  '/materias': [
    { icon: <FolderPlus size={12} />, label: 'Nova matéria', prompt: 'Quero criar uma nova matéria, me ajude a escolher o nome' },
  ],
};

/* ═══════════════════════════════════════════
   ACAO BADGE — mensagem amigável, sem termos técnicos
   ═══════════════════════════════════════════ */
const AcaoBadge = ({ label }) => (
  <div className="mt-2.5 flex items-center gap-2 px-[11px] py-[7px] rounded-[10px] bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50">
    <CheckCircle2 size={14} strokeWidth={2.2} className="text-green-600 dark:text-green-400" />
    <span className="text-[11.5px] font-medium text-green-700 dark:text-green-400">
      {label}
    </span>
  </div>
);

// ─── System Prompt Builder ───────────────────────────────────────────────────

/**
 * Constrói o system prompt completo injetado no chat do Gemini.
 *
 * Injeta três blocos de contexto:
 *  1. Memória do usuário (preferências, estatísticas de uso, histórico de ações)
 *  2. Dados atuais do sistema (matérias, contadores, streak — via useKakabotContext)
 *  3. Página atual (para ações contextuais relevantes)
 *
 * @param {object} memoria     - Estado `memoriaUsuario` (DEFAULT_MEMORY shape)
 * @param {object} dadosSistema - Retorno de useKakabotContext (materias, totais, streak)
 * @param {string} pageContext  - Descrição da página atual (de PAGE_CONTEXTS)
 * @returns {string} System prompt completo como string
 *
 * NOTE: este prompt é reenviado integralmente a CADA nova instância de chat (initializeGemini).
 * WARN: o conteúdo gerado aqui determina diretamente o comportamento do agente —
 *       qualquer alteração deve ser testada para evitar regressão no tom ou nas ações.
 */
const buildSystemPrompt = (memoria, dadosSistema, pageContext) => {
  const pref = memoria?.preferenciasUsuario || {};
  const stats = memoria?.estatisticasUso || {};
  const materiaNames = dadosSistema?.materias?.map((m) => m.nome).join(', ') || 'nenhuma';

  return `Você é o **Kaka**, um agente de IA integrado ao sistema Cinesia para estudantes de Fisioterapia.

## 🧠 MEMÓRIA DO USUÁRIO
${pref.nomePreferido ? `- Nome preferido: ${pref.nomePreferido}` : '- Ainda não sei o nome preferido do usuário'}
- Nível de conhecimento: ${pref.nivelConhecimento || 'não identificado ainda'}
- Áreas de interesse: ${pref.areasDeInteresse?.join(', ') || 'não identificadas ainda'}
- Estilo de resposta preferido: ${pref.estiloResposta || 'padrão'}
- Total de interações: ${stats.totalMensagens || 0}
- Ações já realizadas: ${JSON.stringify(stats.acoesExecutadas || {})}

## 📊 DADOS ATUAIS DO SISTEMA
- Matérias cadastradas: ${materiaNames}
- Total de flashcards: ${dadosSistema?.totalFlashcards || 0}
- Total de resumos: ${dadosSistema?.totalResumos || 0}
- Cards para revisar hoje (SM-2): ${dadosSistema?.cardsParaRevisarHoje || 0}
- Streak atual: ${dadosSistema?.streakAtual || 0} dias
- Maior streak: ${dadosSistema?.longestStreak || 0} dias

${pageContext ? `## 📍 CONTEXTO ATUAL\n${pageContext}` : ''}

## 🎯 PERSONALIDADE E ADAPTAÇÃO
- Parceiro de estudos paciente, didático e natural
- Tom acolhedor mas profissional
- Use o nome preferido do usuário sempre que souber
- Adapte o nível técnico ao conhecimento identificado
- Se for a primeira interação do dia, cumprimente mencionando o streak
- Se houver cards para revisar, mencione proativamente
- Lembre de conquistas recentes do usuário quando relevante

## 📏 REGRA DE ADAPTABILIDADE
**A extensão da resposta deve refletir a intenção:**
1. **Saudação/Social** → 1-2 frases curtas e simpáticas
2. **Dúvida Específica** → Explicação direta, 2-4 parágrafos com exemplos clínicos
3. **Pedido de ação** → Execute + confirme + sugira próximo passo
4. **Aprofundamento** → Resposta completa com seções e exemplos

## 🔧 AÇÕES QUE VOCÊ PODE EXECUTAR
Quando o usuário pedir, você pode executar ações reais no sistema.
Para executar uma ação, inclua um bloco JSON especial no FINAL da sua mensagem no seguinte formato EXATO:

\`\`\`action
{
  "acao": "NOME_DA_ACAO",
  "dados": { ... }
}
\`\`\`

### Ações disponíveis:

**CRIAR_MATERIA** — Criar uma nova matéria/disciplina
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "string", "cor": "#hexcolor", "descricao": "string" } }
\`\`\`

**CRIAR_FLASHCARD** — Criar um flashcard individual
\`\`\`action
{ "acao": "CRIAR_FLASHCARD", "dados": { "pergunta": "string", "resposta": "string", "materiaId": "string ou null" } }
\`\`\`

**CRIAR_MULTIPLOS_FLASHCARDS** — Criar vários flashcards de uma vez
\`\`\`action
{ "acao": "CRIAR_MULTIPLOS_FLASHCARDS", "dados": { "flashcards": [{ "pergunta": "string", "resposta": "string" }], "materiaId": "string ou null" } }
\`\`\`

**CRIAR_RESUMO** — Criar um resumo completo
\`\`\`action
{ "acao": "CRIAR_RESUMO", "dados": { "titulo": "string", "conteudo": "string (HTML)", "materiaId": "string ou null", "tags": ["string"] } }
\`\`\`

**AGENDAR_REVISAO** — Agendar uma revisão na agenda
\`\`\`action
{ "acao": "AGENDAR_REVISAO", "dados": { "data": "YYYY-MM-DD", "descricao": "string", "materiaId": "string ou null" } }
\`\`\`

**ATUALIZAR_PREFERENCIAS** — Atualizar preferências do usuário na memória
\`\`\`action
{ "acao": "ATUALIZAR_PREFERENCIAS", "dados": { "nomePreferido": "string", "nivelConhecimento": "iniciante|intermediario|avancado", "areasDeInteresse": ["string"], "estiloResposta": "detalhado|resumido" } }
\`\`\`

### Matérias disponíveis para referência (use o id correto):
${dadosSistema?.materias?.map((m) => `- ${m.nome} (id: ${m.id})`).join('\n') || '- Nenhuma matéria cadastrada'}

### Regras para usar ações:
1. SEMPRE confirme com o usuário antes de executar ações destrutivas ou em massa
2. Ao criar flashcards, gere conteúdo de alta qualidade baseado em literatura de fisioterapia
3. Para criar resumos, use formatação HTML compatível com Quill (tags: h1, h2, h3, p, ul, ol, li, strong, em)
4. Se o usuário não especificar a matéria, pergunte antes de executar OU use null
5. Após executar uma ação, confirme o sucesso e sugira próximos passos
6. Inclua APENAS UM bloco action por resposta
7. O bloco action deve vir SEMPRE NO FINAL da mensagem

## ✍️ FORMATAÇÃO
- Use **negrito** para termos-chave médicos
- Listas numeradas para passos sequenciais
- Bullets para características ou sintomas
- Mantenha parágrafos curtos (2-4 linhas)

## ⚠️ LIMITAÇÕES
- NUNCA invente informações médicas incorretas
- Se não souber, seja honesto e sugira consultar literatura
- Para diagnósticos clínicos reais, sempre reforce a necessidade de avaliação presencial
- Nunca execute ações sem os dados necessários — pergunte antes`;
};

/* ═══════════════════════════════════════════
   DEFAULT MEMORY
   ═══════════════════════════════════════════ */
const DEFAULT_MEMORY = {
  ultimasConversas: [],
  preferenciasUsuario: {
    nomePreferido: null,
    nivelConhecimento: null,
    areasDeInteresse: [],
    estiloResposta: null,
  },
  estatisticasUso: {
    totalMensagens: 0,
    acoesExecutadas: {},
    ultimoAcesso: null,
  },
};

/* ═══════════════════════════════════════════
   MARKDOWN COMPONENTS (reutilizado no render)
   ═══════════════════════════════════════════ */
const markdownComponents = {
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: '#0f766e' }}>
      {children}
    </strong>
  ),
  p: ({ children }) => (
    <p className="text-[13.5px] leading-[1.65] my-1.5 first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-[13.5px] my-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-[13.5px] my-2 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  code: ({ children }) => (
    <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono" style={{ color: '#0f766e' }}>
      {children}
    </code>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#0d9488' }}>
      {children}
    </a>
  ),
};

/* ═══════════════════════════════════════════
   FRIENDLY ACTION LABELS (sem termos técnicos)
   ═══════════════════════════════════════════ */
const getAcaoLabel = (acao, dados) => {
  switch (acao) {
    case 'CRIAR_MATERIA':
      return `Matéria "${dados?.nome || ''}" criada na sua lista`;
    case 'CRIAR_FLASHCARD':
      return 'Flashcard adicionado com sucesso';
    case 'CRIAR_MULTIPLOS_FLASHCARDS': {
      const count = dados?.flashcards?.length || 0;
      return `${count} flashcard${count !== 1 ? 's' : ''} adicionado${count !== 1 ? 's' : ''}`;
    }
    case 'CRIAR_RESUMO':
      return `Resumo "${dados?.titulo || ''}" salvo com sucesso`;
    case 'AGENDAR_REVISAO':
      return 'Revisão agendada na sua agenda';
    case 'ATUALIZAR_PREFERENCIAS':
      return 'Preferências atualizadas';
    default:
      return 'Ação realizada com sucesso';
  }
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const KakaBot = () => {
  const location = useLocation();
  const { user } = useAuth();
  // NOTE: AuthContext expõe tanto `id` quanto `uid` dependendo da plataforma de login
  const uid = user?.id || user?.uid;

  // ─── Contexto externo ──────────────────────────────────────────────────────
  // Dados em tempo real injetados no system prompt do Gemini
  const { dadosSistema, materiasLista, isLoadingContext } = useKakabotContext(uid);

  // ─── Estado — UI ───────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);          // aguardando resposta do Gemini
  const [isExecutingAction, setIsExecutingAction] = useState(false); // executando ação no Firestore

  // ─── Estado — Conexão Gemini ────────────────────────────────────────────────
  // connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  const [geminiModel, setGeminiModel] = useState(null);
  const [activeModelName, setActiveModelName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);

  // ─── Estado — Memória Persistente ──────────────────────────────────────────
  // Carregada do Firestore na abertura do chat; salva ao fechar
  const [memoriaUsuario, setMemoriaUsuario] = useState(DEFAULT_MEMORY);
  const [memoryLoaded, setMemoryLoaded] = useState(false);

  // ─── Estado — Rate Limiting ─────────────────────────────────────────────────
  // timestamps das últimas mensagens para checar MAX_MESSAGES_PER_MINUTE
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const lastMessageTimeRef = useRef(0); // timestamp da última mensagem (para MIN_MESSAGE_INTERVAL_MS)

  // ─── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null); // ancora de auto-scroll
  const inputRef = useRef(null);       // foco automático ao abrir
  const chatRef = useRef(null);        // instância de chat do Gemini (mantém histórico da sessão)

  // Voice input
  const handleVoiceFinalResult = useCallback((finalText) => {
    setInputValue(finalText);
    // Auto-send after a brief delay
    setTimeout(() => {
      // We'll trigger send via a ref-based approach
      sendMessageRef.current?.(finalText);
    }, 100);
  }, []);

  const { isListening, transcript, startListening, stopListening, isSupported, error: voiceError } =
    useSpeechRecognition(handleVoiceFinalResult);

  // Show voice error as system message
  useEffect(() => {
    if (voiceError) addSystemMessage(`🎤 ${voiceError}`, 'error');
  }, [voiceError]);

  // ─── Memória — Carregar / Salvar ───────────────────────────────────────────

  /**
   * Carrega a memória persistente do Firestore e restaura as últimas mensagens.
   *
   * Firestore: `users/{uid}/kakabot_memoria/historico`
   * Campos: ultimasConversas[], preferenciasUsuario, estatisticasUso
   *
   * NOTE: restaura apenas as últimas 10 mensagens na UI — o histórico maior
   *       é injetado silenciosamente no chatRef ao inicializar o Gemini.
   * WARN: `memoryLoaded` deve ser verdadeiro antes de initializeGemini ser chamado.
   */
  const carregarMemoria = useCallback(async () => {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const memoria = {
          ultimasConversas: data.ultimasConversas || [],
          preferenciasUsuario: {
            ...DEFAULT_MEMORY.preferenciasUsuario,
            ...(data.preferenciasUsuario || {}),
          },
          estatisticasUso: {
            ...DEFAULT_MEMORY.estatisticasUso,
            ...(data.estatisticasUso || {}),
          },
        };
        setMemoriaUsuario(memoria);

        // Restaurar últimas mensagens da sessão anterior
        if (memoria.ultimasConversas.length > 0) {
          const restored = memoria.ultimasConversas.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
            time: m.time || '',
          }));
          setMessages(restored);
        }
      }
    } catch (err) {
      console.warn('[KakaBot] Erro ao carregar memória:', err?.message);
    } finally {
      setMemoryLoaded(true);
    }
  }, [uid]);

  /**
   * Persiste o histórico da conversa e estatísticas de uso no Firestore.
   *
   * Firestore: `users/{uid}/kakabot_memoria/historico` (setDoc com merge)
   *
   * @param {Array}  mensagensParaSalvar - Array completo de mensagens da sessão
   * @param {object|null} prefUpdates   - Novas preferências a mesclar (ou null)
   *
   * NOTE: mensagens com `isSystem: true` são filtradas — não são persistidas.
   * NOTE: usa `merge: true` para não sobrescrever campos não enviados.
   */
  const salvarMemoria = useCallback(
    async (mensagensParaSalvar, prefUpdates = null) => {
      if (!uid) return;
      try {
        const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');

        const conversasParaSalvar = mensagensParaSalvar
          .filter((m) => !m.isSystem)
          .slice(-MEMORY_MAX_MESSAGES)
          .map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date().toISOString(),
            time: m.time || '',
            ...(m.acaoExecutada ? { acaoExecutada: m.acaoExecutada } : {}),
          }));

        const updateData = {
          ultimasConversas: conversasParaSalvar,
          estatisticasUso: {
            totalMensagens: (memoriaUsuario.estatisticasUso.totalMensagens || 0) + 1,
            acoesExecutadas: memoriaUsuario.estatisticasUso.acoesExecutadas || {},
            ultimoAcesso: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        };

        if (prefUpdates) {
          updateData.preferenciasUsuario = {
            ...memoriaUsuario.preferenciasUsuario,
            ...prefUpdates,
          };
          setMemoriaUsuario((prev) => ({
            ...prev,
            preferenciasUsuario: { ...prev.preferenciasUsuario, ...prefUpdates },
          }));
        }

        await setDoc(docRef, updateData, { merge: true });

        setMemoriaUsuario((prev) => ({
          ...prev,
          estatisticasUso: updateData.estatisticasUso,
          ultimasConversas: conversasParaSalvar,
        }));
      } catch (err) {
        console.warn('[KakaBot] Erro ao salvar memória:', err?.message);
      }
    },
    [uid, memoriaUsuario]
  );

  /**
   * Incrementa o contador de uma ação específica nas estatísticas de uso do Firestore.
   *
   * Firestore: `users/{uid}/kakabot_memoria/historico` (merge parcial)
   *
   * @param {string} nomeAcao - Nome da ação (ex: 'CRIAR_FLASHCARD', 'CRIAR_RESUMO')
   *
   * NOTE: use esta função SOMENTE após ação bem-sucedida para manter contagens precisas.
   */
  const registrarAcaoNaMemoria = useCallback(
    async (nomeAcao) => {
      if (!uid) return;
      try {
        // Firestore: users/{uid}/kakabot_memoria/historico
        const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');
        const acoesAtuais = { ...(memoriaUsuario.estatisticasUso.acoesExecutadas || {}) };
        acoesAtuais[nomeAcao] = (acoesAtuais[nomeAcao] || 0) + 1;

        await setDoc(
          docRef,
          { estatisticasUso: { acoesExecutadas: acoesAtuais } },
          { merge: true }
        );

        setMemoriaUsuario((prev) => ({
          ...prev,
          estatisticasUso: {
            ...prev.estatisticasUso,
            acoesExecutadas: acoesAtuais,
          },
        }));
      } catch (err) {
        console.warn('[KakaBot] Erro ao registrar ação:', err?.message);
      }
    },
    [uid, memoriaUsuario]
  );

  // ─── Efeitos ────────────────────────────────────────────────────────────────

  // Mensagem de boas-vindas inicial — exibida apenas antes da memória ser carregada
  useEffect(() => {
    if (messages.length === 0 && !memoryLoaded) {
      setMessages([
        {
          role: 'assistant',
          content:
            '👋 Olá! Sou o **Kaka**, seu agente de IA em Fisioterapia!\n\nPosso te ajudar com:\n- 📚 Dúvidas sobre anatomia, patologias e protocolos\n- 🃏 **Criar flashcards** automaticamente\n- 📝 **Gerar resumos** estruturados\n- 📚 **Criar matérias** e organizar seus estudos\n- 📅 **Agendar revisões** na sua agenda\n- 💡 Dicas personalizadas de estudo\n\nComo posso ajudar hoje?',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [memoryLoaded]);

  // Carrega memória do Firestore na primeira abertura do bot
  useEffect(() => {
    if (isOpen && uid && !memoryLoaded) {
      carregarMemoria();
    }
  }, [isOpen, uid, memoryLoaded, carregarMemoria]);

  // Inicia conexão com Gemini APÓS memória E contexto do sistema estarem prontos
  // WARN: não chamar initializeGemini antes de memoryLoaded — o system prompt ficaria incompleto
  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected' && memoryLoaded && !isLoadingContext) {
      initializeGemini();
    }
  }, [isOpen, connectionStatus, memoryLoaded, isLoadingContext]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecutingAction]);

  // Auto-foco no input ao estabelecer conexão
  useEffect(() => {
    if (isOpen && connectionStatus === 'connected') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, connectionStatus]);

  // Persiste o histórico ao fechar o bot
  // NOTE: disparado pela mudança de isOpen=true→false, não pelo unmount do componente
  useEffect(() => {
    if (!isOpen && memoryLoaded && messages.length > 1) {
      salvarMemoria(messages);
    }
  }, [isOpen]);

  // ─── Gemini — Inicialização ──────────────────────────────────────────────────

  /**
   * Inicializa a conexão com o Gemini, tentando cada modelo de GEMINI_MODELS em ordem.
   *
   * Fluxo:
   *  1. Lê VITE_GEMINI_API_KEY do environment
   *  2. Tenta instanciar cada modelo em sequência até um responder sem erro
   *  3. Em caso de erro 429 (quota), aplica backoff exponencial e tenta novamente
   *  4. Em caso de erro não-429, tenta o próximo modelo da lista
   *
   * @param {number} retryCount - Contador interno de retentativas (não passar externamente)
   *
   * WARN: não chamar antes de `memoryLoaded === true` — o system prompt usa dados da memória.
   * NOTE: o SDK @google/generative-ai é importado dinamicamente aqui para reduzir bundle inicial.
   * NOTE: em caso de falha em todos os modelos, chama handleConnectionError e define status 'error'.
   */
  const initializeGemini = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    // Backoff exponencial: 0ms, 2s, 5s, 10s
    const BACKOFF_MS = [0, 2000, 5000, 10000];
    setConnectionStatus('connecting');
    setErrorMessage(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      handleConnectionError('API Key não configurada no arquivo .env');
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      // Percorre GEMINI_MODELS em fallback — para no primeiro que funcionar
      for (let i = 0; i < GEMINI_MODELS.length; i++) {
        const modelName = GEMINI_MODELS[i].name;
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 4096,
            },
          });

          const chat = createChatWithPersona(model);
          chatRef.current = chat;
          setGeminiModel(chat);
          setActiveModelName(modelName);
          setConnectionStatus('connected');
          addSystemMessage('✅ **Conexão estabelecida!**\n\nPronto para responder suas dúvidas e executar ações no sistema! 💪', 'success');
          return;
        } catch (err) {
          // Erros 429 param o loop — devem ser tratados com backoff, não com fallback de modelo
          if (err.message?.includes('429') || err.status === 429) throw err;
          // No último modelo da lista, propaga o erro para o catch externo
          if (i === GEMINI_MODELS.length - 1) throw err;
          // Qualquer outro erro: tenta o próximo modelo silenciosamente
        }
      }
    } catch (error) {
      console.error('[KakaBot] Erro ao conectar:', error);
      const is429 = error.message?.includes('429') || error.status === 429;
      if (is429 && retryCount < MAX_RETRIES) {
        const waitTime = BACKOFF_MS[retryCount + 1];
        addSystemMessage(
          `⏳ **Limite de requisições atingido**\n\nAguardando ${waitTime / 1000} segundos...\n\n_Tentativa ${retryCount + 1} de ${MAX_RETRIES}_`,
          'info'
        );
        setTimeout(() => initializeGemini(retryCount + 1), waitTime);
      } else {
        handleConnectionError(error);
      }
    }
  };

  /**
   * Cria uma instância de chat do Gemini com o system prompt injetado via trick de histórico.
   *
   * NOTE: a API Gemini não tem suporte nativo a `systemInstruction` na versão Flash —
   *       o system prompt é injetado como primeiro turn user/model no histórico do chat.
   * NOTE: as últimas 6 mensagens da memória são reinseridas para manter continuidade.
   * WARN: ao criar um novo chat (ex: ao reconectar), o histórico da sessão atual é perdido.
   *       Por isso a memória sempre é salva antes de reconectar.
   *
   * @param {object} model - Instância do modelo retornada por genAI.getGenerativeModel()
   * @returns {object} Instância de chat do Gemini com histórico pré-populado
   */
  const createChatWithPersona = (model) => {
    const pageContext = PAGE_CONTEXTS[location.pathname] || '';
    const systemPrompt = buildSystemPrompt(memoriaUsuario, dadosSistema, pageContext);

    const history = [
      {
        role: 'user',
        parts: [{ text: `Aja como o seguinte assistente em TODAS as suas respostas:\n\n${systemPrompt}` }],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'Entendido! Sou o Kaka, agente de IA integrado ao Cinesia. Conheço os dados do sistema, vou usar a memória do usuário e estou pronto para executar ações reais (criar flashcards, resumos, matérias, etc.) quando solicitado. Vou seguir as diretrizes de adaptabilidade e tom profissional. 💪',
          },
        ],
      },
    ];

    // Injeta as últimas 6 mensagens da memória para dar continuidade à conversa anterior
    // NOTE: injetar mais mensagens aqui aumenta o custo de tokens por request
    const remembered = memoriaUsuario.ultimasConversas.slice(-6);
    for (const msg of remembered) {
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    return model.startChat({ history });
  };

  /* ═══════════════════════════════════════════
     ERROR HANDLING
     ═══════════════════════════════════════════ */
  const handleConnectionError = (error) => {
    setConnectionStatus('error');
    const msg = typeof error === 'string' ? error : error.message || String(error);
    setErrorMessage(msg);
    const details = analyzeError(msg);
    addSystemMessage(
      `😔 **Não consegui me conectar**\n\n${details.message}\n\n**Possíveis soluções:**\n${details.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      'error'
    );
  };

  const analyzeError = (error) => {
    const e = error.toLowerCase();
    if (e.includes('429') || e.includes('rate limit') || e.includes('quota')) {
      return {
        message: '⏱️ _Limite de requisições da API atingido_',
        solutions: [
          '**Aguarde 1-2 minutos** antes de reconectar',
          'O Google Gemini tem limite gratuito por minuto',
          'Verifique sua cota em [Google AI Studio](https://aistudio.google.com/app/apikey)',
        ],
      };
    }
    if (e.includes('api key') || e.includes('invalid')) {
      return {
        message: '🔑 _API Key inválida ou não configurada_',
        solutions: [
          'Verifique se `VITE_GEMINI_API_KEY` está no `.env`',
          'Gere uma nova key em [Google AI Studio](https://aistudio.google.com/)',
          'Reinicie o servidor após alterar o .env',
        ],
      };
    }
    if (e.includes('network') || e.includes('fetch') || e.includes('failed to fetch')) {
      return {
        message: '🌐 _Erro de conexão_',
        solutions: ['Verifique sua internet', 'Desabilite VPN temporariamente', 'Tente reconectar em instantes'],
      };
    }
    return {
      message: `⚠️ _${error}_`,
      solutions: ['Aguarde 1-2 minutos', 'Tente reconectar', 'Verifique o console (F12)'],
    };
  };

  // ─── Mensagens de Sistema ────────────────────────────────────────────────────

  /**
   * Adiciona uma mensagem de sistema à conversa (sem enviar ao Gemini).
   * Usada para feedback de erro, sucesso, conexão, etc.
   *
   * @param {string} content - Conteúdo Markdown da mensagem
   * @param {'info'|'error'|'success'} type - Tipo visual da mensagem
   */
  const addSystemMessage = useCallback((content, type = 'info') => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
        isSystem: true,
        systemType: type,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  /**
   * Verifica se o envio da próxima mensagem está dentro dos limites de rate.
   * Dois critérios independentes:
   *  1. Intervalo mínimo entre mensagens consecutivas (MIN_MESSAGE_INTERVAL_MS)
   *  2. Máximo de mensagens por janela de 60 segundos (MAX_MESSAGES_PER_MINUTE)
   *
   * @returns {{ allowed: boolean, reason?: string }}
   */
  const checkRateLimit = () => {
    const now = Date.now();
    // Critério 1: intervalo mínimo entre envios
    if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      const wait = Math.ceil((MIN_MESSAGE_INTERVAL_MS - (now - lastMessageTimeRef.current)) / 1000);
      return { allowed: false, reason: `Aguarde ${wait} segundo(s) antes de enviar outra mensagem.` };
    }
    // Critério 2: janela deslizante de 60 segundos
    const recent = messageTimestamps.filter((t) => now - t < 60000);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
      return { allowed: false, reason: `Limite de ${MAX_MESSAGES_PER_MINUTE} mensagens/minuto atingido.` };
    }
    return { allowed: true };
  };

  // ─── Envio de Mensagem ────────────────────────────────────────────────────────

  /**
   * Envia a mensagem do usuário ao Gemini e processa a resposta.
   *
   * Fluxo:
   *  1. Valida rate limit (intervalo mínimo + janela por minuto)
   *  2. Envia ao Gemini via `chatRef.current.sendMessage()` (mantém histórico da sessão)
   *  3. Extrai possível bloco ```action``` da resposta via `extrairAcao()`
   *  4. Exibe a resposta de texto na UI
   *  5. Se houver ação, executa no Firestore via `executarAcao()`
   *  6. Persiste o histórico atualizado na memória do Firestore
   *
   * @param {string} [overrideText] - Texto enviado por voz (sobrescreve inputValue)
   *
   * @sideEffects
   *  - Pode escrever em `materias`, `flashcards`, `resumos`, `eventos` (via executarAcao)
   *  - Sempre escreve em `users/{uid}/kakabot_memoria/historico` (persistência)
   *  - Dispara CustomEvents (ex: 'cinesia:flashcard:alterado') para atualizar outros componentes
   *
   * WARN: não chamar fora do contexto de conexão estabelecida (connectionStatus === 'connected')
   * NOTE: o chatRef mantém o histórico da sessão em memória — ao fechar o bot este histórico
   *       é perdido, por isso a memória é sempre persistida ao final de cada envio.
   */
  const sendMessage = async (overrideText) => {
    if (isLoading || connectionStatus !== 'connected') return;
    const userMessage = (overrideText || inputValue).trim();
    if (!userMessage) return;

    if (userMessage.length > MAX_USER_CHARS) {
      addSystemMessage(`⚠️ **Mensagem muito longa**\n\nResuma em até ${MAX_USER_CHARS} caracteres.`, 'error');
      return;
    }

    const rl = checkRateLimit();
    if (!rl.allowed) {
      addSystemMessage(`⏱️ **Calma aí!**\n\n${rl.reason}`, 'info');
      return;
    }

    setInputValue('');
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString(), time: nowTime };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const now = Date.now();
    lastMessageTimeRef.current = now;
    setMessageTimestamps((prev) => [...prev.filter((t) => now - t < 60000), now]);

    try {
      const result = await chatRef.current.sendMessage(userMessage);
      const response = await result.response;
      const textoCompleto = response.text();

      // Extrai bloco ```action { ... }``` da resposta, se presente
      // textoLimpo = resposta sem o bloco JSON; acao = objeto parseado ou null
      const { textoLimpo, acao } = extrairAcao(textoCompleto);

      const assistantTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const assistantMsg = {
        role: 'assistant',
        content: textoLimpo,
        timestamp: new Date().toISOString(),
        time: assistantTime,
        acaoExecutada: acao?.acao || null,
        acaoLabel: acao ? getAcaoLabel(acao.acao, acao.dados) : null,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);

      // Executa ação no Firestore se o Gemini incluiu um bloco ```action```
      if (acao) {
        setIsExecutingAction(true);
        const resultado = await executarAcao(acao, uid, materiasLista);
        setIsExecutingAction(false);

        // Mensagem de confirmação de ação (sucesso ou erro) vista pelo usuário
        const resultMsg = {
          role: 'assistant',
          content: resultado.mensagem,
          isSystem: true,
          systemType: resultado.sucesso ? 'success' : 'error',
          timestamp: new Date().toISOString(),
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, resultMsg]);

        if (resultado.sucesso) {
          await registrarAcaoNaMemoria(acao.acao);
        }

        // ATUALIZAR_PREFERENCIAS retorna dados para atualizar a memória — trata separado
        if (acao.acao === 'ATUALIZAR_PREFERENCIAS' && resultado.sucesso && resultado.dadosRetorno?.preferencias) {
          await salvarMemoria(
            [...messages, userMsg, assistantMsg, resultMsg],
            resultado.dadosRetorno.preferencias
          );
          return;
        }
      }

      await salvarMemoria([...messages, userMsg, assistantMsg]);
    } catch (error) {
      setIsLoading(false);
      if (error.message?.includes('429') || error.status === 429) {
        addSystemMessage('😅 **Limite de requisições atingido**\n\nAguarde 1-2 minutos e tente novamente.', 'error');
      } else {
        addSystemMessage('😅 **Problema ao processar**\n\nNão consegui processar sua mensagem. Tente novamente em instantes.', 'error');
      }
    }
  };

  // HACK: ref para permitir que o callback de voz (useSpeechRecognition) acesse sendMessage
  // sem capturar um stale closure — o callback é registrado no mount e não pode ser atualizado
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Converte o nome técnico do modelo Gemini para label amigável exibida no header. */
  const formatModelName = (name) => {
    if (!name) return 'Gemini';
    if (name.includes('2.5-flash-lite')) return '2.5 Flash Lite';
    if (name.includes('2.5-flash')) return '2.5 Flash';
    if (name.includes('1.5-flash')) return '1.5 Flash';
    if (name.includes('1.5-pro')) return '1.5 Pro';
    return name;
  };

  const handleRetryConnection = () => {
    setConnectionStatus('disconnected');
    setErrorMessage(null);
    setGeminiModel(null);
    setActiveModelName(null);
    chatRef.current = null;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isSystem && last?.systemType === 'error') return prev.slice(0, -1);
      return prev;
    });
    initializeGemini();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = useMemo(
    () => QUICK_ACTIONS_BY_PAGE[location.pathname] || QUICK_ACTIONS_BY_PAGE['/'] || [],
    [location.pathname]
  );

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <>
      {/* ════ FAB Button ════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-50 sm:bottom-6 sm:right-6 group"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            aria-label="Abrir Kaka"
          >
            <div
              className="w-[58px] h-[58px] flex items-center justify-center relative overflow-hidden"
              style={{
                borderRadius: 18,
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #0891b2 100%)',
                boxShadow: '0 8px 24px rgba(13,148,136,0.4)',
              }}
            >
              {/* Shimmer no hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
                }}
              />
              <Dna size={26} color="#fff" strokeWidth={1.6} />
            </div>

            {/* Badge */}
            <motion.div
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Sparkles size={9} color="#fff" strokeWidth={2.5} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════ Chat Window ════ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[190] sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              className="fixed z-[200] flex flex-col overflow-hidden
                bottom-0 left-0 right-0 h-[70vh] rounded-t-[24px]
                sm:bottom-5 sm:right-5 sm:left-auto sm:w-[414px]
                sm:h-[620px] sm:max-h-[calc(100vh-80px)] sm:rounded-[24px]
                bg-white dark:bg-slate-900
                border border-slate-200/80 dark:border-slate-700/60"
              style={{ boxShadow: '0 20px 60px rgba(13,148,136,0.12), 0 4px 20px rgba(0,0,0,0.08)' }}
              initial={{ opacity: 0, y: 50, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* ════ HEADER ════ */}
              <div
                className="px-5 py-[18px] flex items-center justify-between flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #0891b2 100%)' }}
              >
                {/* Identidade */}
                <div className="flex items-center gap-3">
                  <KakaAvatar size="md" speaking={isLoading} showStatus />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-[17px] tracking-tight leading-none">Kaka</h3>
                      <span
                        className="text-[9.5px] font-bold tracking-[1.2px] px-2 py-0.5 rounded-md text-white/95"
                        style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        AGENTE IA
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-[3px]">
                      {connectionStatus === 'connected' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-white/75 text-[11px]">Online · {formatModelName(activeModelName)}</span>
                        </>
                      )}
                      {connectionStatus === 'connecting' && (
                        <>
                          <Loader size={10} className="animate-spin text-white/75" />
                          <span className="text-white/75 text-[11px]">Conectando...</span>
                        </>
                      )}
                      {connectionStatus === 'error' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span className="text-white/75 text-[11px]">Desconectado</span>
                        </>
                      )}
                      {connectionStatus === 'disconnected' && (
                        <span className="text-white/60 text-[11px]">Seu Agente de Fisioterapia</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors hover:bg-white/15"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    aria-label="Fechar"
                  >
                    <X size={15} className="text-white/90" />
                  </button>
                </div>
              </div>

              {/* ════ BODY ════ */}
              <div className="flex flex-col flex-1 overflow-hidden">
                    {/* ════ Messages Area ════ */}
                    <div
                      className="flex-1 overflow-y-auto px-4 py-5 space-y-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-50 dark:bg-slate-900"
                    >
                      {messages.map((message, index) => {
                        const isNew = index === messages.length - 1;

                        if (message.role === 'user') {
                          /* ── Balão Usuário ── */
                          return (
                            <div
                              key={index}
                              className="flex items-end gap-2 mb-[14px] flex-row-reverse"
                              style={{ animation: isNew ? 'kakafadeUp .22s ease' : 'none' }}
                            >
                              <div
                                className="w-8 h-8 rounded-[10px] flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}
                              >
                                <User size={15} strokeWidth={2} />
                              </div>
                              <div className="flex flex-col gap-1 items-end max-w-[78%]">
                                <div
                                  className="px-[15px] py-[11px] text-[13.5px] leading-[1.65] text-white shadow-md"
                                  style={{
                                    borderRadius: '18px 18px 4px 18px',
                                    background: 'linear-gradient(135deg, #0f766e, #0891b2)',
                                    boxShadow: '0 4px 14px rgba(13,148,136,0.28)',
                                  }}
                                >
                                  {message.content}
                                </div>
                                {message.time && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-0.5">
                                    {message.time}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        /* ── Balão Assistente ── */
                        return (
                          <div
                            key={index}
                            className="flex items-end gap-2 mb-[14px]"
                            style={{ animation: isNew ? 'kakafadeUp .22s ease' : 'none' }}
                          >
                            <KakaAvatar size="sm" />
                            <div className="flex flex-col gap-1 max-w-[78%]">
                              <span
                                className="text-[10.5px] font-semibold ml-0.5 tracking-[0.4px]"
                                style={{ color: '#0f766e' }}
                              >
                                KAKA
                              </span>
                              <div
                                className={`px-[15px] py-[11px] text-[13.5px] leading-[1.65] shadow-sm border ${
                                  message.isSystem && message.systemType === 'error'
                                    ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50'
                                    : message.isSystem && message.systemType === 'success'
                                    ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                }`}
                                style={{ borderRadius: '18px 18px 18px 4px' }}
                              >
                                <ReactMarkdown components={markdownComponents}>
                                  {message.content}
                                </ReactMarkdown>
                                {/* AcaoBadge se a msg teve ação executada com sucesso */}
                                {message.acaoLabel && <AcaoBadge label={message.acaoLabel} />}
                              </div>
                              {message.time && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-0.5">
                                  {message.time}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* ── Waveform "Kaka está pensando" ── */}
                      {isLoading && (
                        <div className="flex items-end gap-2 mb-[14px]">
                          <KakaAvatar size="sm" speaking />
                          <div
                            className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2.5"
                            style={{ borderRadius: '18px 18px 18px 4px' }}
                          >
                            <div className="flex items-center gap-[3px]">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className="w-[3px] rounded-full opacity-70"
                                  style={{
                                    height: 14,
                                    background: '#0d9488',
                                    transformOrigin: 'center',
                                    animation: `kakaWave .9s ${i * 0.1}s infinite ease-in-out`,
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-400">Kaka está pensando...</span>
                          </div>
                        </div>
                      )}

                      {/* ── Action execution indicator ── */}
                      {isExecutingAction && (
                        <div className="flex items-end gap-2 mb-[14px]">
                          <KakaAvatar size="sm" speaking />
                          <div
                            className="px-4 py-3 border shadow-sm flex items-center gap-2.5 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50"
                            style={{ borderRadius: '18px 18px 18px 4px' }}
                          >
                            <Loader size={14} className="animate-spin text-teal-600 dark:text-teal-400" />
                            <span className="text-xs text-teal-700 dark:text-teal-400">
                              Executando ação no sistema...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ── Connecting indicator ── */}
                      {connectionStatus === 'connecting' && (
                        <div className="flex items-center justify-center py-4">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm shadow-sm border bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-400">
                            <Loader size={16} className="animate-spin" />
                            Estabelecendo conexão com a IA...
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* ════ Reconnect button ════ */}
                    {connectionStatus === 'error' && (
                      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800/50">
                        <button
                          onClick={handleRetryConnection}
                          className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <RefreshCw size={16} />
                          Tentar Reconectar
                        </button>
                      </div>
                    )}

                    {/* ════ Quick Action Chips ════ */}
                    {!isLoading && !isExecutingAction && connectionStatus === 'connected' && quickActions.length > 0 && (
                      <div
                        className="flex gap-1.5 px-3.5 pt-2.5 pb-0 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-700/50"
                      >
                        {quickActions.map((action, i) => (
                          <motion.button
                            key={i}
                            onClick={() => {
                              setInputValue(action.prompt);
                              inputRef.current?.focus();
                            }}
                            disabled={isLoading}
                            className="flex-shrink-0 flex items-center gap-[5px] px-3 py-[5px] text-[11.5px] font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-700/60 text-teal-700 dark:text-teal-400"
                            whileTap={{ scale: 0.97 }}
                          >
                            {action.icon}
                            <span>{action.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* ════ INPUT BAR ════ */}
                    <div className="px-3.5 pb-3.5 pt-2.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 flex-shrink-0">
                      <div className="flex items-end gap-2">
                        {/* Botão Microfone */}
                        {isSupported && (
                          <div className="relative flex-shrink-0">
                            {isListening && (
                              <span className="absolute inset-0 rounded-[13px] bg-red-400/20 animate-ping" />
                            )}
                            <motion.button
                              onClick={isListening ? stopListening : startListening}
                              className={`w-11 h-11 rounded-[13px] flex items-center justify-center transition-all border ${
                                isListening
                                  ? 'bg-red-500 border-transparent shadow-lg shadow-red-500/30'
                                  : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                              }`}
                              whileTap={{ scale: 0.94 }}
                              aria-label={isListening ? 'Parar gravação' : 'Falar'}
                              disabled={isLoading || isExecutingAction}
                            >
                              {isListening ? (
                                <MicOff size={18} className="text-white" strokeWidth={2} />
                              ) : (
                                <Mic size={18} className="text-slate-500 dark:text-slate-400" strokeWidth={2} />
                              )}
                            </motion.button>
                          </div>
                        )}

                        {/* Textarea */}
                        <div className="flex-1 relative">
                          <textarea
                            ref={inputRef}
                            value={isListening ? transcript : inputValue}
                            onChange={(e) => !isListening && setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={
                              isListening
                                ? 'Ouvindo...'
                                : connectionStatus !== 'connected'
                                ? 'Aguardando conexão...'
                                : 'Pergunte ou peça algo ao Kaka...'
                            }
                            disabled={isLoading || isExecutingAction || connectionStatus !== 'connected'}
                            rows={1}
                            className={`w-full px-[14px] py-[11px] rounded-[13px] text-[13.5px] text-slate-700 dark:text-slate-200 outline-none resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              isListening
                                ? 'bg-red-50 dark:bg-red-950/20 border-[1.5px] border-red-300'
                                : 'bg-slate-50 dark:bg-slate-700/50 border-[1.5px] border-slate-200 dark:border-slate-600 focus:border-teal-400'
                            }`}
                            style={{ minHeight: 44, maxHeight: 120, fontFamily: 'inherit', lineHeight: 1.5 }}
                          />
                        </div>

                        {/* Botão Enviar */}
                        <motion.button
                          onClick={() => sendMessage()}
                          disabled={!inputValue.trim() || isLoading || isExecutingAction || connectionStatus !== 'connected'}
                          className="w-11 h-11 rounded-[13px] flex items-center justify-center border-none transition-all disabled:cursor-not-allowed flex-shrink-0 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                          style={{
                            background:
                              inputValue.trim() && !isLoading && connectionStatus === 'connected'
                                ? 'linear-gradient(135deg, #0f766e, #0891b2)'
                                : undefined,
                            boxShadow:
                              inputValue.trim() && !isLoading && connectionStatus === 'connected'
                                ? '0 4px 12px rgba(13,148,136,0.35)'
                                : 'none',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isLoading || isExecutingAction ? (
                            <Loader size={18} className="animate-spin text-slate-400" strokeWidth={2} />
                          ) : (
                            <Send
                              size={18}
                              color={inputValue.trim() && connectionStatus === 'connected' ? '#fff' : '#94a3b8'}
                              strokeWidth={2}
                            />
                          )}
                        </motion.button>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2 text-[10.5px] text-slate-400 dark:text-slate-500">
                        <span>Enter para enviar · Shift+Enter nova linha</span>
                        <span className="flex items-center gap-1">
                          <Sparkles size={10} color="#0d9488" />
                          Powered by Gemini
                        </span>
                      </div>
                    </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default KakaBot;
