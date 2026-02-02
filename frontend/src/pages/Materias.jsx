import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { materiasAPI } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Button, Card, Input, TextArea } from '../components/ui';

function Materias() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#0D9488'
  });

  useEffect(() => {
    carregarMaterias();
  }, []);

  const carregarMaterias = async () => {
    try {
      setLoading(true);
      const response = await materiasAPI.getAll();
      setMaterias(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar matérias: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await materiasAPI.update(editingId, formData);
      } else {
        await materiasAPI.create(formData);
      }
      carregarMaterias();
      resetForm();
    } catch (err) {
      setError('Erro ao salvar matéria: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (materia) => {
    setFormData({
      nome: materia.nome,
      descricao: materia.descricao || '',
      cor: materia.cor || '#0D9488'
    });
    setEditingId(materia.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir esta matéria?')) {
      try {
        await materiasAPI.delete(id);
        carregarMaterias();
      } catch (err) {
        setError('Erro ao excluir matéria: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', cor: '#0D9488' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 pt-8 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-text-primary">Matérias</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <FiPlus size={20} />
            Nova Matéria
          </Button>
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
            <Card 
              className="mb-8"
              as={motion.div}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {editingId ? 'Editar Matéria' : 'Nova Matéria'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Nome da Matéria
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Anatomia Humana"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Descrição (Opcional)
                  </label>
                  <TextArea
                    placeholder="Descrição da matéria"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Cor da Matéria
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-20 h-12 rounded-xl cursor-pointer border-2 border-border"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    />
                    <span className="text-text-secondary font-mono">{formData.cor}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit">
                    {editingId ? 'Atualizar' : 'Criar Matéria'}
                  </Button>
                  <Button variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </AnimatePresence>

        {/* Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          {materias.map((materia, index) => (
            <motion.div
              key={materia.id}
              className="bg-surface rounded-2xl shadow-sm border border-border p-6 border-l-4 hover:shadow-md hover:border-brand-primary transition-all duration-300"
              style={{ borderLeftColor: materia.cor }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
              layout
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-text-primary flex-1">
                  {materia.nome}
                </h3>
                <div className="flex gap-2">
                  <motion.button
                    className="text-brand-primary hover:text-brand-hover p-2 hover:bg-brand-light rounded-xl transition-colors"
                    onClick={() => handleEdit(materia)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiEdit2 size={18} />
                  </motion.button>
                  <motion.button
                    className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors"
                    onClick={() => handleDelete(materia.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiTrash2 size={18} />
                  </motion.button>
                </div>
              </div>

              {materia.descricao && (
                <p className="text-text-secondary mb-4 text-sm">
                  {materia.descricao}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <span>📝 {materia.totalResumos || 0} resumos</span>
                <span>📚 {materia.totalFlashcards || 0} flashcards</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {materias.length === 0 && !showForm && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              Nenhuma matéria cadastrada
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Crie sua primeira matéria para organizar seus estudos
            </p>
            <Button onClick={() => setShowForm(true)}>
              <FiPlus className="inline mr-2" />
              Criar Primeira Matéria
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Materias;
