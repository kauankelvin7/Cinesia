/**
 * MATÉRIAS - Gerenciamento Premium de Disciplinas
 * * Grid de cards gerenciais com visual Clean HealthTech
 * Features:
 * - Grid responsivo de cards
 * - Modal de criação/edição
 * - Ações no hover (Editar/Excluir)
 * - Indicador de progresso
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
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
  Layers,
  Check
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

  const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(14, 165, 233, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16) || 14;
    const g = parseInt(hex.slice(3, 5), 16) || 165;
    const b = parseInt(hex.slice(5, 7), 16) || 233;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-32 pt-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Skeleton Header Premium */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-[14px] bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-8 w-56 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
                <div className="h-4 w-72 bg-slate-50 dark:bg-slate-800/40 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 animate-pulse"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-700 rounded mb-3" /><div className="h-8 w-16 bg-slate-100 dark:bg-slate-700 rounded" /></div>
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 animate-pulse"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-700 rounded mb-3" /><div className="h-8 w-16 bg-slate-100 dark:bg-slate-700 rounded" /></div>
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 animate-pulse"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-700 rounded mb-3" /><div className="h-8 w-16 bg-slate-100 dark:bg-slate-700 rounded" /></div>
            </div>
          </div>
          {/* Skeleton Grid */}
          <div className="h-5 w-36 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-1 ipad:grid-cols-2 ipad:lg:grid-cols-3 ipad:xl:grid-cols-4 gap-6 ipad:gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800/50 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden" style={{animationDelay: `${i*100}ms`}}>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700/50 animate-pulse" />
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-[14px] bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <div className="flex-1"><div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mb-2.5" /><div className="h-4 w-1/2 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" /></div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50"><div className="h-6 w-full bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></div>
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
        {/* Header Premium */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
                <div 
                  className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
                >
                  <BookOpen size={24} className="text-white" strokeWidth={2} />
                </div>
                Minhas Disciplinas
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium ml-1">
                Gerencie suas matérias e acompanhe seu progresso de estudos
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto shadow-md bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 border-none"
            >
              Nova Matéria
            </Button>
          </div>

          {/* Cards de estatísticas rápidas Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {/* Progresso geral */}
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Progresso Geral</p>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{completionPercent}%</p>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                <div 
                  className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-[12px] font-medium text-slate-400">{materias.filter(m => m.concluida).length} de {materias.length} concluídas</p>
            </motion.div>

            {/* Matérias ativas */}
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Matérias Ativas</p>
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <Layers size={16} className="text-indigo-500" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">{materias.filter(m => !m.concluida).length}</p>
              <p className="text-[12px] font-medium text-slate-400 mt-3">Sendo estudadas ativamente</p>
            </motion.div>

            {/* Revisões pendentes */}
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-[20px] p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700 transition-all group"
              onClick={() => navigate('/flashcards')}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Revisões Hoje</p>
                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <RotateCcw size={16} className="text-amber-500" strokeWidth={2.5} />
                </div>
              </div>
              <p className={`text-3xl font-extrabold tracking-tight ${totalPendingReviews > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{totalPendingReviews}</p>
              <p className="text-[12px] font-medium text-slate-400 mt-3 flex items-center gap-1">
                Ver flashcards pendentes <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
              </p>
            </motion.div>
          </div>

          {/* Barra de Busca + Ordenação Glassmorphism */}
          <motion.div 
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-[20px] border border-slate-200/80 dark:border-slate-700/80 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar matéria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 h-12 rounded-[14px] border-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-[15px] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />
            <div className="relative">
              <ArrowUpDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-12 pr-10 h-12 rounded-[14px] border-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-[14px] font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-full sm:w-auto"
              >
                <option value="recente">Mais Recente</option>
                <option value="nome">Ordem Alfabética</option>
                <option value="flashcards">Mais Flashcards</option>
                <option value="revisao">Mais Revisões</option>
              </select>
            </div>
          </motion.div>
        </motion.div>

        {/* Grid de Cards */}
        {materias.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100 dark:border-indigo-800/50 relative z-10">
                <BookOpen size={48} className="text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
              </div>
              <motion.div 
                className="absolute inset-0 bg-teal-400 blur-2xl opacity-20 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
              Nenhuma matéria cadastrada
            </h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              Crie sua primeira matéria para organizar seus resumos e flashcards de forma inteligente.
            </p>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
              className="shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 border-none"
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
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-5 mt-4 flex items-center gap-2 tracking-tight">
                    Matérias Ativas
                    <span className="flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] h-6 px-2.5 rounded-full ml-1">
                      {ativas.length}
                    </span>
                  </h2>
                  <motion.div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
                    variants={gridVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {ativas.length === 0 && (
                      <div className="col-span-full text-center text-slate-400 py-10 bg-slate-50/50 dark:bg-slate-800/20 rounded-[20px] border border-dashed border-slate-200 dark:border-slate-700">
                        {searchTerm ? 'Nenhuma matéria ativa encontrada com este termo.' : 'Nenhuma matéria ativa no momento.'}
                      </div>
                    )}
                    {ativas.map((materia) => {
                      const pendingCount = reviewsByMateria[materia.id]?.pending || 0;
                      const lastActivity = lastActivityByMateria[materia.id];
                      const timeAgo = formatTimeAgo(lastActivity);
                      const materiaColor = materia.cor || '#0EA5E9';
                      
                      return (
                        <motion.div
                          key={materia.id}
                          className="group h-[240px]"
                          variants={cardItemVariants}
                          whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                        >
                          <div 
                            className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 h-full flex flex-col relative"
                          >
                            {/* Efeito visual superior refinado */}
                            <div 
                              className="absolute top-0 left-0 right-0 h-20 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
                              style={{ background: `linear-gradient(to bottom, ${materiaColor}, transparent)` }}
                            />

                            {/* Card Header */}
                            <div className="p-6 flex-1 relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                <div 
                                  className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm"
                                  style={{ backgroundColor: hexToRgba(materiaColor, 0.15), color: materiaColor, border: `1px solid ${hexToRgba(materiaColor, 0.3)}` }}
                                >
                                  <BookOpen size={22} strokeWidth={2} />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {pendingCount > 0 && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold border border-amber-200 dark:border-amber-700/50 shadow-sm">
                                      <RotateCcw size={12} strokeWidth={2.5} />
                                      {pendingCount}
                                    </span>
                                  )}
                                  
                                  {/* Botões de ação com Glassmorphism (aparecem no hover) */}
                                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[12px] p-1 border border-slate-100 dark:border-slate-700 shadow-sm ml-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleEdit(materia); }}
                                      className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors active:scale-95"
                                      title="Editar"
                                    >
                                      <Edit2 size={14} strokeWidth={2.5} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(materia); }}
                                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors active:scale-95"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5 truncate tracking-tight">
                                {materia.nome}
                              </h3>
                              
                              {materia.descricao && (
                                <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium line-clamp-2 leading-relaxed">
                                  {materia.descricao}
                                </p>
                              )}
                            </div>
                            
                            {/* Card Footer — Stats Premium */}
                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {/* Pílula Flashcards */}
                                <button
                                  onClick={() => navigate('/flashcards', { state: { filterMateria: materia.id } })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm group/btn"
                                  title="Ver Flashcards"
                                >
                                  <CreditCard size={14} className="text-blue-500" />
                                  <span>{materia.totalFlashcards || 0}</span>
                                </button>
                                
                                {/* Pílula Resumos */}
                                <button
                                  onClick={() => navigate('/resumos', { state: { filterMateria: materia.id } })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-sm"
                                  title="Ver Resumos"
                                >
                                  <FileText size={14} className="text-purple-500" />
                                  <span>{materia.totalResumos || 0}</span>
                                </button>
                              </div>
                              
                              {/* Botão Concluir com estilo floating */}
                              <button
                                onClick={() => toggleConcluida(materia)}
                                className="p-2 rounded-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all shadow-sm active:scale-95"
                                title="Marcar como concluída"
                              >
                                <Check size={16} strokeWidth={2.5} />
                              </button>
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
                  <div className="flex items-center gap-4 mt-12 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
                      Matérias Concluídas
                      <span className="flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] h-6 px-2.5 rounded-full ml-1">
                        {concluidas.length}
                      </span>
                    </h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                  
                  <motion.div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
                    variants={gridVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {concluidas.length === 0 && (
                      <div className="col-span-full text-center text-slate-400 py-8">Nenhuma matéria concluída encontrada.</div>
                    )}
                    {concluidas.map((materia) => (
                      <motion.div
                        key={materia.id}
                        className="group opacity-70 hover:opacity-100 transition-opacity h-[200px]"
                        variants={cardItemVariants}
                      >
                        <div 
                          className="bg-slate-50 dark:bg-slate-800/40 rounded-[24px] shadow-sm border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col relative overflow-hidden"
                        >
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/80 dark:bg-emerald-900/50 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50 text-[11px] z-10">
                            <CheckCircle2 size={14} strokeWidth={2.5} />
                            <span>Concluída</span>
                          </div>
                          
                          <div className="p-6 flex-1">
                            <div className="flex items-start mb-3">
                              <div 
                                className="w-10 h-10 rounded-[12px] flex items-center justify-center grayscale"
                                style={{ backgroundColor: `${materia.cor || '#0EA5E9'}15`, color: materia.cor || '#0EA5E9' }}
                              >
                                <BookOpen size={18} strokeWidth={2} />
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1 truncate line-through decoration-slate-400 dark:decoration-slate-500">
                              {materia.nome}
                            </h3>
                          </div>
                          
                          <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                                <CreditCard size={14} className="text-slate-400" />
                                {materia.totalFlashcards || 0}
                              </span>
                              <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                                <FileText size={14} className="text-slate-400" />
                                {materia.totalResumos || 0}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleConcluida(materia)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 shadow-sm"
                              title="Reativar Matéria"
                            >
                              <RotateCcw size={14} strokeWidth={2.5} />
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

        {/* Modal de Criação/Edição Premium */}
        <Modal
          isOpen={showModal}
          onClose={resetForm}
          title={editingId ? 'Editar Matéria' : 'Nova Matéria'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome da Matéria"
              placeholder="Ex: Anatomia Humana, Cinesiologia..."
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              className="h-14 text-[15px] font-semibold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-500/10"
            />

            <Textarea
              label="Descrição (Opcional)"
              placeholder="Breve descrição sobre o foco desta matéria..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="text-[14px] font-medium bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />

            {/* Seletor de Cor Refinado */}
            <div>
              <label className="block text-[14px] font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Palette size={18} className="text-indigo-500" />
                Cor da Matéria
              </label>
              <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-100 dark:border-slate-700">
                {CORES_DISPONIVEIS.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: cor.valor })}
                    className={`
                      relative h-12 rounded-[12px] transition-all duration-200 w-full
                      ${formData.cor === cor.valor 
                        ? 'scale-110 shadow-lg' 
                        : 'hover:scale-105 hover:shadow-md opacity-80 hover:opacity-100'
                      }
                    `}
                    style={{ 
                      backgroundColor: cor.valor,
                      boxShadow: formData.cor === cor.valor ? `0 0 0 3px white, 0 0 0 6px ${hexToRgba(cor.valor, 0.4)}` : undefined
                    }}
                    title={cor.nome}
                  >
                    {formData.cor === cor.valor && (
                      <Check size={16} color="white" strokeWidth={3} className="absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[14px] font-medium flex items-center gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 border-none shadow-md h-14 text-[15px] font-bold"
              >
                {editingId ? 'Atualizar Matéria' : 'Criar Matéria'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none h-14 text-[15px] font-bold"
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