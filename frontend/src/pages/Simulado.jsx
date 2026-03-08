/** *
 * Página de simulados inteligentes para estudantes de Fisioterapia.
 * Permite gerar provas de múltipla escolha automaticamente usando LLM (Google Gemini).
 *
 * Principais recursos:
 * - Geração de 5 questões a partir de tema livre ou PDF
 * - Feedback imediato (certo/errado) e explicação didática
 * - Upload e extração de texto de PDFs acadêmicos
 * - Fallback automático entre modelos Gemini
 * - Interface reativa e acessível
 *
 * v4.1 - FIXED JSON PARSING (Fevereiro 2025)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  Loader2,
  AlertTriangle,
  Target,
  Zap,
  FileText,
  Upload,
  X,
  File,
  RefreshCw,
  History,
  Clock,
  Sparkles
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { salvarSimulado } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// 📄 Configuração do worker do PDF.js v5+ para funcionar com Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// 🤖 Lista de modelos Gemini disponíveis para fallback automático
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',          // Modelo 2.5 estável mais recente
  'gemini-1.5-flash',          // Fallback 1.5 estável
  'gemini-1.5-pro',            // Pro como último recurso
];

// Prompt para gerar questões de múltipla escolha a partir de um tema fornecido pelo usuário
const generatePromptByTema = (tema) => `Você é um professor de Fisioterapia criando uma prova.

Crie EXATAMENTE 5 questões de múltipla escolha sobre o tema: "${tema}"

REGRAS:
1. Nível: Graduação em Fisioterapia
2. Cada questão deve ter 4 alternativas (A, B, C, D)
3. Apenas 1 alternativa correta por questão
4. Inclua uma explicação didática para cada resposta correta

RESPONDA APENAS COM JSON VÁLIDO, sem markdown, sem texto adicional:
[
  {
    "pergunta": "Texto da pergunta aqui?",
    "opcoes": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
    "correta": 0,
    "explicacao": "Explicação didática do porquê esta é a resposta correta."
  }
]

IMPORTANTE: 
- "correta" é o ÍNDICE (0-3) da alternativa correta
- Retorne APENAS o array JSON, nada mais`;

// 📄 Prompt para gerar questões por CONTEÚDO DO PDF
const generatePromptByPDF = (textoExtraido) => `Você é um professor de Fisioterapia criando uma prova baseada em material didático.

Analise o seguinte texto acadêmico e gere EXATAMENTE 5 questões de múltipla escolha focadas nos conceitos-chave apresentados:

--- INÍCIO DO TEXTO ---
${textoExtraido}
--- FIM DO TEXTO ---

REGRAS:
1. As questões devem ser baseadas EXCLUSIVAMENTE no conteúdo do texto acima
2. Nível: Graduação em Fisioterapia
3. Cada questão deve ter 4 alternativas (A, B, C, D)
4. Apenas 1 alternativa correta por questão
5. Inclua uma explicação didática para cada resposta correta
6. Priorize conceitos importantes e termos técnicos do texto

RESPONDA APENAS COM JSON VÁLIDO, sem markdown, sem texto adicional:
[
  {
    "pergunta": "Texto da pergunta aqui?",
    "opcoes": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
    "correta": 0,
    "explicacao": "Explicação didática do porquê esta é a resposta correta."
  }
]

IMPORTANTE: 
- "correta" é o ÍNDICE (0-3) da alternativa correta
- Retorne APENAS o array JSON, nada mais`;

// Temas sugeridos para facilitar o uso rápido do simulado
const temasSugeridos = [
  'Anatomia do Joelho',
  'Dermátomos e Miótomos',
  'Biomecânica da Marcha',
  'Fisiologia Muscular',
  'Avaliação Postural',
  'Neuroanatomia Básica',
  'Lesões do Manguito Rotador',
  'Fisioterapia Respiratória',
  'Cinesioterapia',
  'Eletroterapia'
];

function Simulado() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ==================== ESTADOS PRINCIPAIS ====================
  const [tema, setTema] = useState('');
  const [historicoSalvo, setHistoricoSalvo] = useState(false);
  const [questoes, setQuestoes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fase, setFase] = useState('setup'); // 'setup' | 'quiz' | 'resultado'
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  // ==================== ESTADOS PARA UPLOAD DE PDF ====================
  const [activeTab, setActiveTab] = useState('tema'); // 'tema' | 'arquivo'
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ==================== TIMER (BUG-009) ====================
  const [timeLeft, setTimeLeft] = useState(null); // null = sem timer (prática livre)
  const [timerDuration, setTimerDuration] = useState(10); // duração selecionada em minutos (0 = sem limite)
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const timerRef = useRef(null);

  const TIMER_OPTIONS = [
    { value: 5,  label: '5 min',    desc: 'Rápido' },
    { value: 10, label: '10 min',   desc: 'Padrão' },
    { value: 15, label: '15 min',   desc: 'Tranquilo' },
    { value: 30, label: '30 min',   desc: 'Extenso' },
    { value: 0,  label: 'Sem limite', desc: 'Livre' },
  ];

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const encerrarSimulado = useCallback(() => {
    setTimerActive(false);
    setTimerPaused(false);
    setFase('resultado');
    setHistoricoSalvo(false);
  }, []);

  const togglePauseTimer = useCallback(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    setTimerPaused(p => !p);
    setTimerActive(a => !a);
  }, [timeLeft]);

  useEffect(() => {
    if (!timerActive || timeLeft === null) return;
    if (timeLeft <= 0) { encerrarSimulado(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timerActive, timeLeft, encerrarSimulado]);

  // ==================== NAV BLOCKER (BUG-027) ====================
  // BrowserRouter doesn't support useBlocker – use beforeunload instead
  useEffect(() => {
    if (fase !== 'quiz' || questoes.length === 0) return;
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [fase, questoes.length]);

  // ==================== AUTO-SAVE RESULTADO ====================
  useEffect(() => {
    if (fase !== 'resultado' || historicoSalvo || questoes.length === 0) return;
    const userId = user?.id || user?.uid;
    if (!userId) return;
    const totalAcertos = questoes.reduce((acc, q, idx) => (respostas[idx] === q.correta ? acc + 1 : acc), 0);
    const score = Math.round((totalAcertos / questoes.length) * 100);
    const tempoTotal = timeLeft !== null && timerDuration > 0 ? (timerDuration * 60) - timeLeft : 0;
    salvarSimulado({
      tema,
      score,
      acertos: totalAcertos,
      total: questoes.length,
      tempoSegundos: tempoTotal,
      questoes: questoes.map((q, idx) => ({
        pergunta: q.pergunta,
        opcoes: q.opcoes,
        correta: q.correta,
        explicacao: q.explicacao,
        respostaUsuario: respostas[idx] ?? null,
        acertou: respostas[idx] === q.correta,
      })),
    }, userId).then(() => {
      setHistoricoSalvo(true);
    }).catch(err => {
      console.error('Erro ao salvar histórico do simulado:', err);
    });
  }, [fase, historicoSalvo, questoes, respostas, tema, timeLeft, timerDuration, user]);

  /**
   * 📄 Extrai texto de um arquivo PDF usando pdfjs-dist.
   *
   * @param {File} file - Arquivo PDF selecionado pelo usuário
   * @returns {Promise<string>} - Texto extraído do PDF
   *
   * Limpa espaços, limita tamanho e trata erros comuns.
   */
  const extractTextFromPdf = async (file) => {
    setIsExtractingPdf(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      // Limpar texto (remover espaços excessivos)
      fullText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      
      if (fullText.length < 100) {
        throw new Error('O PDF parece estar vazio ou com pouco texto legível.');
      }
      
      // Limitar tamanho do texto (Gemini tem limite de tokens)
      const maxChars = 30000; // ~7500 tokens
      if (fullText.length > maxChars) {
        fullText = fullText.substring(0, maxChars) + '\n\n[... texto truncado para processamento ...]';
      }
      
      setPdfText(fullText);
      return fullText;
      
    } catch (err) {
      const errorMsg = err.message || 'Erro ao ler o PDF. Verifique se o arquivo não está protegido.';
      setError(errorMsg);
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Simulado] Erro ao extrair PDF:', err);
      }
      throw new Error(errorMsg);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  /**
   * 📁 Handler para seleção de arquivo PDF pelo input.
   * Valida tipo e tamanho, chama extração e trata erros.
   */
  const handleFileSelect = async (file) => {
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF válido.');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB
      setError('O arquivo é muito grande. Máximo: 20MB.');
      return;
    }
    
    setPdfFile(file);
    setError(null);
    
    try {
      await extractTextFromPdf(file);
    } catch (err) {
      setPdfFile(null);
      setError('Não foi possível extrair o texto do PDF. Tente outro arquivo.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Simulado] Erro ao selecionar arquivo:', err);
      }
    }
  };

  /**
   * 🖱️ Handlers de Drag & Drop para upload de PDF.
   * Permite arrastar e soltar arquivos na interface.
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const removeFile = () => {
    setPdfFile(null);
    setPdfText('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 🔥 MULTI-MODEL FALLBACK: Tenta múltiplos modelos Gemini para garantir resposta.
   *
   * @param {string} prompt - Prompt a ser enviado para a LLM
   * @returns {Promise<string>} - Resposta gerada pela IA
   *
   * Tenta cada modelo da lista até obter resposta válida.
   */
  const generateWithFallback = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('O sistema está temporariamente indisponível. Por favor, tente novamente mais tarde.');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const errors = [];
    
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096, // Aumentado de 2048 para 4096
          }
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return text;
        
      } catch (err) {
        const status = err?.status || err?.code || '';
        const message = err?.message || 'erro desconhecido';
        console.warn(`❌ [Simulado] Modelo ${modelName} falhou:`, status, message);
        errors.push(`${modelName}: ${message}`);
        
        // Continua tentando o próximo modelo
        continue;
      }
    }
    
    // Se chegou aqui, todos falharam
    // 1. Deixa o erro feio e técnico apenas no console do navegador (para você debugar)
    console.error('[Simulado] Todos os modelos falharam. Detalhes técnicos:', errors);
    
    // 2. Dispara uma mensagem limpa e amigável para o usuário final
    throw new Error(
      'Não foi possível gerar o simulado neste momento. Nossos servidores de Inteligência Artificial estão indisponíveis ou sobrecarregados. Por favor, aguarde alguns minutos e tente novamente.'
    );
  };

  // Gerar questões (suporta tema OU PDF)
  const gerarQuestoes = async () => {
    // Validação baseada no modo ativo
    if (activeTab === 'tema') {
      if (!tema.trim()) {
        setError('Digite um tema para o simulado');
        return;
      }
    } else {
      if (!pdfText) {
        setError('Envie um arquivo PDF primeiro');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Usar prompt apropriado baseado no modo
      const prompt = activeTab === 'tema' 
        ? generatePromptByTema(tema)
        : generatePromptByPDF(pdfText);
      
      // Se for modo PDF, usar nome do arquivo como "tema" para exibição
      if (activeTab === 'arquivo' && pdfFile) {
        setTema(pdfFile.name.replace('.pdf', '').replace(/_/g, ' '));
      }
      
      const responseText = await generateWithFallback(prompt);
      
      // 🧹 LIMPEZA INTELIGENTE: remover apenas marcadores markdown
      let cleanedResponse = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Remover texto ANTES do JSON (mas preservar o JSON completo)
      const jsonStartMatch = cleanedResponse.match(/^[^[\{]*/);
      if (jsonStartMatch && jsonStartMatch[0].length > 0) {
        cleanedResponse = cleanedResponse.substring(jsonStartMatch[0].length);
      }
      
      // Remover texto DEPOIS do JSON (mas preservar o JSON completo)
      // Encontrar o último ] ou } e manter tudo até ali
      const lastBracket = Math.max(
        cleanedResponse.lastIndexOf(']'),
        cleanedResponse.lastIndexOf('}')
      );
      if (lastBracket !== -1) {
        cleanedResponse = cleanedResponse.substring(0, lastBracket + 1);
      }
      
      // 🔍 PARSING COM MÚLTIPLAS TENTATIVAS
      let parsedQuestions;
      
      // Tentativa 1: Parse direto (caso mais comum)
      try {
        parsedQuestions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // Tentativa 2: Extrair array JSON completo
        try {
          // Encontrar início e fim do array
          const arrayStart = cleanedResponse.indexOf('[');
          const arrayEnd = cleanedResponse.lastIndexOf(']');
          
          if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
            const jsonArray = cleanedResponse.substring(arrayStart, arrayEnd + 1);
            parsedQuestions = JSON.parse(jsonArray);
          } else {
            throw new Error('Nenhum array JSON encontrado');
          }
        } catch (innerError) {
          console.error('❌ [Simulado] Todas as tentativas falharam');
          console.error('💥 [Simulado] Erro:', innerError.message);
          console.error('📄 [Simulado] JSON completo (primeiros 1000 chars):', cleanedResponse.substring(0, 1000));
          throw new Error('A IA retornou um formato inválido. Tente novamente.');
        }
      }

      // Validar estrutura
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error('Nenhuma questão foi gerada. Tente novamente.');
      }

      // Validar e limpar cada questão
      const validQuestions = parsedQuestions
        .filter(q => {
          const isValid = q.pergunta && 
                          Array.isArray(q.opcoes) && 
                          q.opcoes.length >= 2 &&
                          typeof q.correta === 'number' &&
                          q.explicacao;
          
          if (!isValid) {
            if (import.meta.env.DEV) { console.warn('⚠️ Questão inválida:', q); }
          }
          return isValid;
        })
        .map(q => ({
          pergunta: String(q.pergunta).trim(),
          opcoes: q.opcoes.map(o => String(o).trim()),
          correta: Number(q.correta),
          explicacao: String(q.explicacao).trim()
        }));

      if (validQuestions.length === 0) {
        throw new Error('As questões geradas estão em formato inválido. Tente novamente.');
      }

      setQuestoes(validQuestions);
      setFase('quiz');
      setCurrentIndex(0);
      setRespostas({});
      setSelectedOption(null);
      setHasAnswered(false);
      // Iniciar timer com duração selecionada
      if (timerDuration > 0) {
        setTimeLeft(timerDuration * 60);
        setTimerActive(true);
      } else {
        setTimeLeft(null); // sem limite
        setTimerActive(false);
      }
      setTimerPaused(false);
      
    } catch (err) {
      setError(err.message || 'Erro ao gerar questões. Verifique sua conexão e tente novamente.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Simulado] Erro final:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Selecionar resposta
  const selecionarResposta = (optionIndex) => {
    if (hasAnswered) return;
    
    setSelectedOption(optionIndex);
    setHasAnswered(true);
    setRespostas(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  // Próxima questão
  const proximaQuestao = () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(respostas[currentIndex + 1] ?? null);
      setHasAnswered(respostas[currentIndex + 1] !== undefined);
    } else {
      encerrarSimulado();
    }
  };

  // Questão anterior
  const questaoAnterior = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedOption(respostas[currentIndex - 1] ?? null);
      setHasAnswered(respostas[currentIndex - 1] !== undefined);
    }
  };

  // Calcular pontuação
  const calcularPontuacao = () => {
    let acertos = 0;
    questoes.forEach((q, idx) => {
      if (respostas[idx] === q.correta) {
        acertos++;
      }
    });
    return acertos;
  };

  // Reiniciar simulado
  const reiniciar = () => {
    setFase('setup');
    setQuestoes([]);
    setCurrentIndex(0);
    setRespostas({});
    setSelectedOption(null);
    setHasAnswered(false);
    setError(null);
    setTimeLeft(null);
    setTimerActive(false);
    setTimerPaused(false);
    setTimerDuration(10);
    setHistoricoSalvo(false);
    // Limpar estados do PDF
    setPdfFile(null);
    setPdfText('');
    setActiveTab('tema');
    setTema('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Novo simulado
  const novoSimulado = () => {
    setQuestoes([]);
    setCurrentIndex(0);
    setRespostas({});
    setSelectedOption(null);
    setHasAnswered(false);
    gerarQuestoes();
  };

  const questaoAtual = questoes[currentIndex];
  const acertos = fase === 'resultado' ? calcularPontuacao() : 0;
  const percentual = fase === 'resultado' ? Math.round((acertos / questoes.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 relative overflow-hidden">
      {/* Background dinâmico global sutil */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-teal-400/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl ipad:max-w-6xl mx-auto relative z-10">
        {/* Header Premium */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-5 mb-4">
            <motion.div 
              className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <BookOpen size={30} className="text-white" strokeWidth={1.8} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Simulado Infinito
              </h1>
              <p className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2 mt-1 text-[15px]">
                <Zap size={16} className="text-amber-500" />
                Provas geradas por Inteligência Artificial
              </p>
            </div>
          </div>
        </motion.div>

        {/* === FASE: SETUP === */}
        <AnimatePresence mode="wait">
          {fase === 'setup' && !isLoading && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6 sm:p-10"
            >
              <div className="text-center mb-10">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full" />
                  <div className="relative w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[20px] flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                    <Target size={36} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Configure seu Teste
                </h2>
                <p className="text-[15px] text-slate-500 dark:text-slate-400">
                  Escolha um tema livre ou faça upload do seu material de estudo.
                </p>
              </div>

              {/* 📑 ABAS: Por Tema / Por Arquivo (iOS Style) */}
              <div className="flex mb-8 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1.5 border border-slate-200/50 dark:border-slate-700/50 max-w-lg mx-auto">
                <button
                  onClick={() => setActiveTab('tema')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-[14px] font-bold transition-all duration-300 ${
                    activeTab === 'tema'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen size={18} strokeWidth={2.5} />
                  Por Tema
                </button>
                <button
                  onClick={() => setActiveTab('arquivo')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-[14px] font-bold transition-all duration-300 ${
                    activeTab === 'arquivo'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText size={18} strokeWidth={2.5} />
                  Por Arquivo PDF
                </button>
              </div>

              <div className="space-y-8 max-w-2xl mx-auto">
                {/* === CONTEÚDO DA ABA TEMA === */}
                {activeTab === 'tema' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="mb-6">
                      <label className="block text-[14px] font-bold text-slate-700 dark:text-slate-300 mb-3">
                        O que você quer estudar hoje?
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: Anatomia do Joelho, Fisiologia Pulmonar..."
                        value={tema}
                        onChange={(e) => setTema(e.target.value)}
                        className="text-lg h-14 rounded-[16px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                      />
                    </div>

                    {/* Temas Sugeridos Premium */}
                    <div>
                      <p className="text-[13px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                        <Sparkles size={14} /> Sugestões Rápidas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {temasSugeridos.map((t, idx) => (
                          <motion.button
                            key={idx}
                            onClick={() => setTema(t)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all border ${
                              tema === t
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                            }`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {t}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* === CONTEÚDO DA ABA ARQUIVO PDF === */}
                {activeTab === 'arquivo' && (
                  <motion.div className="space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {!pdfFile ? (
                      /* Dropzone Premium */
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative overflow-hidden border-2 border-dashed rounded-[20px] p-10 text-center cursor-pointer transition-all duration-300 ${
                          isDragOver
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                          <Upload size={28} className="text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-bold text-[16px] mb-2">
                          Arraste seu PDF aqui ou clique
                        </p>
                        <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">
                          Artigos, resumos ou apostilas (máx. 20MB)
                        </p>
                      </div>
                    ) : (
                      /* Arquivo selecionado */
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-[20px] p-5 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-[14px] flex items-center justify-center shadow-sm">
                              <File size={24} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs text-[15px]">
                                {pdfFile.name}
                              </p>
                              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                {pdfText && (
                                  <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                                    ✓ Pronto para uso
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={removeFile}
                            className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors shadow-sm"
                            title="Remover arquivo"
                          >
                            <X size={18} className="text-red-500" strokeWidth={2.5} />
                          </button>
                        </div>
                        
                        {isExtractingPdf && (
                          <div className="mt-5 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-[14px]">
                            <Loader2 size={18} className="animate-spin" />
                            Lendo conteúdo do PDF...
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

                {/* === SELEÇÃO DE TEMPO === */}
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-500" />
                    Tempo do Simulado
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {TIMER_OPTIONS.map((opt) => (
                      <motion.button
                        key={opt.value}
                        onClick={() => setTimerDuration(opt.value)}
                        className={`flex flex-col items-center justify-center p-3 rounded-[16px] border-2 transition-all ${
                          timerDuration === opt.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md shadow-indigo-500/10'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={`text-[15px] font-bold ${timerDuration === opt.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {opt.label}
                        </span>
                        <span className={`text-[11px] font-medium mt-1 ${timerDuration === opt.value ? 'text-indigo-500/80 dark:text-indigo-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          {opt.desc}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-[16px] text-red-700 dark:text-red-400 shadow-sm"
                  >
                    <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                    <p className="text-[14px] font-medium">{error}</p>
                  </motion.div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={gerarQuestoes}
                  disabled={isLoading || isExtractingPdf || (activeTab === 'tema' ? !tema.trim() : !pdfText)}
                  className="w-full h-14 text-[16px] font-bold bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 border-none shadow-lg shadow-indigo-500/25"
                  leftIcon={isLoading ? <Loader2 size={22} className="animate-spin" /> : <Play size={22} />}
                >
                  {isLoading ? 'Preparando Prova...' : 'Iniciar Simulado'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* === FASE: LOADING === */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-12 text-center"
            >
              {/* Animação de loading Premium */}
              <div className="relative w-32 h-32 mx-auto mb-10">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-3 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-teal-400"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap size={24} className="text-white" fill="white" />
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
                  A IA está trabalhando...
                </h3>
                <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-8">
                  Criando questões exclusivas sobre <span className="text-indigo-600 dark:text-indigo-400">{tema || 'seu conteúdo'}</span>
                </p>
              </motion.div>

              {/* Etapas do processo */}
              <div className="space-y-3 max-w-sm mx-auto text-left">
                {[
                  { text: 'Analisando o contexto do tema...', delay: 0.4 },
                  { text: 'Formulando enunciados de nível universitário...', delay: 0.8 },
                  { text: 'Gerando alternativas e explicações didáticas...', delay: 1.2 }
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay }}
                  >
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: step.delay }}
                    />
                    <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">
                      {step.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* === FASE: QUIZ === */}
          {fase === 'quiz' && questaoAtual && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              {/* Barra Superior */}
              <div className="flex items-center justify-between mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-[20px] shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div>
                  <span className="text-[13px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    Progresso
                  </span>
                  <span className="text-[16px] font-bold text-indigo-600 dark:text-indigo-400">
                    Questão {currentIndex + 1} de {questoes.length}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="hidden sm:block text-[15px] font-bold text-slate-700 dark:text-slate-200">
                    {tema}
                  </span>
                  {timeLeft !== null && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        timeLeft < 60 
                          ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20' 
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                      }`}>
                        <Clock size={16} strokeWidth={2.5} />
                        <span className="text-[15px] font-bold font-mono tabular-nums tracking-tight">
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                      <button
                        onClick={togglePauseTimer}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                        title={timerPaused ? 'Retomar' : 'Pausar'}
                      >
                        {timerPaused ? <Play size={18} fill="currentColor" /> : <div className="flex gap-1"><div className="w-1.5 h-4 bg-currentColor rounded-sm" /><div className="w-1.5 h-4 bg-currentColor rounded-sm" /></div>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Line */}
              <div className="h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden mb-8">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              {/* Card da Questão */}
              <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 shadow-xl overflow-hidden mb-6">
                {/* Pergunta */}
                <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-relaxed">
                    {questaoAtual.pergunta}
                  </h3>
                </div>

                {/* Opções */}
                <div className="p-8 sm:p-10 space-y-4">
                  {questaoAtual.opcoes.map((opcao, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = questaoAtual.correta === idx;
                    const showFeedback = hasAnswered;
                    
                    let optionClass = "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300";
                    let letterClass = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";

                    if (showFeedback) {
                      if (isCorrect) {
                        optionClass = "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm";
                        letterClass = "bg-emerald-500 text-white shadow-md shadow-emerald-500/20";
                      } else if (isSelected && !isCorrect) {
                        optionClass = "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500 text-red-900 dark:text-red-100";
                        letterClass = "bg-red-500 text-white";
                      } else {
                        optionClass = "border-slate-200 dark:border-slate-700 opacity-50";
                      }
                    } else if (isSelected) {
                      optionClass = "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20 text-indigo-900 dark:text-indigo-100";
                      letterClass = "bg-indigo-500 text-white";
                    }

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => selecionarResposta(idx)}
                        disabled={hasAnswered}
                        className={`w-full p-5 rounded-[16px] border-2 text-left transition-all duration-200 flex items-center gap-5 ${optionClass} ${
                          hasAnswered ? 'cursor-default' : 'cursor-pointer'
                        }`}
                        whileHover={!hasAnswered ? { scale: 1.01 } : {}}
                        whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[16px] shrink-0 transition-colors ${letterClass}`}>
                          {showFeedback && isCorrect ? (
                            <CheckCircle size={20} strokeWidth={2.5} />
                          ) : showFeedback && isSelected && !isCorrect ? (
                            <XCircle size={20} strokeWidth={2.5} />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </div>
                        <span className="text-[16px] font-medium leading-snug">
                          {opcao}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explicação Premium */}
                <AnimatePresence>
                  {hasAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t border-slate-100 dark:border-slate-700 overflow-hidden bg-indigo-50/50 dark:bg-indigo-900/10"
                    >
                      <div className="p-8 sm:p-10">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                            <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                              Explicação Didática
                            </p>
                            <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                              {questaoAtual.explicacao}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={questaoAnterior}
                  disabled={currentIndex === 0}
                  leftIcon={<ArrowLeft size={20} />}
                  className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl h-14 px-6 text-[15px]"
                >
                  Anterior
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={proximaQuestao}
                  disabled={!hasAnswered}
                  rightIcon={currentIndex === questoes.length - 1 ? <Trophy size={20} /> : <ArrowRight size={20} />}
                  className="bg-indigo-600 shadow-lg shadow-indigo-500/25 rounded-2xl h-14 px-8 text-[15px] font-bold"
                >
                  {currentIndex === questoes.length - 1 ? 'Ver Resultado Final' : 'Avançar para a Próxima'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* === FASE: RESULTADO PREMIUM === */}
          {fase === 'resultado' && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="max-w-2xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[32px] border border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-10 sm:p-14 text-center overflow-hidden relative"
            >
              {/* Confetti / Glow background */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[80px] ${
                  percentual >= 80 ? 'bg-amber-400' : percentual >= 60 ? 'bg-indigo-400' : 'bg-slate-400'
                }`} />
              </div>

              <motion.div
                className={`relative w-32 h-32 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl z-10 ${
                  percentual >= 80
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300'
                    : percentual >= 60
                    ? 'bg-gradient-to-br from-indigo-500 to-teal-400 border border-indigo-400'
                    : 'bg-gradient-to-br from-slate-400 to-slate-600 border border-slate-300'
                }`}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
              >
                <Trophy size={60} color="#fff" strokeWidth={1.5} />
              </motion.div>

              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight relative z-10">
                {percentual >= 80 ? 'Excelente! 🎉' : percentual >= 60 ? 'Muito Bom! 👏' : 'Continue Estudando! 💪'}
              </h2>

              <p className="text-[16px] text-slate-600 dark:text-slate-300 mb-10 font-medium relative z-10">
                Você acertou <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{acertos}</span> de{' '}
                <span className="font-bold text-lg">{questoes.length}</span> questões sobre{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{tema}</span>.
              </p>

              {/* Barra de desempenho Gorda */}
              <div className="mb-10 relative z-10">
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-sm mx-auto shadow-inner">
                  <motion.div
                    className={`h-full rounded-full ${
                      percentual >= 80 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : percentual >= 60 ? 'bg-gradient-to-r from-indigo-500 to-teal-400' : 'bg-slate-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentual}%` }}
                    transition={{ delay: 0.3, duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
                <motion.p 
                  className="text-4xl font-black mt-4 tracking-tighter"
                  style={{ color: percentual >= 80 ? '#f59e0b' : percentual >= 60 ? '#6366f1' : '#94a3b8' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {percentual}%
                </motion.p>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={reiniciar}
                  leftIcon={<RotateCcw size={20} />}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 h-14 rounded-[16px] text-[15px] font-bold border-none"
                >
                  Novo Tema
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={novoSimulado}
                  leftIcon={<RefreshCw size={20} />}
                  className="flex-[1.5] bg-indigo-600 h-14 rounded-[16px] text-[15px] font-bold shadow-lg shadow-indigo-500/20 border-none"
                >
                  Mais Questões ({tema})
                </Button>
              </div>
              <div className="mt-6 flex justify-center relative z-10">
                <button
                  onClick={() => navigate('/historico-simulados')}
                  className="flex items-center gap-2 text-[14px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <History size={16} /> Ver Histórico Completo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Simulado;