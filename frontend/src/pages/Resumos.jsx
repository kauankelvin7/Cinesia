import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { listarResumos, criarResumo, atualizarResumo, deletarResumo, listarMaterias } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiX } from 'react-icons/fi';

function Resumos() {
  const { user } = useAuth();
  const { materiaId } = useParams();
  const [resumos, setResumos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingResumo, setViewingResumo] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    materiaId: materiaId || ''
  });

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [materiaId, user]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [resumosData, materiasData] = await Promise.all([
        listarResumos(user.id, materiaId || null),
        listarMaterias(user.id)
      ]);
      setResumos(resumosData);
      setMaterias(materiasData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      setError('Título é obrigatório');
      return;
    }

    try {
      if (editingId) {
        await atualizarResumo(editingId, formData);
      } else {
        await criarResumo(formData, user.id);
      }
      await carregarDados();
      resetForm();
      setError(null);
    } catch (err) {
      setError('Erro ao salvar resumo: ' + err.message);
      console.error('Erro ao salvar:', err);
    }
  };

  const handleEdit = (resumo) => {
    setFormData({
      titulo: resumo.titulo,
      conteudo: resumo.conteudo || '',
      materiaId: resumo.materiaId || ''
    });
    setEditingId(resumo.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este resumo?')) {
      try {
        await deletarResumo(id);
        await carregarDados();
        setError(null);
      } catch (err) {
        setError('Erro ao excluir resumo: ' + err.message);
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ titulo: '', conteudo: '', materiaId: materiaId || '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner"></div>
    </div>
  );

  // VIEW MODE
  if (viewingResumo) {
    return (
      <div className="min-h-screen bg-background pb-32 pt-8 px-4 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <motion.button 
            className="bg-surface text-brand-primary px-6 py-3 rounded-2xl font-semibold border-2 border-border hover:border-brand-primary hover:bg-brand-light transition-all mb-6 flex items-center gap-2"
            onClick={() => setViewingResumo(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiX size={20} />
            Fechar
          </motion.button>
          <motion.div 
            className="bg-surface rounded-2xl shadow-sm border border-border p-8 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              {viewingResumo.titulo}
            </h1>
            <div className="flex items-center gap-4 mb-6 text-sm text-text-secondary">
              <span 
                className="px-3 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: `${viewingResumo.materiaCor}20`,
                  color: viewingResumo.materiaCor || '#0D9488'
                }}
              >
                {viewingResumo.materiaNome}
              </span>
              <span>Atualizado em: {viewingResumo.atualizadoEm}</span>
            </div>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: viewingResumo.conteudo }} 
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // LIST MODE
  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-4xl font-bold text-text-primary">Resumos</h1>
            {materiaId && materias.find(m => m.id == materiaId) && (
              <p className="text-text-secondary mt-2">
                {materias.find(m => m.id == materiaId).nome}
              </p>
            )}
          </div>
          <motion.button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus size={20} />
            Novo Resumo
          </motion.button>
        </motion.div>

        {/* Error */}
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

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              className="card mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {editingId ? 'Editar Resumo' : 'Novo Resumo'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Sistema Muscular"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>

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
                    Conteúdo
                  </label>
                  <div className="bg-surface rounded-xl overflow-hidden border-2 border-border">
                    <ReactQuill
                      theme="snow"
                      value={formData.conteudo}
                      onChange={(value) => setFormData({ ...formData, conteudo: value })}
                      modules={modules}
                      placeholder="Escreva seu resumo aqui..."
                      style={{ minHeight: '300px' }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button 
                    type="submit" 
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingId ? 'Atualizar' : 'Criar Resumo'}
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

        {/* Lista de Resumos */}
        <motion.div className="space-y-4" layout>
          {resumos.map((resumo, index) => (
            <motion.div
              key={resumo.id}
              className="card-interactive flex items-start justify-between gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {resumo.titulo}
                </h3>
                <div className="flex items-center gap-3 mb-2">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${resumo.materiaCor}20`,
                      color: resumo.materiaCor || '#0D9488'
                    }}
                  >
                    {resumo.materiaNome}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    Atualizado em: {resumo.atualizadoEm}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <motion.button
                  className="text-brand-primary hover:text-brand-hover p-2 hover:bg-brand-light rounded-xl transition-colors"
                  onClick={() => setViewingResumo(resumo)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiEye size={20} />
                </motion.button>
                <motion.button
                  className="text-brand-primary hover:text-brand-hover p-2 hover:bg-brand-light rounded-xl transition-colors"
                  onClick={() => handleEdit(resumo)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiEdit2 size={18} />
                </motion.button>
                <motion.button
                  className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors"
                  onClick={() => handleDelete(resumo.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiTrash2 size={18} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {resumos.length === 0 && !showForm && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              Nenhum resumo ainda
            </h3>
            <p className="text-text-secondary mb-6">
              Crie seu primeiro resumo para começar a estudar
            </p>
            <motion.button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="inline mr-2" />
              Criar Primeiro Resumo
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Resumos;
