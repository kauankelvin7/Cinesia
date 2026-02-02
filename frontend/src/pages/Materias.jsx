import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listarMaterias, criarMateria, atualizarMateria, deletarMateria, salvarEvento } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
import { FiPlus, FiX, FiCheck } from 'react-icons/fi';
import { BookOpen, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import MateriaCard from '../components/MateriaCard';
import CalendarWidget from '../components/Dashboard/CalendarWidget';
import PomodoroWidget from '../components/Dashboard/PomodoroWidget';

function Materias() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#0D9488'
  });

  const cores = [
    '#0D9488', '#3B82F6', '#8B5CF6', '#EC4899', 
    '#F59E0B', '#10B981', '#6366F1', '#EF4444'
  ];

  useEffect(() => {
    if (user) {
      carregarMaterias();
    }
  }, [user]);

  const carregarMaterias = async () => {
    try {
      setLoading(true);
      const data = await listarMaterias(user.id || user.uid);
      setMaterias(data);
    } catch (err) {
      console.error('Erro ao carregar matérias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await atualizarMateria(editingId, formData);
      } else {
        await criarMateria(formData, user.id || user.uid);
      }
      carregarMaterias();
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar matéria:', err);
    }
  };

  const handleEdit = (materia) => {
    setEditingId(materia.id);
    setFormData({
      nome: materia.nome,
      descricao: materia.descricao || '',
      cor: materia.cor || '#0D9488'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta matéria?')) {
      try {
        await deletarMateria(id);
        carregarMaterias();
      } catch (err) {
        console.error('Erro ao deletar matéria:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', cor: '#0D9488' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleToggleConcluida = async (materia) => {
    try {
      const novaConcluida = !materia.concluida;
      await atualizarMateria(materia.id, { concluida: novaConcluida });
      setMaterias(prev => prev.map(item =>
        item.id === materia.id ? { ...item, concluida: novaConcluida } : item
      ));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleAddEvento = async (novoEvento) => {
    try {
      await salvarEvento(novoEvento, user.id || user.uid);
      setEventos([...eventos, novoEvento]);
    } catch (err) {
      console.error('Erro ao adicionar evento:', err);
    }
  };

  const materiasAtivas = materias.filter(m => !m.concluida);
  const materiasConcluidas = materias.filter(m => m.concluida);
  
  const totalMaterias = materias.length;
  const percentualConclusao = totalMaterias > 0 ? Math.round((materiasConcluidas.length / totalMaterias) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Carregando matérias...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header com Estatísticas */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Matérias
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Organize suas disciplinas de estudo
              </p>
            </div>
            <motion.button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 dark:bg-teal-500 text-black dark:text-white rounded-xl hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors shadow-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showForm ? <FiX size={20} /> : <FiPlus size={20} />}
              {showForm ? 'Cancelar' : 'Nova Matéria'}
            </motion.button>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{totalMaterias}</p>
                </div>
                <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800/50 border border-amber-200 dark:border-amber-700/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">A Fazer</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{materiasAtivas.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800/50 border border-green-200 dark:border-green-700/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Concluídas</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{materiasConcluidas.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 dark:text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800/50 border border-teal-200 dark:border-teal-700/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-600 dark:text-teal-400">Progresso</p>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{percentualConclusao}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Formulário */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {editingId ? 'Editar Matéria' : 'Nova Matéria'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome da Matéria *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ex: Anatomia Humana"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex gap-2">
                      {cores.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor })}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            formData.cor === cor 
                              ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110' 
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Breve descrição da matéria"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    className="flex-1 px-6 py-2.5 bg-teal-600 dark:bg-teal-500 text-black dark:text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors font-medium"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {editingId ? 'Salvar Alterações' : 'Criar Matéria'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Cancelar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid Principal com Calendário e Pomodoro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Coluna Esquerda: Materias */}
          <div className="lg:col-span-2 space-y-8">
            {/* Matérias Ativas */}
            {materiasAtivas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    A Fazer ({materiasAtivas.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materiasAtivas.map((materia) => (
                    <MateriaCard
                      key={materia.id}
                      materia={materia}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleConcluida={handleToggleConcluida}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Matérias Concluídas */}
            {materiasConcluidas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Concluídas ({materiasConcluidas.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                  {materiasConcluidas.map((materia) => (
                    <MateriaCard
                      key={materia.id}
                      materia={materia}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleConcluida={handleToggleConcluida}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Nenhuma matéria */}
            {totalMaterias === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-16 text-center shadow-sm">
                <BookOpen className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhuma matéria cadastrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece criando sua primeira matéria de estudo
                </p>
                <motion.button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2.5 bg-teal-600 dark:bg-teal-500 text-black dark:text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Criar Primeira Matéria
                </motion.button>
              </div>
            )}
          </div>

          {/* Coluna Direita: Calendário e Pomodoro */}
          <div className="space-y-6">
            <CalendarWidget 
              eventos={eventos}
              onAddEvento={handleAddEvento}
            />
            <PomodoroWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Materias;
