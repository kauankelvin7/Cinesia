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

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Stagger animation variants
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};
const cardItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
};
import { 
  Plus, 
  BookOpen, 
  Edit2, 
  Trash2, 
  CreditCard,
  FileText,
  Palette,
  Target,
  TrendingUp,
  Search,
  ArrowUpDown,
  ChevronRight,
  Clock,
  RotateCcw,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { listarMaterias, criarMateria, atualizarMateria, deletarMateria, listarFlashcards } from '../services/firebaseService';
import { isDueForReview } from '../utils/sm2';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import ConfirmModal from '../components/ui/ConfirmModal';

const CORES_DISPONIVEIS = [
  { nome: 'Sky', valor: '#0EA5E9' },
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
  const navigate = useNavigate();
  const { loadData: loadCachedData, refreshData } = useDashboardData();
  const [materias, setMaterias] = useState([]);
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#0EA5E9',
    concluida: false
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recente');

  // Estado do Modal de Confirmação
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado da Meta Mensal (Questões Resolvidas)
  const [metaMensal, setMetaMensal] = useState({ atual: 0, meta: 50, porcentagem: 0 });

  // ========== DADOS COMPUTADOS ==========
  const reviewsByMateria = useMemo(() => {
    const map = {};
    allFlashcards.forEach(fc => {
      const mid = fc.materiaId;
      if (!mid) return;
      if (!map[mid]) map[mid] = { total: 0, pending: 0 };
      map[mid].total++;
      if (isDueForReview(fc)) map[mid].pending++;
    });
    return map;
  }, [allFlashcards]);

  const totalPendingReviews = useMemo(() => {
    return Object.values(reviewsByMateria).reduce((sum, r) => sum + r.pending, 0);
  }, [reviewsByMateria]);

  const completionPercent = useMemo(() => {
    if (materias.length === 0) return 0;
    return Math.round((materias.filter(m => m.concluida).length / materias.length) * 100);
  }, [materias]);

  // Última atividade por matéria (baseado no flashcard mais recente)
  const lastActivityByMateria = useMemo(() => {
    const map = {};
    allFlashcards.forEach(fc => {
      const mid = fc.materiaId;
      if (!mid) return;
      const ts = fc.updatedAt?.toDate?.() || fc.updatedAt || fc.createdAt?.toDate?.() || fc.createdAt;
      if (!ts) return;
      const date = ts instanceof Date ? ts : new Date(ts);
      if (!map[mid] || date > map[mid]) map[mid] = date;
    });
    return map;
  }, [allFlashcards]);

  // Filtrar + Ordenar
  const filterAndSort = (list) => {
    let filtered = list;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => m.nome.toLowerCase().includes(term) || (m.descricao || '').toLowerCase().includes(term));
    }
    const sorted = [...filtered];
    switch (sortBy) {
      case 'nome':
        sorted.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        break;
      case 'flashcards':
        sorted.sort((a, b) => (b.totalFlashcards || 0) - (a.totalFlashcards || 0));
        break;
      case 'revisao':
        sorted.sort((a, b) => (reviewsByMateria[b.id]?.pending || 0) - (reviewsByMateria[a.id]?.pending || 0));
        break;
      case 'recente':
      default:
        break; // already ordered by createdAt desc from Firestore
    }
    return sorted;
  };

  const formatTimeAgo = (date) => {
    if (!date) return null;
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`;
    return `${Math.floor(diffDays / 30)} mês(es) atrás`;
  };

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
      const data = await loadCachedData(userId);
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
      const userId = user.id || user.uid;
      const [data, fcData] = await Promise.all([
        listarMaterias(userId),
        listarFlashcards(userId)
      ]);
      setMaterias(data);
      setAllFlashcards(fcData);
      setError(null);
    } catch (err) {
      setError('Não encontramos suas matérias agora. Tente novamente em instantes.');
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
      toast.success(editingId ? 'Matéria atualizada com sucesso!' : 'Matéria criada com sucesso!');
    } catch (err) {
      setError('Não foi possível salvar a matéria. Tente novamente.');
      toast.error('Não foi possível salvar a matéria.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Materias] Erro ao salvar matéria:', err);
      }
    }
  };

  const handleEdit = (materia) => {
    setFormData({
      nome: materia.nome,
      descricao: materia.descricao || '',
      cor: materia.cor || '#0EA5E9',
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
      toast.success('Matéria excluída com sucesso.');
    } catch (err) {
      setError('Não foi possível excluir a matéria. Tente novamente.');
      toast.error('Não foi possível excluir a matéria.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Materias] Erro ao excluir matéria:', err);
      }
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', cor: '#0EA5E9', concluida: false });
    setEditingId(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-32 pt-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Skeleton Header */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <div className="h-8 w-56 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
                <div className="h-4 w-72 bg-slate-50 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 w-36 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            </div>
            <div className="grid grid-cols-1 ipad:grid-cols-2 gap-4 mt-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 animate-pulse"><div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-700 rounded mb-2" /><div className="h-7 w-10 bg-slate-100 dark:bg-slate-700 rounded" /></div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 animate-pulse"><div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-700 rounded mb-2" /><div className="h-7 w-10 bg-slate-100 dark:bg-slate-700 rounded" /></div>
            </div>
          </div>
          {/* Skeleton Grid */}
          <div className="h-5 w-36 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mb-4" />
          <div className="grid grid-cols-1 ipad:grid-cols-2 ipad:lg:grid-cols-3 ipad:xl:grid-cols-4 gap-6 ipad:gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden" style={{animationDelay: `${i*100}ms`}}>
                <div className="h-1 bg-slate-100 dark:bg-slate-700 animate-pulse" />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <div className="flex-1"><div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mb-2" /><div className="h-4 w-1/2 bg-slate-50 rounded animate-pulse" /></div>
                  </div>
                </div>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100"><div className="h-8 w-full bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></div>
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
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                  <BookOpen size={22} className="text-primary-600 dark:text-primary-400" />
                </div>
                Minhas Disciplinas
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {/* Progresso geral */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Progresso Geral</p>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{completionPercent}%</p>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{materias.filter(m => m.concluida).length} de {materias.length} concluídas</p>
            </div>
            {/* Matérias ativas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Matérias Ativas</p>
                <Layers size={16} className="text-primary-500" />
              </div>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{materias.filter(m => !m.concluida).length}</p>
              <p className="text-xs text-slate-400 mt-1">de {materias.length} total</p>
            </div>
            {/* Revisões pendentes */}
            <div 
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/flashcards')}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Revisões Pendentes</p>
                <RotateCcw size={16} className="text-amber-500" />
              </div>
              <p className={`text-2xl font-bold ${totalPendingReviews > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{totalPendingReviews}</p>
              <p className="text-xs text-slate-400 mt-1">flashcards para revisar hoje</p>
            </div>
          </div>

          {/* Barra de Busca + Ordenação */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar matéria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-colors"
              />
            </div>
            <div className="relative">
              <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-colors"
              >
                <option value="recente">Mais Recente</option>
                <option value="nome">Alfabético</option>
                <option value="flashcards">Mais Flashcards</option>
                <option value="revisao">Mais Revisões</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Grid de Cards */}
        {materias.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BookOpen size={40} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Nenhuma matéria cadastrada
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
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
            {(() => {
              const ativas = filterAndSort(materias.filter(m => !m.concluida));
              return (
                <>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 mt-8 flex items-center gap-2">
                    Matérias Ativas
                    <span className="text-sm font-normal text-slate-400">({ativas.length})</span>
                  </h2>
                  <motion.div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    variants={gridVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {ativas.length === 0 && (
                      <div className="col-span-full text-center text-slate-400 py-8">
                        {searchTerm ? 'Nenhuma matéria encontrada' : 'Nenhuma matéria ativa'}
                      </div>
                    )}
                    {ativas.map((materia) => {
                      const pendingCount = reviewsByMateria[materia.id]?.pending || 0;
                      const lastActivity = lastActivityByMateria[materia.id];
                      const timeAgo = formatTimeAgo(lastActivity);
                      return (
                        <motion.div
                          key={materia.id}
                          className="group"
                          variants={cardItemVariants}
                          whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        >
                          <div 
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-slate-200/60 dark:border-slate-700/60 h-full flex flex-col"
                            style={{ borderTopColor: materia.cor || '#0EA5E9', borderTopWidth: '3px', borderTopStyle: 'solid' }}
                          >
                            {/* Card Header */}
                            <div className="p-4 sm:p-5 flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div 
                                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                                  style={{ backgroundColor: `${materia.cor || '#0EA5E9'}15`, color: materia.cor || '#0EA5E9' }}
                                >
                                  <BookOpen size={20} />
                                </div>
                                <div className="flex items-center gap-1">
                                  {pendingCount > 0 && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200/60 dark:border-amber-700/40">
                                      <RotateCcw size={11} />
                                      {pendingCount}
                                    </span>
                                  )}
                                  <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleEdit(materia); }}
                                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 text-slate-400 sm:text-primary-600 sm:dark:text-primary-400 transition-colors active:scale-95"
                                      title="Editar"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(materia); }}
                                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 sm:text-red-600 sm:dark:text-red-400 transition-colors active:scale-95"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1 truncate" style={{wordBreak:'break-word'}}>
                                {materia.nome}
                              </h3>
                              {materia.descricao && (
                                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 mb-2" style={{wordBreak:'break-word'}}>
                                  {materia.descricao}
                                </p>
                              )}
                              {timeAgo && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                  <Clock size={12} />
                                  <span>{timeAgo}</span>
                                </div>
                              )}
                            </div>
                            {/* Card Footer — Atalhos + Stats */}
                            <div className="px-4 sm:px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => navigate('/flashcards', { state: { filterMateria: materia.id } })}
                                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link"
                                    title="Ver Flashcards"
                                  >
                                    <CreditCard size={13} />
                                    <span>{materia.totalFlashcards || 0}</span>
                                    <ChevronRight size={12} className="opacity-0 -ml-1 group-hover/link:opacity-100 transition-opacity" />
                                  </button>
                                  <button
                                    onClick={() => navigate('/resumos', { state: { filterMateria: materia.id } })}
                                    className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group/link"
                                    title="Ver Resumos"
                                  >
                                    <FileText size={13} />
                                    <span>{materia.totalResumos || 0}</span>
                                    <ChevronRight size={12} className="opacity-0 -ml-1 group-hover/link:opacity-100 transition-opacity" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => toggleConcluida(materia)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 transition-colors border border-emerald-100 dark:border-emerald-800 active:scale-95"
                                  title="Marcar como concluída"
                                >
                                  <TrendingUp size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </>
              );
            })()}

            {/* Concluídas */}
            {(() => {
              const concluidas = filterAndSort(materias.filter(m => m.concluida));
              if (concluidas.length === 0 && !searchTerm) return null;
              return (
                <>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 mt-10 flex items-center gap-2">
                    Matérias Concluídas
                    <span className="text-sm font-normal text-slate-400">({concluidas.length})</span>
                  </h2>
                  <motion.div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    variants={gridVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {concluidas.length === 0 && (
                      <div className="col-span-full text-center text-slate-400 py-8">Nenhuma matéria encontrada</div>
                    )}
                    {concluidas.map((materia) => (
                      <motion.div
                        key={materia.id}
                        className="group opacity-60 hover:opacity-80 transition-opacity"
                        variants={cardItemVariants}
                      >
                        <div 
                          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 h-full flex flex-col relative"
                          style={{ borderTopColor: materia.cor || '#0EA5E9', borderTopWidth: '3px', borderTopStyle: 'solid' }}
                        >
                          <div className="absolute top-3 right-3 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 rounded-full px-2 py-0.5 shadow border border-emerald-100 dark:border-emerald-800 text-xs z-10">
                            <CheckCircle2 size={13} />
                            <span>Concluída</span>
                          </div>
                          <div className="p-5 flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div 
                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${materia.cor || '#0EA5E9'}15`, color: materia.cor || '#0EA5E9' }}
                              >
                                <BookOpen size={20} />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate line-through">
                              {materia.nome}
                            </h3>
                            {materia.descricao && (
                              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 italic">
                                {materia.descricao}
                              </p>
                            )}
                          </div>
                          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-xs text-blue-400">
                                <CreditCard size={13} />
                                {materia.totalFlashcards || 0}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-purple-400">
                                <FileText size={13} />
                                {materia.totalResumos || 0}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleConcluida(materia)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors border border-slate-200 dark:border-slate-700"
                              title="Desfazer conclusão"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              );
            })()}
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Palette size={16} className="text-primary-600 dark:text-primary-400" />
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
