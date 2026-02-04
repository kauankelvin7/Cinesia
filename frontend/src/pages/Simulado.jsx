/**
 * 🧠 SIMULADO INFINITO - Gerador de Provas com IA
 * 
 * Gera questões de múltipla escolha usando Google Gemini
 * Features:
 * - Escolha de tema livre OU upload de PDF
 * - 5 questões por simulado
 * - Feedback imediato (certo/errado)
 * - Explicação após resposta
 * - Placar final
 * 
 * v2.0 - Upload de PDF com pdfjs-dist
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  RotateCcw,
  Trophy,
  Loader2,
  AlertTriangle,
  Target,
  Zap,
  FileText,
  Upload,
  X,
  File
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// 📄 Configurar worker do PDF.js v5+ para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// 🤖 MULTI-MODEL FALLBACK ARRAY (Zero Config Strategy)
// Modelos estáveis ordenados por preferência - SEM systemInstruction
// Se um modelo falhar (429/404/400), tenta o próximo automaticamente
const MODEL_CANDIDATES = [
  'gemini-1.5-flash',           // Mais estável e compatível
  'gemini-1.5-flash-001',       // Versão específica
  'gemini-pro'                  // Fallback clássico
];

// Prompt para gerar questões por TEMA
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

// Temas sugeridos para Fisioterapia
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
  // Estados principais
  const [tema, setTema] = useState('');
  const [questoes, setQuestoes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fase, setFase] = useState('setup'); // 'setup' | 'quiz' | 'resultado'
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  // 📄 Estados para Upload de PDF
  const [activeTab, setActiveTab] = useState('tema'); // 'tema' | 'arquivo'
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * 📄 Extrair texto do PDF usando pdfjs-dist
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
      throw new Error(errorMsg);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  /**
   * 📁 Handler para seleção de arquivo
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
    } catch {
      setPdfFile(null);
    }
  };

  /**
   * 🖱️ Handlers de Drag & Drop
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
   * 🔥 HIGHLANDER STRATEGY: Gera conteúdo tentando múltiplos modelos
   * Se um falhar (429/404), tenta o próximo automaticamente
   * Só lança erro se TODOS falharem
   * LÓGICA IDÊNTICA AO KAKABOT
   */
  const generateWithFallback = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // 🔍 DEBUG: Log visual da API Key
    console.log('🔑 [Simulado] API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'AUSENTE');
    
    if (!apiKey) {
      throw new Error('API Key do Gemini não configurada. Adicione VITE_GEMINI_API_KEY no Vercel (Settings → Environment Variables) e faça Redeploy.');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const errors = [];
    
    for (const modelName of MODEL_CANDIDATES) {
      try {
        console.log(`🤖 [Simulado] Tentando modelo: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        console.log(`✅ [Simulado] Modelo ${modelName} funcionou!`);
        // Modelo funcionou! Retorna o texto
        return result.response.text();
      } catch (err) {
        const status = err?.status || err?.code || '';
        const message = err?.message || 'erro desconhecido';
        console.warn(`❌ [Simulado] Modelo ${modelName} falhou:`, status, message);
        errors.push(`${modelName}: ${status} - ${message}`);
        
        // Erros que indicam "tente o próximo modelo"
        const isRecoverable = 
          status === 400 ||  // Bad Request - modelo incompatível
          status === 429 || 
          status === 404 || 
          status === 503 ||
          message.includes('quota') || 
          message.includes('not found') ||
          message.includes('not supported') ||
          message.includes('unavailable') ||
          message.includes('invalid');
        
        if (isRecoverable) {
          // Pula para o próximo modelo silenciosamente
          continue;
        }
        // Para outros erros, também tenta o próximo
        continue;
      }
    }
    
    // Se chegou aqui, todos falharam
    throw new Error(`Todos os ${MODEL_CANDIDATES.length} modelos falharam. Aguarde alguns minutos e tente novamente.`);
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
      
      // 🧹 Limpar a resposta (remover possíveis marcadores markdown)
      let cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // 🔍 Tentar fazer parse do JSON (com extração segura)
      let parsedQuestions;
      try {
        parsedQuestions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // Regex robusto para extrair array JSON de qualquer posição
        const jsonMatch = cleanedResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          try {
            parsedQuestions = JSON.parse(jsonMatch[0]);
          } catch (innerError) {
            throw new Error('A IA retornou JSON malformado. Tente novamente.');
          }
        } else {
          throw new Error('A IA não retornou um formato válido. Tente outro tema.');
        }
      }

      // Validar estrutura
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error('Nenhuma questão foi gerada. Tente outro tema.');
      }

      // Validar cada questão
      const validQuestions = parsedQuestions.filter(q => 
        q.pergunta && 
        Array.isArray(q.opcoes) && 
        q.opcoes.length >= 2 &&
        typeof q.correta === 'number' &&
        q.explicacao
      );

      if (validQuestions.length === 0) {
        throw new Error('As questões geradas estão em formato inválido.');
      }

      setQuestoes(validQuestions);
      setFase('quiz');
      setCurrentIndex(0);
      setRespostas({});
      setSelectedOption(null);
      setHasAnswered(false);
      
    } catch (err) {
      console.error('Erro ao gerar questões:', err);
      setError(err.message || 'Erro ao gerar questões. Verifique sua conexão e tente novamente.');
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
      setFase('resultado');
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
    // Limpar estados do PDF
    setPdfFile(null);
    setPdfText('');
    setActiveTab('tema');
    setTema('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Novo simulado (mesmo tema)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 pb-32 pt-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <BookOpen size={32} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Simulado Infinito
              </h1>
              <p className="text-slate-600 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                Questões geradas por IA para seu estudo
              </p>
            </div>
          </div>
        </motion.div>

        {/* === FASE: SETUP === */}
        <AnimatePresence mode="wait">
          {fase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Target size={40} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Gere Questões com IA
                </h2>
                <p className="text-slate-600">
                  Escolha um tema ou faça upload de um PDF
                </p>
              </div>

              {/* 📑 ABAS: Por Tema / Por Arquivo */}
              <div className="flex mb-6 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('tema')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'tema'
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen size={18} />
                  Por Tema
                </button>
                <button
                  onClick={() => setActiveTab('arquivo')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'arquivo'
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={18} />
                  Por Arquivo PDF
                </button>
              </div>

              <div className="space-y-6">
                {/* === CONTEÚDO DA ABA TEMA === */}
                {activeTab === 'tema' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Tema do Simulado
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: Anatomia do Quadril, Propriocepção, AVE..."
                        value={tema}
                        onChange={(e) => setTema(e.target.value)}
                        className="text-lg"
                      />
                    </div>

                    {/* Temas Sugeridos */}
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-3">
                        Sugestões populares:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {temasSugeridos.map((t, idx) => (
                          <motion.button
                            key={idx}
                            onClick={() => setTema(t)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              tema === t
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {t}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* === CONTEÚDO DA ABA ARQUIVO PDF === */}
                {activeTab === 'arquivo' && (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {!pdfFile ? (
                      /* Dropzone */
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          isDragOver
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Upload size={32} className="text-indigo-600" />
                        </div>
                        <p className="text-slate-700 font-semibold mb-2">
                          Arraste um PDF aqui ou clique para selecionar
                        </p>
                        <p className="text-sm text-slate-500">
                          Apostilas, capítulos de livros, artigos... (máx. 20MB)
                        </p>
                      </div>
                    ) : (
                      /* Arquivo selecionado */
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <File size={24} className="text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                                {pdfFile.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                {pdfText && (
                                  <span className="text-green-600 ml-2">
                                    ✓ {pdfText.length.toLocaleString()} caracteres extraídos
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={removeFile}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remover arquivo"
                          >
                            <X size={20} className="text-red-500" />
                          </button>
                        </div>
                        
                        {isExtractingPdf && (
                          <div className="mt-4 flex items-center gap-2 text-indigo-600">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">Extraindo texto do PDF...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={gerarQuestoes}
                  disabled={isLoading || isExtractingPdf || (activeTab === 'tema' ? !tema.trim() : !pdfText)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  leftIcon={isLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                >
                  {isLoading ? 'Gerando Questões...' : 'Iniciar Simulado'}
                </Button>
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
            >
              {/* Barra de Progresso */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">
                    Questão {currentIndex + 1} de {questoes.length}
                  </span>
                  <span className="text-sm font-bold text-indigo-600">
                    {tema}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>

              {/* Card da Questão */}
              <motion.div
                className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
                layout
              >
                {/* Pergunta */}
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-bold">{currentIndex + 1}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed">
                      {questaoAtual.pergunta}
                    </h3>
                  </div>
                </div>

                {/* Opções */}
                <div className="p-6 sm:p-8 space-y-3">
                  {questaoAtual.opcoes.map((opcao, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = questaoAtual.correta === idx;
                    const showFeedback = hasAnswered;
                    
                    let optionStyle = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50';
                    if (showFeedback) {
                      if (isCorrect) {
                        optionStyle = 'border-emerald-500 bg-emerald-50';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-red-500 bg-red-50';
                      } else {
                        optionStyle = 'border-slate-200 opacity-60';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-indigo-500 bg-indigo-50';
                    }

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => selecionarResposta(idx)}
                        disabled={hasAnswered}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${optionStyle} ${
                          hasAnswered ? 'cursor-default' : 'cursor-pointer'
                        }`}
                        whileHover={!hasAnswered ? { scale: 1.01 } : {}}
                        whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            showFeedback && isCorrect
                              ? 'bg-emerald-500 text-white'
                              : showFeedback && isSelected && !isCorrect
                              ? 'bg-red-500 text-white'
                              : isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {showFeedback && isCorrect ? (
                              <CheckCircle size={18} />
                            ) : showFeedback && isSelected && !isCorrect ? (
                              <XCircle size={18} />
                            ) : (
                              String.fromCharCode(65 + idx)
                            )}
                          </div>
                          <span className={`flex-1 ${
                            showFeedback && isCorrect
                              ? 'text-emerald-800 font-medium'
                              : showFeedback && isSelected && !isCorrect
                              ? 'text-red-800'
                              : 'text-slate-700'
                          }`}>
                            {opcao}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explicação (após responder) */}
                <AnimatePresence>
                  {hasAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-indigo-50/30">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={18} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-indigo-600 mb-1">
                              Explicação
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                              {questaoAtual.explicacao}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navegação */}
                <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                  <Button
                    variant="secondary"
                    onClick={questaoAnterior}
                    disabled={currentIndex === 0}
                    leftIcon={<ArrowLeft size={18} />}
                  >
                    Anterior
                  </Button>

                  <Button
                    variant="primary"
                    onClick={proximaQuestao}
                    disabled={!hasAnswered}
                    rightIcon={currentIndex === questoes.length - 1 ? <Trophy size={18} /> : <ArrowRight size={18} />}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    {currentIndex === questoes.length - 1 ? 'Ver Resultado' : 'Próxima'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* === FASE: RESULTADO === */}
          {fase === 'resultado' && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 p-8 text-center"
            >
              {/* Ícone de troféu animado */}
              <motion.div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                  percentual >= 80
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30'
                    : percentual >= 60
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/30'
                }`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Trophy size={48} className="text-white" />
              </motion.div>

              <motion.h2
                className="text-3xl font-bold text-slate-900 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {percentual >= 80
                  ? 'Excelente! 🎉'
                  : percentual >= 60
                  ? 'Muito Bom! 👏'
                  : 'Continue Estudando! 💪'}
              </motion.h2>

              <motion.p
                className="text-slate-600 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Você acertou <span className="font-bold text-indigo-600">{acertos}</span> de{' '}
                <span className="font-bold">{questoes.length}</span> questões sobre{' '}
                <span className="font-semibold text-slate-900">{tema}</span>
              </motion.p>

              {/* Barra de desempenho */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden max-w-md mx-auto">
                  <motion.div
                    className={`h-full rounded-full ${
                      percentual >= 80
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : percentual >= 60
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                        : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentual}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-3">{percentual}%</p>
              </motion.div>

              {/* Botões de ação */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={reiniciar}
                  leftIcon={<RotateCcw size={18} />}
                >
                  Novo Tema
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={novoSimulado}
                  leftIcon={<Sparkles size={18} />}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  Mais Questões ({tema})
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Simulado;
