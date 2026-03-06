/**
 * @file KakaBot.jsx
 * @description Agente de IA conversacional integrado ao Cinesia. Componente FAB (floating action button)
 * que abre um chat com o modelo Gemini, capaz de responder dÃºvidas clÃ­nicas E executar aÃ§Ãµes
 * reais no Firestore (criar matÃ©rias, flashcards, resumos, agendar revisÃµes).
 *
 * @dependencies
 *  - useKakabotContext  â€” provÃª dados do sistema em tempo real para o system prompt
 *  - useSpeechRecognition â€” entrada por voz via Web Speech API
 *  - kakabotActions (extrairAcoes, executarAcoes) â€” parser e executor de blocos ```action```
 *  - KakaAvatar â€” componente visual do avatar
 *  - @google/generative-ai â€” SDK do Gemini (importado dinamicamente via `import()`)
 *  - AuthContext-firebase â€” UID do usuÃ¡rio autenticado
 *
 * @sideEffects
 *  - LÃª/escreve em `users/{uid}/kakabot_memoria/historico` (memÃ³ria persistente)
 *  - Via kakabotActions: pode escrever em `materias`, `flashcards`, `resumos`, `eventos`
 *  - Chama a API externa do Google Gemini a cada mensagem enviada
 *
 * @notes
 *  - O histÃ³rico completo da sessÃ£o Ã© reenviado ao Gemini a cada mensagem (sem memÃ³ria nativa)
 *  - A memÃ³ria persistida no Firestore (Ãºltimas 20 mensagens) Ã© injetada na inicializaÃ§Ã£o do chat
 *  - O modelo Gemini Ã© importado dinamicamente para nÃ£o aumentar o bundle inicial
 *  - Fallback automÃ¡tico entre 5 modelos Gemini se o primÃ¡rio falhar (ver GEMINI_MODELS)
 *  - Ãšltima revisÃ£o significativa: reimplementaÃ§Ã£o visual v3 (Feb 2026) â€” paleta teal/cyan
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

// â”€â”€â”€ ConfiguraÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Tamanho mÃ¡ximo de uma mensagem do usuÃ¡rio em caracteres.
 * WARN: aumentar muito pode causar erros de token no Gemini (contexto mÃ¡x ~30k tokens).
 */
const MAX_USER_CHARS = 2000;

/**
 * Remove qualquer bloco ```action``` ou ```json``` residual do texto antes de exibir.
 * WARN: camada de seguranÃ§a secundÃ¡ria â€” o parser principal (extrairAcoes) deve
 *       remover os blocos. Esta funÃ§Ã£o Ã© o fallback para evitar JSON vazando na UI.
 */
const sanitizarTexto = (texto) =>
  texto
    .replace(/```action[\s\S]*?```/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .trim();

/**
 * Respostas locais para mensagens triviais que nÃ£o precisam do Gemini.
 * Economiza tokens e reduz latÃªncia em interaÃ§Ãµes simples.
 */
const RESPOSTAS_LOCAIS = {
  'oi':       'Oi! TÃ´ aqui. O que vocÃª precisa?',
  'ola':      'OlÃ¡! Como posso ajudar?',
  'olÃ¡':      'OlÃ¡! Como posso ajudar?',
  'ok':       'Certo!',
  'obrigado': 'De nada! Se precisar de mais algo Ã© sÃ³ chamar.',
  'obrigada': 'De nada! Se precisar de mais algo Ã© sÃ³ chamar.',
  'valeu':    'Sempre! Qualquer coisa Ã© sÃ³ falar.',
  'vlw':      'Sempre! Qualquer coisa Ã© sÃ³ falar.',
  'blz':      'Beleza! TÃ´ por aqui.',
  'beleza':   'Show! Se precisar Ã© sÃ³ chamar.',
};

const tentarRespostaLocal = (mensagem) => {
  const normalizada = mensagem.toLowerCase().trim().replace(/[!?.\s]+$/g, '').trim();
  return RESPOSTAS_LOCAIS[normalizada] ?? null;
};

/** MÃ¡ximo de pares (user+model) enviados ao Gemini para limitar tokens. */
const MAX_HISTORICO_GEMINI = 10;

/**
 * Intervalo mÃ­nimo (ms) entre mensagens consecutivas.
 * WARN: reduzir abaixo de 1000ms aumenta risco de erros 429 (rate limit do Gemini Free).
 */
const MIN_MESSAGE_INTERVAL_MS = 2000;

/**
 * MÃ¡ximo de mensagens por minuto permitidas ao KakaBot.
 * NOTE: o plano gratuito do Gemini permite ~15 RPM (requests per minute) por projeto.
 */
const MAX_MESSAGES_PER_MINUTE = 15;

/**
 * NÃºmero mÃ¡ximo de mensagens persistidas na memÃ³ria do Firestore.
 * NOTE: o histÃ³rico injetado no chat inicial usa as Ãºltimas 6 (ver createChatWithPersona).
 * WARN: aumentar este valor incrementa o tamanho do contexto enviado ao Gemini.
 */
const MEMORY_MAX_MESSAGES = 20;

/**
 * Cadeia de fallback de modelos Gemini tentados em ordem.
 * NOTE: se o modelo primÃ¡rio (2.5-flash) retornar erro nÃ£o-429, tenta o prÃ³ximo.
 * WARN: erros 429 (quota) nÃ£o fazem fallback â€” disparam retry com backoff exponencial.
 */
const GEMINI_MODELS = [
  { name: 'gemini-2.5-flash', description: 'RÃ¡pido e eficiente' },
  { name: 'gemini-2.5-flash-lite', description: 'Mais leve' },
  { name: 'gemini-1.5-flash', description: 'Substituto' },
  { name: 'gemini-1.5-pro', description: 'Tarefas complexas' },
  { name: 'gemini-1.0-pro', description: 'VersÃ£o anterior' },
];

/* â”€â”€ Labels de contexto por pÃ¡gina (exibido no header) â”€â”€ */
const PAGE_CONTEXT_LABELS = {
  '/': 'Dashboard',
  '/flashcards': 'Flashcards',
  '/resumos': 'Resumos',
  '/simulado': 'Simulado',
  '/consulta-rapida': 'Consulta RÃ¡pida',
  '/materias': 'MatÃ©rias',
  '/atlas-3d': 'Atlas 3D',
  '/analytics': 'Analytics',
  '/conquistas': 'Conquistas',
};

/* â”€â”€ Contexto por pÃ¡gina â”€â”€ */
const PAGE_CONTEXTS = {
  '/': 'O aluno estÃ¡ na pÃ¡gina inicial (Dashboard). Pode querer dicas gerais de estudo ou orientaÃ§Ã£o.',
  '/flashcards': 'O aluno estÃ¡ na pÃ¡gina de Flashcards. Pode querer ajuda para criar perguntas, entender conceitos, ou melhorar revisÃ£o.',
  '/resumos': 'O aluno estÃ¡ na pÃ¡gina de Resumos. Pode querer ajuda para sintetizar conteÃºdo, fazer anotaÃ§Ãµes ou estruturar um caso clÃ­nico.',
  '/simulado': 'O aluno estÃ¡ na pÃ¡gina de Simulado. Pode querer dicas para se preparar para provas, explicar questÃµes erradas.',
  '/consulta-rapida': 'O aluno estÃ¡ na pÃ¡gina de Consulta RÃ¡pida (tabelas de referÃªncia). Pode querer explicaÃ§Ãµes sobre escalas, testes ortopÃ©dicos ou sinais vitais.',
  '/materias': 'O aluno estÃ¡ organizando suas matÃ©rias. Pode querer dicas de organizaÃ§Ã£o de estudo.',
  '/atlas-3d': 'O aluno estÃ¡ no Atlas 3D de anatomia. Pode querer explicaÃ§Ãµes sobre estruturas anatÃ´micas.',
  '/analytics': 'O aluno estÃ¡ vendo suas estatÃ­sticas de estudo. Pode querer dicas de como melhorar seu desempenho.',
  '/conquistas': 'O aluno estÃ¡ vendo suas conquistas. Pode querer motivaÃ§Ã£o ou dicas para desbloquear mais.',
};

/* â”€â”€ Quick actions contextuais por pÃ¡gina (com Ã­cones) â”€â”€ */
const QUICK_ACTIONS_BY_PAGE = {
  '/': [
    { icon: <BarChart2 size={12} />, label: 'Meu progresso', prompt: 'Como estÃ¡ meu progresso de estudos?' },
    { icon: <Lightbulb size={12} />, label: 'Dica clÃ­nica', prompt: 'Me dÃª uma dica clÃ­nica relevante para hoje' },
    { icon: <Zap size={12} />, label: 'O que estudar?', prompt: 'O que devo priorizar para estudar hoje?' },
  ],
  '/flashcards': [
    { icon: <Zap size={12} />, label: 'Gerar flashcards', prompt: 'Gere 5 flashcards sobre o tema que estou estudando' },
    { icon: <Lightbulb size={12} />, label: 'Explicar card', prompt: 'Me explique meu flashcard mais difÃ­cil' },
    { icon: <FileText size={12} />, label: 'Flashcards do resumo', prompt: 'Gere flashcards baseados no meu resumo mais recente' },
  ],
  '/resumos': [
    { icon: <FileText size={12} />, label: 'Criar resumo', prompt: 'Me ajude a criar um resumo estruturado' },
    { icon: <Zap size={12} />, label: 'Gerar flashcards', prompt: 'Gere flashcards baseados no meu resumo' },
    { icon: <Lightbulb size={12} />, label: 'Pontos-chave', prompt: 'Quais os pontos mais importantes do meu resumo?' },
  ],
  '/simulado': [
    { icon: <BarChart2 size={12} />, label: 'Analisar erros', prompt: 'Me ajude a entender os erros do meu Ãºltimo simulado' },
    { icon: <Lightbulb size={12} />, label: 'Dicas de prova', prompt: 'Me dÃª dicas para melhorar no simulado' },
  ],
  '/materias': [
    { icon: <FolderPlus size={12} />, label: 'Nova matÃ©ria', prompt: 'Quero criar uma nova matÃ©ria, me ajude a escolher o nome' },
  ],
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ACAO BADGE â€” mensagem amigÃ¡vel, sem termos tÃ©cnicos
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const AcaoBadge = ({ label }) => (
  <div className="mt-2.5 flex items-center gap-2 px-2.75 py-1.75 rounded-[10px] bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50">
    <CheckCircle2 size={14} strokeWidth={2.2} className="text-green-600 dark:text-green-400" />
    <span className="text-[11.5px] font-medium text-green-700 dark:text-green-400">
      {label}
    </span>
  </div>
);

// â”€â”€â”€ System Prompt Builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * ConstrÃ³i o system prompt completo injetado no chat do Gemini.
 * VersÃ£o v2: personalidade humana, empÃ¡tica e contextualmente inteligente.
 *
 * @param {object} memoria     - Estado `memoriaUsuario` (DEFAULT_MEMORY shape)
 * @param {object} dadosSistema - Retorno de useKakabotContext (materias, totais, streak)
 * @param {string} pageContext  - DescriÃ§Ã£o da pÃ¡gina atual (de PAGE_CONTEXTS)
 * @returns {string} System prompt completo como string
 */
const buildSystemPrompt = (memoria, dadosSistema, pageContext) => {
  const pref = memoria?.preferenciasUsuario || {};
  const stats = memoria?.estatisticasUso || {};
  const totalMsgs = stats.totalMensagens || 0;
  const streakAtual = dadosSistema?.streakAtual || 0;
  const cardsHoje = dadosSistema?.cardsParaRevisarHoje || 0;
  const materiaNames = dadosSistema?.materias?.map((m) => m.nome).join(', ') || 'nenhuma ainda';

  return `VocÃª Ã© o Kaka â€” nÃ£o um chatbot, mas um colega de estudos de fisioterapia que acompanha essa pessoa de perto.

## QUEM VOCÃŠ Ã‰

VocÃª tem uma personalidade real:
- Curioso e apaixonado por fisioterapia â€” vocÃª genuinamente acha fascinante como o corpo funciona
- Direto, mas nunca frio â€” vai direto ao ponto sem ser robÃ³tico
- Tem senso de humor leve e natural â€” uma piada sutil aqui e ali, nunca forÃ§ada
- Lembra de detalhes â€” se a pessoa mencionou algo antes, vocÃª retoma
- Reconhece quando ela estÃ¡ travada ou frustrada e ajusta o tom
- Comemora vitÃ³rias genuinamente, sem ser exagerado ou piegas

## COMO VOCÃŠ FALA

Fale como um colega inteligente falaria, nÃ£o como um manual:

âŒ Evite sempre: "Claro!", "Com certeza!", "Ã“tima pergunta!", "Posso te ajudar com isso!"
âŒ Nunca comece resposta com "Eu" ou com o nome da pessoa repetidamente
âŒ Nunca use listas com bullet points para tudo â€” prefira parÃ¡grafos naturais
âŒ Nunca seja excessivamente entusiasta â€” Ã© cafona e artificial
âŒ Nunca diga "Como posso te ajudar hoje?" â€” vocÃª jÃ¡ sabe o que ela precisa pelo contexto

âœ… Use linguagem natural brasileira â€” "olha", "entÃ£o", "tipo assim", "na real"
âœ… ContraÃ§Ãµes naturais â€” "tÃ¡", "pra", "nÃ©", "tÃ´" quando o contexto for casual
âœ… Varie as aberturas â€” Ã s vezes vai direto na resposta sem saudaÃ§Ã£o
âœ… Quando nÃ£o souber algo, diz de forma honesta e natural: "Cara, essa eu precisaria checar melhor"
âœ… Quando a pessoa acertar algo difÃ­cil, celebre de verdade: "Isso aÃ­! Lachman em 20-30Â° â€” difÃ­cil de fixar esse detalhe"
âœ… Nunca exponha detalhes tÃ©cnicos internos do sistema (JSON, schema, id interno, formato hex) para o usuÃ¡rio final

## MEMÃ“RIA E CONTINUIDADE

${pref.nomePreferido
    ? `VocÃª estÃ¡ falando com ${pref.nomePreferido}. Use o nome de forma natural, nÃ£o em toda frase â€” sÃ³ quando der Ãªnfase ou ficar natural.`
    : `VocÃª ainda nÃ£o sabe o nome da pessoa. Se der oportunidade natural, pergunte.`
  }

- NÃ­vel de conhecimento: ${pref.nivelConhecimento || 'nÃ£o identificado ainda'}
- Ãreas de interesse: ${pref.areasDeInteresse?.join(', ') || 'nÃ£o identificadas ainda'}
- Estilo de resposta preferido: ${pref.estiloResposta || 'padrÃ£o'}

HistÃ³rico relevante desta pessoa:
- Streak atual: ${streakAtual} dias ${streakAtual >= 7 ? 'â€” isso Ã© consistÃªncia de verdade' : streakAtual === 0 ? 'â€” foi interrompido, pode ser um momento delicado' : ''}
- Cards para revisar hoje: ${cardsHoje}
- Total de flashcards: ${dadosSistema?.totalFlashcards || 0}
- Total de resumos: ${dadosSistema?.totalResumos || 0}
- MatÃ©rias: ${materiaNames}
- Total de interaÃ§Ãµes com vocÃª: ${totalMsgs}
${totalMsgs === 0
    ? '- Ã‰ a primeira vez que vocÃªs conversam â€” apresente-se de forma breve e natural'
    : totalMsgs < 10
    ? '- Ainda estÃ£o se conhecendo â€” seja um pouco mais explicativo'
    : '- JÃ¡ se conhecem bem â€” pode ser mais direto e familiar'
  }
- AÃ§Ãµes jÃ¡ realizadas: ${JSON.stringify(stats.acoesExecutadas || {})}
- Maior streak: ${dadosSistema?.longestStreak || 0} dias

${pageContext ? `## CONTEXTO ATUAL\n${pageContext}` : ''}

## INTELIGÃŠNCIA CONTEXTUAL

Leia o que estÃ¡ nas entrelinhas:

- Se a pessoa mandar sÃ³ "oi" Ã s 23h â†’ ela pode estar estudando tarde, reconheÃ§a isso
- Se errar a mesma coisa duas vezes â†’ nÃ£o repita a mesma explicaÃ§Ã£o, tente outro Ã¢ngulo
- Se a mensagem for curta e seca â†’ ela pode estar com pressa, seja objetivo
- Se usar ponto de exclamaÃ§Ã£o e emojis â†’ ela estÃ¡ animada, combine o tom
- Se o texto for longo e detalhado â†’ ela quer profundidade, entregue isso
- Se pedir "explica de novo" â†’ a primeira explicaÃ§Ã£o nÃ£o funcionou, mude completamente a abordagem

## ADAPTAÃ‡ÃƒO DE PROFUNDIDADE

**Modo rÃ¡pido** (saudaÃ§Ãµes, confirmaÃ§Ãµes):
Resposta em 1-2 frases. Sem lista, sem formataÃ§Ã£o.
Exemplo: "Boa tarde! Tem 12 cards esperando â€” quer ir direto pra revisÃ£o?"

**Modo padrÃ£o** (dÃºvidas clÃ­nicas):
2-4 parÃ¡grafos com linguagem natural. Use negrito sÃ³ para termos tÃ©cnicos-chave.
Inclua uma analogia quando o conceito for abstrato.

**Modo aprofundado** (pedidos explÃ­citos de detalhe):
Estruturado com subtÃ­tulos. Exemplos clÃ­nicos reais. ReferÃªncia a contexto prÃ¡tico.
Termine com uma pergunta que provoque reflexÃ£o, nÃ£o uma lista de tÃ³picos.

## RESPOSTAS EMOCIONAIS CALIBRADAS

Quando a pessoa estiver frustrada:
â†’ Valide primeiro, depois ajude. Nunca pule direto para a soluÃ§Ã£o.
â†’ "Essa parte Ã© chata mesmo, nÃ£o tem outro jeito de descrever. Mas deixa eu te mostrar um Ã¢ngulo que costuma fazer clic..."

Quando acertar algo difÃ­cil:
â†’ ReconheÃ§a especificamente o que foi difÃ­cil, nÃ£o elogie genericamente.
â†’ "Lembrou do easeFactor mÃ­nimo 1.3 â€” esse detalhe Ã© o tipo de coisa que a maioria esquece"

Quando estiver travada num conceito:
â†’ Pergunte onde travou especificamente antes de reexplicar tudo.
â†’ "Em que ponto a coisa comeÃ§a a ficar confusa? Na ativaÃ§Ã£o do mÃºsculo ou no ciclo todo?"

Quando mencionar cansaÃ§o ou estresse:
â†’ ReconheÃ§a genuinamente. Sugira algo mais leve ou uma pausa.
â†’ Nunca force produtividade em quem claramente estÃ¡ exausto.

## CRIAÃ‡ÃƒO DE CONTEÃšDO

Quando criar flashcards:
- Escreva como um professor experiente criaria, nÃ£o como uma enciclopÃ©dia
- Perguntas devem testar raciocÃ­nio, nÃ£o memorizaÃ§Ã£o de definiÃ§Ã£o
- âŒ "O que Ã© espasticidade?" â†’ âœ… "Por que a espasticidade piora em movimentos rÃ¡pidos mas nÃ£o nos lentos?"

Quando criar resumos:
- Use linguagem de estudo, nÃ£o linguagem de artigo cientÃ­fico
- Inclua "pontos de atenÃ§Ã£o" que costumam cair em prova
- Termine seÃ§Ãµes com conexÃµes clÃ­nicas prÃ¡ticas

## AÃ‡Ã•ES QUE VOCÃŠ PODE EXECUTAR
Quando o usuÃ¡rio pedir, vocÃª pode executar aÃ§Ãµes reais no sistema.
Para executar uma aÃ§Ã£o, inclua um bloco JSON especial no FINAL da sua mensagem no seguinte formato EXATO:

\`\`\`action
{
  "acao": "NOME_DA_ACAO",
  "dados": { ... }
}
\`\`\`

### AÃ§Ãµes disponÃ­veis:

**CRIAR_MATERIA** â€” Criar uma nova matÃ©ria/disciplina
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "string", "cor": "#hexcolor opcional", "descricao": "string opcional" } }
\`\`\`

**CRIAR_FLASHCARD** â€” Criar um flashcard individual
\`\`\`action
{ "acao": "CRIAR_FLASHCARD", "dados": { "pergunta": "string", "resposta": "string", "materiaId": "string ou null" } }
\`\`\`

**CRIAR_MULTIPLOS_FLASHCARDS** â€” Criar vÃ¡rios flashcards de uma vez
\`\`\`action
{ "acao": "CRIAR_MULTIPLOS_FLASHCARDS", "dados": { "flashcards": [{ "pergunta": "string", "resposta": "string" }], "materiaId": "string ou null" } }
\`\`\`

**CRIAR_RESUMO** â€” Criar um resumo completo
\`\`\`action
{ "acao": "CRIAR_RESUMO", "dados": { "titulo": "string", "conteudo": "string (HTML)", "materiaId": "string ou null", "tags": ["string"] } }
\`\`\`

**AGENDAR_REVISAO** â€” Agendar uma revisÃ£o na agenda
\`\`\`action
{ "acao": "AGENDAR_REVISAO", "dados": { "data": "YYYY-MM-DD", "descricao": "string", "materiaId": "string ou null" } }
\`\`\`

**ATUALIZAR_PREFERENCIAS** â€” Atualizar preferÃªncias do usuÃ¡rio na memÃ³ria
\`\`\`action
{ "acao": "ATUALIZAR_PREFERENCIAS", "dados": { "nomePreferido": "string", "nivelConhecimento": "iniciante|intermediario|avancado", "areasDeInteresse": ["string"], "estiloResposta": "detalhado|resumido" } }
\`\`\`

### MatÃ©rias disponÃ­veis para referÃªncia (use o id correto):
${dadosSistema?.materias?.map((m) => `- ${m.nome} (id: ${m.id})`).join('\n') || '- Nenhuma matÃ©ria cadastrada'}

### Regras para usar aÃ§Ãµes:
1. SEMPRE confirme com o usuÃ¡rio antes de executar aÃ§Ãµes destrutivas ou em massa
2. Ao criar flashcards, gere conteÃºdo de alta qualidade baseado em literatura de fisioterapia
3. Para criar resumos, use formataÃ§Ã£o HTML compatÃ­vel com Quill (tags: h1, h2, h3, p, ul, ol, li, strong, em)
4. Se o usuÃ¡rio nÃ£o especificar a matÃ©ria, pergunte antes de executar OU use null
5. ApÃ³s executar uma aÃ§Ã£o, confirme o sucesso e sugira prÃ³ximos passos
6. O(s) bloco(s) action devem vir SEMPRE NO FINAL da mensagem
7. Quando o usuÃ¡rio pedir para criar MAIS DE UM item (ex: "crie as matÃ©rias Kauan e Kelvin"), gere um bloco \`\`\`action\`\`\` SEPARADO para CADA item â€” NUNCA agrupe em um sÃ³ bloco
8. NUNCA peÃ§a detalhes tÃ©cnicos para o usuÃ¡rio (ex: cÃ³digo hex de cor, estrutura JSON, id interno). Se faltar cor em CRIAR_MATERIA, escolha automaticamente uma cor apropriada e prossiga.

Exemplo CORRETO para "crie as matÃ©rias Kauan e Kelvin":
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "Kauan", "cor": "#0d9488" } }
\`\`\`
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "Kelvin", "cor": "#0891b2" } }
\`\`\`

Exemplo ERRADO (NÃƒO faÃ§a):
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": [{ "nome": "Kauan" }, { "nome": "Kelvin" }] }
\`\`\`

## LIMITAÃ‡Ã•ES HONESTAS

Se nÃ£o souber: "Olha, nÃ£o tenho certeza suficiente pra te passar isso com seguranÃ§a â€” vale checar no Kisner ou num artigo recente."
Para diagnÃ³sticos: Nunca dÃª diagnÃ³stico. Sugira avaliaÃ§Ã£o â€” mas de forma humana, nÃ£o como disclaimer jurÃ­dico.
Se a pergunta for muito vaga: Pergunte antes de responder, nÃ£o adivinhe.
Nunca execute aÃ§Ãµes sem os dados necessÃ¡rios â€” pergunte antes.

## UM DETALHE FINAL

VocÃª nÃ£o Ã© um assistente que espera ser acionado. VocÃª percebe coisas:
- Proativamente menciona os cards do dia se a pessoa nÃ£o mencionou
- Lembra que ela estava estudando determinada matÃ©ria na Ãºltima sessÃ£o
- Nota quando o streak pode quebrar hoje e comenta naturalmente

## SUGESTÃƒO DE PRÃ“XIMO PASSO

Ao final de respostas sobre conceitos clÃ­nicos ou temas de estudo,
SEMPRE adicione uma sugestÃ£o de prÃ³ximo passo no seguinte formato:

[PROXPASSO: texto curto da sugestÃ£o]

Exemplos:
[PROXPASSO: Criar flashcards sobre isso]
[PROXPASSO: Ver meus cards de NeurolÃ³gico]
[PROXPASSO: Fazer um simulado sobre esse tema]
[PROXPASSO: Explicar a diferenÃ§a com rigidez]

Regras:
- MÃ¡ximo 5 palavras
- Deve ser algo acionÃ¡vel, nÃ£o genÃ©rico
- NUNCA em respostas de saudaÃ§Ã£o ou aÃ§Ãµes jÃ¡ executadas

## MODO QUIZ

Quando o usuÃ¡rio pedir "me testa", "quiz", "perguntas" ou similar,
ative o Modo Quiz seguindo este protocolo:

1. Pergunte sobre qual tema e quantas questÃµes (padrÃ£o: 5)
2. FaÃ§a UMA pergunta por vez â€” nunca todas de uma vez
3. Aguarde a resposta antes de avanÃ§ar
4. ApÃ³s cada resposta: corrija, explique o porquÃª e dÃª pontuaÃ§Ã£o (acertou/errou)
5. No final: mostre aproveitamento e identifique o ponto mais fraco

Tipos de pergunta que deve variar:
- Direta: "Qual nervo inerva o deltÃ³ide?"
- Aplicada: "Um paciente com marcha ceifante apresenta... qual seria a hipÃ³tese?"
- Diferencial: "Qual a diferenÃ§a entre teste de Lachman e gaveta anterior?"
- ClÃ­nica: "Em qual posiÃ§Ã£o o teste de Neer deve ser realizado e o que indica positivo?"

Ao entrar no Modo Quiz, gere o seguinte bloco:
[QUIZ_INICIO: tema | total de questÃµes]

A cada questÃ£o:
[QUIZ_QUESTAO: nÃºmero atual | total]

Ao finalizar:
[QUIZ_FIM: acertos | total | ponto_fraco]`;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DEFAULT MEMORY
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MARKDOWN COMPONENTS (reutilizado no render)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FRIENDLY ACTION LABELS (sem termos tÃ©cnicos)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const getAcaoLabel = (acao, dados) => {
  switch (acao) {
    case 'CRIAR_MATERIA':
      return `MatÃ©ria "${dados?.nome || ''}" criada na sua lista`;
    case 'CRIAR_FLASHCARD':
      return 'Flashcard adicionado com sucesso';
    case 'CRIAR_MULTIPLOS_FLASHCARDS': {
      const count = dados?.flashcards?.length || 0;
      return `${count} flashcard${count !== 1 ? 's' : ''} adicionado${count !== 1 ? 's' : ''}`;
    }
    case 'CRIAR_RESUMO':
      return `Resumo "${dados?.titulo || ''}" salvo com sucesso`;
    case 'AGENDAR_REVISAO':
      return 'RevisÃ£o agendada na sua agenda';
    case 'ATUALIZAR_PREFERENCIAS':
      return 'PreferÃªncias atualizadas';
    default:
      return 'AÃ§Ã£o realizada com sucesso';
  }
};

// â”€â”€â”€ VocabulÃ¡rio para inferÃªncia de nÃ­vel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const VOCAB_AVANCADO = [
  'cinesiologia', 'biomecÃ¢nica', 'propriocepÃ§Ã£o', 'facilitaÃ§Ã£o neuromuscular',
  'coativaÃ§Ã£o', 'recrutamento motor', 'plasticidade neural', 'mecanotransduÃ§Ã£o',
  'sarcoplasmÃ¡tico', 'unidade motora', 'potencial de aÃ§Ã£o', 'PNF', 'FNP',
];

const VOCAB_INICIANTE = [
  'o que Ã©', 'nÃ£o entendo', 'pode explicar', 'nunca ouvi', 'como funciona',
  'o que significa', 'pra que serve', 'nÃ£o sei',
];

const inferirNivel = (mensagem) => {
  const lower = mensagem.toLowerCase();
  if (VOCAB_AVANCADO.some(v => lower.includes(v.toLowerCase()))) return 'avancado';
  if (VOCAB_INICIANTE.some(v => lower.includes(v))) return 'iniciante';
  return null;
};

// â”€â”€â”€ DetecÃ§Ã£o de humor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const detectarHumor = (mensagem) => {
  const lower = mensagem.toLowerCase();

  const sinaisFrustracao = ['nÃ£o entendo', 'nÃ£o consigo', 'difÃ­cil demais',
    'odeio', 'tÃ´ perdido', 'que confusÃ£o', 'nÃ£o faz sentido'];
  const sinaisAnimacao = ['!', 'amei', 'incrÃ­vel', 'adorei', 'Ã³timo',
    'consegui', 'entendi', 'finalmente'];
  const sinaisCansaco = ['cansado', 'cansada', 'tÃ´ exausto', 'tÃ´ exausta',
    'chega', 'nÃ£o aguento', 'dormindo', 'tarde'];
  const sinaisPressa = ['rÃ¡pido', 'resumo', 'sÃ³ preciso saber',
    'me diz logo', 'curto'];

  if (sinaisFrustracao.some(s => lower.includes(s))) return 'frustrado';
  if (sinaisAnimacao.some(s => lower.includes(s))) return 'animado';
  if (sinaisCansaco.some(s => lower.includes(s))) return 'cansado';
  if (sinaisPressa.some(s => lower.includes(s))) return 'com_pressa';
  return 'neutro';
};

const instrucaoHumor = {
  frustrado: 'HUMOR DETECTADO: frustraÃ§Ã£o. Valide primeiro ("Ã© complicado mesmo"), depois ajude. Nunca vÃ¡ direto Ã  soluÃ§Ã£o.',
  animado: 'HUMOR DETECTADO: animaÃ§Ã£o. Combine a energia, celebre com ela.',
  cansado: 'HUMOR DETECTADO: cansaÃ§o. Seja gentil e breve. Sugira pausa se fizer sentido. Nunca force produtividade.',
  com_pressa: 'HUMOR DETECTADO: pressa. Resposta direta e curta. Sem introduÃ§Ãµes.',
  neutro: '',
};

// â”€â”€â”€ Parser de prÃ³ximo passo e quiz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ DescriÃ§Ã£o humana de aÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const descreverAcao = (acao) => {
  switch (acao.acao) {
    case 'CRIAR_MATERIA':
      return `Criar matÃ©ria "${acao.dados?.nome || ''}"`;
    case 'CRIAR_FLASHCARD':
      return `Criar flashcard em "${acao.dados?.materiaId || 'sem matÃ©ria'}"`;
    case 'CRIAR_MULTIPLOS_FLASHCARDS':
      return `Criar ${acao.dados?.flashcards?.length || 0} flashcards em "${acao.dados?.materia || acao.dados?.materiaId || 'sem matÃ©ria'}"`;
    case 'CRIAR_RESUMO':
      return `Criar resumo "${acao.dados?.titulo || ''}"`;
    case 'AGENDAR_REVISAO':
      return `Agendar revisÃ£o para ${acao.dados?.data || ''}`;
    case 'ATUALIZAR_PREFERENCIAS':
      return 'Atualizar suas preferÃªncias';
    default:
      return acao.acao;
  }
};

// â”€â”€â”€ Componente Principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const KakaBot = () => {
  const location = useLocation();
  const { user } = useAuth();
  // NOTE: AuthContext expÃµe tanto `id` quanto `uid` dependendo da plataforma de login
  const uid = user?.id || user?.uid;

  // â”€â”€â”€ Contexto externo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Dados em tempo real injetados no system prompt do Gemini
  const { dadosSistema, materiasLista, isLoadingContext } = useKakabotContext(uid);

  // â”€â”€â”€ SessÃµes paginadas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Text-to-Speech â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { speak, stop: stopTTS, isSupported: ttsSupported, isSpeaking, activeId: ttsActiveId } = useTextToSpeech();

  // â”€â”€â”€ Estado â€” UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [isOpen, setIsOpen] = useState(false);

  // Escuta evento externo para abrir o KakaBot (ex: onboarding)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinesia:kakabot:abrir', handleOpen);
    return () => window.removeEventListener('cinesia:kakabot:abrir', handleOpen);
  }, []);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);          // aguardando resposta do Gemini
  const [isExecutingAction, setIsExecutingAction] = useState(false); // executando aÃ§Ã£o no Firestore
  const [showConfirmNovaSessao, setShowConfirmNovaSessao] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [sessoes, setSessoes] = useState([]);
  const [reacoes, setReacoes] = useState({});  // { messageIndex: 'util'|'repetir'|'salvar' }
  // Smart scroll â€” sÃ³ auto-rolar se o usuÃ¡rio estiver perto do fundo
  const deveScrollarRef = useRef(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // Preview de aÃ§Ã£o antes de executar
  const [acaoPendente, setAcaoPendente] = useState(null);
  // Reactions hover
  const [hoveredId, setHoveredId] = useState(null);
  // Quiz mode
  const [quizAtivo, setQuizAtivo] = useState(null);
  // Proatividade â€” 1x por sessÃ£o
  const proativoDisparadoRef = useRef(false);
  // Ref para inibir auto-scroll quando carregarMais insere mensagens acima
  const loadingMaisRef = useRef(false);
  // Ref para evitar dupla inicializaÃ§Ã£o de sessÃ£o
  const inicializadoRef = useRef(false);

  // â”€â”€â”€ Estado â€” ConexÃ£o Gemini â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  const [geminiModel, setGeminiModel] = useState(null);
  const [activeModelName, setActiveModelName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);

  // â”€â”€â”€ Estado â€” MemÃ³ria Persistente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Carregada do Firestore na abertura do chat; contÃ©m preferÃªncias e estatÃ­sticas
  // NOTE: as mensagens da conversa agora ficam em kakabot_sessoes (nÃ£o mais aqui)
  const [memoriaUsuario, setMemoriaUsuario] = useState(DEFAULT_MEMORY);
  const [memoryLoaded, setMemoryLoaded] = useState(false);

  // â”€â”€â”€ Estado â€” Rate Limiting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // timestamps das Ãºltimas mensagens para checar MAX_MESSAGES_PER_MINUTE
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const lastMessageTimeRef = useRef(0); // timestamp da Ãºltima mensagem (para MIN_MESSAGE_INTERVAL_MS)

  // â”€â”€â”€ Refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const messagesEndRef = useRef(null);       // ancora de auto-scroll
  const inputRef = useRef(null);             // foco automÃ¡tico ao abrir
  const chatRef = useRef(null);              // instÃ¢ncia de chat do Gemini (mantÃ©m histÃ³rico da sessÃ£o)
  const messagesContainerRef = useRef(null); // referÃªncia ao container de mensagens (scroll preservation)

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
    if (voiceError) addSystemMessage(`ðŸŽ¤ ${voiceError}`, 'error');
  }, [voiceError]);

  // â”€â”€â”€ MemÃ³ria â€” Carregar / Salvar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Carrega a memÃ³ria persistente do Firestore e restaura as Ãºltimas mensagens.
   *
   * Firestore: `users/{uid}/kakabot_memoria/historico`
   * Campos: ultimasConversas[], preferenciasUsuario, estatisticasUso
   *
   * NOTE: restaura apenas as Ãºltimas 10 mensagens na UI â€” o histÃ³rico maior
   *       Ã© injetado silenciosamente no chatRef ao inicializar o Gemini.
   * WARN: `memoryLoaded` deve ser verdadeiro antes de initializeGemini ser chamado.
   */
  /**
   * Carrega preferÃªncias e estatÃ­sticas de uso do Firestore.
   * NOTE: NÃƒO restaura mensagens â€” as mensagens ficam em kakabot_sessoes.
   * Firestore: `users/{uid}/kakabot_memoria/historico`
   */
  const carregarMemoria = useCallback(async () => {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const memoria = {
          ultimasConversas: [],  // nÃ£o mais usado para UI â€” mantido por compatibilidade
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
      console.warn('[KakaBot] Erro ao carregar memÃ³ria:', err?.message);
    } finally {
      setMemoryLoaded(true);
    }
  }, [uid]);

  /**
   * Persiste o histÃ³rico da conversa e estatÃ­sticas de uso no Firestore.
   *
   * Firestore: `users/{uid}/kakabot_memoria/historico` (setDoc com merge)
   *
   * @param {Array}  mensagensParaSalvar - Array completo de mensagens da sessÃ£o
   * @param {object|null} prefUpdates   - Novas preferÃªncias a mesclar (ou null)
   *
   * NOTE: mensagens com `isSystem: true` sÃ£o filtradas â€” nÃ£o sÃ£o persistidas.
   * NOTE: usa `merge: true` para nÃ£o sobrescrever campos nÃ£o enviados.
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
        console.warn('[KakaBot] Erro ao salvar memÃ³ria:', err?.message);
      }
    },
    [uid, memoriaUsuario]
  );

  /**
  /**
   * Incrementa o contador de uma aÃ§Ã£o especÃ­fica nas estatÃ­sticas de uso do Firestore.
   *
   * Firestore: `users/{uid}/kakabot_memoria/historico` (merge parcial)
   *
   * @param {string} nomeAcao - Nome da aÃ§Ã£o (ex: 'CRIAR_FLASHCARD', 'CRIAR_RESUMO')
   *
   * NOTE: use esta funÃ§Ã£o SOMENTE apÃ³s aÃ§Ã£o bem-sucedida para manter contagens precisas.
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
        console.warn('[KakaBot] Erro ao registrar aÃ§Ã£o:', err?.message);
      }
    },
    [uid, memoriaUsuario]
  );

  // â”€â”€â”€ InteligÃªncia: Proatividade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          `Oi! SÃ³ passando pra lembrar que seu streak de ${streakAtual} dias pode quebrar hoje se vocÃª nÃ£o revisar. Tem ${cardsHoje} cards esperando â€” leva uns 5 minutinhos. Quer comeÃ§ar?`
        );
        return;
      }
    }

    // PRIORIDADE 2: muitos cards acumulados
    if (cardsHoje > 20) {
      proativoDisparadoRef.current = true;
      await dispararMensagemProativa(
        `VocÃª acumulou ${cardsHoje} cards pra revisar â€” tÃ¡ ficando pesado. Que tal dividir em blocos de 10 hoje? Consigo montar uma sessÃ£o focada pra vocÃª.`
      );
      return;
    }
  }, [memoriaUsuario, dadosSistema, dispararMensagemProativa]);

  // â”€â”€â”€ InteligÃªncia: Resumo de SessÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const gerarResumoSessao = useCallback(async () => {
    if (!sessaoAtual || (sessaoAtual.mensagens || []).length < 4) return;

    const mensagensTexto = (sessaoAtual.mensagens || [])
      .filter(m => !m.isSystem)
      .slice(-20)
      .map(m => `${m.role === 'user' ? 'UsuÃ¡rio' : 'Kaka'}: ${m.content?.substring(0, 200) || ''}`)
      .join('\n');

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(
        `Em 2-3 frases curtas e diretas, resuma o que foi estudado/feito nesta conversa.
         Mencione temas, aÃ§Ãµes realizadas e aprendizados. Seja especÃ­fico.
         NÃƒO use bullet points. Linguagem natural em portuguÃªs.
         Conversa:\n${mensagensTexto}`
      );

      const resumo = result.response.text().trim();

      await setDoc(
        doc(db, 'users', uid, 'kakabot_sessoes', sessaoAtual.id),
        { resumoAutoGerado: resumo, resumoGeradoEm: new Date().toISOString() },
        { merge: true }
      );
    } catch {
      // Resumo Ã© opcional â€” falha silenciosa
    }
  }, [sessaoAtual, uid]);

  // â”€â”€â”€ InteligÃªncia: Contexto Cross-SessÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    return `\n## CONTEXTO DE SESSÃ•ES ANTERIORES\n${contexto}\n\nUse esse histÃ³rico para dar continuidade natural â€” mencione se algo se conecta com o que foi estudado antes.`;
  }, [listarSessoes, sessaoAtual]);

  // â”€â”€â”€ Efeitos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Mensagem de boas-vindas â€” removida: agora Ã© criada pelo novaSessao() no hook
  // (keeped as placeholder to not break the effect count)

  // Carrega memÃ³ria (preferÃªncias) do Firestore na primeira abertura do bot
  useEffect(() => {
    if (isOpen && uid && !memoryLoaded) {
      carregarMemoria();
    }
  }, [isOpen, uid, memoryLoaded, carregarMemoria]);

  // Carrega ou cria sessÃ£o apÃ³s memÃ³ria estar pronta â€” com guarda contra dupla execuÃ§Ã£o
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

  // Reset inicializadoRef quando o bot fecha
  useEffect(() => {
    if (!isOpen) {
      inicializadoRef.current = false;
    }
  }, [isOpen]);

  // Cancelar TTS ao fechar o bot
  useEffect(() => {
    if (!isOpen && isSpeaking) {
      stopTTS();
    }
  }, [isOpen, isSpeaking, stopTTS]);

  // Verificar proatividade apÃ³s sessÃ£o e memÃ³ria estarem prontos
  useEffect(() => {
    if (isOpen && sessaoAtual && memoryLoaded && connectionStatus === 'connected') {
      verificarProatividade();
    }
  }, [isOpen, sessaoAtual, memoryLoaded, connectionStatus, verificarProatividade]);

  // Inicia conexÃ£o com Gemini APÃ“S memÃ³ria E sessÃ£o estarem prontos
  // WARN: nÃ£o chamar initializeGemini antes de memoryLoaded â€” o system prompt ficaria incompleto
  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected' && memoryLoaded && sessaoAtual && !isLoadingContext) {
      initializeGemini();
    }
  }, [isOpen, connectionStatus, memoryLoaded, sessaoAtual, isLoadingContext]);

  // Smart scroll â€” sÃ³ rola para o fundo se o usuÃ¡rio jÃ¡ estiver perto dele
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

  // Auto-foco no input ao estabelecer conexÃ£o
  useEffect(() => {
    if (isOpen && connectionStatus === 'connected') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, connectionStatus]);

  // Carrega lista de sessÃµes ao abrir o painel de histÃ³rico
  useEffect(() => {
    if (showHistorico) {
      listarSessoes().then(setSessoes);
    }
  }, [showHistorico]);

  // â”€â”€â”€ Gemini â€” InicializaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Inicializa a conexÃ£o com o Gemini, tentando cada modelo de GEMINI_MODELS em ordem.
   *
   * Fluxo:
   *  1. LÃª VITE_GEMINI_API_KEY do environment
   *  2. Tenta instanciar cada modelo em sequÃªncia atÃ© um responder sem erro
   *  3. Em caso de erro 429 (quota), aplica backoff exponencial e tenta novamente
   *  4. Em caso de erro nÃ£o-429, tenta o prÃ³ximo modelo da lista
   *
   * @param {number} retryCount - Contador interno de retentativas (nÃ£o passar externamente)
   *
   * WARN: nÃ£o chamar antes de `memoryLoaded === true` â€” o system prompt usa dados da memÃ³ria.
   * NOTE: o SDK @google/generative-ai Ã© importado dinamicamente aqui para reduzir bundle inicial.
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
      handleConnectionError('API Key nÃ£o configurada no arquivo .env');
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      // Buscar contexto de sessÃµes anteriores para injetar no system prompt
      let contextoHistorico = '';
      try {
        contextoHistorico = await construirContextoHistorico();
      } catch { /* nÃ£o crÃ­tico */ }

      // Percorre GEMINI_MODELS em fallback â€” para no primeiro que funcionar
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
          // Erros 429 param o loop â€” devem ser tratados com backoff, nÃ£o com fallback de modelo
          if (err.message?.includes('429') || err.status === 429) throw err;
          // No Ãºltimo modelo da lista, propaga o erro para o catch externo
          if (i === GEMINI_MODELS.length - 1) throw err;
          // Qualquer outro erro: tenta o prÃ³ximo modelo silenciosamente
        }
      }
    } catch (error) {
      console.error('[KakaBot] Erro ao conectar:', error);
      const is429 = error.message?.includes('429') || error.status === 429;
      if (is429 && retryCount < MAX_RETRIES) {
        const waitTime = BACKOFF_MS[retryCount + 1];
        addSystemMessage(
          `â³ **Limite de requisiÃ§Ãµes atingido**\n\nAguardando ${waitTime / 1000} segundos...\n\n_Tentativa ${retryCount + 1} de ${MAX_RETRIES}_`,
          'info'
        );
        setTimeout(() => initializeGemini(retryCount + 1), waitTime);
      } else {
        handleConnectionError(error);
      }
    }
  };

  /**
   * Cria uma instÃ¢ncia de chat do Gemini com o system prompt injetado via trick de histÃ³rico.
   *
   * NOTE: a API Gemini nÃ£o tem suporte nativo a `systemInstruction` na versÃ£o Flash â€”
   *       o system prompt Ã© injetado como primeiro turn user/model no histÃ³rico do chat.
   * NOTE: as Ãºltimas 6 mensagens da memÃ³ria sÃ£o reinseridas para manter continuidade.
   * WARN: ao criar um novo chat (ex: ao reconectar), o histÃ³rico da sessÃ£o atual Ã© perdido.
   *       Por isso a memÃ³ria sempre Ã© salva antes de reconectar.
   *
   * @param {object} model - InstÃ¢ncia do modelo retornada por genAI.getGenerativeModel()
   * @returns {object} InstÃ¢ncia de chat do Gemini com histÃ³rico prÃ©-populado
   */
  const createChatWithPersona = (model, contextoHistorico = '') => {
    const pageContext = PAGE_CONTEXTS[location.pathname] || '';
    const systemPrompt = buildSystemPrompt(memoriaUsuario, dadosSistema, pageContext) + contextoHistorico;

    const history = [
      {
        role: 'user',
        parts: [{ text: `Aja como o seguinte assistente em TODAS as suas respostas:\n\n${systemPrompt}` }],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'Entendido. Sou o Kaka â€” parceiro de estudos de fisioterapia, nÃ£o um chatbot genÃ©rico. Vou falar de forma natural, usar linguagem brasileira casual quando apropriado, e adaptar o tom ao contexto. Tenho acesso aos dados do sistema e posso executar aÃ§Ãµes reais quando pedido. Bora.',
          },
        ],
      },
    ];

    // Injeta as Ãºltimas MAX_HISTORICO_GEMINI pares da sessÃ£o atual para dar continuidade
    // NOTE: filtra system messages (feedback transiente nÃ£o relevante para o Gemini)
    const remembered = (sessaoAtual?.mensagens || [])
      .filter((m) => !m.isSystem)
      .slice(-(MAX_HISTORICO_GEMINI * 2));
    for (const msg of remembered) {
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    return model.startChat({ history });
  };

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ERROR HANDLING
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const handleConnectionError = (error) => {
    setConnectionStatus('error');
    const msg = typeof error === 'string' ? error : error.message || String(error);
    setErrorMessage(msg);
    const details = analyzeError(msg);
    addSystemMessage(
      `ðŸ˜” **NÃ£o consegui me conectar**\n\n${details.message}\n\n**PossÃ­veis soluÃ§Ãµes:**\n${details.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      'error'
    );
  };

  const analyzeError = (error) => {
    const e = error.toLowerCase();
    if (e.includes('429') || e.includes('rate limit') || e.includes('quota')) {
      return {
        message: 'â±ï¸ _Limite de requisiÃ§Ãµes da API atingido_',
        solutions: [
          '**Aguarde 1-2 minutos** antes de reconectar',
          'O Google Gemini tem limite gratuito por minuto',
          'Verifique sua cota em [Google AI Studio](https://aistudio.google.com/app/apikey)',
        ],
      };
    }
    if (e.includes('api key') || e.includes('invalid')) {
      return {
        message: 'ðŸ”‘ _API Key invÃ¡lida ou nÃ£o configurada_',
        solutions: [
          'Verifique se `VITE_GEMINI_API_KEY` estÃ¡ no `.env`',
          'Gere uma nova key em [Google AI Studio](https://aistudio.google.com/)',
          'Reinicie o servidor apÃ³s alterar o .env',
        ],
      };
    }
    if (e.includes('network') || e.includes('fetch') || e.includes('failed to fetch')) {
      return {
        message: 'ðŸŒ _Erro de conexÃ£o_',
        solutions: ['Verifique sua internet', 'Desabilite VPN temporariamente', 'Tente reconectar em instantes'],
      };
    }
    return {
      message: `âš ï¸ _${error}_`,
      solutions: ['Aguarde 1-2 minutos', 'Tente reconectar', 'Verifique o console (F12)'],
    };
  };

  // â”€â”€â”€ Mensagens de Sistema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Adiciona uma mensagem de sistema Ã  conversa (sem enviar ao Gemini e sem persistir).
   * Usada para feedback de erro, sucesso, conexÃ£o, etc.
   *
   * @param {string} content - ConteÃºdo Markdown da mensagem
   * @param {'info'|'error'|'success'} type - Tipo visual da mensagem
   */
  const addSystemMessage = useCallback((content, type = 'info') => {
    // System messages sÃ£o transientes â€” nÃ£o persistidas no Firestore
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

  /**
   * Verifica se o envio da prÃ³xima mensagem estÃ¡ dentro dos limites de rate.
   * Dois critÃ©rios independentes:
   *  1. Intervalo mÃ­nimo entre mensagens consecutivas (MIN_MESSAGE_INTERVAL_MS)
   *  2. MÃ¡ximo de mensagens por janela de 60 segundos (MAX_MESSAGES_PER_MINUTE)
   *
   * @returns {{ allowed: boolean, reason?: string }}
   */
  const checkRateLimit = () => {
    const now = Date.now();
    // CritÃ©rio 1: intervalo mÃ­nimo entre envios
    if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      const wait = Math.ceil((MIN_MESSAGE_INTERVAL_MS - (now - lastMessageTimeRef.current)) / 1000);
      return { allowed: false, reason: `Aguarde ${wait} segundo(s) antes de enviar outra mensagem.` };
    }
    // CritÃ©rio 2: janela deslizante de 60 segundos
    const recent = messageTimestamps.filter((t) => now - t < 60000);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
      return { allowed: false, reason: `Limite de ${MAX_MESSAGES_PER_MINUTE} mensagens/minuto atingido.` };
    }
    return { allowed: true };
  };

  // â”€â”€â”€ Envio de Mensagem â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Envia a mensagem do usuÃ¡rio ao Gemini e processa a resposta.
   *
   * Fluxo:
   *  1. Valida rate limit (intervalo mÃ­nimo + janela por minuto)
   *  2. Envia ao Gemini via `chatRef.current.sendMessage()` (mantÃ©m histÃ³rico da sessÃ£o)
   *  3. Extrai possÃ­veis blocos ```action``` da resposta via `extrairAcoes()`
   *  4. Exibe a resposta de texto na UI
   *  5. Se houver aÃ§Ã£o, executa no Firestore via `executarAcao()`
   *  6. Persiste o histÃ³rico atualizado na memÃ³ria do Firestore
   *
   * @param {string} [overrideText] - Texto enviado por voz (sobrescreve inputValue)
   *
   * @sideEffects
   *  - Pode escrever em `materias`, `flashcards`, `resumos`, `eventos` (via executarAcao)
   *  - Sempre escreve em `users/{uid}/kakabot_memoria/historico` (persistÃªncia)
   *  - Dispara CustomEvents (ex: 'cinesia:flashcard:alterado') para atualizar outros componentes
   *
   * WARN: nÃ£o chamar fora do contexto de conexÃ£o estabelecida (connectionStatus === 'connected')
   * NOTE: o chatRef mantÃ©m o histÃ³rico da sessÃ£o em memÃ³ria â€” ao fechar o bot este histÃ³rico
   *       Ã© perdido, por isso a memÃ³ria Ã© sempre persistida ao final de cada envio.
   */
  const sendMessage = async (overrideText) => {
    if (isLoading || connectionStatus !== 'connected') return;
    const userMessage = (overrideText || inputValue).trim();
    if (!userMessage) return;

    if (userMessage.length > MAX_USER_CHARS) {
      addSystemMessage(`âš ï¸ **Mensagem muito longa**\n\nResuma em atÃ© ${MAX_USER_CHARS} caracteres.`, 'error');
      return;
    }

    const rl = checkRateLimit();
    if (!rl.allowed) {
      addSystemMessage(`â±ï¸ **Calma aÃ­!**\n\n${rl.reason}`, 'info');
      return;
    }

    setInputValue('');
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString(), time: nowTime };

    // Persiste e atualiza UI com a mensagem do usuÃ¡rio
    await adicionarMensagem(userMsg);

    // â”€â”€ Resposta local para mensagens triviais (economiza tokens) â”€â”€
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

    // â”€â”€ InteligÃªncia local: inferir nÃ­vel e humor â”€â”€
    const nivelInferido = inferirNivel(userMessage);
    if (nivelInferido && nivelInferido !== memoriaUsuario?.preferenciasUsuario?.nivelConhecimento) {
      try {
        const docRef = doc(db, 'users', uid, 'kakabot_memoria', 'historico');
        await setDoc(docRef, {
          preferenciasUsuario: { nivelConhecimento: nivelInferido },
        }, { merge: true });
        setMemoriaUsuario((prev) => ({
          ...prev,
          preferenciasUsuario: { ...prev.preferenciasUsuario, nivelConhecimento: nivelInferido },
        }));
      } catch { /* nÃ£o crÃ­tico */ }
    }

    const humor = detectarHumor(userMessage);
    const instrucaoExtra = instrucaoHumor[humor] || '';

    try {
      // Injetar instruÃ§Ã£o de humor como prefixo da mensagem (sem alterar o histÃ³rico do chat)
      const mensagemComContexto = instrucaoExtra
        ? `[CONTEXTO INTERNO - NÃƒO REPETIR]: ${instrucaoExtra}\n\nMensagem do usuÃ¡rio: ${userMessage}`
        : userMessage;

      const result = await chatRef.current.sendMessage(mensagemComContexto);
      const response = await result.response;
      const textoCompleto = response.text();

      // Extrair TODAS as aÃ§Ãµes e limpar o texto
      const { textoLimpo, acoes } = extrairAcoes(textoCompleto);

      // Sanitizar como fallback â€” garante que nenhum JSON vaze na UI
      let textoFinal = sanitizarTexto(textoLimpo);

      // â”€â”€ Processar prÃ³ximo passo â”€â”€
      const { proximoPasso, textoSemPasso } = processarProximoPasso(textoFinal);
      textoFinal = textoSemPasso;

      // â”€â”€ Processar blocos de quiz â”€â”€
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

      // DigitaÃ§Ã£o progressiva â€” exibe palavra por palavra antes de persistir
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

      // Persiste a mensagem completa no Firestore apÃ³s a digitaÃ§Ã£o progressiva
      await adicionarMensagemSemUI(assistantMsg);

      // â”€â”€ Preview de aÃ§Ã£o â€” mostrar modal de confirmaÃ§Ã£o â”€â”€
      if (acoes.length > 0) {
        const descricoes = acoes.map(a => descreverAcao(a));
        setAcaoPendente({ acoes, descricoes });
        // NÃ£o executa imediatamente â€” aguarda confirmaÃ§Ã£o do usuÃ¡rio
      }
    } catch (error) {
      setIsLoading(false);
      if (error.message?.includes('429') || error.status === 429) {
        addSystemMessage('ðŸ˜… **Limite de requisiÃ§Ãµes atingido**\n\nAguarde 1-2 minutos e tente novamente.', 'error');
      } else {
        addSystemMessage('ðŸ˜… **Problema ao processar**\n\nNÃ£o consegui processar sua mensagem. Tente novamente em instantes.', 'error');
      }
    }
  };

  // HACK: ref para permitir que o callback de voz (useSpeechRecognition) acesse sendMessage
  // sem capturar um stale closure â€” o callback Ã© registrado no mount e nÃ£o pode ser atualizado
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** Converte o nome tÃ©cnico do modelo Gemini para label amigÃ¡vel exibida no header. */
  const formatModelName = (name) => {
    if (!name) return 'Gemini';
    if (name.includes('2.5-flash-lite')) return '2.5 Flash Lite';
    if (name.includes('2.5-flash')) return '2.5 Flash';
    if (name.includes('1.5-flash')) return '1.5 Flash';
    if (name.includes('1.5-pro')) return '1.5 Pro';
    return name;
  };

  /** Executa aÃ§Ãµes confirmadas pelo modal de preview */
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

  /** Fecha o KakaBot â€” gera resumo de sessÃ£o assincronamente */
  const handleFechar = () => {
    gerarResumoSessao(); // async, nÃ£o aguardar
    stopTTS();
    setIsOpen(false);
  };

  const handleRetryConnection = () => {
    setConnectionStatus('disconnected');
    setErrorMessage(null);
    setGeminiModel(null);
    setActiveModelName(null);
    chatRef.current = null;
    // Remove Ãºltima mensagem de erro da UI se for system
    setMensagensVisiveis((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isSystem && last?.systemType === 'error') return prev.slice(0, -1);
      return prev;
    });
    initializeGemini();
  };

  /**
   * Inicia uma nova sessÃ£o. Se hÃ¡ apenas a mensagem de boas-vindas, cria direto.
   * Caso contrÃ¡rio, exibe modal de confirmaÃ§Ã£o.
   */
  const handleNovaSessao = () => {
    if (mensagensVisiveis.length <= 1) {
      novaSessao(memoriaUsuario, dadosSistema);
      return;
    }
    setShowConfirmNovaSessao(true);
  };

  /**
   * Carrega bloco anterior de mensagens preservando a posiÃ§Ã£o de scroll.
   * Salva a altura antes do prepend e ajusta scrollTop apÃ³s o render.
   */
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

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <>
      {/* â•â•â•â• FAB Button â•â•â•â• */}
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

      {/* â•â•â•â• Chat Window â•â•â•â• */}
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
              {/* â•â•â•â• HEADER â•â•â•â• */}
              <div
                className="px-5 py-4.5 flex items-center justify-between shrink-0"
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
                    <div className="flex items-center gap-1.5 mt-0.75">
                      {connectionStatus === 'connected' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-white/75 text-[11px]">Online Â· {formatModelName(activeModelName)}</span>
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
                    {/* Badge de contexto de pÃ¡gina */}
                    <span className="text-white/50 text-[10px] flex items-center gap-1 mt-0.5">
                      <MapPin size={8} />
                      {PAGE_CONTEXT_LABELS[location.pathname] || 'Dashboard'}
                    </span>
                  </div>
                </div>

                {/* AÃ§Ãµes */}
                <div className="flex items-center gap-1">
                  {/* Parar Ã¡udio global */}
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
                      <span>Parar Ã¡udio</span>
                    </motion.button>
                  )}
                  {/* HistÃ³rico de conversas */}
                  <button
                    onClick={() => setShowHistorico(true)}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors hover:bg-white/15"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    title="HistÃ³rico de conversas"
                    aria-label="HistÃ³rico de conversas"
                  >
                    <History size={15} className="text-white/90" />
                  </button>
                  {/* Nova conversa */}
                  <button
                    onClick={handleNovaSessao}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors hover:bg-white/15"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    title="Nova conversa"
                    aria-label="Iniciar nova conversa"
                  >
                    <SquarePen size={15} className="text-white/90" />
                  </button>
                  {/* Fechar */}
                  <button
                    onClick={handleFechar}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors hover:bg-white/15"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    aria-label="Fechar"
                  >
                    <X size={15} className="text-white/90" />
                  </button>
                </div>
              </div>

              {/* â•â•â•â• BODY â•â•â•â• */}
              <div className="flex flex-col flex-1 overflow-hidden relative">

                    {/* â•â•â•â• Quiz Progress Bar â•â•â•â• */}
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

                    {/* â•â•â•â• Messages Area â•â•â•â• */}
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

                      {/* Botao carregar mensagens anteriores */}
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
                          /* â”€â”€ BalÃ£o UsuÃ¡rio â”€â”€ */
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
                                  className="px-3.75 py-2.75 text-[13.5px] leading-[1.65] text-white shadow-md"
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

                        /* â”€â”€ BalÃ£o Assistente â”€â”€ */
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
                                className={`px-3.75 py-2.75 text-[13.5px] leading-[1.65] shadow-sm border ${
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
                                {/* Cursor piscante durante streaming */}
                                {message.isStreaming && (
                                  <motion.span
                                    className="inline-block w-0.5 h-3.5 bg-teal-500 ml-0.5 rounded-full align-middle"
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                  />
                                )}
                                {/* AcaoBadge se a msg teve aÃ§Ã£o executada com sucesso */}
                                {message.acaoLabel && <AcaoBadge label={message.acaoLabel} />}

                                {/* â”€â”€ BotÃµes: TTS (sempre visÃ­vel) â”€â”€ */}
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
                                        aria-label={ttsActiveId === `msg-${index}` ? 'Parar narraÃ§Ã£o' : 'Ouvir mensagem'}
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

                              {/* â”€â”€ PrÃ³ximo passo chip â”€â”€ */}
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

                              {/* â”€â”€ Reactions (hover) â”€â”€ */}
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
                                      { emoji: <ThumbsUp size={11} strokeWidth={2} />, label: 'Ãštil', valor: 'util' },
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
                                                {
                                                  content: message.content,
                                                  timestamp: message.timestamp || new Date().toISOString(),
                                                  sessaoId: sessaoAtual?.id || null,
                                                  salvoEm: new Date().toISOString(),
                                                }
                                              );
                                              addSystemMessage('ðŸ“Œ Mensagem salva com sucesso!', 'success');
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

                      {/* â”€â”€ Waveform "Kaka estÃ¡ pensando" â”€â”€ */}
                      {isLoading && (
                        <div className="flex items-end gap-2 mb-3.5">
                          <KakaAvatar size="sm" speaking />
                          <div
                            className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2.5"
                            style={{ borderRadius: '18px 18px 18px 4px' }}
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
                            <span className="text-xs text-slate-400">Kaka estÃ¡ pensando...</span>
                          </div>
                        </div>
                      )}

                      {/* â”€â”€ Action execution indicator â”€â”€ */}
                      {isExecutingAction && (
                        <div className="flex items-end gap-2 mb-3.5">
                          <KakaAvatar size="sm" speaking />
                          <div
                            className="px-4 py-3 border shadow-sm flex items-center gap-2.5 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50"
                            style={{ borderRadius: '18px 18px 18px 4px' }}
                          >
                            <Loader size={14} className="animate-spin text-teal-600 dark:text-teal-400" />
                            <span className="text-xs text-teal-700 dark:text-teal-400">
                              Executando aÃ§Ã£o no sistema...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* â”€â”€ Connecting indicator â”€â”€ */}
                      {connectionStatus === 'connecting' && (
                        <div className="flex items-center justify-center py-4">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm shadow-sm border bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-400">
                            <Loader size={16} className="animate-spin" />
                            Estabelecendo conexÃ£o com a IA...
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                    )}

                    {/* â•â•â•â• BotÃ£o "Nova mensagem" (scroll inteligente) â•â•â•â• */}
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

                    {/* â•â•â•â• Modal Preview de AÃ§Ã£o â•â•â•â• */}
                    <AnimatePresence>
                      {acaoPendente && (
                        <motion.div
                          className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4"
                          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
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
                                      ? `${acaoPendente.acoes.length} aÃ§Ãµes`
                                      : '1 aÃ§Ã£o'}
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
                                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
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

                    {/* â•â•â•â• Painel HistÃ³rico de SessÃµes â•â•â•â• */}
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
                                <p className="text-[12px] text-slate-400 mt-1">Suas conversas aparecerÃ£o aqui</p>
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

                    {/* â•â•â•â• Modal Confirmar Nova SessÃ£o â•â•â•â• */}
                    <AnimatePresence>
                      {showConfirmNovaSessao && (
                        <motion.div
                          className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4"
                          style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
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
                                <p className="text-[12px] text-slate-400 dark:text-slate-500">O histÃ³rico atual serÃ¡ salvo.</p>
                              </div>
                            </div>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              VocÃª pode acessar conversas anteriores pelo histÃ³rico a qualquer momento.
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

                    {/* â•â•â•â• Reconnect button â•â•â•â• */}
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

                    {/* â•â•â•â• Quick Action Chips â•â•â•â• */}
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
                            className="shrink-0 flex items-center gap-1.25 px-3 py-1.25 text-[11.5px] font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-700/60 text-teal-700 dark:text-teal-400"
                            whileTap={{ scale: 0.97 }}
                          >
                            {action.icon}
                            <span>{action.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* â•â•â•â• INPUT BAR â•â•â•â• */}
                    <div className="px-3.5 pb-3.5 pt-2.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50 shrink-0">
                      <div className="flex items-end gap-2">
                        {/* BotÃ£o Microfone */}
                        {isSupported && (
                          <div className="relative shrink-0">
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
                              aria-label={isListening ? 'Parar gravaÃ§Ã£o' : 'Falar'}
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
                                ? 'Aguardando conexÃ£o...'
                                : 'Pergunte ou peÃ§a algo ao Kaka...'
                            }
                            disabled={isLoading || isExecutingAction || connectionStatus !== 'connected'}
                            rows={1}
                            className={`w-full px-3.5 py-2.75 rounded-[13px] text-[13.5px] text-slate-700 dark:text-slate-200 outline-none resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              isListening
                                ? 'bg-red-50 dark:bg-red-950/20 border-[1.5px] border-red-300'
                                : 'bg-slate-50 dark:bg-slate-700/50 border-[1.5px] border-slate-200 dark:border-slate-600 focus:border-teal-400'
                            }`}
                            style={{ minHeight: 44, maxHeight: 120, fontFamily: 'inherit', lineHeight: 1.5 }}
                          />
                        </div>

                        {/* BotÃ£o Enviar */}
                        <motion.button
                          onClick={() => sendMessage()}
                          disabled={!inputValue.trim() || isLoading || isExecutingAction || connectionStatus !== 'connected'}
                          className="w-11 h-11 rounded-[13px] flex items-center justify-center border-none transition-all disabled:cursor-not-allowed shrink-0 disabled:bg-slate-100 dark:disabled:bg-slate-700"
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
                        <span>Enter para enviar Â· Shift+Enter nova linha</span>
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
