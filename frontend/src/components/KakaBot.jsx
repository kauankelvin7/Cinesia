/**
 * 🤖 KakaBot - Agente de IA para Fisioterapia
 * 
 * Assistente inteligente que ajuda fisioterapeutas com:
 * - Consultas sobre anatomia e patologias
 * - Análise de exercícios cadastrados
 * - Sugestões de tratamento
 * - Acesso a dados do sistema (pacientes, sessões, etc.)
 * 
 * VERSÃO: 2.0 - AI Agent Edition
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  User,
  Loader2,
  Stethoscope,
  AlertTriangle,
  RefreshCw,
  Zap,
  CheckCircle2,
  Sparkles,
  Database,
  Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Configurações
const MAX_USER_CHARS = 2000;

// Lista de modelos em ordem de preferência
const GEMINI_MODELS = [
  { name: 'gemini-2.5-flash', description: 'Rápido e eficiente' },
  { name: 'gemini-2.5-flash-lite', description: 'Mais leve, custo/velocidade' },
  { name: 'gemini-1.5-flash', description: 'Substituto do 8b' },
  { name: 'gemini-1.5-pro', description: 'Tarefas complexas' },
  { name: 'gemini-1.0-pro', description: 'Versão anterior, simples' },
];

// System Prompt otimizado para agente
const SYSTEM_PROMPT = `Você é o **Kaka**, um assistente de IA especializado em Fisioterapia integrado ao sistema Cinesia.

## 🎯 PERSONALIDADE
- Parceiro de estudos paciente, didático e natural
- Tom acolhedor mas profissional
- Adapta o nível de detalhe à pergunta do usuário

## 📏 REGRA DE ADAPTABILIDADE
**A extensão da resposta deve refletir a intenção:**

1. **Saudação/Social** (Ex: "Oi", "Tudo bem?")
   → 1-2 frases curtas e simpáticas
   → Exemplo: "Oi! Pronta pra estudar? 💪"

2. **Dúvida Específica** (Ex: "O que é sarcômero?")
   → Explicação direta, 2-4 parágrafos
   → Use analogias se ajudar a compreensão

3. **Aprofundamento** (Ex: "Explique detalhadamente...")
   → Resposta completa com tópicos e exemplos clínicos

## 🔧 CAPACIDADES DO SISTEMA
Você tem acesso a ferramentas para consultar dados do Cinesia:
- \`get_patient_info\`: Buscar informações de pacientes
- \`get_exercise_library\`: Consultar biblioteca de exercícios
- \`get_recent_sessions\`: Ver sessões recentes
- \`analyze_progress\`: Analisar evolução de pacientes

**Quando usar ferramentas:**
- Usuário pergunta sobre paciente específico
- Solicitação de análise de dados
- Busca por exercícios ou protocolos

## ✍️ FORMATAÇÃO
- Use **negrito** para termos-chave médicos
- Listas numeradas para passos sequenciais
- Bullets para características ou sintomas
- Mantenha parágrafos curtos (2-4 linhas)

## ⚠️ LIMITAÇÕES
- NUNCA invente informações médicas
- Se não souber, seja honesto e sugira consultar literatura
- Para diagnósticos, sempre reforce: "consulte um profissional"

## 🎓 PRIMEIRA INTERAÇÃO
Apresente-se brevemente em 2-3 frases mencionando suas capacidades.`;

const KakaBot = () => {
  // Estados principais
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de conexão
  const [geminiModel, setGeminiModel] = useState(null);
  const [activeModelName, setActiveModelName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Rate limiting local
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const lastMessageTimeRef = useRef(0);

  // Constantes de rate limiting
  const MIN_MESSAGE_INTERVAL_MS = 2000; // 2 segundos entre mensagens
  const MAX_MESSAGES_PER_MINUTE = 15; // Máximo de 15 mensagens por minuto

  // Mensagem inicial
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '👋 Olá! Sou o **Kaka**, seu assistente de IA em Fisioterapia!\n\nPosso te ajudar com:\n- 📚 Dúvidas sobre anatomia e patologias\n- 💪 Sugestões de exercícios terapêuticos\n- 📊 Análise de dados dos seus pacientes\n- 🎯 Orientações sobre protocolos de tratamento\n\nComo posso ajudar hoje?'
      }]);
    }
  }, []);

  // Inicializar Gemini quando abrir
  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected') {
      initializeGemini();
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus no input
  useEffect(() => {
    if (isOpen && connectionStatus === 'connected') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, connectionStatus]);

  /**
   * Inicializar conexão com Gemini com retry e backoff
   */
  const initializeGemini = async (retryCount = 0, modelIndex = 0) => {
    const MAX_RETRIES = 3;
    const BACKOFF_MS = [0, 2000, 5000, 10000];
    setConnectionStatus('connecting');
    setErrorMessage(null);

    // Validar API Key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      handleConnectionError('API Key não configurada no arquivo .env');
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      // Tentar modelos em ordem
      for (let i = modelIndex; i < GEMINI_MODELS.length; i++) {
        const modelName = GEMINI_MODELS[i].name;
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 2048,
            }
          });
          const chat = createChatWithPersona(model);
          // Teste de conectividade
          const testResult = await chat.sendMessage('OK');
          await testResult.response;
          // Sucesso!
          chatRef.current = chat;
          setGeminiModel(chat);
          setActiveModelName(modelName);
          setConnectionStatus('connected');
          addSystemMessage(
            `✅ **Conexão estabelecida!**\n\nPronto para responder suas dúvidas! 💪`,
            'success'
          );
          return;
        } catch (err) {
          // Se for erro 429, não tente outros modelos
          if (err.message?.includes('429') || err.status === 429) {
            throw err;
          }
          // Se não for o último modelo, tenta o próximo
          if (i === GEMINI_MODELS.length - 1) {
            throw err;
          }
        }
      }
    } catch (error) {
      console.error('[KakaBot] Erro ao conectar:', error);
      // Verificar se é erro 429 (rate limit)
      const is429 = error.message?.includes('429') || error.status === 429;
      if (is429 && retryCount < MAX_RETRIES) {
        const waitTime = BACKOFF_MS[retryCount + 1];
        addSystemMessage(
          `⏳ **Limite de requisições atingido**\n\nAguardando ${waitTime/1000} segundos antes de tentar novamente...\n\n_Tentativa ${retryCount + 1} de ${MAX_RETRIES}_`,
          'info'
        );
        
        setTimeout(() => {
          initializeGemini(retryCount + 1);
        }, waitTime);
        
      } else {
        // Erro final ou não é 429
        handleConnectionError(error);
      }
    }
  };

  /**
   * Criar chat com persona injetada no histórico
   */
  const createChatWithPersona = (model) => {
    return model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `Aja como o seguinte assistente em todas as respostas:\n\n${SYSTEM_PROMPT}` }]
        },
        {
          role: 'model', 
          parts: [{ text: 'Entendido! Sou o Kaka, assistente de Fisioterapia integrado ao sistema Cinesia. Vou seguir todas as diretrizes de adaptabilidade, tom profissional e uso de ferramentas do sistema. Estou pronto para ajudar! 💪' }]
        }
      ]
    });
  };

  /**
   * Tratar erros de conexão
   */
  const handleConnectionError = (error) => {
    setConnectionStatus('error');
    
    // Extrair mensagem de erro
    const errorMessage = typeof error === 'string' ? error : error.message || String(error);
    setErrorMessage(errorMessage);
    
    const errorDetails = analyzeError(errorMessage);
    
    addSystemMessage(
      `😔 **Não consegui me conectar**\n\n${errorDetails.message}\n\n**Possíveis soluções:**\n${errorDetails.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      'error'
    );
  };

  /**
   * Analisar tipo de erro e sugerir soluções
   */
  const analyzeError = (error) => {
    const errorLower = error.toLowerCase();
    
    // Erro 429 - Rate Limit
    if (errorLower.includes('429') || errorLower.includes('rate limit') || errorLower.includes('quota')) {
      return {
        message: '⏱️ _Limite de requisições da API atingido_',
        solutions: [
          '**Aguarde 1-2 minutos** antes de tentar reconectar',
          'O Google Gemini tem limite gratuito de requisições por minuto',
          'Verifique sua cota em [Google AI Studio](https://aistudio.google.com/app/apikey)',
          'Considere fazer upgrade para aumentar o limite',
          '**Dica:** Use o KakaBot com moderação para evitar atingir o limite'
        ]
      };
    }
    
    if (errorLower.includes('api key') || errorLower.includes('invalid')) {
      return {
        message: '🔑 _API Key inválida ou não configurada_',
        solutions: [
          'Verifique se a variável `VITE_GEMINI_API_KEY` está no arquivo `.env`',
          'Gere uma nova API Key em [Google AI Studio](https://aistudio.google.com/)',
          'Certifique-se de reiniciar o servidor após alterar o .env',
          'Confirme que não há espaços extras na API Key'
        ]
      };
    }
    
    if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('failed to fetch')) {
      return {
        message: '🌐 _Erro de conexão com a internet_',
        solutions: [
          'Verifique sua conexão com a internet',
          'Tente desabilitar VPN ou proxy temporariamente',
          'Aguarde alguns instantes e tente reconectar',
          'Verifique se o firewall não está bloqueando a API do Google'
        ]
      };
    }
    
    return {
      message: `⚠️ _${error}_`,
      solutions: [
        'Aguarde 1-2 minutos antes de reconectar',
        'Tente reconectar usando o botão abaixo',
        'Verifique o console do navegador (F12) para mais detalhes',
        'Se o problema persistir, entre em contato com o suporte'
      ]
    };
  };

  /**
   * Adicionar mensagem do sistema
   */
  const addSystemMessage = (content, type = 'info') => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      isSystem: true,
      systemType: type // success | error | info
    }]);
  };

  /**
   * Verificar rate limit local
   */
  const checkRateLimit = () => {
    const now = Date.now();
    
    // Verificar intervalo mínimo entre mensagens
    if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      const waitSeconds = Math.ceil((MIN_MESSAGE_INTERVAL_MS - (now - lastMessageTimeRef.current)) / 1000);
      return {
        allowed: false,
        reason: `Por favor, aguarde ${waitSeconds} segundo(s) antes de enviar outra mensagem.`
      };
    }
    
    // Verificar quantidade de mensagens no último minuto
    const recentMessages = messageTimestamps.filter(timestamp => now - timestamp < 60000);
    
    if (recentMessages.length >= MAX_MESSAGES_PER_MINUTE) {
      return {
        allowed: false,
        reason: `Você atingiu o limite de ${MAX_MESSAGES_PER_MINUTE} mensagens por minuto. Aguarde um momento.`
      };
    }
    
    return { allowed: true };
  };

  /**
   * Enviar mensagem
   */
  const sendMessage = async () => {
    if (isLoading || connectionStatus !== 'connected') return;

    const userMessage = inputValue.trim();
    if (!userMessage) return;

    // Validar tamanho
    if (userMessage.length > MAX_USER_CHARS) {
      addSystemMessage(
        `⚠️ **Mensagem muito longa**\n\nPor favor, resuma sua dúvida em até ${MAX_USER_CHARS} caracteres para que eu possa processar melhor.`,
        'error'
      );
      return;
    }

    // Verificar rate limit local
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      addSystemMessage(
        `⏱️ **Calma aí!**\n\n${rateLimitCheck.reason}\n\n_Isso ajuda a evitar atingir o limite da API do Google._`,
        'info'
      );
      return;
    }

    // Adicionar mensagem do usuário
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Registrar timestamp
    const now = Date.now();
    lastMessageTimeRef.current = now;
    setMessageTimestamps(prev => [...prev.filter(t => now - t < 60000), now]);

    try {
      // Verificar se precisa usar ferramentas do sistema
      const needsTools = detectToolUsage(userMessage);
      
      let responseText = '';
      
      if (needsTools) {
        // Executar com ferramentas
        responseText = await sendMessageWithTools(userMessage);
      } else {
        // Envio normal
        const result = await chatRef.current.sendMessage(userMessage);
        const response = await result.response;
        responseText = response.text();
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseText 
      }]);

    } catch (error) {
      // Verificar se é erro 429
      if (error.message?.includes('429') || error.status === 429) {
        addSystemMessage(
          '😅 **Ops! Limite de requisições atingido**\n\nEstou recebendo muitas mensagens no momento. Por favor:\n\n1. Aguarde 1-2 minutos\n2. Tente enviar sua mensagem novamente\n3. Use mensagens mais espaçadas para evitar este problema\n\n_O Google Gemini tem limites de uso gratuito._',
          'error'
        );
      } else {
        // Outros erros
        addSystemMessage(
          '😅 **Tive um probleminha aqui**\n\nNão consegui processar sua mensagem agora. Por favor, tente novamente em alguns instantes!\n\n_Se o erro persistir, tente reconectar._',
          'error'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Detectar se a mensagem precisa de ferramentas do sistema
   */
  const detectToolUsage = (message) => {
    const messageLower = message.toLowerCase();
    
    const triggers = [
      'paciente',
      'sessão',
      'sessao',
      'exercício',
      'exercicio',
      'biblioteca',
      'progresso',
      'evolução',
      'evolucao',
      'dados do sistema',
      'consultar',
      'buscar',
      'listar'
    ];
    
    return triggers.some(trigger => messageLower.includes(trigger));
  };

  /**
   * Enviar mensagem com uso de ferramentas
   */
  const sendMessageWithTools = async (message) => {
    // Aqui você implementaria a integração real com o sistema
    // Por enquanto, retorna uma resposta simulada
    
    return `🔧 **Acesso ao sistema detectado**\n\nIdentifiquei que você está perguntando sobre dados do sistema.\n\n_**Nota:** A integração completa com o banco de dados do Cinesia será implementada em breve. Por enquanto, posso responder dúvidas teóricas sobre Fisioterapia._\n\nSua pergunta: "${message}"\n\nPosso te ajudar de outra forma?`;
  };

  /**
   * Formatar nome do modelo
   */
  const formatModelName = (modelName) => {
    if (modelName.includes('2.0-flash')) return 'Gemini 2.0 Flash ⚡';
    if (modelName.includes('1.5-flash-8b')) return 'Gemini 1.5 Flash 8B';
    if (modelName.includes('1.5-flash')) return 'Gemini 1.5 Flash';
    return modelName;
  };

  /**
   * Tentar reconectar
   */
  const handleRetryConnection = () => {
    // Limpar estados
    setConnectionStatus('disconnected');
    setErrorMessage(null);
    setGeminiModel(null);
    setActiveModelName(null);
    chatRef.current = null;
    
    // Remover última mensagem de erro do sistema
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.isSystem && lastMsg?.systemType === 'error') {
        return prev.slice(0, -1);
      }
      return prev;
    });
    
    // Tentar reconectar
    initializeGemini();
  };

  /**
   * Manipular Enter
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Renderizar status badge
   */
  const renderStatusBadge = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Conectando...</span>
          </>
        );
      case 'connected':
        return (
          <>
            <CheckCircle2 size={14} className="text-green-300" />
            <span className="flex items-center gap-1">
              <Zap size={12} />
              {formatModelName(activeModelName)}
            </span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle size={14} className="text-amber-300" />
            <span>Desconectado</span>
          </>
        );
      default:
        return <span className="text-xs">Seu Mentor de Fisioterapia</span>;
    }
  };

  return (
    <>
      {/* Botão FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-50 sm:bottom-6 sm:right-6 w-16 h-16 bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl transition-all group"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Stethoscope size={28} className="group-hover:rotate-12 transition-transform" />
            
            {/* Indicador de notificação */}
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={12} className="text-white" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Janela de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 z-50 w-[400px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                  <Stethoscope className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    Kaka
                    <motion.span
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✨
                    </motion.span>
                  </h3>
                  <p className="text-white/90 text-xs flex items-center gap-1.5">
                    {renderStatusBadge()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="text-white" size={22} />
              </button>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  {/* Avatar do assistente */}
                  {message.role === 'assistant' && (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-2 shrink-0 shadow-sm ${
                      message.isSystem && message.systemType === 'error' ? 'bg-red-100' : 
                      message.isSystem && message.systemType === 'success' ? 'bg-green-100' :
                      'bg-gradient-to-br from-teal-500 to-emerald-500'
                    }`}>
                      {message.isSystem && message.systemType === 'error' ? (
                        <AlertTriangle className="text-red-500" size={18} />
                      ) : message.isSystem && message.systemType === 'success' ? (
                        <CheckCircle2 className="text-green-600" size={18} />
                      ) : (
                        <Stethoscope className="text-white" size={18} />
                      )}
                    </div>
                  )}
                  
                  {/* Balão de mensagem */}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-br-md shadow-md'
                        : message.isSystem && message.systemType === 'error'
                          ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
                          : message.isSystem && message.systemType === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200 rounded-bl-md'
                            : 'bg-white text-slate-700 shadow-md border border-slate-200 rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            strong: ({ children }) => (
                              <strong className="font-semibold text-teal-700">{children}</strong>
                            ),
                            p: ({ children }) => (
                              <p className="text-sm leading-relaxed my-1.5 first:mt-0 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside text-sm my-2 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside text-sm my-2 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="my-0.5">{children}</li>
                            ),
                            code: ({ children }) => (
                              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-teal-700">{children}</code>
                            ),
                            a: ({ href, children }) => (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-teal-600 hover:text-teal-700 underline"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>

                  {/* Avatar do usuário */}
                  {message.role === 'user' && (
                    <div className="w-9 h-9 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center ml-2 shrink-0 shadow-sm">
                      <User className="text-slate-600" size={18} />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Indicador de digitando */}
              {isLoading && (
                <motion.div 
                  className="flex items-start" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center mr-2 shadow-sm">
                    <Stethoscope className="text-white" size={18} />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Kaka está pensando</span>
                      <span className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 bg-teal-500 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ 
                              duration: 0.6, 
                              repeat: Infinity, 
                              delay: i * 0.15 
                            }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Indicador de conectando */}
              {connectionStatus === 'connecting' && (
                <motion.div 
                  className="flex items-center justify-center py-4" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm shadow-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Estabelecendo conexão com a IA...
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Botão de Reconexão */}
            {connectionStatus === 'error' && (
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
                <button
                  onClick={handleRetryConnection}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                  <RefreshCw size={16} />
                  Tentar Reconectar
                </button>
              </div>
            )}

            {/* Input de Mensagem */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    connectionStatus === 'error' ? "Reconecte para enviar..." :
                    connectionStatus === 'connecting' ? "Aguarde a conexão..." :
                    connectionStatus === 'connected' ? "Digite sua dúvida..." :
                    "Conectando..."
                  }
                  disabled={isLoading || connectionStatus !== 'connected'}
                  rows={1}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none max-h-24"
                  style={{ 
                    minHeight: '44px',
                    maxHeight: '96px'
                  }}
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading || connectionStatus !== 'connected'}
                  className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                  whileHover={{ scale: connectionStatus === 'connected' ? 1.05 : 1 }}
                  whileTap={{ scale: connectionStatus === 'connected' ? 0.95 : 1 }}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </motion.button>
              </div>
              
              {/* Footer com informações */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  {connectionStatus === 'connected' && (
                    <>
                      <Activity size={12} className="text-green-500" />
                      <span className="text-green-600 font-medium">Online</span>
                    </>
                  )}
                </span>
                <span>
                  Powered by {activeModelName ? formatModelName(activeModelName) : 'Gemini'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KakaBot;