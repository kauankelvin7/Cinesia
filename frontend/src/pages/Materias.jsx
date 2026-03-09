/**
 * MATÉRIAS - Gerenciamento Premium de Disciplinas
 * * Grid de cards gerenciais com visual Clean HealthTech
 * Features:
 * - Grid responsivo de cards
 * - Modal de criação/edição com seletor de cores
 * - Ações no hover (Editar/Excluir)
 * - Loading Skeletons Consistentes
 * - Efeito de Gradiente (Glow) nos cards restaurado
 * - FIX: Quebra de texto (overflow) nos cards de status superiores resolvida
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { 
  Plus, 
  BookOpen, 
  Edit2, 
  Trash2, 
  CreditCard,
  FileText,
  Palette,
  TrendingUp,
  Search,
  ArrowUpDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Layers,
  Check,
  AlertTriangle
} from 'lucide-react';

// Services & Context
import { listarMaterias, criarMateria, atualizarMateria, deletarMateria, listarFlashcards } from '../services/firebaseService';
import { isDueForReview } from '../utils/sm2';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';

// Components
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import ConfirmModal from '../components/ui/ConfirmModal';

// Animações Stagger
const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

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
  const { loadData: loadCachedData } = useDashboardData();
  
  const [materias, setMaterias] = useState([]);
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States Modal e Forms
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#0EA5E9',
    concluida: false
  });
  const [error, setError] = useState(null);
  
  // Filtros e Ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recente');

  // Modal de Exclusão
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ==================== DADOS COMPUTADOS ====================

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
        break;
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

  const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(14, 165, 233, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16) || 14;
    const g = parseInt(hex.slice(3, 5), 16) || 165;
    const b = parseInt(hex.slice(5, 7), 16) || 233;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // ==================== EFFECTS & HANDLERS ====================

  useEffect(() => {
    if (user) {
      carregarMaterias();
    }
  }, [user]);

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
      if (process.env.NODE_ENV !== 'production') console.error(err);
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

  const toggleConcluida = async (materia) => {
    try {
      await atualizarMateria(materia.id, { ...materia, concluida: !materia.concluida });
      await carregarMaterias();
    } catch (err) {
      toast.error('Erro ao atualizar status da matéria.');
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
      toast.success('Matéria excluída com sucesso.');
    } catch (err) {
      toast.error('Não foi possível excluir a matéria.');
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

  // ==================== LOADING STATE (Consistente) ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center text-center animate-pulse"
        >
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-[20px] flex items-center justify-center mb-5 border border-indigo-100/50 dark:border-indigo-800/30">
            <BookOpen size={32} className="text-indigo-400 dark:text-indigo-500" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Buscando Matérias...
          </p>
        </motion.div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen pb-32 pt-8 px-4 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER PREMIUM */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <BookOpen size={26} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                  Minhas Disciplinas
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-[14px] font-medium">
                  Gerencie suas matérias e acompanhe seu progresso.
                </p>
              </div>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto shadow-md bg-indigo-600 border-none shrink-0"
            >
              Nova Matéria
            </Button>
          </div>

          {/* STATS CARDS PREMIUM (Fixado o Wrap em Telas Pequenas) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-5 mt-8">
            {/* Progresso Geral */}
            <motion.div 
              className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-4 lg:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col"
              whileHover={{ y: -2 }}
            >
              <div className="mb-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-[12px] flex items-center justify-center shadow-sm mb-3 shrink-0">
                  <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={2.5} />
                </div>
                <p className="text-[11px] lg:text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 line-clamp-1">Progresso Geral</p>
              </div>
              <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter leading-none">{completionPercent}%</p>
              <div className="mt-auto">
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden mb-2 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-400">{materias.filter(m => m.concluida).length} de {materias.length} concluídas</p>
              </div>
            </motion.div>

            {/* Matérias Ativas */}
            <motion.div 
              className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-4 lg:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col"
              whileHover={{ y: -2 }}
            >
              <div className="mb-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-[12px] flex items-center justify-center shadow-sm mb-3 shrink-0">
                  <Layers size={20} className="text-indigo-500" strokeWidth={2.5} />
                </div>
                <p className="text-[11px] lg:text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 line-clamp-1">Em Andamento</p>
              </div>
              <p className="text-3xl lg:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none mb-1">
                {materias.filter(m => !m.concluida).length}
              </p>
              <p className="text-[11px] font-bold text-slate-400 mt-auto pt-2">Matérias ativas no momento</p>
            </motion.div>

            {/* Revisões Pendentes */}
            <motion.div 
              className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-4 lg:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm cursor-pointer group transition-all flex flex-col"
              onClick={() => navigate('/flashcards', { state: { reviewMode: true } })}
              whileHover={{ y: -2, borderColor: 'rgba(245,158,11,0.4)', boxShadow: '0 10px 25px rgba(245,158,11,0.1)' }}
            >
              <div className="mb-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-[12px] flex items-center justify-center shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-500 mb-3 shrink-0">
                  <RotateCcw size={20} strokeWidth={2.5} />
                </div>
                <p className="text-[11px] lg:text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-1">Revisões Hoje</p>
              </div>
              <p className={`text-3xl lg:text-4xl font-extrabold tracking-tighter leading-none mb-1 ${totalPendingReviews > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                {totalPendingReviews}
              </p>
              <p className="text-[11px] font-bold text-slate-400 mt-auto pt-2 flex items-center gap-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                Cards aguardando <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
              </p>
            </motion.div>
          </div>

          {/* BARRA DE BUSCA + FILTROS */}
          <motion.div 
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar matéria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 h-14 rounded-[16px] border-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-[15px] font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />
            <div className="relative">
              <ArrowUpDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-12 pr-10 h-14 rounded-[16px] border-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-[14px] font-black uppercase tracking-wide appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-full sm:w-auto shadow-inner"
              >
                <option value="recente">Mais Recente</option>
                <option value="nome">A-Z</option>
                <option value="flashcards">+ Flashcards</option>
                <option value="revisao">+ Revisões</option>
              </select>
            </div>
          </motion.div>
        </motion.div>

        {/* ==================== LISTAGEM DE MATÉRIAS ==================== */}
        {materias.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-slate-800/30 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-indigo-100 dark:border-indigo-800/50">
              <BookOpen size={40} className="text-indigo-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Nenhuma matéria cadastrada
            </h3>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Crie sua primeira matéria para organizar seus resumos e flashcards de forma inteligente.
            </p>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus size={20} />}
              onClick={() => setShowModal(true)}
              className="shadow-lg shadow-indigo-500/20 bg-indigo-600 rounded-2xl h-14 px-8"
            >
              Criar Primeira Matéria
            </Button>
          </motion.div>
        ) : (
          <>
            {/* ── MATÉRIAS ATIVAS ── */}
            {(() => {
              const ativas = filterAndSort(materias.filter(m => !m.concluida));
              return (
                <>
                  <div className="flex items-center gap-3 mb-6 mt-4">
                    <h2 className="text-[14px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Em Andamento
                    </h2>
                    <span className="flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold h-6 px-2.5 rounded-full">
                      {ativas.length}
                    </span>
                  </div>

                  <motion.div
                    className="grid gap-5 sm:gap-6"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
                    variants={gridVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {ativas.length === 0 && (
                      <div className="col-span-full text-center text-slate-500 font-bold py-12 bg-white/50 dark:bg-slate-800/20 rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700">
                        {searchTerm ? 'Nenhuma matéria ativa corresponde à sua busca.' : 'Nenhuma matéria em andamento.'}
                      </div>
                    )}
                    
                    {ativas.map((materia) => {
                      const pendingCount = reviewsByMateria[materia.id]?.pending || 0;
                      const materiaColor = materia.cor || '#0EA5E9';
                      
                      return (
                        <motion.div
                          key={materia.id}
                          className="group h-full min-h-[220px] flex flex-col"
                          variants={cardItemVariants}
                          whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                        >
                          <div 
                            className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 h-full flex flex-col relative group-hover:ring-1 group-hover:ring-offset-1 dark:group-hover:ring-offset-slate-950"
                            style={{ '--tw-ring-color': materiaColor }}
                          >
                            {/* GRADIENTE RESTAURADO */}
                            <div 
                              className="absolute top-0 left-0 right-0 h-24 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
                              style={{ background: `linear-gradient(to bottom, ${materiaColor}, transparent)` }}
                            />

                            <div className="p-6 flex-1 flex flex-col relative z-10">
                              {/* Top Row: Icon + Badges */}
                              <div className="flex items-start justify-between mb-4">
                                <div 
                                  className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm"
                                  style={{ backgroundColor: hexToRgba(materiaColor, 0.15), color: materiaColor, border: `1px solid ${hexToRgba(materiaColor, 0.3)}` }}
                                >
                                  <BookOpen size={22} strokeWidth={2.5} />
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  {pendingCount > 0 && (
                                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-700/50 shadow-sm">
                                      <RotateCcw size={12} strokeWidth={3} />
                                      {pendingCount} Hoje
                                    </span>
                                  )}
                                  
                                  {/* Quick Actions (Hover) */}
                                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm ml-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleEdit(materia); }}
                                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors shadow-sm"
                                      title="Editar"
                                    >
                                      <Edit2 size={14} strokeWidth={2.5} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(materia); }}
                                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors shadow-sm"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Title & Desc */}
                              <h3 className="text-[18px] font-black text-slate-900 dark:text-white mb-1.5 truncate tracking-tight">
                                {materia.nome}
                              </h3>
                              {materia.descricao && (
                                <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium line-clamp-2 leading-relaxed flex-1">
                                  {materia.descricao}
                                </p>
                              )}
                            </div>
                            
                            {/* Footer: Stats & Complete Button */}
                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigate('/flashcards', { state: { filterMateria: materia.id } })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
                                  title="Ver Flashcards"
                                >
                                  <CreditCard size={14} className="text-blue-500" />
                                  <span>{materia.totalFlashcards || 0}</span>
                                </button>
                                <button
                                  onClick={() => navigate('/resumos', { state: { filterMateria: materia.id } })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600 transition-colors shadow-sm"
                                  title="Ver Resumos"
                                >
                                  <FileText size={14} className="text-teal-500" />
                                  <span>{materia.totalResumos || 0}</span>
                                </button>
                              </div>
                              
                              <button
                                onClick={() => toggleConcluida(materia)}
                                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all shadow-sm active:scale-95"
                                title="Marcar como concluída"
                              >
                                <Check size={18} strokeWidth={3} />
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

            {/* ── MATÉRIAS CONCLUÍDAS ── */}
            {(() => {
              const concluidas = filterAndSort(materias.filter(m => m.concluida));
              if (concluidas.length === 0 && !searchTerm) return null;
              
              return (
                <>
                  <div className="flex items-center gap-4 mt-12 mb-6">
                    <h2 className="text-[14px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      Concluídas
                      <span className="flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] h-6 px-2.5 rounded-full">
                        {concluidas.length}
                      </span>
                    </h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                  
                  <motion.div
                    className="grid gap-5"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
                    variants={gridVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {concluidas.length === 0 && (
                      <div className="col-span-full text-center text-slate-400 font-bold py-8">Nenhuma matéria concluída encontrada.</div>
                    )}
                    {concluidas.map((materia) => (
                      <motion.div
                        key={materia.id}
                        className="group opacity-75 hover:opacity-100 transition-opacity h-full flex flex-col"
                        variants={cardItemVariants}
                      >
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[24px] shadow-sm border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col relative overflow-hidden">
                          
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-black uppercase tracking-widest bg-emerald-100/80 dark:bg-emerald-900/50 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50 text-[9px] z-10">
                            <CheckCircle2 size={12} strokeWidth={3} /> Concluída
                          </div>
                          
                          <div className="p-6 flex-1">
                            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center grayscale opacity-80 mb-3" style={{ backgroundColor: `${materia.cor || '#0EA5E9'}15`, color: materia.cor || '#0EA5E9' }}>
                              <BookOpen size={18} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-[16px] font-bold text-slate-600 dark:text-slate-300 mb-1 truncate line-through decoration-slate-400 dark:decoration-slate-500">
                              {materia.nome}
                            </h3>
                          </div>
                          
                          <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                                <CreditCard size={14} className="text-slate-400" /> {materia.totalFlashcards || 0}
                              </span>
                              <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                                <FileText size={14} className="text-slate-400" /> {materia.totalResumos || 0}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleConcluida(materia)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
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

        {/* ==================== MODALS ==================== */}
        
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
              placeholder="Ex: Anatomia Humana, Cinesiologia..."
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              className="h-14 text-[15px] font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />

            <Textarea
              label="Descrição (Opcional)"
              placeholder="Breve descrição sobre o foco desta matéria..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="text-[14px] font-medium bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-inner p-4"
            />

            {/* Seletor de Cor Refinado */}
            <div>
              <label className="block text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Palette size={16} className="text-indigo-500" />
                Cor da Etiqueta
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[20px] border border-slate-100 dark:border-slate-700">
                {CORES_DISPONIVEIS.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, cor: cor.valor })}
                    className={`
                      relative aspect-square rounded-[14px] transition-all duration-200 w-full
                      ${formData.cor === cor.valor 
                        ? 'scale-110 shadow-md z-10' 
                        : 'hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100'
                      }
                    `}
                    style={{ 
                      backgroundColor: cor.valor,
                      boxShadow: formData.cor === cor.valor ? `0 0 0 3px var(--bg-card), 0 0 0 6px ${cor.valor}` : undefined
                    }}
                    title={cor.nome}
                  >
                    {formData.cor === cor.valor && (
                      <Check size={18} color="white" strokeWidth={3} className="absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-sm">
                <AlertTriangle size={18} strokeWidth={2.5} /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-500/20 h-14 text-[15px] font-bold rounded-2xl"
              >
                {editingId ? 'Atualizar' : 'Criar Matéria'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none h-14 text-[15px] font-bold rounded-2xl"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de Exclusão */}
        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
          onConfirm={confirmarExclusao}
          title="Excluir Matéria"
          itemName={confirmDelete.nome}
          confirmText="Excluir Matéria"
          isLoading={isDeleting}
          type="danger"
        />
      </div>
    </div>
  );
}

export default Materias;