/**
 * MATÉRIAS - Gerenciamento Premium de Disciplinas
 * 
 * Grid de cards gerenciais com visual Clean HealthTech
 * Features:
 * - Grid responsivo de cards
 * - Modal de criação/edição
 * - Ações no hover (Editar/Excluir)
 * - Indicador de progresso
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  Edit2, 
  Trash2, 
  Sparkles,
  CreditCard,
  FileText,
  Palette,
  Target,
  TrendingUp
} from 'lucide-react';
import { listarMaterias, criarMateria, atualizarMateria, deletarMateria } from '../services/firebaseService';
import { getDashboardStats } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import ConfirmModal from '../components/ui/ConfirmModal';

const CORES_DISPONIVEIS = [
  { nome: 'Teal', valor: '#14B8A6' },
  { nome: 'Blue', valor: '#3B82F6' },
  { nome: 'Purple', valor: '#A855F7' },
  { nome: 'Pink', valor: '#EC4899' },
  { nome: 'Orange', valor: '#F97316' },
  { nome: 'Green', valor: '#10B981' },
  { nome: 'Indigo', valor: '#6366F1' },
  { nome: 'Red', valor: '#EF4444' },
];

function Materias() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#14B8A6',
    concluida: false
  });
  const [error, setError] = useState(null);

  // Estado do Modal de Confirmação
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado da Meta Mensal (Questões Resolvidas)
  const [metaMensal, setMetaMensal] = useState({ atual: 0, meta: 50, porcentagem: 0 });

  useEffect(() => {
    if (user) {
      carregarMaterias();
      carregarMetaMensal();
    }
  }, [user]);

  const carregarMetaMensal = async () => {
    try {
      const userId = user?.id || user?.uid;
      if (!userId) return;
      const data = await getDashboardStats(userId);
      if (data?.metaMensal) {
        setMetaMensal(data.metaMensal);
      }
    } catch (err) {
      // Silenciar erro - meta não é crítica
    }
  };

  const carregarMaterias = async () => {
    try {
      setLoading(true);
      const data = await listarMaterias(user.id || user.uid);
      setMaterias(data);
      setError(null);
    } catch (err) {
      setError('Não foi possível carregar as matérias. Tente novamente mais tarde.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Materias] Erro ao carregar matérias:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      setError('Nome da matéria é obrigatório');
      return;
    }

    try {
      if (editingId) {
        await atualizarMateria(editingId, formData);
      } else {
        await criarMateria(formData, user.id || user.uid);
      }
      
      await carregarMaterias();
      resetForm();
      setError(null);
    } catch (err) {
      setError('Não foi possível salvar a matéria. Tente novamente.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Materias] Erro ao salvar matéria:', err);
      }
    }
  };

  const handleEdit = (materia) => {
    setFormData({
      nome: materia.nome,
      descricao: materia.descricao || '',
      cor: materia.cor || '#14B8A6',
      concluida: !!materia.concluida
    });
    setEditingId(materia.id);
    setShowModal(true);
  };

  // Marcar/desmarcar matéria como concluída
  const toggleConcluida = async (materia) => {
    try {
      await atualizarMateria(materia.id, { ...materia, concluida: !materia.concluida });
      await carregarMaterias();
    } catch (err) {
      setError('Não foi possível atualizar o status da matéria. Tente novamente.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Materias] Erro ao atualizar status:', err);
      }
    }
  };

  const handleDelete = (materia) => {
    setConfirmDelete({
      isOpen: true,
      id: materia.id,
      nome: materia.nome
    });
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id) return;
    
    setIsDeleting(true);
    try {
      await deletarMateria(confirmDelete.id);
      await carregarMaterias();
      setError(null);
    } catch (err) {
      setError('Não foi possível excluir a matéria. Tente novamente.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Materias] Erro ao excluir matéria:', err);
      }
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', cor: '#14B8A6', concluida: false });
    setEditingId(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 transition-opacity duration-700 opacity-100">
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-20 h-20 flex items-center justify-center">
            <span className="absolute w-20 h-20 rounded-full border-4 border-teal-200 border-t-teal-400" style={{opacity:0.5}} />
            <span className="absolute w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-400" style={{opacity:0.3}} />
            <span className="relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg transition-all duration-700">
              <BookOpen size={28} className="text-teal-600" />
            </span>
          </div>
          <span className="mt-8 text-lg font-semibold text-teal-600 text-center drop-shadow-sm transition-opacity duration-700 opacity-80">Carregando matérias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 pb-32 pt-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <BookOpen size={28} className="text-white" />
                </div>
                Minhas Disciplinas
              </h1>
              <p className="text-slate-600 flex items-center gap-2">
                <Sparkles size={16} className="text-teal-500" />
                Gerencie suas matérias e acompanhe seu progresso
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
            >
              Nova Matéria
            </Button>
          </div>

          {/* Cards de estatísticas rápidas */}
          <div className="grid grid-cols-1 ipad:grid-cols-2 gap-4 mt-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
              <p className="text-sm text-slate-600 mb-1">Total de Matérias</p>
              <p className="text-2xl font-bold text-slate-900">{materias.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
              <p className="text-sm text-slate-600 mb-1">Matérias Ativas</p>
              <p className="text-2xl font-bold text-teal-600">{materias.filter(m => !m.concluida).length}</p>
            </div>
          </div>
        </motion.div>

        {/* Grid de Cards */}
        {/* Separar matérias ativas e concluídas */}
        {materias.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BookOpen size={48} className="text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Nenhuma matéria cadastrada
            </h3>
            <p className="text-slate-600 mb-8">
              Crie sua primeira matéria para começar a organizar seus estudos
            </p>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
            >
              Criar Primeira Matéria
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Ativas */}
            <h2 className="text-lg font-bold text-slate-800 mb-2 mt-8">Matérias Ativas</h2>
            <div className="grid grid-cols-1 ipad:grid-cols-2 ipad:lg:grid-cols-3 ipad:xl:grid-cols-4 gap-6 ipad:gap-8">
              {materias.filter(m => !m.concluida).length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-8">Nenhuma matéria ativa</div>
              )}
              {materias.filter(m => !m.concluida).map((materia, index) => (
                <motion.div
                  key={materia.id}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div 
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-t-4 min-h-[180px] h-full flex flex-col"
                    style={{ borderTopColor: materia.cor || '#14B8A6' }}
                  >
                    {/* Card Header */}
                    <div className="p-4 sm:p-5 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-md"
                          style={{ background: `linear-gradient(135deg, ${materia.cor}dd, ${materia.cor})` }}
                        >
                          <BookOpen size={24} className="text-white" />
                        </div>
                        {/* Botão concluir - agora alinhado no rodapé */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={() => handleEdit(materia)}
                            className="p-2 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(materia)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-1 truncate max-w-full" style={{wordBreak:'break-word'}}>
                        {materia.nome}
                      </h3>
                      {materia.descricao && (
                        <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-3 max-w-full" style={{wordBreak:'break-word'}}>
                          {materia.descricao}
                        </p>
                      )}
                    </div>
                    {/* Card Footer - Info Extras e botão concluir */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                            <CreditCard size={14} />
                            <p className="text-[10px] sm:text-xs font-medium">Flashcards</p>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-slate-900">
                            {materia.totalFlashcards || 0}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                            <FileText size={14} />
                            <p className="text-[10px] sm:text-xs font-medium">Resumos</p>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-slate-900">
                            {materia.totalResumos || 0}
                          </p>
                        </div>
                      </div>
                      {/* Botão concluir */}
                      <button
                        onClick={() => toggleConcluida(materia)}
                        className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors border border-emerald-100 ml-2"
                        title="Marcar como concluída"
                      >
                        <TrendingUp size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Concluídas */}
            <h2 className="text-lg font-bold text-slate-800 mb-2 mt-10">Matérias Concluídas</h2>
            <div className="grid grid-cols-1 ipad:grid-cols-2 ipad:lg:grid-cols-3 ipad:xl:grid-cols-4 gap-6 ipad:gap-8">
              {materias.filter(m => m.concluida).length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-8">Nenhuma matéria concluída</div>
              )}
              {materias.filter(m => m.concluida).map((materia, index) => (
                <motion.div
                  key={materia.id}
                  className="group opacity-60"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div 
                    className="bg-white rounded-2xl shadow-lg border-t-4 min-h-[220px] h-full flex flex-col relative"
                    style={{ borderTopColor: materia.cor || '#14B8A6' }}
                  >
                    {/* Selo de concluída ajustado para o canto superior direito, menor e sem sobrepor o ícone */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 rounded-full px-2 py-0.5 shadow border border-emerald-100 text-xs z-10" style={{minHeight:'28px'}}>
                      <TrendingUp size={14} />
                      <span>Concluída</span>
                    </div>
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                          style={{ background: `linear-gradient(135deg, ${materia.cor}dd, ${materia.cor})` }}
                        >
                          <BookOpen size={28} className="text-white" />
                        </div>
                        {/* Botão desfazer conclusão no rodapé */}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 truncate line-through">
                        {materia.nome}
                      </h3>
                      {materia.descricao && (
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 italic">
                          {materia.descricao}
                        </p>
                      )}
                    </div>
                    {/* Card Footer - Info Extras e botão desfazer conclusão */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                            <CreditCard size={16} />
                            <p className="text-xs font-medium">Flashcards</p>
                          </div>
                          <p className="text-lg font-bold text-slate-900">
                            {materia.totalFlashcards || 0}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                            <FileText size={16} />
                            <p className="text-xs font-medium">Resumos</p>
                          </div>
                          <p className="text-lg font-bold text-slate-900">
                            {materia.totalResumos || 0}
                          </p>
                        </div>
                      </div>
                      {/* Botão desfazer conclusão */}
                      <button
                        onClick={() => toggleConcluida(materia)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors border border-slate-200 ml-2"
                        title="Desfazer conclusão"
                      >
                        <TrendingUp size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Modal de Criação/Edição */}
        <Modal
          isOpen={showModal}
          onClose={resetForm}
          title={editingId ? 'Editar Matéria' : 'Nova Matéria'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome da Matéria"
              placeholder="Ex: Anatomia Humana"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />

            <Textarea
              label="Descrição (Opcional)"
              placeholder="Breve descrição sobre a matéria..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />

            {/* Seletor de Cor */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Palette size={16} className="text-teal-600" />
                Cor da Matéria
              </label>
              <div className="grid grid-cols-4 gap-3">
                {CORES_DISPONIVEIS.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: cor.valor })}
                    className={`
                      h-12 rounded-xl transition-all duration-200
                      ${formData.cor === cor.valor 
                        ? 'ring-4 ring-offset-2 scale-105' 
                        : 'hover:scale-105'
                      }
                    `}
                    style={{ 
                      backgroundColor: cor.valor,
                      ringColor: `${cor.valor}40`
                    }}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
              >
                {editingId ? 'Atualizar Matéria' : 'Criar Matéria'}
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

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
          onConfirm={confirmarExclusao}
          title="Excluir Matéria"
          itemName={confirmDelete.nome}
          confirmText="Excluir"
          isLoading={isDeleting}
          type="danger"
        />
      </div>
    </div>
  );
}

export default Materias;
