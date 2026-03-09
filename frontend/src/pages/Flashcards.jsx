/**
 * 🎴 FLASHCARDS - Gerenciamento e Modo Estudo Premium
 * * Features:
 * - CORREÇÃO: Salva materiaNome e materiaCor junto com materiaId
 * - Filtro por matéria
 * - Grid de cards com flip 3D
 * - NOVO: Modo Estudo Imersivo (Quiz)
 * - Animações fluidas com framer-motion
 * - Correção: Responsividade da barra de filtros (overflow resolvido)
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
  Sparkles
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
  hidden: { opacity: 0, y: 15, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
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
    scale: 0.92
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }
  },
  exit: (direction) => ({
    x: direction < 0 ? 400 : -400,
    opacity: 0,
    scale: 0.92,
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

  // Suporte para filterMateria vindo de Matérias
  useEffect(() => {
    if (location.state?.filterMateria) {
      setSelectedMateria(location.state.filterMateria);
      window.history.replaceState({}, document.title);
    }
    if (location.state?.reviewMode) {
      setModoRevisao(true);
    }
  }, [location.state]);

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
    
    setFormData(prev => ({
      ...prev,
      materiaId: materiaId,
      materiaNome: materia?.nome || '',
      materiaCor: materia?.cor || '#94A3B8'
    }));
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
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                  <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                </div>
                <div className="h-4 w-64 bg-slate-50 dark:bg-slate-800/30 rounded-lg animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-12 w-32 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="h-12 w-36 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 animate-pulse">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="h-12 w-24 bg-slate-50 dark:bg-slate-700/30 rounded-xl" />
                <div className="h-12 w-full sm:w-64 bg-slate-50 dark:bg-slate-700/30 rounded-xl" />
                <div className="h-12 w-28 bg-slate-50 dark:bg-slate-700/30 rounded-xl ml-auto" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 ipad:grid-cols-2 ipad:lg:grid-cols-3 ipad:xl:grid-cols-4 gap-6 ipad:gap-8">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm h-[280px] overflow-hidden" style={{animationDelay:`${i*80}ms`}}>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700/50 animate-pulse" />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="h-6 w-28 bg-blue-50 dark:bg-blue-900/20 rounded-full animate-pulse" />
                    <div className="flex gap-1.5"><div className="w-8 h-8 bg-slate-50 dark:bg-slate-700/30 rounded-lg animate-pulse" /><div className="w-8 h-8 bg-slate-50 dark:bg-slate-700/30 rounded-lg animate-pulse" /></div>
                  </div>
                  <div className="space-y-2.5 mt-6">
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-700/40 rounded-md animate-pulse" />
                    <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-700/40 rounded-md animate-pulse" />
                    <div className="h-4 w-3/5 bg-slate-50 dark:bg-slate-700/20 rounded-md animate-pulse" />
                  </div>
                </div>
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
        
        {/* Header Premium (INTOCADO OS BOTOES CONFORME PEDIDO) */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
                <div className="w-12 h-12 shrink-0 rounded-[14px] bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <CreditCard size={24} className="text-white" strokeWidth={2} />
                </div>
                <span className="truncate">Meus Flashcards</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium ml-1 sm:ml-16 lg:ml-1">
                Crie cartas, memorize conteúdos e não esqueça de revisar.
              </p>
            </div>
            
            {/* GRUPO DE BOTÕES (INTOCADO) */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
              {pendingReviewCount > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<RotateCcw size={18} />}
                  onClick={() => iniciarModoEstudo(true)}
                  className="w-full sm:flex-1 lg:flex-none justify-center bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                  Revisar
                  <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm">
                    {pendingReviewCount}
                  </span>
                </Button>
              )}
              {flashcardsFiltrados.length > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Play size={18} className="ml-0.5" />}
                  onClick={() => iniciarModoEstudo(false)}
                  className="w-full sm:flex-1 lg:flex-none justify-center shadow-sm"
                >
                  Modo Estudo
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={20} />}
                onClick={() => setShowModal(true)}
                className="w-full sm:flex-1 lg:flex-none justify-center shadow-md bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 border-none"
              >
                Novo Flashcard
              </Button>
            </div>
          </div>

          {/* === AQUI FOI AJUSTADO: Barra de Filtros Totalmente Responsiva === */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {/* Label */}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold text-sm shrink-0">
              <Filter size={16} className="text-indigo-500 dark:text-indigo-400" />
              Filtrar por:
            </div>
            
            {/* Contêiner dos Selects (Ajustado com min-w-0 e flex-1) */}
            <div className="flex flex-col sm:flex-row flex-1 gap-3 min-w-0 w-full">
              <div className="flex-1 min-w-0">
                <Select
                  value={selectedMateria}
                  onChange={(e) => { setSelectedMateria(e.target.value); setSelectedTag('all'); }}
                  className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm truncate"
                >
                  <option value="all">Todas as Matérias</option>
                  {materias.map(materia => (
                    <option key={materia.id} value={materia.id}>
                      {materia.nome}
                    </option>
                  ))}
                </Select>
              </div>

              {(() => {
                const baseCards = selectedMateria === 'all' ? flashcards : flashcards.filter(fc => fc.materiaId === selectedMateria);
                const allTags = [...new Set(baseCards.flatMap(fc => fc.tags || []))].sort();
                return allTags.length > 0 ? (
                  <div className="flex-1 sm:max-w-[200px] min-w-0">
                    <Select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm truncate"
                    >
                      <option value="all">Todas as Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>#{tag}</option>
                      ))}
                    </Select>
                  </div>
                ) : null;
              })()}
            </div>
            
            {/* Contador (agora quebra de linha corretamente em telas pequenas) */}
            <div className="flex items-center justify-between w-full lg:w-auto border-t lg:border-t-0 border-slate-100 dark:border-slate-700 pt-3 lg:pt-0 shrink-0">
              <span className="lg:hidden text-xs font-medium text-slate-500">Total listado:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                {flashcardsFiltrados.length} card{flashcardsFiltrados.length !== 1 && 's'}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Grid de Flashcards */}
        {flashcardsFiltrados.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100 dark:border-indigo-800/50 relative z-10">
                <CreditCard size={48} className="text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
              </div>
              <motion.div 
                className="absolute inset-0 bg-teal-400 blur-2xl opacity-20 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
              {selectedMateria === 'all' ? 'Seu baralho está vazio 🎴' : 'Nenhum flashcard nesta matéria'}
            </h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              Flashcards são a melhor forma de fixar o conteúdo usando repetição espaçada. Crie o seu primeiro!
            </p>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
              className="shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 border-none"
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
                  whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
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

        {/* Modal de Criação/Edição Refinado */}
        <Modal
          isOpen={showModal}
          onClose={resetForm}
          title={editingId ? 'Editar Flashcard' : 'Novo Flashcard'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Matéria"
              value={formData.materiaId}
              onChange={handleMateriaChange}
              required
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            >
              <option value="">Selecione uma matéria</option>
              {materias.map(materia => (
                <option key={materia.id} value={materia.id}>
                  {materia.nome}
                </option>
              ))}
            </Select>

            <Textarea
              label="Pergunta (Frente)"
              placeholder="Digite a pergunta do card..."
              value={formData.pergunta}
              onChange={(e) => setFormData(prev => ({ ...prev, pergunta: e.target.value }))}
              onKeyDown={(e) => e.stopPropagation()}
              required
              rows={3}
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[15px] font-medium"
            />

            <Textarea
              label="Resposta (Verso)"
              placeholder="Digite a resposta correta..."
              value={formData.resposta}
              onChange={(e) => setFormData(prev => ({ ...prev, resposta: e.target.value }))}
              onKeyDown={(e) => e.stopPropagation()}
              required
              rows={4}
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[15px]"
            />

            {/* Upload de Imagem Premium */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Imagem (Opcional)
              </label>
              <div className="relative group rounded-[20px] overflow-hidden transition-all duration-300">
                <div className={`absolute inset-0 border-2 border-dashed rounded-[20px] pointer-events-none transition-colors ${imagePreview ? 'border-transparent' : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`} />
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
                  className={`cursor-pointer flex flex-col items-center justify-center p-6 transition-colors ${imagePreview ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-800/50 dark:hover:bg-indigo-900/20'}`}
                  style={{ minHeight: imagePreview ? 'auto' : '160px' }}
                >
                  {imagePreview ? (
                    <div className="relative w-full max-w-sm mx-auto">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 rounded-xl object-cover shadow-md border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setImagePreview(null);
                          setSelectedImageFile(null);
                        }}
                        className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-105 active:scale-95"
                      >
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <ImageIcon size={28} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 font-semibold text-[15px]">
                        {compressingImage ? 'Processando...' : 'Clique para enviar imagem'}
                      </p>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        PNG, JPG ou WEBP (máx. 10MB)
                      </p>
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
                key={editingId ?? 'new'}
                tags={formData.tags}
                onChange={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
                placeholder="Ex: anatomia, prova, importante..."
                suggestions={[...new Set(flashcards.flatMap(fc => fc.tags || []))]}
              />
            </div>

            {error && (
              <motion.div 
                className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium"
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
                className="flex-1 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 border-none shadow-md"
                disabled={compressingImage}
              >
                {editingId ? 'Atualizar Flashcard' : 'Criar Flashcard'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        {/* ==================== MODO ESTUDO IMERSIVO PREMIUM ==================== */}
        <AnimatePresence>
          {modoEstudo && currentFlashcard && (
            <motion.div
              className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Glow Orbs de Fundo (Cinema Effect) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                  className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/20 blur-[120px]"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-600/20 blur-[100px]"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
              </div>

              {/* Header do Modo Estudo (Glassmorphism) */}
              <motion.div 
                className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 bg-white/5 backdrop-blur-md border-b border-white/10"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <BookOpen size={24} className="text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-xl tracking-tight">
                      {modoRevisao ? 'Revisão Programada' : 'Modo Estudo'}
                    </h2>
                    <p className="text-white/60 text-[13px] font-medium mt-0.5">
                      Card {currentIndex + 1} de {studyCards.length}
                      {modoRevisao && <span className="ml-2 text-amber-400">· Algoritmo SM-2 ativo</span>}
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={fecharModoEstudo}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-colors border border-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={24} strokeWidth={2} />
                </motion.button>
              </motion.div>

              {/* Barra de Progresso Sleek */}
              <div className="w-full h-1 bg-white/5 relative z-10">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>

              {/* Card de Estudo Central */}
              <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 relative z-10">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={currentIndex}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full max-w-3xl"
                  >
                    <motion.div
                      className="relative perspective-1000 cursor-pointer"
                      onClick={flipStudyCard}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ minHeight: 'min(450px, 65vh)' }}
                    >
                      <motion.div
                        className="relative w-full h-full"
                        animate={{ rotateY: isStudyFlipped ? 180 : 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* FRENTE - Pergunta */}
                        <div
                          className="absolute inset-0 backface-hidden rounded-[32px] shadow-2xl p-8 sm:p-14 flex flex-col justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            minHeight: 'min(450px, 65vh)'
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-8">
                              <Badge color={currentFlashcard.materiaCor} size="md" className="shadow-sm">
                                {currentFlashcard.materiaNome || 'Sem matéria'}
                              </Badge>
                              {currentFlashcard.tags && currentFlashcard.tags.length > 0 && (
                                <div className="flex gap-1.5">
                                  {currentFlashcard.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-[13px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                                <Sparkles size={14} /> Pergunta
                              </p>
                              <h3 className="text-2xl sm:text-4xl font-extrabold leading-snug text-slate-800 dark:text-slate-100 line-clamp-6">
                                {currentFlashcard.pergunta}
                              </h3>
                            </div>
                          </div>
                          
                          <motion.div 
                            className="text-center mt-10"
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[15px] font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-600">
                              <RotateCcw size={18} strokeWidth={2.5} />
                              Clique ou aperte Espaço para virar
                            </div>
                          </motion.div>
                        </div>

                        {/* VERSO - Resposta (Gradiente Premium) */}
                        <div
                          className="absolute inset-0 backface-hidden rounded-[32px] shadow-2xl p-8 sm:p-14 flex flex-col border border-white/20 overflow-hidden"
                          style={{ 
                            background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)',
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            minHeight: 'min(450px, 65vh)'
                          }}
                        >
                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-light">
                            <p className="text-[13px] uppercase tracking-widest font-bold text-white/60 mb-4 flex items-center gap-2">
                              <BookOpen size={14} /> Resposta
                            </p>
                            <p className="text-xl sm:text-3xl text-white font-bold leading-relaxed whitespace-pre-wrap drop-shadow-sm">
                              {currentFlashcard.resposta}
                            </p>

                            {currentFlashcard.imagemUrl && (
                              <motion.div 
                                className="mt-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                              >
                                <img
                                  src={currentFlashcard.imagemUrl}
                                  alt="Imagem do flashcard"
                                  className="w-full max-h-64 object-cover"
                                />
                              </motion.div>
                            )}
                          </div>
                          
                          <div className="text-center mt-6 pt-4 border-t border-white/10 shrink-0">
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-full text-white/90 text-[14px] font-medium backdrop-blur-sm border border-white/20">
                              <RotateCcw size={16} />
                              Voltar para a pergunta
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controles de Navegação + SM-2 Rating (Glassmorphism) */}
              <motion.div 
                className="px-4 sm:px-8 pb-10 pt-4 relative z-10"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* SM-2 Rating Buttons */}
                <AnimatePresence>
                  {isStudyFlipped && (
                    <motion.div
                      className="max-w-2xl mx-auto"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                    >
                      <p className="text-center text-white/40 text-[12px] mb-3 font-bold uppercase tracking-widest">
                        Avalie para agendar a próxima revisão (1, 2, 3)
                      </p>
                      <div className="flex items-center justify-center gap-3 sm:gap-4 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] shadow-2xl">
                        {/* Difícil */}
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); handleSM2Rating(1); }}
                          className="flex-1 py-4 px-2 sm:px-4 rounded-[20px] font-bold flex flex-col items-center gap-1.5 transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <span className="text-2xl group-hover:scale-110 transition-transform">😰</span>
                          <span className="text-[14px]">Difícil</span>
                          <span className="text-[11px] opacity-70 bg-red-950/50 px-2 py-0.5 rounded-full mt-1">
                            {getNextReviewLabel(1, currentFlashcard?.repetitions || 0, currentFlashcard?.interval || 0, currentFlashcard?.easeFactor || 2.5)}
                          </span>
                        </motion.button>

                        {/* Médio */}
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); handleSM2Rating(3); }}
                          className="flex-1 py-4 px-2 sm:px-4 rounded-[20px] font-bold flex flex-col items-center gap-1.5 transition-all bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <span className="text-2xl group-hover:scale-110 transition-transform">😐</span>
                          <span className="text-[14px]">Médio</span>
                          <span className="text-[11px] opacity-70 bg-amber-950/50 px-2 py-0.5 rounded-full mt-1">
                            {getNextReviewLabel(3, currentFlashcard?.repetitions || 0, currentFlashcard?.interval || 0, currentFlashcard?.easeFactor || 2.5)}
                          </span>
                        </motion.button>

                        {/* Fácil */}
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); handleSM2Rating(5); }}
                          className="flex-1 py-4 px-2 sm:px-4 rounded-[20px] font-bold flex flex-col items-center gap-1.5 transition-all bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <span className="text-2xl group-hover:scale-110 transition-transform">😄</span>
                          <span className="text-[14px]">Fácil</span>
                          <span className="text-[11px] opacity-70 bg-emerald-950/50 px-2 py-0.5 rounded-full mt-1">
                            {getNextReviewLabel(5, currentFlashcard?.repetitions || 0, currentFlashcard?.interval || 0, currentFlashcard?.easeFactor || 2.5)}
                          </span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Standard navigation */}
                {!isStudyFlipped && (
                  <div className="flex items-center justify-center gap-4 max-w-xl mx-auto">
                    <motion.button
                      onClick={cardAnterior}
                      disabled={currentIndex === 0}
                      className={`flex-1 py-4 px-6 rounded-[24px] font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-200 ${
                        currentIndex === 0
                          ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                          : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10'
                      }`}
                      whileHover={currentIndex !== 0 ? { scale: 1.02 } : {}}
                      whileTap={currentIndex !== 0 ? { scale: 0.98 } : {}}
                    >
                      <ChevronLeft size={20} strokeWidth={2.5} />
                      Anterior
                    </motion.button>

                    <motion.button
                      onClick={proximoCard}
                      disabled={currentIndex === studyCards.length - 1}
                      className={`flex-1 py-4 px-6 rounded-[24px] font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-200 ${
                        currentIndex === studyCards.length - 1
                          ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                          : 'bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-white/20'
                      }`}
                      whileHover={currentIndex !== studyCards.length - 1 ? { scale: 1.02 } : {}}
                      whileTap={currentIndex !== studyCards.length - 1 ? { scale: 0.98 } : {}}
                    >
                      Próximo
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSS Customizado para o Flip 3D e Scrollbar do Verso */}
      <style>{`
        .perspective-1000 { perspective: 1200px; }
        .backface-hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .transform-style-3d { transform-style: preserve-3d; }
        
        .custom-scrollbar-light::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { 
          background-color: rgba(255, 255, 255, 0.2); 
          border-radius: 10px; 
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { 
          background-color: rgba(255, 255, 255, 0.4); 
        }

        @media (max-width: 640px) {
          .perspective-1000 { min-height: 400px !important; }
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
    </div>
  );
}

export default Flashcards;