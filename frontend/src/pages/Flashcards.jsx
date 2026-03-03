/**
 * 🎴 FLASHCARDS - Gerenciamento e Modo Estudo Premium
 * 
 * Features:
 * - CORREÇÃO: Salva materiaNome e materiaCor junto com materiaId
 * - Filtro por matéria
 * - Grid de cards com flip 3D
 * - NOVO: Modo Estudo Imersivo (Quiz)
 * - Animações fluidas com framer-motion
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  CreditCard, 
  ImageIcon,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { 
  listarFlashcards, 
  criarFlashcard, 
  atualizarFlashcard, 
  deletarFlashcard,
  listarMateriasSimples
} from '../services/firebaseService';
import { compressImage } from '../utils/imageCompressor';
import TagInput from '../components/TagInput';
import { calculateSM2, isDueForReview, getNextReviewLabel } from '../utils/sm2';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import FlashcardItem from '../components/FlashcardItem';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';
import { isTypingInInput } from '../utils/keyboard';

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.15 } 
  }
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.9
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
  },
  exit: (direction) => ({
    x: direction < 0 ? 400 : -400,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.3 }
  })
};

function Flashcards() {
  const { user } = useAuth();
  const location = useLocation();
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsFiltrados, setFlashcardsFiltrados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [formData, setFormData] = useState({
    pergunta: '',
    resposta: '',
    materiaId: '',
    materiaNome: '',
    materiaCor: '',
    tags: []
  });
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [error, setError] = useState(null);

  // Estado do Modal de Confirmação
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado do Modo Estudo
  const [modoEstudo, setModoEstudo] = useState(false);
  const [modoRevisao, setModoRevisao] = useState(false); // SM-2 review mode
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStudyFlipped, setIsStudyFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);
  const [studyCards, setStudyCards] = useState([]); // cards being studied
  const [reviewStats, setReviewStats] = useState({ easy: 0, medium: 0, hard: 0 }); // session stats

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  // Filtrar flashcards quando mudar a matéria selecionada
  useEffect(() => {
    let filtered = flashcards;
    if (selectedMateria !== 'all') {
      filtered = filtered.filter(fc => fc.materiaId === selectedMateria);
    }
    if (selectedTag !== 'all') {
      filtered = filtered.filter(fc => fc.tags && fc.tags.includes(selectedTag));
    }
    setFlashcardsFiltrados(filtered);
  }, [selectedMateria, selectedTag, flashcards]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.uid;
      const [flashcardsData, materiasData] = await Promise.all([
        listarFlashcards(userId),
        listarMateriasSimples(userId)
      ]);
      
      // Enriquecer flashcards com dados da matéria se não tiverem
      const flashcardsEnriquecidos = flashcardsData.map(fc => {
        if (fc.materiaNome && fc.materiaCor) return fc;
        const materia = materiasData.find(m => m.id === fc.materiaId);
        return {
          ...fc,
          materiaNome: fc.materiaNome || materia?.nome || 'Sem matéria',
          materiaCor: fc.materiaCor || materia?.cor || '#94A3B8'
        };
      });
      
      setFlashcards(flashcardsEnriquecidos);
      setFlashcardsFiltrados(flashcardsEnriquecidos);
      setMaterias(materiasData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-iniciar modo revisão se vindo do Home
  useEffect(() => {
    if (location.state?.reviewMode && flashcards.length > 0 && !modoEstudo) {
      iniciarModoEstudo(true);
      // Limpar o state para não re-ativar no re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state, flashcards.length]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 10MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas.');
      return;
    }

    try {
      setCompressingImage(true);
      const base64Data = await compressImage(file);
      setSelectedImageFile(base64Data);
      setImagePreview(base64Data);
      setError(null);
    } catch (err) {
      setError('Erro ao processar imagem');
      console.error(err);
    } finally {
      setCompressingImage(false);
    }
  };

  // CORREÇÃO: Buscar dados completos da matéria ao selecionar
  const handleMateriaChange = (e) => {
    const materiaId = e.target.value;
    const materia = materias.find(m => m.id === materiaId);
    
    setFormData({
      ...formData,
      materiaId: materiaId,
      materiaNome: materia?.nome || '',
      materiaCor: materia?.cor || '#94A3B8'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pergunta.trim() || !formData.resposta.trim()) {
      setError('Pergunta e resposta são obrigatórias');
      return;
    }

    if (!formData.materiaId) {
      setError('Selecione uma matéria');
      return;
    }

    try {
      const userId = user?.id || user?.uid;
      
      // CORREÇÃO: Enviar materiaNome e materiaCor junto
      const dadosFlashcard = {
        pergunta: formData.pergunta,
        resposta: formData.resposta,
        materiaId: formData.materiaId,
        materiaNome: formData.materiaNome,
        materiaCor: formData.materiaCor,
        tags: formData.tags || []
      };

      if (editingId) {
        await atualizarFlashcard(editingId, dadosFlashcard, selectedImageFile);
      } else {
        await criarFlashcard(dadosFlashcard, selectedImageFile, userId);
      }
      
      await carregarDados();
      resetForm();
      setError(null);
      toast.success(editingId ? 'Flashcard atualizado!' : 'Flashcard criado com sucesso!');
    } catch (err) {
      setError('Erro ao salvar flashcard');
      toast.error('Não foi possível salvar o flashcard.');
      console.error(err);
    }
  };

  const handleEdit = (flashcard) => {
    setFormData({
      pergunta: flashcard.pergunta,
      resposta: flashcard.resposta,
      materiaId: flashcard.materiaId || '',
      materiaNome: flashcard.materiaNome || '',
      materiaCor: flashcard.materiaCor || '#94A3B8',
      tags: flashcard.tags || []
    });
    setEditingId(flashcard.id);
    setImagePreview(flashcard.imagemUrl || null);
    setSelectedImageFile(flashcard.imagemUrl || null);
    setShowModal(true);
  };

  const handleDelete = (flashcard) => {
    setConfirmDelete({
      isOpen: true,
      id: flashcard.id,
      nome: flashcard.pergunta.substring(0, 50) + (flashcard.pergunta.length > 50 ? '...' : '')
    });
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id) return;
    
    setIsDeleting(true);
    try {
      await deletarFlashcard(confirmDelete.id);
      await carregarDados();
      setError(null);
      toast.success('Flashcard excluído com sucesso.');
    } catch (err) {
      setError('Erro ao excluir flashcard');
      toast.error('Não foi possível excluir o flashcard.');
      console.error(err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  const resetForm = useCallback(() => {
    setFormData({ pergunta: '', resposta: '', materiaId: '', materiaNome: '', materiaCor: '', tags: [] });
    setEditingId(null);
    setImagePreview(null);
    setSelectedImageFile(null);
    setShowModal(false);
  }, []);

  // ==================== IMPORTAR CSV ====================
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvMateriaId, setCsvMateriaId] = useState('');
  const csvInputRef = React.useRef(null);

  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      // Detect separator: ; or , or \t
      const sep = lines[0]?.includes(';') ? ';' : lines[0]?.includes('\t') ? '\t' : ',';
      const parsed = lines
        .map(line => {
          const parts = line.split(sep).map(p => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 2) return { pergunta: parts[0], resposta: parts[1] };
          return null;
        })
        .filter(Boolean);
      // Skip header if it looks like a header
      const first = parsed[0];
      if (first && (first.pergunta.toLowerCase().includes('pergunta') || first.pergunta.toLowerCase().includes('front'))) {
        parsed.shift();
      }
      setCsvPreview(parsed);
      setShowCsvModal(true);
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const importCsv = async () => {
    if (csvPreview.length === 0 || !csvMateriaId) {
      toast.error('Selecione uma matéria para importar.');
      return;
    }
    setCsvImporting(true);
    const materia = materias.find(m => m.id === csvMateriaId);
    const userId = user?.id || user?.uid;
    let success = 0;
    try {
      for (const row of csvPreview) {
        await criarFlashcard({
          pergunta: row.pergunta,
          resposta: row.resposta,
          materiaId: csvMateriaId,
          materiaNome: materia?.nome || '',
          materiaCor: materia?.cor || '#94A3B8',
        }, null, userId);
        success++;
      }
      await carregarDados();
      toast.success(`${success} flashcards importados com sucesso!`);
      setShowCsvModal(false);
      setCsvPreview([]);
      setCsvMateriaId('');
    } catch (err) {
      toast.error(`Erro ao importar. ${success} de ${csvPreview.length} importados.`);
      console.error(err);
    } finally {
      setCsvImporting(false);
    }
  };

  // ==================== MODO ESTUDO ====================
  
  const iniciarModoEstudo = (reviewOnly = false) => {
    let cards = flashcardsFiltrados;
    if (reviewOnly) {
      cards = flashcardsFiltrados.filter(fc => isDueForReview(fc));
      if (cards.length === 0) {
        toast.info('Nenhum card pendente para revisão hoje! 🎉');
        return;
      }
    }
    if (cards.length === 0) {
      setError('Nenhum flashcard disponível para estudar');
      return;
    }
    setStudyCards(cards);
    setCurrentIndex(0);
    setIsStudyFlipped(false);
    setSlideDirection(0);
    setModoRevisao(reviewOnly);
    setReviewStats({ easy: 0, medium: 0, hard: 0 });
    setModoEstudo(true);
  };

  const fecharModoEstudo = () => {
    setModoEstudo(false);
    setModoRevisao(false);
    setCurrentIndex(0);
    setIsStudyFlipped(false);
    setStudyCards([]);
    setReviewStats({ easy: 0, medium: 0, hard: 0 });
  };

  // SM-2 rating handler
  const handleSM2Rating = async (quality) => {
    const card = studyCards[currentIndex];
    if (!card) return;

    const reps = card.repetitions || 0;
    const interval = card.interval || 0;
    const ef = card.easeFactor || 2.5;

    const result = calculateSM2(quality, reps, interval, ef);

    // Update stats
    if (quality >= 5) setReviewStats(s => ({ ...s, easy: s.easy + 1 }));
    else if (quality >= 3) setReviewStats(s => ({ ...s, medium: s.medium + 1 }));
    else setReviewStats(s => ({ ...s, hard: s.hard + 1 }));

    try {
      // Update Firestore
      await atualizarFlashcard(card.id, {
        interval: result.interval,
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        nextReviewDate: result.nextReviewDate,
      });

      // Update local state
      const updatedCards = [...studyCards];
      updatedCards[currentIndex] = {
        ...card,
        ...result,
      };
      setStudyCards(updatedCards);

      // Also update main flashcards list
      setFlashcards(prev => prev.map(fc => 
        fc.id === card.id ? { ...fc, ...result } : fc
      ));
    } catch (err) {
      console.error('Erro ao salvar avaliação SM-2:', err);
      toast.error('Erro ao salvar progresso do card.');
    }

    // Move to next card or finish
    if (currentIndex < studyCards.length - 1) {
      setSlideDirection(1);
      setIsStudyFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session complete
      const total = reviewStats.easy + reviewStats.medium + reviewStats.hard + 1;
      toast.success(`Sessão concluída! ${total} cards revisados 🎉`);
      fecharModoEstudo();
      carregarDados(); // refresh to get updated nextReviewDate
    }
  };

  const pendingReviewCount = useMemo(() => {
    return flashcards.filter(fc => isDueForReview(fc)).length;
  }, [flashcards]);

  const proximoCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setSlideDirection(1);
      setIsStudyFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const cardAnterior = () => {
    if (currentIndex > 0) {
      setSlideDirection(-1);
      setIsStudyFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const flipStudyCard = useCallback(() => {
    setIsStudyFlipped(prev => !prev);
  }, []);

  // Atalhos de teclado para o Modo Estudo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modoEstudo) return;
      // 🛡️ Guard: não interceptar teclas mentre usuario digita em campo de texto
      if (isTypingInInput()) return;
      
      switch (e.key) {
        case 'ArrowRight':
          if (currentIndex < studyCards.length - 1) {
            setSlideDirection(1);
            setIsStudyFlipped(false);
            setCurrentIndex(prev => prev + 1);
          }
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setSlideDirection(-1);
            setIsStudyFlipped(false);
            setCurrentIndex(prev => prev - 1);
          }
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          setIsStudyFlipped(prev => !prev);
          break;
        case '1':
          if (isStudyFlipped) { e.preventDefault(); handleSM2Rating(1); }
          break;
        case '2':
          if (isStudyFlipped) { e.preventDefault(); handleSM2Rating(3); }
          break;
        case '3':
          if (isStudyFlipped) { e.preventDefault(); handleSM2Rating(5); }
          break;
        case 'Escape':
          setModoEstudo(false);
          setCurrentIndex(0);
          setIsStudyFlipped(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modoEstudo, currentIndex, studyCards.length, isStudyFlipped]);

  const currentFlashcard = studyCards[currentIndex];
  const progressPercent = studyCards.length > 0 
    ? ((currentIndex + 1) / studyCards.length) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen pb-32 pt-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <div className="h-8 w-48 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
                <div className="h-4 w-64 bg-slate-50 rounded-lg animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-12 w-32 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                <div className="h-12 w-36 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 animate-pulse">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="h-10 w-20 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                <div className="h-10 w-full sm:w-64 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                <div className="h-10 w-24 bg-slate-100 dark:bg-slate-700 rounded-lg ml-auto" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 ipad:grid-cols-2 ipad:lg:grid-cols-3 ipad:xl:grid-cols-4 gap-6 ipad:gap-8">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm h-72" style={{animationDelay:`${i*80}ms`}}>
                <div className="h-1 bg-slate-100 dark:bg-slate-700 animate-pulse" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-5 w-24 bg-blue-50 rounded-full animate-pulse" />
                    <div className="flex gap-1"><div className="w-8 h-8 bg-slate-50 rounded-lg animate-pulse" /><div className="w-8 h-8 bg-slate-50 rounded-lg animate-pulse" /></div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-3/5 bg-slate-50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="absolute bottom-5 left-0 right-0 text-center"><div className="h-3.5 w-32 bg-slate-50 rounded animate-pulse mx-auto" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center"
                >
                  <CreditCard size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                Meus Flashcards
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Crie e estude com flashcards interativos
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {pendingReviewCount > 0 && (
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<RotateCcw size={20} />}
                  onClick={() => iniciarModoEstudo(true)}
                >
                  Revisar ({pendingReviewCount})
                </Button>
              )}
              {flashcardsFiltrados.length > 0 && (
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Play size={20} />}
                  onClick={() => iniciarModoEstudo(false)}
                >
                  Modo Estudo
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Plus size={20} />}
                onClick={() => setShowModal(true)}
              >
                Novo Flashcard
              </Button>
              <div className="relative">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleCsvFile}
                />
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Upload size={18} />}
                  onClick={() => csvInputRef.current?.click()}
                  title="Importar CSV (pergunta;resposta)"
                >
                  <span className="hidden sm:inline">Importar CSV</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Barra de Filtros */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Filter size={18} className="text-primary-600 dark:text-primary-400" />
              Filtrar por:
            </div>
            <Select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
              className="w-full sm:w-64"
            >
              <option value="all">Todas as Matérias</option>
              {materias.map(materia => (
                <option key={materia.id} value={materia.id}>
                  {materia.nome}
                </option>
              ))}
            </Select>

            {/* Tag filter */}
            {(() => {
              const allTags = [...new Set(flashcards.flatMap(fc => fc.tags || []))].sort();
              return allTags.length > 0 ? (
                <Select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full sm:w-48"
                >
                  <option value="all">Todas as Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </Select>
              ) : null;
            })()}
            
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-bold text-slate-900 dark:text-white">{flashcardsFiltrados.length}</span> flashcard{flashcardsFiltrados.length !== 1 && 's'}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Grid de Flashcards */}
        {flashcardsFiltrados.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div 
              className="w-20 h-20 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center mx-auto mb-5"
            >
              <CreditCard size={40} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {selectedMateria === 'all' ? 'Pronto para memorizar? \u{1F9E0}' : 'Nenhum flashcard nesta mat\u00e9ria'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Flashcards são a melhor forma de fixar um conteúdo. Crie o primeiro e comece a revisar!
            </p>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
            >
              Criar Primeiro Flashcard
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {flashcardsFiltrados.map((flashcard) => (
                <motion.div
                  key={flashcard.id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <FlashcardItem
                    flashcard={flashcard}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Modal de Criação/Edição */}
        <Modal
          isOpen={showModal}
          onClose={resetForm}
          title={editingId ? 'Editar Flashcard' : 'Novo Flashcard'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CORREÇÃO: onChange usa handleMateriaChange */}
            <Select
              label="Matéria"
              value={formData.materiaId}
              onChange={handleMateriaChange}
              required
            >
              <option value="">Selecione uma matéria</option>
              {materias.map(materia => (
                <option key={materia.id} value={materia.id}>
                  {materia.nome}
                </option>
              ))}
            </Select>

            <Textarea
              label="Pergunta"
              placeholder="Digite a pergunta..."
              value={formData.pergunta}
              onChange={(e) => setFormData({ ...formData, pergunta: e.target.value })}
              onKeyDown={(e) => e.stopPropagation()}
              required
              rows={3}
            />

            <Textarea
              label="Resposta"
              placeholder="Digite a resposta..."
              value={formData.resposta}
              onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
              onKeyDown={(e) => e.stopPropagation()}
              required
              rows={4}
            />

            {/* Upload de Imagem */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Imagem (Opcional)
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary-500 transition-colors duration-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  disabled={compressingImage}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 rounded-lg object-cover shadow-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setImagePreview(null);
                          setSelectedImageFile(null);
                        }}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <ImageIcon size={28} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-medium">
                          {compressingImage ? 'Processando...' : 'Clique para adicionar imagem'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          PNG, JPG ou WEBP (máx. 10MB)
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tags (Opcional)
              </label>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Ex: anatomia, prova, importante..."
                suggestions={[...new Set(flashcards.flatMap(fc => fc.tags || []))]}
              />
            </div>

            {error && (
              <motion.div 
                className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={compressingImage}
              >
                {editingId ? 'Atualizar Flashcard' : 'Criar Flashcard'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={resetForm}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        {/* ==================== MODO ESTUDO IMERSIVO ==================== */}
        <AnimatePresence>
          {modoEstudo && currentFlashcard && (
            <motion.div
              className="fixed inset-0 z-50 bg-slate-900 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header do Modo Estudo */}
              <motion.div 
                className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/10"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center"
                  >
                    <BookOpen size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      {modoRevisao ? 'Revisão Programada' : 'Modo Estudo'}
                    </h2>
                    <p className="text-white/60 text-sm">
                      Card {currentIndex + 1} de {studyCards.length}
                      {modoRevisao && <span className="ml-2 text-amber-400">· SRS ativo</span>}
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={fecharModoEstudo}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={24} />
                </motion.button>
              </motion.div>

              {/* Barra de Progresso */}
              <div className="px-4 sm:px-8 py-3">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Card de Estudo Central */}
              <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 overflow-hidden">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={currentIndex}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full max-w-2xl"
                  >
                    <motion.div
                      className="relative perspective-1000 cursor-pointer"
                      onClick={flipStudyCard}
                      whileTap={{ scale: 0.98 }}
                      style={{ minHeight: 'min(400px, 60vh)' }}
                    >
                      <motion.div
                        className="relative w-full h-full"
                        animate={{ rotateY: isStudyFlipped ? 180 : 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* FRENTE - Pergunta */}
                        <div
                          className="absolute inset-0 backface-hidden rounded-3xl shadow-2xl p-6 sm:p-12 flex flex-col justify-between overflow-hidden"
                          style={{ 
                            backgroundColor: 'var(--bg-surface)',
                            backfaceVisibility: 'hidden',
                            minHeight: 'min(400px, 60vh)'
                          }}
                        >
                          <div>
                            <Badge color={currentFlashcard.materiaCor} size="md">
                              {currentFlashcard.materiaNome || 'Sem matéria'}
                            </Badge>
                            <div className="mt-8">
                              <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-3)' }}>
                                Pergunta
                              </p>
                              <h3 className="text-xl sm:text-3xl font-bold leading-relaxed line-clamp-6 overflow-hidden" style={{ color: 'var(--text-1)' }}>
                                {currentFlashcard.pergunta}
                              </h3>
                            </div>
                          </div>
                          
                          <motion.div 
                            className="text-center mt-8"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-2)' }}>
                              <RotateCcw size={16} />
                              Clique para virar
                            </div>
                          </motion.div>
                        </div>

                        {/* VERSO - Resposta */}
                        <div
                          className="absolute inset-0 backface-hidden bg-primary-600 rounded-3xl shadow-2xl p-6 sm:p-12 flex flex-col overflow-hidden"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            minHeight: 'min(400px, 60vh)'
                          }}
                        >
                          <div className="flex-1 overflow-y-auto">
                            <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-3">
                              Resposta
                            </p>
                            <p className="text-lg sm:text-2xl text-white leading-relaxed font-medium line-clamp-8 overflow-hidden">
                              {currentFlashcard.resposta}
                            </p>

                            {currentFlashcard.imagemUrl && (
                              <motion.div 
                                className="mt-6 rounded-2xl overflow-hidden shadow-lg"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                <img
                                  src={currentFlashcard.imagemUrl}
                                  alt="Imagem do flashcard"
                                  className="w-full max-h-48 object-cover"
                                />
                              </motion.div>
                            )}
                          </div>
                          
                          <div className="text-center mt-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white/90 text-sm font-medium">
                              <RotateCcw size={16} />
                              Clique para voltar
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controles de Navegação + SM-2 Rating */}
              <motion.div 
                className="px-4 sm:px-8 py-6 border-t border-white/10"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* SM-2 Rating Buttons — show after flip */}
                <AnimatePresence>
                  {isStudyFlipped && (
                    <motion.div
                      className="mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <p className="text-center text-white/50 text-xs mb-3 font-medium uppercase tracking-wider">
                        Como foi? (atalhos: 1, 2, 3)
                      </p>
                      <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
                        {/* Difícil */}
                        <motion.button
                          onClick={() => handleSM2Rating(1)}
                          className="flex-1 py-3.5 px-4 rounded-2xl font-semibold flex flex-col items-center gap-1.5 transition-all bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="text-lg">😰</span>
                          <span className="text-sm">Difícil</span>
                          <span className="text-[10px] opacity-60">
                            {getNextReviewLabel(1, currentFlashcard?.repetitions || 0, currentFlashcard?.interval || 0, currentFlashcard?.easeFactor || 2.5)}
                          </span>
                        </motion.button>

                        {/* Médio */}
                        <motion.button
                          onClick={() => handleSM2Rating(3)}
                          className="flex-1 py-3.5 px-4 rounded-2xl font-semibold flex flex-col items-center gap-1.5 transition-all bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="text-lg">😐</span>
                          <span className="text-sm">Médio</span>
                          <span className="text-[10px] opacity-60">
                            {getNextReviewLabel(3, currentFlashcard?.repetitions || 0, currentFlashcard?.interval || 0, currentFlashcard?.easeFactor || 2.5)}
                          </span>
                        </motion.button>

                        {/* Fácil */}
                        <motion.button
                          onClick={() => handleSM2Rating(5)}
                          className="flex-1 py-3.5 px-4 rounded-2xl font-semibold flex flex-col items-center gap-1.5 transition-all bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="text-lg">😄</span>
                          <span className="text-sm">Fácil</span>
                          <span className="text-[10px] opacity-60">
                            {getNextReviewLabel(5, currentFlashcard?.repetitions || 0, currentFlashcard?.interval || 0, currentFlashcard?.easeFactor || 2.5)}
                          </span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Standard navigation (only show if card is NOT flipped) */}
                {!isStudyFlipped && (
                  <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
                    <motion.button
                      onClick={cardAnterior}
                      disabled={currentIndex === 0}
                      className={`flex-1 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                        currentIndex === 0
                          ? 'bg-white/5 text-white/30 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      whileHover={currentIndex !== 0 ? { scale: 1.02 } : {}}
                      whileTap={currentIndex !== 0 ? { scale: 0.98 } : {}}
                    >
                      <ChevronLeft size={20} />
                      Anterior
                    </motion.button>

                    <motion.button
                      onClick={proximoCard}
                      disabled={currentIndex === studyCards.length - 1}
                      className={`flex-1 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                        currentIndex === studyCards.length - 1
                          ? 'bg-white/5 text-white/30 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                      }`}
                      whileHover={currentIndex !== studyCards.length - 1 ? { scale: 1.02 } : {}}
                      whileTap={currentIndex !== studyCards.length - 1 ? { scale: 0.98 } : {}}
                    >
                      Próximo
                      <ChevronRight size={20} />
                    </motion.button>
                  </div>
                )}

                <p className="text-center text-white/40 text-sm mt-4">
                  {isStudyFlipped 
                    ? 'Avalie sua resposta · Espaço para voltar à pergunta'
                    : 'Use as setas ← → ou barra de espaço para navegar'
                  }
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSS para efeito 3D */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        /* Study mode — responsive card sizing */
        @media (max-width: 640px) {
          .perspective-1000 {
            min-height: 300px !important;
          }
        }
      `}</style>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
        onConfirm={confirmarExclusao}
        title="Excluir Flashcard"
        itemName={confirmDelete.nome}
        confirmText="Excluir"
        isLoading={isDeleting}
        type="danger"
      />

      {/* Modal de Importação CSV */}
      <AnimatePresence>
        {showCsvModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCsvModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Importar Flashcards
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {csvPreview.length} flashcard{csvPreview.length !== 1 ? 's' : ''} encontrado{csvPreview.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowCsvModal(false)}
                  className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                >
                  <X size={18} className="text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Select matéria */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                    Matéria para importar *
                  </label>
                  <Select value={csvMateriaId} onChange={(e) => setCsvMateriaId(e.target.value)}>
                    <option value="">Selecione uma matéria...</option>
                    {materias.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </Select>
                </div>

                {/* Preview table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-medium">#</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-medium">Pergunta</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-medium">Resposta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                          <td className="px-3 py-2 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-3 py-2 text-slate-900 dark:text-white truncate max-w-[200px]">{row.pergunta}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{row.resposta}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > 20 && (
                    <div className="px-3 py-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                      ... e mais {csvPreview.length - 20} flashcards
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowCsvModal(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={importCsv}
                  disabled={csvImporting || !csvMateriaId}
                  leftIcon={csvImporting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RotateCcw size={16} /></motion.div> : <Upload size={16} />}
                >
                  {csvImporting ? 'Importando...' : `Importar ${csvPreview.length} cards`}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Flashcards;
