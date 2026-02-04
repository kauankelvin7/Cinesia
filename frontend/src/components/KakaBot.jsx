/**
 * 🤖 KAKA BOT - Assistente Virtual de Fisioterapia
 * 
 * Mentor de estudos baseado em IA (Google Gemini)
 * Persona: Parceiro, encorajador e didático
 * 
 * Features:
 * - Chat flutuante minimalista
 * - Modelo: gemini-1.5-flash (máxima compatibilidade)
 * - Fallback: gemini-pro
 * - History Injection Pattern (SEM systemInstruction)
 * - Renderização Markdown
 * - Tratamento robusto de erros
 * 
 * VERSÃO: 9.0 - Zero Config (Vercel Fix)
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  User,
  Loader2,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  CheckCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Prompt do Sistema (Persona do Kaka) - Injetado via histórico
const KAKA_PERSONA = `Você é o Kaka, um parceiro de estudos de Fisioterapia paciente e natural.

REGRA DE OURO (ADAPTABILIDADE):
O tamanho da sua resposta deve espelhar a intenção do usuário:

1. **Interação Social / Curta (Ex: "Oi", "Tudo bem?", "Bom dia"):**
   - SEJA BREVE. Responda em no máximo 1 ou 2 frases curtas e simpáticas.
   - Exemplo: "Oi! Tudo ótimo por aqui. Pronta pra estudar um pouco ou quer só conversar?"
   - NUNCA comece a explicar matéria se não foi perguntado.

2. **Dúvida Específica (Ex: "O que é sarcômero?"):**
   - Explique de forma direta e didática. Use analogia se ajudar, mas vá direto ao ponto.

3. **Pedido de Aprofundamento (Ex: "Me explique detalhadamente...", "Não entendi"):**
   - Aí sim: Use tópicos, detalhes, exemplos clínicos e todo seu conhecimento.

TOM DE VOZ:
- Natural, acolhedor e paciente.
- Aceite o ritmo dela. Sem textões desnecessários.
- Use **negrito** para termos-chave quando explicar conceitos.
- Nunca invente informações médicas.`;

// 🔥 MODELOS - Ordem de preferência (máxima compatibilidade)
const MODEL_CANDIDATES = [
  'gemini-1.5-flash',      // Mais estável e compatível
  'gemini-1.5-flash-001',  // Versão específica
  'gemini-pro'             // Fallback clássico
];

const KakaBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou o **Kaka**, seu parceiro de estudos em Fisioterapia! \n\nPodemos revisar anatomia, discutir casos clínicos, tirar dúvidas sobre patologias ou qualquer outro tema. \n\nEm que posso ajudar hoje? 📚'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiModel, setGeminiModel] = useState(null);
  const [activeModelName, setActiveModelName] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Inicializar Gemini quando abrir o chat
  useEffect(() => {
    if (isOpen && !geminiModel && !isInitializing && !connectionError) {
      initializeGemini();
    }
  }, [isOpen]);

  const initializeGemini = async () => {
    setIsInitializing(true);
    setConnectionError(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setConnectionError('API Key não configurada');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ **Erro de Configuração**\n\nA API Key do Gemini não foi encontrada.\n\n**Como resolver:**\n1. Crie um arquivo `.env` na pasta `frontend/`\n2. Adicione: `VITE_GEMINI_API_KEY=sua_chave_aqui`\n3. Reinicie o servidor com `npm run dev`',
        isError: true
      }]);
      setIsInitializing(false);
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      
      let chat = null;
      let usedModel = null;
      
      // 🔥 ZERO CONFIG: Injeção de persona no histórico (SEM systemInstruction)
      const createChatWithPersona = (genModel) => {
        return genModel.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: `Aja como o seguinte personagem em TODAS as suas respostas a partir de agora:\n\n${KAKA_PERSONA}` }]
            },
            {
              role: 'model', 
              parts: [{ text: 'Entendido! Sou o Kaka, seu parceiro de estudos de Fisioterapia. 💪 Vou seguir todas as diretrizes - sendo breve em saudações e detalhado quando você precisar. Me conta, o que quer estudar hoje?' }]
            }
          ]
        });
      };
      
      // 🔥 MULTI-MODEL FALLBACK: Tenta cada modelo até um funcionar
      for (const modelName of MODEL_CANDIDATES) {
        try {
          // SEM systemInstruction - apenas model name
          const model = genAI.getGenerativeModel({ model: modelName });
          chat = createChatWithPersona(model);
          
          // Teste de conectividade simples
          const testResult = await chat.sendMessage('Responda apenas: OK');
          await testResult.response;
          
          usedModel = modelName;
          break; // Modelo funcionou!
          
        } catch (err) {
          // Erro recuperável - tenta próximo modelo
          console.warn(`Modelo ${modelName} falhou:`, err.message);
          continue;
        }
      }
      
      if (!chat || !usedModel) {
        throw new Error('Nenhum modelo disponível. Verifique sua API Key.');
      }
      
      setGeminiModel(chat);
      setActiveModelName(usedModel);
      setConnectionError(null);
      
      // Mensagem de sucesso
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚡ **Conexão estabelecida!**\n\nEstou rodando no modelo \`${usedModel}\`.\n\nPode mandar suas dúvidas! 💪`,
        isSuccess: true
      }]);
      
    } catch (error) {
      const errorMsg = '😢 **Não consegui me conectar**\n\n' + 
        `_${error.message}_\n\n` +
        '**Possíveis causas:**\n' +
        '- API Key inválida ou expirada\n' +
        '- Limite de cota atingido\n' +
        '- Região bloqueada\n\n' +
        '**Sugestões:**\n' +
        '1. Verifique sua chave em [AI Studio](https://aistudio.google.com/)\n' +
        '2. Crie uma nova API Key\n' +
        '3. Aguarde alguns minutos e tente novamente';
      
      setConnectionError(error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        isError: true
      }]);
    } finally {
      setIsInitializing(false);
    }
  };

  // Scroll para o final das mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (!geminiModel) {
        throw new Error('Modelo não inicializado. Clique em reconectar.');
      }

      // Chat já mantém histórico internamente via startChat()
      // Enviar apenas a mensagem atual
      const result = await geminiModel.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      // Chat do Gemini já mantém histórico interno via startChat()
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      
    } catch (error) {
      let errorMessage = 'Ops! Tive um probleminha técnico. 😅 Pode tentar novamente?';
      
      if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
        errorMessage = '⚠️ Problema com a API Key. Verifique a configuração.';
      } else if (error.message?.includes('blocked') || error.message?.includes('SAFETY')) {
        errorMessage = 'Hmm, não consegui processar essa pergunta. Pode reformular? 🤔';
      } else if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorMessage = '⏳ Limite de requisições atingido. Aguarde um momento e tente novamente.';
      } else if (error.message?.includes('não inicializado') || error.message?.includes('reconectar')) {
        errorMessage = '🔄 Preciso me reconectar. Use o botão abaixo.';
        setConnectionError('Desconectado');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRetryConnection = () => {
    setConnectionError(null);
    setGeminiModel(null);
    setActiveModelName(null);
    // Remover última mensagem de erro ou sucesso
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.isError || lastMsg?.isSuccess) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    initializeGemini();
  };

  return (
    <>
      {/* Botão FAB - Posição principal no canto inferior direito */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-50 sm:bottom-6 sm:right-6 w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle size={26} />
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Janela de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    Kaka
                    {isInitializing && <Loader2 size={14} className="animate-spin" />}
                    {geminiModel && !isInitializing && (
                      <CheckCircle size={14} className="text-green-300" />
                    )}
                    {connectionError && !isInitializing && (
                      <AlertTriangle size={14} className="text-amber-300" />
                    )}
                  </h3>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    {isInitializing ? (
                      'Conectando...'
                    ) : connectionError ? (
                      'Desconectado'
                    ) : activeModelName ? (
                      <>
                        <Zap size={12} />
                        {activeModelName === 'gemini-2.0-flash-lite' ? 'Flash-Lite' : 'Flash'}
                      </>
                    ) : (
                      'Seu Mentor de Fisioterapia'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="text-white" size={20} />
              </button>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {message.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                      message.isError ? 'bg-red-100' : 
                      message.isSuccess ? 'bg-green-100' :
                      'bg-gradient-to-br from-teal-500 to-emerald-500'
                    }`}>
                      <MessageCircle className={
                        message.isError ? 'text-red-500' : 
                        message.isSuccess ? 'text-green-600' :
                        'text-white'
                      } size={16} />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-teal-500 text-white rounded-br-md'
                        : message.isError
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                          : message.isSuccess
                            ? 'bg-green-50 text-green-700 border border-green-200 rounded-bl-md'
                            : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                        <ReactMarkdown
                          components={{
                            strong: ({ children }) => (
                              <strong className="font-semibold text-teal-700">{children}</strong>
                            ),
                            p: ({ children }) => (
                              <p className="text-sm leading-relaxed my-1">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside text-sm my-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside text-sm my-1">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="my-0.5">{children}</li>
                            ),
                            code: ({ children }) => (
                              <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                            ),
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">{children}</a>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                      <User className="text-slate-600" size={16} />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Indicador de Digitando */}
              {isLoading && (
                <motion.div className="flex items-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mr-2">
                    <MessageCircle className="text-white" size={16} />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Kaka está digitando</span>
                      <span className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 bg-teal-500 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Indicador de Inicializando */}
              {isInitializing && (
                <motion.div className="flex items-center justify-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full text-teal-700 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Conectando ao cérebro do Kaka...
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Botão de Reconexão */}
            {connectionError && !isInitializing && (
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
                <button
                  onClick={handleRetryConnection}
                  className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={16} />
                  Tentar Reconectar
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={connectionError ? "Reconecte para enviar..." : isInitializing ? "Aguarde..." : "Digite sua dúvida..."}
                  disabled={isLoading || isInitializing || !!connectionError}
                  className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading || isInitializing || !!connectionError}
                  className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </motion.button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                {activeModelName ? (
                  <>
                    Powered by <span className="font-semibold">{activeModelName === 'gemini-2.0-flash-lite' ? 'Gemini 2.0 Flash-Lite ⚡' : 'Gemini Flash'}</span>
                  </>
                ) : (
                  'Powered by Google Gemini'
                )} • Respostas podem conter erros
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KakaBot;
