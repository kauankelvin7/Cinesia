import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  listarFlashcards, 
  criarFlashcard, 
  atualizarFlashcard, 
  deletarFlashcard,
  listarMaterias
} from '../services/firebaseService';
import { compressImage } from '../utils/imageCompressor';
import { useAuth } from '../contexts/AuthContext-firebase';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiChevronLeft, FiChevronRight, FiX, FiZoomIn } from 'react-icons/fi';

function Flashcards() {
  const { user } = useAuth();
  const { materiaId } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [formData, setFormData] = useState({
    pergunta: '',
    resposta: '',
    materiaId: materiaId || ''
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [materiaId, user]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [flashcardsData, materiasData] = await Promise.all([
        listarFlashcards(user.id, materiaId || null),
        listarMaterias(user.id)
      ]);
      setFlashcards(flashcardsData);
      setMaterias(materiasData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação de tamanho (máx 10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 10MB');
      return;
    }

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas (jpg, png, gif, webp)');
      return;
    }

    try {
      setCompressingImage(true);
      setError(null);
      console.log('🖼️ Comprimindo imagem...');
      
      // Comprimir imagem para Base64
      const base64Data = await compressImage(file);
      
      // Estimar tamanho
      const sizeKB = (base64Data.length * 0.75 / 1024).toFixed(2);
      console.log(`✅ Imagem comprimida: ${sizeKB}KB`);
      
      // Se muito grande, avisar
      if (base64Data.length * 0.75 > 800 * 1024) {
        console.warn('⚠️ Imagem comprimida ocupa mais de 800KB');
      }
      
      setImagePreview(base64Data);
      setSelectedImageFile(base64Data);
      setError(null);
    } catch (err) {
      setError('Erro ao comprimir imagem: ' + err.message);
      console.error('Erro na compressão:', err);
      setImagePreview(null);
      setSelectedImageFile(null);
    } finally {
      setCompressingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pergunta.trim() || !formData.resposta.trim()) {
      setError('Pergunta e resposta são obrigatórios');
      return;
    }

    try {
      if (editingId) {
        // Atualizar: passar imagem se houver
        await atualizarFlashcard(editingId, formData, selectedImageFile);
      } else {
        // Criar: passar imagem (File ou Base64 já processado)
        await criarFlashcard(formData, selectedImageFile, user.id);
      }
      await carregarDados();
      resetForm();
      setError(null);
    } catch (err) {
      setError('Erro ao salvar flashcard: ' + err.message);
      console.error('Erro ao salvar:', err);
    }
  };

  const handleEdit = (flashcard) => {
    setFormData({
      pergunta: flashcard.pergunta,
      resposta: flashcard.resposta,
      materiaId: flashcard.materiaId || ''
    });
    if (flashcard.imagemUrl) {
      setImagePreview(flashcard.imagemUrl);
      setSelectedImageFile(flashcard.imagemUrl);
    } else {
      setImagePreview(null);
      setSelectedImageFile(null);
    }
    setEditingId(flashcard.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este flashcard?')) {
      try {
        await deletarFlashcard(id);
        await carregarDados();
        setError(null);
      } catch (err) {
        setError('Erro ao excluir flashcard: ' + err.message);
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ pergunta: '', resposta: '', materiaId: materiaId || '' });
    setEditingId(null);
    setShowForm(false);
    setImagePreview(null);
    setSelectedImageFile(null);
  };

  const startStudyMode = () => {
    if (flashcards.length === 0) {
      alert('Não há flashcards para estudar!');
      return;
    }
    setStudyMode(true);
    setCurrentCard(0);
    setShowAnswer(false);
  };

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner"></div>
    </div>
  );

  // 3D FLIP CARD - MODO ESTUDO
  if (studyMode && flashcards.length > 0) {
    const card = flashcards[currentCard];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-wellness-mint pb-32 pt-8 px-4">
        {/* Header do Modo Estudo */}
        <motion.div 
          className="max-w-4xl mx-auto mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={() => setStudyMode(false)}
          >
            <FiX size={20} />
            Sair do Estudo
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-soft">
            <span className="text-primary-600 font-bold text-lg">
              {currentCard + 1} / {flashcards.length}
            </span>
          </div>
        </motion.div>

        {/* 3D Flip Card Container */}
        <div className="max-w-2xl mx-auto perspective-1000">
          <motion.div
            className="relative w-full"
            style={{ minHeight: '500px' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard}
                className="relative w-full h-full cursor-pointer"
                onClick={() => setShowAnswer(!showAnswer)}
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: showAnswer ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* FRENTE - Apenas Pergunta */}
                <motion.div
                  className="absolute inset-0 w-full backface-hidden"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)'
                  }}
                >
                  <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl shadow-float p-12 min-h-[500px] flex flex-col items-center justify-center text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-8">
                        <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                          Pergunta
                        </span>
                      </div>
                      <h2 className="text-white text-4xl font-bold leading-relaxed max-w-xl">
                        {card.pergunta}
                      </h2>
                      <div className="mt-12 text-white/60 text-sm flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          👆
                        </motion.div>
                        Toque para ver a resposta
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* VERSO - Imagem + Resposta */}
                <motion.div
                  className="absolute inset-0 w-full backface-hidden"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="bg-white rounded-3xl shadow-float p-12 min-h-[500px] flex flex-col">
                    <div className="bg-primary-50 px-6 py-2 rounded-full mb-8 self-center">
                      <span className="text-primary-700 text-sm font-semibold uppercase tracking-wider">
                        Resposta
                      </span>
                    </div>
                    
                    {/* Imagem com Zoom Interativo - Cloudinary CDN */}
                    {card.imagemUrl && (
                      <motion.div 
                        className="mb-8 rounded-2xl overflow-hidden shadow-card relative group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {/* Hint de Zoom */}
                        <div className="absolute top-3 right-3 z-10 bg-teal-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
                          <FiZoomIn size={14} />
                          <span className="hidden sm:inline">Pinch to Zoom</span>
                          <span className="sm:hidden">Zoom</span>
                        </div>
                        
                        <TransformWrapper
                          initialScale={1}
                          minScale={1}
                          maxScale={4}
                          centerOnInit
                          wheel={{ step: 0.1 }}
                          doubleClick={{ mode: 'reset' }}
                          panning={{ velocityDisabled: false }}
                        >
                          <TransformComponent
                            wrapperClass="w-full"
                            contentClass="w-full"
                          >
                            <img 
                              src={card.imagemUrl} 
                              alt="Anatomia" 
                              className="w-full h-64 object-cover cursor-move"
                              draggable={false}
                            />
                          </TransformComponent>
                        </TransformWrapper>
                      </motion.div>
                    )}
                    
                    {/* Texto da Resposta */}
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-text-primary text-2xl leading-relaxed text-center max-w-xl">
                        {card.resposta}
                      </p>
                    </div>
                    
                    <div className="mt-8 text-text-tertiary text-sm text-center flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        👆
                      </motion.div>
                      Toque para voltar
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Controles de Navegação */}
        <motion.div 
          className="max-w-2xl mx-auto mt-12 flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
            onClick={prevCard}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiChevronLeft size={24} />
            Anterior
          </motion.button>
          
          <motion.button
            className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-card"
            onClick={() => setShowAnswer(!showAnswer)}
            whileHover={{ scale: 1.05, backgroundColor: '#0F766E' }}
            whileTap={{ scale: 0.95 }}
          >
            {showAnswer ? 'Ver Pergunta' : 'Ver Resposta'}
          </motion.button>
          
          <motion.button
            className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
            onClick={nextCard}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Próximo
            <FiChevronRight size={24} />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // LISTA DE FLASHCARDS
  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-4xl font-bold text-text-primary">
              Flashcards
            </h1>
            {materiaId && materias.find(m => m.id == materiaId) && (
              <p className="text-text-secondary mt-2">
                {materias.find(m => m.id == materiaId).nome}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {flashcards.length > 0 && (
              <motion.button 
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-card flex items-center gap-2"
                onClick={startStudyMode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎯 Iniciar Estudo
              </motion.button>
            )}
            <motion.button 
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowForm(!showForm)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus size={20} />
              Novo Flashcard
            </motion.button>
          </div>
        </motion.div>

        {/* Mensagem de Erro */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulário */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              className="card mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {editingId ? 'Editar Flashcard' : 'Novo Flashcard'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Matéria
                  </label>
                  <select
                    className="input-field"
                    value={formData.materiaId}
                    onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })}
                    required
                  >
                    <option value="">Selecione uma matéria</option>
                    {materias.map((materia) => (
                      <option key={materia.id} value={materia.id}>
                        {materia.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Pergunta
                  </label>
                  <textarea
                    className="input-field resize-none"
                    placeholder="Ex: Qual é a função do músculo deltoide?"
                    value={formData.pergunta}
                    onChange={(e) => setFormData({ ...formData, pergunta: e.target.value })}
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Resposta
                  </label>
                  <textarea
                    className="input-field resize-none"
                    placeholder="Abdução do braço e rotação lateral"
                    value={formData.resposta}
                    onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Imagem (Opcional - Comprimida para Base64)
                  </label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="image-input" className="btn-secondary cursor-pointer inline-flex items-center gap-2 disabled:opacity-50">
                      <FiImage size={20} />
                      {compressingImage ? 'Comprimindo...' : imagePreview ? 'Alterar Imagem' : 'Adicionar Imagem'}
                    </label>
                    {compressingImage && (
                      <span className="text-sm text-text-secondary">🖼️ Processando...</span>
                    )}
                  </div>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={compressingImage}
                    className="hidden"
                  />
                  {imagePreview && (
                    <motion.div 
                      className="mt-4 rounded-2xl overflow-hidden shadow-card max-w-md"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                      <div className="text-xs text-text-secondary p-2 bg-primary-50">
                        ✅ Imagem pronta para envio
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button 
                    type="submit" 
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingId ? 'Atualizar' : 'Criar Flashcard'}
                  </motion.button>
                  <motion.button 
                    type="button" 
                    className="btn-secondary"
                    onClick={resetForm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid de Flashcards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          {flashcards.map((flashcard, index) => (
            <motion.div
              key={flashcard.id}
              className="card-interactive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <div className="flex items-start justify-between mb-4">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${flashcard.materiaCor}20`,
                    color: flashcard.materiaCor || '#0D9488'
                  }}
                >
                  {flashcard.materiaNome}
                </span>
                <div className="flex gap-2">
                  <motion.button
                    className="text-brand-primary hover:text-brand-hover p-2 hover:bg-brand-light rounded-xl transition-colors"
                    onClick={() => handleEdit(flashcard)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiEdit2 size={18} />
                  </motion.button>
                  <motion.button
                    className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors"
                    onClick={() => handleDelete(flashcard.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiTrash2 size={18} />
                  </motion.button>
                </div>
              </div>

              {flashcard.imagemUrl && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={flashcard.imagemUrl} 
                    alt="Flashcard" 
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-brand-primary mb-1 uppercase tracking-wider">
                    Pergunta
                  </p>
                  <p className="text-text-primary font-medium">
                    {flashcard.pergunta}
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                    Resposta
                  </p>
                  <p className="text-text-secondary">
                    {flashcard.resposta}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Estado Vazio */}
        {flashcards.length === 0 && !showForm && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🎴</div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              Nenhum flashcard ainda
            </h3>
            <p className="text-text-secondary mb-6">
              Crie seu primeiro flashcard para começar a estudar
            </p>
            <motion.button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="inline mr-2" />
              Criar Primeiro Flashcard
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Flashcards;
