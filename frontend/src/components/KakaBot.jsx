/**
 * @file KakaBot.jsx
 * @description Agente de IA conversacional integrado ao Cinesia. Componente FAB (floating action button)
 * que abre um chat com o modelo Gemini, capaz de responder dúvidas clínicas E executar ações
 * reais no Firestore (criar matérias, flashcards, resumos, agendar revisões).
 *
 * @dependencies
 * - useKakabotContext — provê dados do sistema em tempo real para o system prompt
 * - useSpeechRecognition — entrada por voz via Web Speech API
 * - kakabotActions (extrairAcoes, executarAcoes) — parser e executor de blocos ```action```
 * - KakaAvatar — componente visual do avatar
 * - @google/generative-ai — SDK do Gemini (importado dinamicamente via `import()`)
 * - AuthContext-firebase — UID do usuário autenticado
 *
 * @sideEffects
 * - Lê/escreve em `users/{uid}/kakabot_memoria/historico` (memória persistente)
 * - Via kakabotActions: pode escrever em `materias`, `flashcards`, `resumos`, `eventos`
 * - Chama a API externa do Google Gemini a cada mensagem enviada
 *
 * @notes
 * - O histórico completo da sessão é reenviado ao Gemini a cada mensagem (sem memória nativa)
 * - A memória persistida no Firestore (últimas 20 mensagens) é injetada na inicialização do chat
 * - O modelo Gemini é importado dinamicamente para não aumentar o bundle inicial
 * - Fallback automático entre 5 modelos Gemini se o primário falhar (ver GEMINI_MODELS)
 * - Última revisão significativa: reimplementação visual v3 (Feb 2026) — paleta teal/cyan
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
  SquarePen,
  ChevronUp,
  History,
  MessageSquare,
  ChevronRight,
  Volume2,
  Square,
  MapPin,
  ThumbsUp,
  Repeat2,
  Bookmark,
  ArrowDown,
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
import useKakabotSessoes from '../hooks/useKakabotSessoes';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { extrairAcoes, executarAcao, executarAcoes } from '../utils/kakabotActions';
import KakaAvatar from './kakabot/KakaAvatar';
import KakaSkeleton from './kakabot/KakaSkeleton';

// ─── Configuração ────────────────────────────────────────────────────────────

/**
 * Tamanho máximo de uma mensagem do usuário em caracteres.
 * WARN: aumentar muito pode causar erros de token no Gemini (contexto máx ~30k tokens).
 */
const MAX_USER_CHARS = 2000;

/**
 * Remove qualquer bloco ```action``` ou ```json``` residual do texto antes de exibir.
 * WARN: camada de segurança secundária — o parser principal (extrairAcoes) deve
 * remover os blocos. Esta função é o fallback para evitar JSON vazando na UI.
 */
const sanitizarTexto = (texto) =>
  texto
    .replace(/```action[\s\S]*?```/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .trim();

/**
 * Respostas locais para mensagens triviais que não precisam do Gemini.
 * Economiza tokens e reduz latência em interações simples.
 */
const RESPOSTAS_LOCAIS = {
  'oi':       'Oi! Tô aqui. O que você precisa?',
  'ola':      'Olá! Como posso ajudar?',
  'olá':      'Olá! Como posso ajudar?',
  'ok':       'Certo!',
  'obrigado': 'De nada! Se precisar de mais algo é só chamar.',
  'obrigada': 'De nada! Se precisar de mais algo é só chamar.',
  'valeu':    'Sempre! Qualquer coisa é só falar.',
  'vlw':      'Sempre! Qualquer coisa é só falar.',
  'blz':      'Beleza! Tô por aqui.',
  'beleza':   'Show! Se precisar é só chamar.',
};

const tentarRespostaLocal = (mensagem) => {
  const normalizada = mensagem.toLowerCase().trim().replace(/[!?.\s]+$/g, '').trim();
  return RESPOSTAS_LOCAIS[normalizada] ?? null;
};

/** Máximo de pares (user+model) enviados ao Gemini para limitar tokens. */
const MAX_HISTORICO_GEMINI = 10;

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
  { name: 'gemini-2.5-flash', description: 'Mais recente' },
  { name: 'gemini-2.0-flash', description: 'Versão 2.0' },
  { name: 'gemini-1.5-pro', description: 'Mais capaz' },
];

/* ── Labels de contexto por página (exibido no header) ── */
const PAGE_CONTEXT_LABELS = {
  '/': 'Dashboard',
  '/flashcards': 'Flashcards',
  '/resumos': 'Resumos',
  '/simulado': 'Simulado',
  '/consulta-rapida': 'Consulta Rápida',
  '/materias': 'Matérias',
  '/atlas-3d': 'Atlas 3D',
  '/analytics': 'Analytics',
  '/conquistas': 'Conquistas',
};

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

/* ═══════════════════════════════════════════════════
   ACAO BADGE — mensagem amigável, sem termos técnicos
   ═══════════════════════════════════════════════════ */
const AcaoBadge = ({ label }) => (
  <div className="mt-2.5 flex items-center gap-2 px-2.75 py-1.75 rounded-[10px] bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800/50">
    <CheckCircle2 size={14} strokeWidth={2.2} className="text-teal-600 dark:text-teal-400" />
    <span className="text-[11.5px] font-medium text-teal-700 dark:text-teal-300">
      {label}
    </span>
  </div>
);

// ─── System Prompt Builder ────────────────────────────────────────────────────

/**
 * Constrói o system prompt completo injetado no chat do Gemini.
 * Versão v2: personalidade humana, empática e contextualmente inteligente.
 *
 * @param {object} memoria      - Estado `memoriaUsuario` (DEFAULT_MEMORY shape)
 * @param {object} dadosSistema - Retorno de useKakabotContext (materias, totais, streak)
 * @param {string} pageContext  - Descrição da página atual (de PAGE_CONTEXTS)
 * @returns {string} System prompt completo como string
 */
const buildSystemPrompt = (memoria, dadosSistema, pageContext) => {
  const pref = memoria?.preferenciasUsuario || {};
  const stats = memoria?.estatisticasUso || {};
  const totalMsgs = stats.totalMensagens || 0;
  const streakAtual = dadosSistema?.streakAtual || 0;
  const cardsHoje = dadosSistema?.cardsParaRevisarHoje || 0;
  const materiaNames = dadosSistema?.materias?.map((m) => m.nome).join(', ') || 'nenhuma ainda';

  return `Você é o Kaka — não um chatbot, mas um colega de estudos de fisioterapia que acompanha essa pessoa de perto.

## QUEM VOCÊ É

Você tem uma personalidade real:
- Curioso e apaixonado por fisioterapia — você genuinamente acha fascinante como o corpo funciona
- Direto, mas nunca frio — vai direto ao ponto sem ser robótico
- Tem senso de humor leve e natural — uma piada sutil aqui e ali, nunca forçada
- Lembra de detalhes — se a pessoa mencionou algo antes, você retoma
- Reconhece quando ela está travada ou frustrada e ajusta o tom
- Comemora vitórias genuinamente, sem ser exagerado ou piegas

## COMO VOCÊ FALA

Fale como um colega inteligente falaria, não como um manual:

❌ Evite sempre: "Claro!", "Com certeza!", "Ótima pergunta!", "Posso te ajudar com isso!"
❌ Nunca comece resposta com "Eu" ou com o nome da pessoa repetidamente
❌ Nunca use listas com bullet points para tudo — prefira parágrafos naturais
❌ Nunca seja excessivamente entusiasta — é cafona e artificial
❌ Nunca diga "Como posso te ajudar hoje?" — você já sabe o que ela precisa pelo contexto

✅ Use linguagem natural brasileira — "olha", "então", "tipo assim", "na real"
✅ Contrações naturais — "tá", "pra", "né", "tô" quando o contexto for casual
✅ Varie as aberturas — às vezes vai direto na resposta sem saudação
✅ Quando não souber algo, diz de forma honesta e natural: "Cara, essa eu precisaria checar melhor"
✅ Quando a pessoa acertar algo difícil, celebre de verdade: "Isso aí! Lachman em 20-30° — difícil de fixar esse detalhe"
✅ Nunca exponha detalhes técnicos internos do sistema (JSON, schema, id interno, formato hex) para o usuário final

## MEMÓRIA E CONTINUIDADE

${pref.nomePreferido
    ? `Você está falando com ${pref.nomePreferido}. Use o nome de forma natural, não em toda frase — só quando der ênfase ou ficar natural.`
    : `Você ainda não sabe o nome da pessoa. Se der oportunidade natural, pergunte.`
  }

- Nível de conhecimento: ${pref.nivelConhecimento || 'não identificado ainda'}
- Áreas de interesse: ${pref.areasDeInteresse?.join(', ') || 'não identificadas ainda'}
- Estilo de resposta preferido: ${pref.estiloResposta || 'padrão'}

Histórico relevante desta pessoa:
- Streak atual: ${streakAtual} dias ${streakAtual >= 7 ? '— isso é consistência de verdade' : streakAtual === 0 ? '— foi interrompido, pode ser um momento delicado' : ''}
- Cards para revisar hoje: ${cardsHoje}
- Total de flashcards: ${dadosSistema?.totalFlashcards || 0}
- Total de resumos: ${dadosSistema?.totalResumos || 0}
- Matérias: ${materiaNames}
- Total de interações com você: ${totalMsgs}
${totalMsgs === 0
    ? '- É a primeira vez que vocês conversam — apresente-se de forma breve e natural'
    : totalMsgs < 10
    ? '- Ainda estão se conhecendo — seja um pouco mais explicativo'
    : '- Já se conhecem bem — pode ser mais direto e familiar'
  }
- Ações já realizadas: ${JSON.stringify(stats.acoesExecutadas || {})}
- Maior streak: ${dadosSistema?.longestStreak || 0} dias

${pageContext ? `## CONTEXTO ATUAL\n${pageContext}` : ''}

## INTELIGÊNCIA CONTEXTUAL

Leia o que está nas entrelinhas:

- Se a pessoa mandar só "oi" às 23h → ela pode estar estudando tarde, reconheça isso
- Se errar a mesma coisa duas vezes → não repita a mesma explicação, tente outro ângulo
- Se a mensagem for curta e seca → ela pode estar com pressa, seja objetivo
- Se usar ponto de exclamação e emojis → ela está animada, combine o tom
- Se o texto for longo e detalhado → ela quer profundidade, entregue isso
- Se pedir "explica de novo" → a primeira explicação não funcionou, mude completamente a abordagem

## ADAPTAÇÃO DE PROFUNDIDADE

**Modo rápido** (saudações, confirmações):
Resposta em 1-2 frases. Sem lista, sem formatação.
Exemplo: "Boa tarde! Tem 12 cards esperando — quer ir direto pra revisão?"

**Modo padrão** (dúvidas clínicas):
2-4 parágrafos com linguagem natural. Use negrito só para termos técnicos-chave.
Inclua uma analogia quando o conceito for abstrato.

**Modo aprofundado** (pedidos explícitos de detalhe):
Estruturado com subtítulos. Exemplos clínicos reais. Referência a contexto prático.
Termine com uma pergunta que provoque reflexão, não uma lista de tópicos.

## RESPOSTAS EMOCIONAIS CALIBRADAS

Quando a pessoa estiver frustrada:
→ Valide primeiro, depois ajude. Nunca pule direto para a solução.
→ "Essa parte é chata mesmo, não tem outro jeito de descrever. Mas deixa eu te mostrar um ângulo que costuma fazer clic..."

Quando acertar algo difícil:
→ Reconheça especificamente o que foi difícil, não elogie genericamente.
→ "Lembrou do easeFactor mínimo 1.3 — esse detalhe é o tipo de coisa que a maioria esquece"

Quando estiver travada num conceito:
→ Pergunte onde travou especificamente antes de reexplicar tudo.
→ "Em que ponto a coisa começa a ficar confusa? Na ativação do músculo ou no ciclo todo?"

Quando mencionar cansaço ou estresse:
→ Reconheça genuinamente. Sugira algo mais leve ou uma pausa.
→ Nunca force produtividade em quem claramente está exausto.

## CRIAÇÃO DE CONTEÚDO

Quando criar flashcards:
- Escreva como um professor experiente criaria, não como uma enciclopédia
- Perguntas devem testar raciocínio, não memorização de definição
- ❌ "O que é espasticidade?" → ✅ "Por que a espasticidade piora em movimentos rápidos mas não nos lentos?"

Quando criar resumos:
- Use linguagem de estudo, não linguagem de artigo científico
- Inclua "pontos de atenção" que costumam cair em prova
- Termine seções com conexões clínicas práticas

## AÇÕES QUE VOCÊ PODE EXECUTAR
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
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "string", "cor": "#hexcolor opcional", "descricao": "string opcional" } }
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
6. O(s) bloco(s) action devem vir SEMPRE NO FINAL da mensagem
7. Quando o usuário pedir para criar MAIS DE UM item (ex: "crie as matérias Kauan e Kelvin"), gere um bloco \`\`\`action\`\`\` SEPARADO para CADA item — NUNCA agrupe em um só bloco
8. NUNCA peça detalhes técnicos para o usuário (ex: código hex de cor, estrutura JSON, id interno). Se faltar cor em CRIAR_MATERIA, escolha automaticamente uma cor apropriada e prossiga.

Exemplo CORRETO para "crie as matérias Kauan e Kelvin":
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "Kauan", "cor": "#0d9488" } }
\`\`\`
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "Kelvin", "cor": "#0891b2" } }
\`\`\`

Exemplo ERRADO (NÃO faça):
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": [{ "nome": "Kauan" }, { "nome": "Kelvin" }] }
\`\`\`

## LIMITAÇÕES HONESTAS

Se não souber: "Olha, não tenho certeza suficiente pra te passar isso com segurança — vale checar no Kisner ou num artigo recente."
Para diagnósticos: Nunca dê diagnóstico. Sugira avaliação — mas de forma humana, não como disclaimer jurídico.
Se a pergunta for muito vaga: Pergunte antes de responder, não adivinhe.
Nunca execute ações sem os dados necessários — pergunte antes.

## UM DETALHE FINAL

Você não é um assistente que espera ser acionado. Você percebe coisas:
- Proativamente menciona os cards do dia se a pessoa não mencionou
- Lembra que ela estava estudando determinada matéria na última sessão
- Nota quando o streak pode quebrar hoje e comenta naturalmente

## SUGESTÃO DE PRÓXIMO PASSO

Ao final de respostas sobre conceitos clínicos ou temas de estudo,
SEMPRE adicione uma sugestão de próximo passo no seguinte formato:

[PROXPASSO: texto curto da sugestão]

Exemplos:
[PROXPASSO: Criar flashcards sobre isso]
[PROXPASSO: Ver meus cards de Neurológico]
[PROXPASSO: Fazer um simulado sobre esse tema]
[PROXPASSO: Explicar a diferença com rigidez]

Regras:
- Máximo 5 palavras
- Deve ser algo acionável, não genérico
- NUNCA em respostas de saudação ou ações já executadas

## MODO QUIZ

Quando o usuário pedir "me testa", "quiz", "perguntas" ou similar,
ative o Modo Quiz seguindo este protocolo:

1. Pergunte sobre qual tema e quantas questões (padrão: 5)
2. Faça UMA pergunta por vez — nunca todas de uma vez
3. Aguarde a resposta antes de avançar
4. Após cada resposta: corrija, explique o porquê e dê pontuação (acertou/errou)
5. No final: mostre aproveitamento e identifique o ponto mais fraco

Tipos de pergunta que deve variar:
- Direta: "Qual nervo inerva o deltóide?"
- Aplicada: "Um paciente com marcha ceifante apresenta... qual seria a hipótese?"
- Diferencial: "Qual a diferença entre teste de Lachman e gaveta anterior?"
- Clínica: "Em qual posição o teste de Neer deve ser realizado e o que indica positivo?"

Ao entrar no Modo Quiz, gere o seguinte bloco:
[QUIZ_INICIO: tema | total de questões]

A cada questão:
[QUIZ_QUESTAO: número atual | total]

Ao finalizar:
[QUIZ_FIM: acertos | total | ponto_fraco]`;
};

/* ═══════════════════════════════════════════════════
   DEFAULT MEMORY
   ═══════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════
   MARKDOWN COMPONENTS (reutilizado no render)
   ═══════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════
   FRIENDLY ACTION LABELS (sem termos técnicos)
   ═══════════════════════════════════════════════════ */
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

const cleanUndefined = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// ─── Vocabulário para inferência de nível ────────────────────────────────────

const VOCAB_AVANCADO = [
  'cinesiologia', 'biomecânica', 'propriocepção', 'facilitação neuromuscular',
  'coativação', 'recrutamento motor', 'plasticidade neural', 'mecanotransdução',
  'sarcoplasmático', 'unidade motora', 'potencial de ação', 'PNF', 'FNP',
];

const VOCAB_INICIANTE = [
  'o que é', 'não entendo', 'pode explicar', 'nunca ouvi', 'como funciona',
  'o que significa', 'pra que serve', 'não sei',
];

const inferirNivel = (mensagem) => {
  const lower = mensagem.toLowerCase();
  if (VOCAB_AVANCADO.some(v => lower.includes(v.toLowerCase()))) return 'avancado';
  if (VOCAB_INICIANTE.some(v => lower.includes(v))) return 'iniciante';
  return null;
};

// ─── Detecção de humor ────────────────────────────────────────────────────────

const detectarHumor = (mensagem) => {
  const lower = mensagem.toLowerCase();

  const sinaisFrustracao = ['não entendo', 'não consigo', 'difícil demais',
    'odeio', 'tô perdido', 'que confusão', 'não faz sentido'];
  const sinaisAnimacao = ['!', 'amei', 'incrível', 'adorei', 'ótimo',
    'consegui', 'entendi', 'finalmente'];
  const sinaisCansaco = ['cansado', 'cansada', 'tô exausto', 'tô exausta',
    'chega', 'não aguento', 'dormindo', 'tarde'];
  const sinaisPressa = ['rápido', 'resumo', 'só preciso saber',
    'me diz logo', 'curto'];

  if (sinaisFrustracao.some(s => lower.includes(s))) return 'frustrado';
  if (sinaisAnimacao.some(s => lower.includes(s))) return 'animado';
  if (sinaisCansaco.some(s => lower.includes(s))) return 'cansado';
  if (sinaisPressa.some(s => lower.includes(s))) return 'com_pressa';
  return 'neutro';
};

const instrucaoHumor = {
  frustrado: 'HUMOR DETECTADO: frustração. Valide primeiro ("é complicado mesmo"), depois ajude. Nunca vá direto à solução.',
  animado: 'HUMOR DETECTADO: animação. Combine a energia, celebre com ela.',
  cansado: 'HUMOR DETECTADO: cansaço. Seja gentil e breve. Sugira pausa se fizer sentido. Nunca force produtividade.',
  com_pressa: 'HUMOR DETECTADO: pressa. Resposta direta e curta. Sem introduções.',
  neutro: '',
};

// ─── Parser de próximo passo e quiz ──────────────────────────────────────────

const processarProximoPasso = (texto) => {
  const proxPassoRegex = /\[PROXPASSO:\s*(.*?)\]/;
  const match = texto.match(proxPassoRegex);
  return {
    proximoPasso: match?.[1]?.trim() ?? null,
    textoSemPasso: texto.replace(proxPassoRegex, '').trim(),
  };
};

const processarQuiz = (texto) => {
  const inicio = texto.match(/\[QUIZ_INICIO:\s*(.*?)\]/);
  const questao = texto.match(/\[QUIZ_QUESTAO:\s*(\d+)\s*\|\s*(\d+)\]/);
  const fim = texto.match(/\[QUIZ_FIM:\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.*?)\]/);

  return {
    textoLimpo: texto
      .replace(/\[QUIZ_INICIO:.*?\]/g, '')
      .replace(/\[QUIZ_QUESTAO:.*?\]/g, '')
      .replace(/\[QUIZ_FIM:.*?\]/g, '')
      .trim(),
    quizMeta: inicio ? { tipo: 'inicio', tema: inicio[1] } :
              questao ? { tipo: 'questao', atual: parseInt(questao[1]), total: parseInt(questao[2]) } :
              fim ? { tipo: 'fim', acertos: parseInt(fim[1]), total: parseInt(fim[2]), pontoFraco: fim[3] } :
              null,
  };
};

// ─── Descrição humana de ação ─────────────────────────────────────────────────

const descreverAcao = (acao) => {
  switch (acao.acao) {
    case 'CRIAR_MATERIA':
      return `Criar matéria "${acao.dados?.nome || ''}"`;
    case 'CRIAR_FLASHCARD':
      return `Criar flashcard em "${acao.dados?.materiaId || 'sem matéria'}"`;
    case 'CRIAR_MULTIPLOS_FLASHCARDS':
      return `Criar ${acao.dados?.flashcards?.length || 0} flashcards em "${acao.dados?.materia || acao.dados?.materiaId || 'sem matéria'}"`;
    case 'CRIAR_RESUMO':
      return `Criar resumo "${acao.dados?.titulo || ''}"`;
    case 'AGENDAR_REVISAO':
      return `Agendar revisão para ${acao.dados?.data || ''}`;
    case 'ATUALIZAR_PREFERENCIAS':
      return 'Atualizar suas preferências';
    default:
      return acao.acao;
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

  // ─── Sessões paginadas ─────────────────────────────────────────────────────
  const {
    sessaoAtual,
    mensagensVisiveis,
    temMais,
    carregando,
    novaSessao,
    carregarSessao,
    carregarMais,
    adicionarMensagem,
    adicionarMensagemSemUI,
    listarSessoes,
    setMensagensVisiveis,
  } = useKakabotSessoes(uid);

  // ─── Text-to-Speech ────────────────────────────────────────────────────────
  const { speak, stop: stopTTS, isSupported: ttsSupported, isSpeaking, activeId: ttsActiveId } = useTextToSpeech();

  // ─── Estado — UI ───────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);

  // Escuta evento externo para abrir o KakaBot (ex: onboarding)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinesia:kakabot:abrir', handleOpen);
    return () => window.removeEventListener('cinesia:kakabot:abrir', handleOpen);
  }, []);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [showConfirmNovaSessao, setShowConfirmNovaSessao] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [sessoes, setSessoes] = useState([]);
  const [reacoes, setReacoes] = useState({});
  // Smart scroll — só auto-rolar se o usuário estiver perto do fundo
  const deveScrollarRef = useRef(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // Preview de ação antes de executar
  const [acaoPendente, setAcaoPendente] = useState(null);
  // Reactions hover
  const [hoveredId, setHoveredId] = useState(null);
  // Quiz mode
  const [quizAtivo, setQuizAtivo] = useState(null);
  // Proatividade — 1x por sessão
  const proativoDisparadoRef = useRef(false);
  // Ref para inibir auto-scroll quando carregarMais insere mensagens acima
  const loadingMaisRef = useRef(false);
  // Ref para evitar dupla inicialização de sessão
  const inicializadoRef = useRef(false);

  // ─── Estado — Conexão Gemini ───────────────────────────────────────────────
  // connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  const [geminiModel, setGeminiModel] = useState(null);
  const [activeModelName, setActiveModelName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);

  // ─── Estado — Memória Persistente ─────────────────────────────────────────
  const [memoriaUsuario, setMemoriaUsuario] = useState(DEFAULT_MEMORY);
  const [memoryLoaded, setMemoryLoaded] = useState(false);

  // ─── Estado — Rate Limiting ────────────────────────────────────────────────
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const lastMessageTimeRef = useRef(0);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Voice input
  const handleVoiceFinalResult = useCallback((finalText) => {
    setInputValue(finalText);
    setTimeout(() => {
      sendMessageRef.current?.(finalText);
    }, 100);
  }, []);

  const { isListening, transcript, startListening, stopListening, isSupported, error: voiceError } =
    useSpeechRecognition(handleVoiceFinalResult);

  useEffect(() => {
    if (voiceError) addSystemMessage(`🎤 ${voiceError}`, 'error');
  }, [voiceError]);

  // ─── Memória — Carregar / Salvar ───────────────────────────────────────────

  const carregarMemoria = useCallback(async () => {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const memoria = {
          ultimasConversas: [],
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
      }
    } catch (err) {
      console.warn('[KakaBot] Erro ao carregar memória:', err?.message);
    } finally {
      setMemoryLoaded(true);
    }
  }, [uid]);

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
        await setDoc(docRef, cleanUndefined(updateData), { merge: true });

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

  const registrarAcaoNaMemoria = useCallback(
    async (nomeAcao) => {
      if (!uid) return;
      try {
        const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');
        const acoesAtuais = { ...(memoriaUsuario.estatisticasUso.acoesExecutadas || {}) };
        acoesAtuais[nomeAcao] = (acoesAtuais[nomeAcao] || 0) + 1;

        await setDoc(
          docRef,
          cleanUndefined({ estatisticasUso: { acoesExecutadas: acoesAtuais } }),
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

  // ─── Inteligência: Proatividade ────────────────────────────────────────────

  const dispararMensagemProativa = useCallback(async (texto) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      role: 'assistant',
      content: texto,
      timestamp: new Date().toISOString(),
      time,
      isProativa: true,
    };
    await adicionarMensagem(msg);
  }, [adicionarMensagem]);

  const verificarProatividade = useCallback(async () => {
    if (proativoDisparadoRef.current) return;
    if (!dadosSistema || !memoriaUsuario) return;

    const agora = new Date();
    const hora = agora.getHours();
    const streakAtual = dadosSistema?.streakAtual || 0;
    const cardsHoje = dadosSistema?.cardsParaRevisarHoje || 0;
    const ultimoAcesso = memoriaUsuario?.estatisticasUso?.ultimoAcesso;

    // PRIORIDADE 1: streak em risco
    if (ultimoAcesso) {
      const diasSemEstudar = Math.floor(
        (agora.getTime() - new Date(ultimoAcesso).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasSemEstudar >= 1 && hora >= 20 && streakAtual > 0) {
        proativoDisparadoRef.current = true;
        await dispararMensagemProativa(
          `Oi! Só passando pra lembrar que seu streak de ${streakAtual} dias pode quebrar hoje se você não revisar. Tem ${cardsHoje} cards esperando — leva uns 5 minutinhos. Quer começar?`
        );
        return;
      }
    }

    // PRIORIDADE 2: muitos cards acumulados
    if (cardsHoje > 20) {
      proativoDisparadoRef.current = true;
      await dispararMensagemProativa(
        `Você acumulou ${cardsHoje} cards pra revisar — tá ficando pesado. Que tal dividir em blocos de 10 hoje? Consigo montar uma sessão focada pra você.`
      );
      return;
    }
  }, [memoriaUsuario, dadosSistema, dispararMensagemProativa]);

  // ─── Inteligência: Resumo de Sessão ───────────────────────────────────────

  const gerarResumoSessao = useCallback(async () => {
    if (!sessaoAtual || (sessaoAtual.mensagens || []).length < 4) return;

    const mensagensTexto = (sessaoAtual.mensagens || [])
      .filter(m => !m.isSystem)
      .slice(-20)
      .map(m => `${m.role === 'user' ? 'Usuário' : 'Kaka'}: ${m.content?.substring(0, 200) || ''}`)
      .join('\n');

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(
        `Em 2-3 frases curtas e diretas, resuma o que foi estudado/feito nesta conversa.
         Mencione temas, ações realizadas e aprendizados. Seja específico.
         NÃO use bullet points. Linguagem natural em português.
         Conversa:\n${mensagensTexto}`
      );

      const resumo = result.response.text().trim();

      await setDoc(
        doc(db, 'users', uid, 'kakabot_sessoes', sessaoAtual.id),
        cleanUndefined({ resumoAutoGerado: resumo, resumoGeradoEm: new Date().toISOString() }),
        { merge: true }
      );
    } catch {
      // Resumo é opcional — falha silenciosa
    }
  }, [sessaoAtual, uid]);

  // ─── Inteligência: Contexto Cross-Sessão ──────────────────────────────────

  const construirContextoHistorico = useCallback(async () => {
    const sessoes = await listarSessoes();
    const sessoesComResumo = sessoes
      .filter(s => s.resumoAutoGerado && s.id !== sessaoAtual?.id)
      .slice(0, 3);

    if (sessoesComResumo.length === 0) return '';

    const contexto = sessoesComResumo
      .map((s) => {
        const data = new Date(s.ultimaAtualizacao)
          .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        return `- ${data}: ${s.resumoAutoGerado}`;
      })
      .join('\n');

    return `\n## CONTEXTO DE SESSÕES ANTERIORES\n${contexto}\n\nUse esse histórico para dar continuidade natural — mencione se algo se conecta com o que foi estudado antes.`;
  }, [listarSessoes, sessaoAtual]);

  // ─── Efeitos ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && uid && !memoryLoaded) {
      carregarMemoria();
    }
  }, [isOpen, uid, memoryLoaded, carregarMemoria]);

  useEffect(() => {
    if (!isOpen || !memoryLoaded || sessaoAtual || inicializadoRef.current) return;
    inicializadoRef.current = true;

    listarSessoes().then((lista) => {
      if (lista.length > 0) {
        carregarSessao(lista[0].id);
      } else {
        novaSessao(memoriaUsuario, dadosSistema);
      }
    });
  }, [isOpen, memoryLoaded, sessaoAtual]);

  useEffect(() => {
    if (!isOpen) {
      inicializadoRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && isSpeaking) {
      stopTTS();
    }
  }, [isOpen, isSpeaking, stopTTS]);

  useEffect(() => {
    if (isOpen && sessaoAtual && memoryLoaded && connectionStatus === 'connected') {
      verificarProatividade();
    }
  }, [isOpen, sessaoAtual, memoryLoaded, connectionStatus, verificarProatividade]);

  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected' && memoryLoaded && sessaoAtual && !isLoadingContext) {
      initializeGemini();
    }
  }, [isOpen, connectionStatus, memoryLoaded, sessaoAtual, isLoadingContext]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanciaDoFundo = el.scrollHeight - el.scrollTop - el.clientHeight;
    deveScrollarRef.current = distanciaDoFundo < 100;
    if (deveScrollarRef.current) setHasNewMessage(false);
  }, []);

  useEffect(() => {
    if (!loadingMaisRef.current && deveScrollarRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (!loadingMaisRef.current && !deveScrollarRef.current) {
      setHasNewMessage(true);
    }
  }, [mensagensVisiveis, isExecutingAction]);

  useEffect(() => {
    if (isOpen && connectionStatus === 'connected') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, connectionStatus]);

  useEffect(() => {
    if (showHistorico) {
      listarSessoes().then(setSessoes);
    }
  }, [showHistorico]);

  // ─── Gemini — Inicialização ────────────────────────────────────────────────

  const initializeGemini = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
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

      let contextoHistorico = '';
      try {
        contextoHistorico = await construirContextoHistorico();
      } catch { /* não crítico */ }

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

          const chat = createChatWithPersona(model, contextoHistorico);
          chatRef.current = chat;
          setGeminiModel(chat);
          setActiveModelName(modelName);
          setConnectionStatus('connected');
          return;
        } catch (err) {
          if (err.message?.includes('429') || err.status === 429) throw err;
          if (i === GEMINI_MODELS.length - 1) throw err;
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

  const createChatWithPersona = (model, contextoHistorico = '') => {
    const MAX_SYSTEM_PROMPT_CHARS = 12000;
    const pageContext = PAGE_CONTEXTS[location.pathname] || '';
    let systemPromptRaw = buildSystemPrompt(memoriaUsuario, dadosSistema, pageContext) + contextoHistorico;
    // Sanitiza prompt: remove undefined/null, força string
    systemPromptRaw = String(systemPromptRaw || '').replace(/undefined|null/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '').trim();
    let systemPrompt = systemPromptRaw.length > MAX_SYSTEM_PROMPT_CHARS
      ? systemPromptRaw.substring(0, MAX_SYSTEM_PROMPT_CHARS) + '\n\n[contexto truncado]'
      : systemPromptRaw;

    // Sanitiza histórico: só mensagens válidas, sem undefined/null
    const remembered = (sessaoAtual?.mensagens || [])
      .filter((m) => !m.isSystem)
      .filter((m) => typeof m.content === 'string' && m.content.trim() !== '' && m.content !== undefined && m.content !== null)
      .map((m) => ({ ...m, content: String(m.content).replace(/undefined|null/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '').trim() }))
      .filter((m) => m.content.length > 0)
      .slice(-(MAX_HISTORICO_GEMINI * 2));

    const historyTurns = [];
    for (const msg of remembered) {
      const role = msg.role === 'user' ? 'user' : 'model';
      if (historyTurns.length > 0 && historyTurns[historyTurns.length - 1].role === role) {
        continue;
      }
      historyTurns.push({
        role,
        parts: [{ text: msg.content }],
      });
    }

    if (historyTurns.length > 0 && historyTurns[historyTurns.length - 1].role === 'user') {
      historyTurns.pop();
    }

    // Truncar histórico se necessário para evitar erro 400
    let maxHistory = 20;
    let fullHistory = [
      {
        role: 'user',
        parts: [{ text: `Aja como o seguinte assistente:\n\n${systemPrompt}` }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Sou o Kaka, parceiro de estudos de fisioterapia. Bora.' }],
      },
      ...historyTurns.slice(-maxHistory),
    ];
    // Se ainda der erro, tente truncar mais
    while (JSON.stringify(fullHistory).length > 12000 && maxHistory > 2) {
      maxHistory -= 2;
      fullHistory = [
        {
          role: 'user',
          parts: [{ text: `Aja como o seguinte assistente:\n\n${systemPrompt}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido. Sou o Kaka, parceiro de estudos de fisioterapia. Bora.' }],
        },
        ...historyTurns.slice(-maxHistory),
      ];
    }

    return model.startChat({ history: fullHistory });
  };

  /* ═══════════════════════════════════════════════════
     ERROR HANDLING
     ═══════════════════════════════════════════════════ */
  const handleConnectionError = (error) => {
    setConnectionStatus('error');
    const msg = typeof error === 'string' ? error : error.message || String(error);
    setErrorMessage(msg);
    const details = analyzeError(msg);
    addSystemMessage(
      `😞 **Não consegui me conectar**\n\n${details.message}\n\n**Possíveis soluções:**\n${details.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
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

  // ─── Mensagens de Sistema ──────────────────────────────────────────────────

  const addSystemMessage = useCallback((content, type = 'info') => {
    setMensagensVisiveis((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
        isSystem: true,
        systemType: type,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [setMensagensVisiveis]);

  const checkRateLimit = () => {
    const now = Date.now();
    if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      const wait = Math.ceil((MIN_MESSAGE_INTERVAL_MS - (now - lastMessageTimeRef.current)) / 1000);
      return { allowed: false, reason: `Aguarde ${wait} segundo(s) antes de enviar outra mensagem.` };
    }
    const recent = messageTimestamps.filter((t) => now - t < 60000);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
      return { allowed: false, reason: `Limite de ${MAX_MESSAGES_PER_MINUTE} mensagens/minuto atingido.` };
    }
    return { allowed: true };
  };

  // ─── Envio de Mensagem ─────────────────────────────────────────────────────

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

    await adicionarMensagem(userMsg);

    const respostaLocal = tentarRespostaLocal(userMessage);
    if (respostaLocal) {
      const assistantTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const localMsg = {
        role: 'assistant',
        content: respostaLocal,
        timestamp: new Date().toISOString(),
        time: assistantTime,
      };
      await adicionarMensagem(localMsg);
      return;
    }

    setIsLoading(true);

    const now = Date.now();
    lastMessageTimeRef.current = now;
    setMessageTimestamps((prev) => [...prev.filter((t) => now - t < 60000), now]);

    const nivelInferido = inferirNivel(userMessage);
    if (nivelInferido && nivelInferido !== memoriaUsuario?.preferenciasUsuario?.nivelConhecimento) {
      try {
        const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');
        await setDoc(docRef, {
          preferenciasUsuario: { nivelConhecimento: nivelInferido },
        }, { merge: true });
        await setDoc(docRef, cleanUndefined({
          preferenciasUsuario: { nivelConhecimento: nivelInferido },
        }), { merge: true });
        setMemoriaUsuario((prev) => ({
          ...prev,
          preferenciasUsuario: { ...prev.preferenciasUsuario, nivelConhecimento: nivelInferido },
        }));
      } catch { /* não crítico */ }
    }

    const humor = detectarHumor(userMessage);
    const instrucaoExtra = instrucaoHumor[humor] || '';

    try {
      const mensagemComContexto = instrucaoExtra
        ? `[CONTEXTO INTERNO - NÃO REPETIR]: ${instrucaoExtra}\n\nMensagem do usuário: ${userMessage}`
        : userMessage;

      // Sanitização
      const mensagemLimpa = mensagemComContexto
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '')
        .trim();

      if (!mensagemLimpa) {
        setIsLoading(false);
        addSystemMessage('Mensagem inválida, tente novamente.', 'error');
        return;
      }

      const result = await chatRef.current.sendMessage(mensagemLimpa);
      const response = await result.response;
      const textoCompleto = response.text();

      const { textoLimpo, acoes } = extrairAcoes(textoCompleto);
      let textoFinal = sanitizarTexto(textoLimpo);

      const { proximoPasso, textoSemPasso } = processarProximoPasso(textoFinal);
      textoFinal = textoSemPasso;

      const { textoLimpo: textoSemQuiz, quizMeta } = processarQuiz(textoFinal);
      textoFinal = textoSemQuiz;

      if (quizMeta) {
        if (quizMeta.tipo === 'inicio') {
          setQuizAtivo({ tema: quizMeta.tema, atual: 0, total: 5 });
        } else if (quizMeta.tipo === 'questao') {
          setQuizAtivo((prev) => prev ? { ...prev, atual: quizMeta.atual, total: quizMeta.total } : null);
        } else if (quizMeta.tipo === 'fim') {
          setQuizAtivo(null);
        }
      }

      const assistantTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const assistantMsg = {
        role: 'assistant',
        content: textoFinal,
        timestamp: new Date().toISOString(),
        time: assistantTime,
        acaoExecutada: acoes.length > 0 ? acoes.map(a => a.acao).join(', ') : null,
        acaoLabel: acoes.length > 0 ? acoes.map(a => getAcaoLabel(a.acao, a.dados)).join(' | ') : null,
        proximoPasso: proximoPasso || null,
      };

      setIsLoading(false);
      const palavras = textoFinal.split(' ');
      const velocidade = palavras.length > 100 ? 20 : 30;
      const msgParcial = { ...assistantMsg, content: '', isStreaming: true };
      setMensagensVisiveis((prev) => [...prev, msgParcial]);

      await new Promise((resolve) => {
        let idx = 0;
        const intervalo = setInterval(() => {
          idx++;
          const parcial = palavras.slice(0, idx).join(' ');
          setMensagensVisiveis((prev) => {
            const clone = [...prev];
            clone[clone.length - 1] = { ...assistantMsg, content: parcial, isStreaming: idx < palavras.length };
            return clone;
          });
          if (idx >= palavras.length) {
            clearInterval(intervalo);
            resolve();
          }
        }, velocidade);
      });

      await adicionarMensagemSemUI(assistantMsg);

      if (acoes.length > 0) {
        const descricoes = acoes.map(a => descreverAcao(a));
        setAcaoPendente({ acoes, descricoes });
      }
    } catch (error) {
      setIsLoading(false);
      const status = error?.status || error?.code;
      const detail = error?.errorDetails?.[0]?.reason
        || error?.message
        || 'Erro desconhecido';

      console.error('[KakaBot] Erro na API:', { status, detail, error });

      if (status === 429 || error.message?.includes('429')) {
        addSystemMessage('😅 Limite de requisições atingido. Aguarde 1-2 min.', 'error');
      } else if (status === 400 || error.message?.includes('400')) {
        // Histórico corrompido — reinicializa o chat do zero
        console.warn('[KakaBot] Erro 400 — reinicializando sessão de chat...');
        chatRef.current = null;
        setConnectionStatus('disconnected');
        addSystemMessage(
          '⚠️ Houve um problema com o histórico da conversa. Reconectando automaticamente...',
          'error'
        );
        setTimeout(() => initializeGemini(), 1000);
      } else {
        addSystemMessage('😅 Não consegui processar sua mensagem. Tente novamente.', 'error');
      }
    }
  };

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatModelName = (name) => {
    if (!name) return 'Gemini';
    if (name.includes('2.5-flash-lite')) return '2.5 Flash Lite';
    if (name.includes('2.5-flash')) return '2.5 Flash';
    if (name.includes('1.5-pro')) return '1.5 Pro';
    return name;
  };

  const executarAcoesConfirmadas = async (acoes) => {
    setAcaoPendente(null);
    setIsExecutingAction(true);

    const resultados = await executarAcoes(acoes, uid, materiasLista);
    setIsExecutingAction(false);

    for (const resultado of resultados) {
      addSystemMessage(
        resultado.mensagem,
        resultado.sucesso ? 'success' : 'error'
      );
    }

    for (const [i, resultado] of resultados.entries()) {
      if (resultado.sucesso) {
        await registrarAcaoNaMemoria(acoes[i].acao);
      }
    }

    for (const [i, resultado] of resultados.entries()) {
      if (
        acoes[i].acao === 'ATUALIZAR_PREFERENCIAS' &&
        resultado.sucesso &&
        resultado.dadosRetorno?.preferencias
      ) {
        await salvarMemoria([], resultado.dadosRetorno.preferencias);
      }
    }
  };

  const handleFechar = () => {
    gerarResumoSessao();
    stopTTS();
    setIsOpen(false);
  };

  const handleRetryConnection = () => {
    setConnectionStatus('disconnected');
    setErrorMessage(null);
    setGeminiModel(null);
    setActiveModelName(null);
    chatRef.current = null;
    setMensagensVisiveis((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isSystem && last?.systemType === 'error') return prev.slice(0, -1);
      return prev;
    });
    initializeGemini();
  };

  const handleNovaSessao = () => {
    if (mensagensVisiveis.length <= 1) {
      novaSessao(memoriaUsuario, dadosSistema);
      return;
    }
    setShowConfirmNovaSessao(true);
  };

  const carregarMaisComScroll = () => {
    const container = messagesContainerRef.current;
    const alturaAntes = container?.scrollHeight ?? 0;
    loadingMaisRef.current = true;
    carregarMais();
    requestAnimationFrame(() => {
      if (container) {
        const alturaDepois = container.scrollHeight;
        container.scrollTop = alturaDepois - alturaAntes;
      }
      loadingMaisRef.current = false;
    });
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

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <>
      {/* ════ FAB Button ════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="relative group"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            aria-label="Abrir Kaka"
          >
            <div
              className="w-14.5 h-14.5 flex items-center justify-center relative overflow-hidden"
              style={{
                borderRadius: 18,
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #0891b2 100%)',
                boxShadow: '0 8px 24px rgba(13,148,136,0.4)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
                }}
              />
              <Dna size={26} color="#fff" strokeWidth={1.6} />
            </div>

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
              className="fixed inset-0 bg-black/30 dark:bg-black/50 z-190 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleFechar}
            />

            <motion.div
              className="fixed z-200 flex flex-col overflow-hidden
                bottom-0 left-0 right-0 h-[70vh] rounded-t-[24px]
                sm:bottom-5 sm:right-5 sm:left-auto sm:w-103.5
                sm:h-155 sm:max-h-[calc(100vh-80px)] sm:rounded-[24px]
                bg-white dark:bg-slate-900
                border border-slate-200/80 dark:border-slate-700/60"
              style={{ boxShadow: '0 20px 60px rgba(13,148,136,0.12), 0 4px 20px rgba(0,0,0,0.08)' }}
              initial={{ opacity: 0, y: 50, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* ════ HEADER COM BACKGROUNDS TRANSLÚCIDOS ════ */}
              <div
                className="px-5 py-4.5 flex items-center justify-between shrink-0"
                style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #0891b2 100%)' }}
              >
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
                    <div className="flex items-center gap-1.5 mt-0.75">
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
                    <span className="text-white/50 text-[10px] flex items-center gap-1 mt-0.5">
                      <MapPin size={8} />
                      {PAGE_CONTEXT_LABELS[location.pathname] || 'Dashboard'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isSpeaking && (
                    <motion.button
                      onClick={stopTTS}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/15 text-white border border-white/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Square size={10} fill="white" strokeWidth={0} />
                      <span>Parar áudio</span>
                    </motion.button>
                  )}
                  <button
                    onClick={() => setShowHistorico(true)}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    title="Histórico de conversas"
                    aria-label="Histórico de conversas"
                  >
                    <History size={15} className="text-white/90" />
                  </button>
                  <button
                    onClick={handleNovaSessao}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    title="Nova conversa"
                    aria-label="Iniciar nova conversa"
                  >
                    <SquarePen size={15} className="text-white/90" />
                  </button>
                  <button
                    onClick={handleFechar}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    aria-label="Fechar"
                  >
                    <X size={15} className="text-white/90" />
                  </button>
                </div>
              </div>

              {/* ════ BODY ════ */}
              <div className="flex flex-col flex-1 overflow-hidden relative">

                {/* ════ Quiz Progress Bar ════ */}
                {quizAtivo && (
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-teal-600">
                      Quiz {quizAtivo.tema}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #0d9488, #0891b2)' }}
                        animate={{ width: `${(quizAtivo.atual / quizAtivo.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {quizAtivo.atual}/{quizAtivo.total}
                    </span>
                  </div>
                )}

                {/* ════ Messages Area ════ */}
                {carregando ? (
                  <div className="flex-1 overflow-y-auto px-4 py-5 bg-slate-50 dark:bg-slate-900">
                    <KakaSkeleton />
                  </div>
                ) : (
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-5 space-y-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-50 dark:bg-slate-900"
                  >

                    {temMais && (
                      <div className="mb-4">
                        <div className="flex justify-center mb-3">
                          <motion.button
                            onClick={carregarMaisComScroll}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-teal-300 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm transition-all"
                            whileTap={{ scale: 0.97 }}
                          >
                            <ChevronUp size={13} strokeWidth={2} />
                            Carregar mensagens anteriores
                          </motion.button>
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                          <span className="text-[10.5px] text-slate-400 whitespace-nowrap">
                            mensagens anteriores acima
                          </span>
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                    )}

                    {mensagensVisiveis.map((message, index) => {
                      const isNew = index === mensagensVisiveis.length - 1;

                      if (message.role === 'user') {
                        return (
                          <div
                            key={index}
                            className="flex items-end gap-2 mb-3.5 flex-row-reverse"
                            style={{ animation: isNew ? 'kakafadeUp .22s ease' : 'none' }}
                          >
                            <div
                              className="w-8 h-8 rounded-[10px] shrink-0 flex items-center justify-center text-white text-[13px] font-bold shadow-sm"
                              style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}
                            >
                              <User size={15} strokeWidth={2} />
                            </div>
                            <div className="flex flex-col gap-1 items-end max-w-[78%]">
                              <div
                                className="px-3.75 py-2.75 text-[13.5px] leading-[1.65] text-white shadow-md rounded-2xl rounded-tr-[4px]"
                                style={{
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

                      return (
                        <div
                          key={index}
                          className="flex items-end gap-2 mb-3.5"
                          style={{ animation: isNew ? 'kakafadeUp .22s ease' : 'none' }}
                          onMouseEnter={() => setHoveredId(index)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <KakaAvatar size="sm" />
                          <div className="flex flex-col gap-1 max-w-[78%] relative">
                            <span
                              className="text-[10.5px] font-semibold ml-0.5 tracking-[0.4px]"
                              style={{ color: '#0f766e' }}
                            >
                              KAKA
                            </span>
                            <div
                              className={`px-3.75 py-2.75 text-[13.5px] leading-[1.65] shadow-sm border rounded-2xl rounded-tl-[4px] ${
                                message.isSystem && message.systemType === 'error'
                                  ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-100 dark:border-red-800/50'
                                  : message.isSystem && message.systemType === 'success'
                                  ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-100 dark:border-teal-800/50'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700'
                              }`}
                            >
                              <ReactMarkdown components={markdownComponents}>
                                {message.content}
                              </ReactMarkdown>
                              {message.isStreaming && (
                                <motion.span
                                  className="inline-block w-0.5 h-3.5 bg-teal-500 ml-0.5 rounded-full align-middle"
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.5, repeat: Infinity }}
                                />
                              )}
                              {message.acaoLabel && <AcaoBadge label={message.acaoLabel} />}

                              {!message.isSystem && !message.isStreaming && (
                                <div className="flex items-center justify-end mt-2.5 -mb-1 gap-2">
                                  {ttsSupported && (
                                    <motion.button
                                      onClick={() => speak(message.content, `msg-${index}`)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                        ttsActiveId === `msg-${index}`
                                          ? 'bg-teal-50 text-teal-600 border border-teal-200'
                                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                      }`}
                                      whileTap={{ scale: 0.95 }}
                                      aria-label={ttsActiveId === `msg-${index}` ? 'Parar narração' : 'Ouvir mensagem'}
                                    >
                                      {ttsActiveId === `msg-${index}` ? (
                                        <>
                                          <div className="flex items-center gap-0.5">
                                            {[0, 1, 2].map((i) => (
                                              <motion.div
                                                key={i}
                                                className="w-0.5 rounded-full bg-teal-500"
                                                animate={{ scaleY: [0.4, 1, 0.4] }}
                                                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                                                style={{ height: 10 }}
                                              />
                                            ))}
                                          </div>
                                          <span>Parar</span>
                                        </>
                                      ) : (
                                        <>
                                          <Volume2 size={12} strokeWidth={2} />
                                          <span>Ouvir</span>
                                        </>
                                      )}
                                    </motion.button>
                                  )}
                                </div>
                              )}
                            </div>

                            {message.proximoPasso && !message.isStreaming && (
                              <motion.button
                                onClick={() => sendMessage(message.proximoPasso)}
                                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border transition-all self-start"
                                style={{
                                  background: '#f0fdfa',
                                  borderColor: '#99f6e4',
                                  color: '#0f766e',
                                }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <Zap size={11} strokeWidth={2.5} />
                                {message.proximoPasso}
                              </motion.button>
                            )}

                            <AnimatePresence>
                              {hoveredId === index && !message.isSystem && !message.isStreaming && (
                                <motion.div
                                  className="flex items-center gap-1 mt-1"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  {[
                                    { emoji: <ThumbsUp size={11} strokeWidth={2} />, label: 'Útil', valor: 'util' },
                                    { emoji: <Repeat2 size={11} strokeWidth={2} />, label: 'Repetir', valor: 'repetir' },
                                    { emoji: <Bookmark size={11} strokeWidth={2} />, label: 'Salvar', valor: 'salvar' },
                                  ].map((r) => (
                                    <motion.button
                                      key={r.valor}
                                      onClick={async () => {
                                        setReacoes((prev) => ({ ...prev, [index]: r.valor }));
                                        if (r.valor === 'repetir') {
                                          const trecho = message.content?.substring(0, 80) || '';
                                          sendMessageRef.current?.(`Explica de outro jeito: "${trecho}..."`);
                                        } else if (r.valor === 'salvar' && uid) {
                                          try {
                                            const salvoId = `salvo_${Date.now()}`;
                                            await setDoc(
                                              doc(db, 'users', uid, 'kakabot_salvos', salvoId),
                                              cleanUndefined({
                                                content: message.content,
                                                timestamp: message.timestamp || new Date().toISOString(),
                                                sessaoId: sessaoAtual?.id || null,
                                                salvoEm: new Date().toISOString(),
                                              })
                                            );
                                            addSystemMessage('📌 Mensagem salva com sucesso!', 'success');
                                          } catch (err) {
                                            console.warn('[KakaBot] Erro ao salvar mensagem:', err?.message);
                                          }
                                        }
                                      }}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                                        reacoes[index] === r.valor
                                          ? 'bg-teal-50 text-teal-600 border border-teal-200'
                                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                                      }`}
                                      whileTap={{ scale: 0.93 }}
                                      aria-label={r.label}
                                    >
                                      {r.emoji}
                                      <span>{r.label}</span>
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

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
                      <div className="flex items-end gap-2 mb-3.5">
                        <KakaAvatar size="sm" speaking />
                        <div
                          className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2.5 rounded-2xl rounded-tl-[4px]"
                        >
                          <div className="flex items-center gap-0.75">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="w-0.75 rounded-full opacity-70"
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
                      <div className="flex items-end gap-2 mb-3.5">
                        <KakaAvatar size="sm" speaking />
                        <div
                          className="px-4 py-3 border shadow-sm flex items-center gap-2.5 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50 rounded-2xl rounded-tl-[4px]"
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
                )}

                {/* ════ Botão "Nova mensagem" (scroll inteligente) ════ */}
                <AnimatePresence>
                  {hasNewMessage && !deveScrollarRef.current && (
                    <motion.button
                      onClick={() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        deveScrollarRef.current = true;
                        setHasNewMessage(false);
                      }}
                      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                        text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #0f766e, #0891b2)' }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                    >
                      <ArrowDown size={12} strokeWidth={2.5} />
                      Nova mensagem
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* ════ Modal Preview de Ação COM GLASSMORPHISM ════ */}
                <AnimatePresence>
                  {acaoPendente && (
                    <motion.div
                      className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="w-full max-w-[320px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
                        initial={{ y: 20, scale: 0.96 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 20, scale: 0.96 }}
                      >
                        <div className="px-5 pt-5 pb-3">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: '#f0fdfa' }}
                            >
                              <Zap size={17} color="#0f766e" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                                Kaka quer executar {acaoPendente.acoes.length > 1
                                  ? `${acaoPendente.acoes.length} ações`
                                  : '1 ação'}
                              </p>
                              <p className="text-[11.5px] text-slate-400">Confirme para continuar</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            {acaoPendente.descricoes.map((desc, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                              >
                                <CheckCircle2 size={13} color="#0d9488" strokeWidth={2} />
                                <span className="text-[12.5px] text-slate-600 dark:text-slate-300">
                                  {desc}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 px-5 pb-5 pt-2">
                          <button
                            onClick={() => setAcaoPendente(null)}
                            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-200"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => executarAcoesConfirmadas(acaoPendente.acoes)}
                            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white transition-colors"
                            style={{ background: 'linear-gradient(135deg, #0f766e, #0891b2)' }}
                          >
                            Confirmar
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ════ Painel Histórico de Sessões ════ */}
                <AnimatePresence>
                  {showHistorico && (
                    <motion.div
                      className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-slate-900"
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">
                          Conversas anteriores
                        </span>
                        <button
                          onClick={() => setShowHistorico(false)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <X size={15} className="text-slate-500" strokeWidth={2} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto py-2">
                        {sessoes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#f0fdfa' }}>
                              <MessageSquare size={22} color="#0d9488" strokeWidth={1.6} />
                            </div>
                            <p className="text-[13px] font-medium text-slate-500">Nenhuma conversa salva</p>
                            <p className="text-[12px] text-slate-400 mt-1">Suas conversas aparecerão aqui</p>
                          </div>
                        ) : (
                          sessoes.map((sessao) => (
                            <button
                              key={sessao.id}
                              onClick={() => { carregarSessao(sessao.id); setShowHistorico(false); }}
                              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/50 transition-colors text-left"
                            >
                              <div
                                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                                style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
                              >
                                <MessageSquare size={14} color="#0f766e" strokeWidth={2} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13.5px] font-medium text-slate-700 dark:text-slate-200 truncate">
                                  {sessao.titulo}
                                </p>
                                <p className="text-[11.5px] text-slate-400 mt-0.5">
                                  {sessao.totalMensagens} mensagens &middot;{' '}
                                  {new Date(sessao.ultimaAtualizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </p>
                                {sessao.resumoAutoGerado && (
                                  <p className="text-[11.5px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {sessao.resumoAutoGerado}
                                  </p>
                                )}
                              </div>
                              <ChevronRight size={14} className="text-slate-300 mt-1 shrink-0" strokeWidth={2} />
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ════ Modal Confirmar Nova Sessão COM GLASSMORPHISM ════ */}
                <AnimatePresence>
                  {showConfirmNovaSessao && (
                    <motion.div
                      className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowConfirmNovaSessao(false)}
                    >
                      <motion.div
                        className="w-full max-w-[320px] bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xl"
                        initial={{ y: 20, scale: 0.97 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 20, scale: 0.97 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: '#f0fdfa' }}
                          >
                            <SquarePen size={17} color="#0f766e" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">Nova conversa</p>
                            <p className="text-[12px] text-slate-400 dark:text-slate-500">O histórico atual será salvo.</p>
                          </div>
                        </div>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                          Você pode acessar conversas anteriores pelo histórico a qualquer momento.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowConfirmNovaSessao(false)}
                            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => { novaSessao(memoriaUsuario, dadosSistema); setShowConfirmNovaSessao(false); }}
                            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white transition-colors"
                            style={{ background: 'linear-gradient(135deg, #0f766e, #0891b2)' }}
                          >
                            Nova conversa
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

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

                {/* ════ Quick Action Chips (Design mais limpo e sutil) ════ */}
                {!isLoading && !isExecutingAction && connectionStatus === 'connected' && quickActions.length > 0 && (
                  <div className="flex gap-1.5 px-3.5 pt-2.5 pb-0 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-700/50">
                    {quickActions.map((action, i) => (
                      <motion.button
                        key={i}
                        onClick={() => {
                          setInputValue(action.prompt);
                          inputRef.current?.focus();
                        }}
                        disabled={isLoading}
                        className="shrink-0 flex items-center gap-1.25 px-3 py-1.25 text-[11.5px] font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 text-slate-600 dark:text-slate-300"
                        whileTap={{ scale: 0.97 }}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* ════ INPUT BAR UNIFICADA (Estilo Premium) ════ */}
                <div className="px-3.5 pb-3.5 pt-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700/50 shrink-0">
                  <div
                    className={`relative flex items-end w-full rounded-[24px] border transition-all ${
                      isListening
                        ? 'border-red-400 bg-red-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:bg-white'
                    }`}
                  >
                    {/* Botão Microfone Integrado */}
                    {isSupported && (
                      <div className="absolute left-1.5 bottom-1.5 z-10">
                        {isListening && (
                          <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
                        )}
                        <motion.button
                          onClick={isListening ? stopListening : startListening}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isListening
                              ? 'bg-red-500 text-white shadow-md'
                              : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                          }`}
                          whileTap={{ scale: 0.9 }}
                          disabled={isLoading || isExecutingAction}
                          aria-label={isListening ? 'Parar gravação' : 'Falar'}
                        >
                          {isListening ? (
                            <MicOff size={16} strokeWidth={2.5} className="text-white" />
                          ) : (
                            <Mic size={18} />
                          )}
                        </motion.button>
                      </div>
                    )}

                    {/* Textarea Integrado */}
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
                      className="flex-1 w-full bg-transparent border-none text-[13.5px] text-slate-700 dark:text-slate-200 outline-none resize-none placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed pt-3.5 pb-3.5 pl-12 pr-12"
                      style={{
                        minHeight: 44,
                        maxHeight: 120,
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                      }}
                    />

                    {/* Botão Enviar Integrado */}
                    <div className="absolute right-1.5 bottom-1.5 z-10">
                      <motion.button
                        onClick={() => sendMessage()}
                        disabled={
                          !inputValue.trim() ||
                          isLoading ||
                          isExecutingAction ||
                          connectionStatus !== 'connected'
                        }
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed ${
                          inputValue.trim() && !isLoading && connectionStatus === 'connected'
                            ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isLoading || isExecutingAction ? (
                          <Loader size={16} className="animate-spin text-slate-500" strokeWidth={2} />
                        ) : (
                          <ArrowDown size={18} strokeWidth={2.5} className="rotate-[-90deg]" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2 px-1 text-[10.5px] text-slate-400 dark:text-slate-500">
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