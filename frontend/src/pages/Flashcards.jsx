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

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  CreditCard, 
  Sparkles,
  ImageIcon,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { 
  listarFlashcards, 
  criarFlashcard, 
  atualizarFlashcard, 
  deletarFlashcard,
  listarMaterias
} from '../services/firebaseService';
import { compressImage } from '../utils/imageCompressor';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import FlashcardItem from '../components/FlashcardItem';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    transition: { duration: 0.2 } 
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
    transition: { type: 'spring', stiffness: 300, damping: 30 }
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
    materiaCor: ''
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [error, setError] = useState(null);

  // Estado do Modal de Confirmação
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado do Modo Estudo
  const [modoEstudo, setModoEstudo] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStudyFlipped, setIsStudyFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  // Filtrar flashcards quando mudar a matéria selecionada
  useEffect(() => {
    if (selectedMateria === 'all') {
      setFlashcardsFiltrados(flashcards);
    } else {
      setFlashcardsFiltrados(
        flashcards.filter(fc => fc.materiaId === selectedMateria)
      );
    }
  }, [selectedMateria, flashcards]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.uid;
      const [flashcardsData, materiasData] = await Promise.all([
        listarFlashcards(userId),
        listarMaterias(userId)
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
        materiaCor: formData.materiaCor
      };

      if (editingId) {
        await atualizarFlashcard(editingId, dadosFlashcard, selectedImageFile);
      } else {
        await criarFlashcard(dadosFlashcard, selectedImageFile, userId);
      }
      
      await carregarDados();
      resetForm();
      setError(null);
    } catch (err) {
      setError('Erro ao salvar flashcard');
      console.error(err);
    }
  };

  const handleEdit = (flashcard) => {
    setFormData({
      pergunta: flashcard.pergunta,
      resposta: flashcard.resposta,
      materiaId: flashcard.materiaId || '',
      materiaNome: flashcard.materiaNome || '',
      materiaCor: flashcard.materiaCor || '#94A3B8'
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
    } catch (err) {
      setError('Erro ao excluir flashcard');
      console.error(err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  const resetForm = () => {
    setFormData({ pergunta: '', resposta: '', materiaId: '', materiaNome: '', materiaCor: '' });
    setEditingId(null);
    setImagePreview(null);
    setSelectedImageFile(null);
    setShowModal(false);
  };

  // ==================== MODO ESTUDO ====================
  
  const iniciarModoEstudo = () => {
    if (flashcardsFiltrados.length === 0) {
      setError('Nenhum flashcard disponível para estudar');
      return;
    }
    setCurrentIndex(0);
    setIsStudyFlipped(false);
    setSlideDirection(0);
    setModoEstudo(true);
  };

  const fecharModoEstudo = () => {
    setModoEstudo(false);
    setCurrentIndex(0);
    setIsStudyFlipped(false);
  };

  const proximoCard = () => {
    if (currentIndex < flashcardsFiltrados.length - 1) {
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
      
      switch (e.key) {
        case 'ArrowRight':
          if (currentIndex < flashcardsFiltrados.length - 1) {
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
  }, [modoEstudo, currentIndex, flashcardsFiltrados.length]);

  const currentFlashcard = flashcardsFiltrados[currentIndex];
  const progressPercent = flashcardsFiltrados.length > 0 
    ? ((currentIndex + 1) / flashcardsFiltrados.length) * 100 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 pb-32 pt-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CreditCard size={28} className="text-white" />
                </motion.div>
                Meus Flashcards
              </h1>
              <p className="text-slate-600 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                Crie e estude com flashcards interativos
              </p>
            </div>
            <div className="flex gap-3">
              {flashcardsFiltrados.length > 0 && (
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Play size={20} />}
                  onClick={iniciarModoEstudo}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-600 hover:to-teal-600"
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
            </div>
          </div>

          {/* Barra de Filtros */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Filter size={18} className="text-teal-600" />
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
            
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{flashcardsFiltrados.length}</span> flashcard{flashcardsFiltrados.length !== 1 && 's'}
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
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CreditCard size={48} className="text-blue-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {selectedMateria === 'all' ? 'Nenhum flashcard criado' : 'Nenhum flashcard nesta matéria'}
            </h3>
            <p className="text-slate-600 mb-8">
              Crie flashcards para fixar melhor o conteúdo estudado
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
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
              required
              rows={3}
            />

            <Textarea
              label="Resposta"
              placeholder="Digite a resposta..."
              value={formData.resposta}
              onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
              required
              rows={4}
            />

            {/* Upload de Imagem */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Imagem (Opcional)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors duration-200">
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
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG ou WEBP (máx. 10MB)
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>
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
              className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col"
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
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                  >
                    <BookOpen size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Modo Estudo</h2>
                    <p className="text-white/60 text-sm">
                      Card {currentIndex + 1} de {flashcardsFiltrados.length}
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
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                      style={{ minHeight: '400px' }}
                    >
                      <motion.div
                        className="relative w-full h-full"
                        animate={{ rotateY: isStudyFlipped ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* FRENTE - Pergunta */}
                        <div
                          className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-2xl p-8 sm:p-12 flex flex-col justify-between"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            minHeight: '400px'
                          }}
                        >
                          <div>
                            <Badge color={currentFlashcard.materiaCor} size="md">
                              {currentFlashcard.materiaNome || 'Sem matéria'}
                            </Badge>
                            <div className="mt-8">
                              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                                Pergunta
                              </p>
                              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-relaxed">
                                {currentFlashcard.pergunta}
                              </h3>
                            </div>
                          </div>
                          
                          <motion.div 
                            className="text-center mt-8"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm font-medium">
                              <RotateCcw size={16} />
                              Clique para virar
                            </div>
                          </motion.div>
                        </div>

                        {/* VERSO - Resposta */}
                        <div
                          className="absolute inset-0 backface-hidden bg-gradient-to-br from-teal-500 to-emerald-500 rounded-3xl shadow-2xl p-8 sm:p-12 flex flex-col"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            minHeight: '400px'
                          }}
                        >
                          <div className="flex-1 overflow-y-auto">
                            <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-3">
                              Resposta
                            </p>
                            <p className="text-xl sm:text-2xl text-white leading-relaxed font-medium">
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

              {/* Controles de Navegação */}
              <motion.div 
                className="px-4 sm:px-8 py-6 border-t border-white/10"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
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
                    disabled={currentIndex === flashcardsFiltrados.length - 1}
                    className={`flex-1 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                      currentIndex === flashcardsFiltrados.length - 1
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg'
                    }`}
                    whileHover={currentIndex !== flashcardsFiltrados.length - 1 ? { scale: 1.02 } : {}}
                    whileTap={currentIndex !== flashcardsFiltrados.length - 1 ? { scale: 0.98 } : {}}
                  >
                    Próximo
                    <ChevronRight size={20} />
                  </motion.button>
                </div>

                <p className="text-center text-white/40 text-sm mt-4">
                  Use as setas   ou barra de espaço para navegar
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
