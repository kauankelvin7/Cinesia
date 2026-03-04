/**
 *  RESUMOS - Biblioteca de Estudos Premium
 * 
 * Editor rico com React Quill para criação de resumos formatados
 * Features:
 * - Editor de texto rico (bold, listas, cores)
 * - Busca em tempo real
 * - Filtro por matéria
 * - Grid responsivo com preview
 * - Modal full-screen para edição
 */

import React, { useState, useEffect, useMemo, Suspense, lazy, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Stagger animation variants
const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const cardItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
};

const ReactQuill = lazy(() => import('react-quill'));
import 'react-quill/dist/quill.snow.css';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  FileText,
  X,
  Calendar,
  ClipboardList,
  BookOpen,
  Lightbulb,
  PenTool,
  Sparkles,
  ArrowRight,
  Download,
  Clock,
  BarChart2,
  ArrowUpDown,
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  AlignLeft,
} from 'lucide-react';
import { 
  listarResumos, 
  criarResumo, 
  atualizarResumo, 
  deletarResumo, 
  listarMateriasSimples
} from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';

// Configuração do Editor Quill
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ list: 'ordered'}, { list: 'bullet' }],
    [{ color: [] }],
    ['clean']
  ],
};

const quillFormats = ['header', 'bold', 'italic', 'list', 'bullet', 'color'];

// Template de Caso Clínico para Fisioterapia
const TEMPLATE_CASO_CLINICO = `<h2>🩺 Caso Clínico</h2>

<h3>Queixa Principal</h3>
<p>Descreva a queixa principal do paciente...</p>

<h3>Histórico da Moléstia Atual (HMA)</h3>
<p>Evolução dos sintomas, início, fatores de melhora/piora...</p>

<h3>Avaliação Física</h3>
<ul>
<li><strong>Inspeção:</strong> </li>
<li><strong>Palpação:</strong> </li>
<li><strong>Amplitude de Movimento:</strong> </li>
<li><strong>Força Muscular:</strong> </li>
<li><strong>Testes Especiais:</strong> </li>
</ul>

<h3>Diagnóstico Cinético-Funcional</h3>
<p>Conclusão baseada na avaliação...</p>

<h3>Objetivos de Tratamento</h3>
<ul>
<li><strong>Curto Prazo:</strong> </li>
<li><strong>Médio Prazo:</strong> </li>
<li><strong>Longo Prazo:</strong> </li>
</ul>

<h3>Plano de Tratamento</h3>
<p>Condutas e intervenções planejadas...</p>
`;

// Função auxiliar para remover HTML tags
const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Função para formatar data relativa
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  if (days < 30) return `Há ${Math.floor(days / 7)} sem.`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Estimar tempo de leitura
const estimateReadingTime = (html) => {
  const words = stripHtml(html).trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.ceil(words / 200);
  return mins <= 1 ? '1 min' : `${mins} min`;
};

function Resumos() {
  const { user } = useAuth();
  const { refreshData } = useDashboardData();
  const location = useLocation();
  const [resumos, setResumos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingResumo, setViewingResumo] = useState(null); // Novo estado para visualização
  const [modalMode, setModalMode] = useState('edit'); // 'edit' ou 'view'
  const [viewFontSize, setViewFontSize] = useState(1); // Zoom da visualização
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [sortBy, setSortBy] = useState('recente');
  const [formData, setFormData] = useState({ titulo: '', conteudo: '', materiaId: '' });
  const [error, setError] = useState(null);

  // Estado do Modal de Confirmação
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-open new resumo modal from Home quick action + filterMateria from Materias
  useEffect(() => {
    if (location.state?.openNew && !loading) {
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
    if (location.state?.filterMateria) {
      setSelectedMateria(location.state.filterMateria);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loading]);

  useEffect(() => {
    if (user) carregarDados();
  }, [user]);

  const resumosFiltrados = useMemo(() => {
    let filtered = [...resumos];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.titulo.toLowerCase().includes(q) ||
        stripHtml(r.conteudo).toLowerCase().includes(q)
      );
    }
    if (selectedMateria !== 'all') {
      filtered = filtered.filter(r => r.materiaId === selectedMateria);
    }
    if (sortBy === 'antigo') {
      filtered.sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return da - db;
      });
    } else if (sortBy === 'nome') {
      filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (sortBy === 'materia') {
      filtered.sort((a, b) => {
        const ma = materias.find(m => m.id === a.materiaId)?.nome || '';
        const mb = materias.find(m => m.id === b.materiaId)?.nome || '';
        return ma.localeCompare(mb);
      });
    } else {
      filtered.sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return db - da;
      });
    }
    return filtered;
  }, [resumos, searchTerm, selectedMateria, sortBy, materias]);

  const statsResumos = useMemo(() => {
    const materiasCobertas = new Set(resumos.map(r => r.materiaId).filter(Boolean)).size;
    const semanaPassada = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const novosNaSemana = resumos.filter(r => {
      const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || 0);
      return d >= semanaPassada;
    }).length;
    return { total: resumos.length, materiasCobertas, novosNaSemana };
  }, [resumos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.uid;
      const [resumosData, materiasData] = await Promise.all([
        listarResumos(userId),
        listarMateriasSimples(userId)
      ]);
      setResumos(resumosData);
      setMaterias(materiasData);
      setError(null);
    } catch (err) {
      setError('Não conseguimos carregar seus dados. Tente novamente em instantes.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Resumos] Erro ao carregar dados:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.conteudo.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }
    try {
      const userId = user?.id || user?.uid;
      if (editingId) {
        await atualizarResumo(editingId, formData);
      } else {
        await criarResumo(formData, userId);
      }
      await carregarDados();
      refreshData(userId).catch(() => {});
      resetForm();
      setError(null);
      toast.success(editingId ? 'Resumo atualizado com sucesso!' : 'Resumo criado com sucesso!');
    } catch (err) {
      setError('Não foi possível salvar o resumo. Tente novamente.');
      toast.error('Não foi possível salvar o resumo.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Resumos] Erro ao salvar resumo:', err);
      }
    }
  };

  const handleEdit = (resumo) => {
    setFormData({ titulo: resumo.titulo, conteudo: resumo.conteudo, materiaId: resumo.materiaId || '' });
    setEditingId(resumo.id);
    setModalMode('edit');
    setViewingResumo(null);
    setShowModal(true);
  };

  const handleView = (resumo) => {
    setViewingResumo(resumo);
    setModalMode('view');
    setEditingId(resumo.id); // Garante que ao voltar para editar, pega o mesmo resumo
    setFormData({ titulo: resumo.titulo, conteudo: resumo.conteudo, materiaId: resumo.materiaId || '' });
    setShowModal(true);
  };

  const handleDelete = (resumo) => {
    setConfirmDelete({
      isOpen: true,
      id: resumo.id,
      nome: resumo.titulo
    });
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id) return;
    
    setIsDeleting(true);
    try {
      await deletarResumo(confirmDelete.id);
      await carregarDados();
      const userId = user?.id || user?.uid;
      refreshData(userId).catch(() => {});
      setError(null);
      toast.success('Resumo excluído com sucesso.');
    } catch (err) {
      setError('Não foi possível excluir o resumo. Tente novamente.');
      toast.error('Não foi possível excluir o resumo.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Resumos] Erro ao excluir resumo:', err);
      }
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  const [exportingPdf, setExportingPdf] = useState(false);

  const exportarPdf = async () => {
    if (!viewingResumo) return;
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const contentEl = document.getElementById('resumo-view-content');
      if (!contentEl) {
        toast.error('Conteúdo não encontrado para exportar.');
        return;
      }

      const canvas = await html2canvas(contentEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // If content is taller than one page, split into multiple pages
      const pageContentHeight = pdfHeight * (imgWidth / pdfWidth);
      const totalPages = Math.ceil(imgHeight / pageContentHeight);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        const srcY = page * pageContentHeight;
        const remainingHeight = Math.min(pageContentHeight, imgHeight - srcY);
        
        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = remainingHeight;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, srcY, imgWidth, remainingHeight, 0, 0, imgWidth, remainingHeight);
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        const pageScaledHeight = (remainingHeight / imgWidth) * pdfWidth;
        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pageScaledHeight);
      }

      const fileName = (viewingResumo.titulo || 'resumo').replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_');
      pdf.save(`${fileName}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toast.error('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setExportingPdf(false);
    }
  };

  const resetForm = () => {
    setFormData({ titulo: '', conteudo: '', materiaId: '' });
    setEditingId(null);
    setShowModal(false);
    setViewingResumo(null);
    setModalMode('edit');
  };

  const getMateriaInfo = (materiaId) => {
    const materia = materias.find(m => m.id === materiaId);
    return materia || { nome: 'Sem matéria', cor: '#94A3B8' };
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-32 pt-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <div className="h-8 w-52 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
                <div className="h-4 w-72 bg-slate-50 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 w-36 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 animate-pulse">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                <div className="w-full sm:w-64 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 ipad:grid-cols-2 ipad:lg:grid-cols-3 ipad:xl:grid-cols-4 gap-6 ipad:gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm h-70 flex flex-col" style={{animationDelay:`${i*80}ms`}}>
                <div className="p-5 flex-1">
                  <div className="h-5 w-24 bg-violet-50 rounded-full animate-pulse mb-4" />
                  <div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mb-3" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-full bg-slate-50 rounded animate-pulse" />
                    <div className="h-3.5 w-5/6 bg-slate-50 rounded animate-pulse" />
                    <div className="h-3.5 w-2/3 bg-slate-50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100"><div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></div>
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
        <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                  <FileText size={22} className="text-violet-600 dark:text-violet-400" />
                </div>
                Biblioteca de Resumos
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Organize e revise seus estudos com resumos formatados
              </p>
            </div>
            <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} onClick={() => setShowModal(true)}>
              Novo Resumo
            </Button>
          </div>

          {/* Stats */}
          {resumos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <FileText size={14} className="text-violet-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{statsResumos.total}</p>
                <p className="text-xs text-slate-400">resumos</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Layers size={14} className="text-blue-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Matérias</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{statsResumos.materiasCobertas}</p>
                <p className="text-xs text-slate-400">cobertas</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BarChart2 size={14} className="text-emerald-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Esta semana</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{statsResumos.novosNaSemana}</p>
                <p className="text-xs text-slate-400">novos</p>
              </div>
            </div>
          )}

          {/* Busca + Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input type="text" placeholder="Buscar resumos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <div className="w-full sm:w-52">
              <Select value={selectedMateria} onChange={(e) => setSelectedMateria(e.target.value)}>
                <option value="all">Todas as Matérias</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recente">Mais Recente</option>
                <option value="antigo">Mais Antigo</option>
                <option value="nome">Alfabético</option>
                <option value="materia">Por Matéria</option>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 whitespace-nowrap px-1">
              <span className="font-bold text-slate-900 dark:text-white">{resumosFiltrados.length}</span>
              <span>{resumosFiltrados.length === 1 ? 'resumo' : 'resumos'}</span>
            </div>
          </div>
        </motion.div>

        {resumosFiltrados.length === 0 ? (
          <motion.div className="text-center py-16" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {searchTerm || selectedMateria !== 'all' ? (
              <>
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Search size={36} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Nenhum resumo encontrado
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
                  Tente ajustar os filtros de busca
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <FileText size={40} className="text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Sua biblioteca começa aqui ?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  Resumos são como mapas do conhecimento. Crie seu primeiro e organize seus estudos!
                </p>

                {/* Onboarding Steps */}
                <div className="max-w-xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <motion.div
                    className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mb-3">
                      <span className="text-sm font-bold text-violet-600 dark:text-violet-400">1</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Clique em "Novo Resumo"</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Use o botão acima para abrir o editor</p>
                  </motion.div>

                  <motion.div
                    className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-3">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">2</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Escreva ou use template</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Formate com negrito, listas, cores e mais</p>
                  </motion.div>

                  <motion.div
                    className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">3</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Organize por matéria</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Vincule a uma matéria para fácil acesso</p>
                  </motion.div>
                </div>

                {/* CTA + Tip */}
                <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} onClick={() => setShowModal(true)}>
                  Criar Primeiro Resumo
                </Button>

                <motion.div
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Lightbulb size={14} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Dica: Use o template de "Caso Clínico" para estruturar rapidamente!
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            variants={gridVariants}
            initial="hidden"
            animate="visible"
          >
            {resumosFiltrados.map((resumo) => {
              const materiaInfo = getMateriaInfo(resumo.materiaId);
              const preview = stripHtml(resumo.conteudo);
              const readTime = estimateReadingTime(resumo.conteudo);
              return (
                <motion.div
                  key={resumo.id}
                  className="group"
                  variants={cardItemVariants}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                >
                  <div
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col cursor-pointer"
                    onClick={() => handleView(resumo)}
                  >
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <Badge color={materiaInfo.cor} size="sm">
                          <span className="truncate block max-w-35">{materiaInfo.nome}</span>
                        </Badge>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(resumo); }}
                            className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-400 sm:text-purple-600 sm:dark:text-purple-400 transition-colors active:scale-95"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(resumo); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 sm:text-red-500 sm:dark:text-red-400 transition-colors active:scale-95"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{resumo.titulo}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">{preview}</p>
                    </div>
                    <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(resumo.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {readTime} leitura
                        </span>
                      </div>
                      <span className="text-xs font-medium text-violet-500 dark:text-violet-400">Ver →</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={resetForm}
            >
              <motion.div
                className="bg-white dark:bg-slate-900 w-full sm:rounded-2xl shadow-xl sm:max-w-5xl max-h-[96dvh] sm:max-h-[90vh] overflow-hidden flex flex-col print:max-h-full print:rounded-none"
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* ── HEADER ── */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 print:hidden shrink-0">
                  {/* Fechar */}
                  <button
                    onClick={resetForm}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    aria-label="Fechar"
                  >
                    <X size={18} />
                  </button>

                  {/* Ícone + título */}
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate flex-1 min-w-0">
                    {formData.titulo || (editingId ? 'Editar Resumo' : 'Novo Resumo')}
                  </span>

                  {/* Tab switcher — Editar / Visualizar */}
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shrink-0">
                    <button
                      onClick={() => {
                        setModalMode('edit');
                        if (viewingResumo) {
                          setFormData({ titulo: viewingResumo.titulo, conteudo: viewingResumo.conteudo, materiaId: viewingResumo.materiaId || '' });
                          setViewingResumo(null);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        modalMode === 'edit'
                          ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Edit2 size={13} />
                      <span className="hidden xs:inline">Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        setModalMode('view');
                        setViewingResumo({
                          titulo: formData.titulo,
                          conteudo: formData.conteudo,
                          materiaId: formData.materiaId,
                          createdAt: viewingResumo?.createdAt
                        });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        modalMode === 'view'
                          ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Eye size={13} />
                      <span className="hidden xs:inline">Visualizar</span>
                    </button>
                  </div>

                  {/* Ações contextuais */}
                  <div className="flex items-center gap-1 shrink-0">
                    {modalMode === 'edit' && (
                      <button
                        form="resumo-form"
                        type="submit"
                        disabled={!formData.titulo.trim() || !formData.conteudo.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {editingId ? 'Atualizar' : 'Salvar'}
                      </button>
                    )}
                    {modalMode === 'view' && (
                      <>
                        {/* Zoom - / % / + */}
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => setViewFontSize(f => Math.max(0.8, +(f - 0.1).toFixed(2)))}
                            disabled={viewFontSize <= 0.8}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors text-sm font-bold"
                            title="Diminuir fonte"
                          >
                            <ZoomOut size={14} />
                          </button>
                          <span className="text-xs text-slate-400 select-none px-1 min-w-[30px] text-center tabular-nums">
                            {Math.round(viewFontSize * 100)}%
                          </span>
                          <button
                            onClick={() => setViewFontSize(f => Math.min(2, +(f + 0.1).toFixed(2)))}
                            disabled={viewFontSize >= 2}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                            title="Aumentar fonte"
                          >
                            <ZoomIn size={14} />
                          </button>
                        </div>
                        <button
                          onClick={exportarPdf}
                          disabled={exportingPdf}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                          title="Exportar PDF"
                        >
                          {exportingPdf ? (
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" /></svg>
                          ) : (
                            <Download size={14} />
                          )}
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── BODY ── */}
                {modalMode === 'edit' ? (
                  <form id="resumo-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-5 sm:p-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input
                            label="Título do Resumo"
                            placeholder="Ex: Sistema Nervoso Central"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            required
                          />
                          <p className="mt-1 text-xs text-slate-400">{formData.titulo.length} caracteres</p>
                        </div>
                        <Select
                          label="Matéria"
                          value={formData.materiaId}
                          onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })}
                          required
                        >
                          <option value="">Selecione uma matéria</option>
                          {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Conteúdo <span className="text-red-500">*</span>
                            </label>
                            {formData.conteudo && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <AlignLeft size={12} />
                                {stripHtml(formData.conteudo).trim().split(/\s+/).filter(Boolean).length} palavras
                                &middot; {estimateReadingTime(formData.conteudo)} leitura
                              </span>
                            )}
                          </div>
                          {!editingId && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFormData({ ...formData, conteudo: TEMPLATE_CASO_CLINICO })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              <ClipboardList size={14} />
                              Template Caso Clínico
                            </motion.button>
                          )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all">
                          <Suspense fallback={<div className="text-center py-10 text-slate-400 text-sm">Carregando editor...</div>}>
                            <ReactQuill
                              theme="snow"
                              value={formData.conteudo}
                              onChange={(content) => setFormData({ ...formData, conteudo: content })}
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="Escreva seu resumo aqui..."
                              className="quill-editor-custom"
                              style={{ minHeight: '300px' }}
                            />
                          </Suspense>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
                      )}
                    </div>

                    <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex gap-3 print:hidden shrink-0">
                      <Button type="submit" variant="primary" size="lg" className="flex-1">
                        {editingId ? 'Atualizar Resumo' : 'Salvar Resumo'}
                      </Button>
                      <Button type="button" variant="secondary" size="lg" onClick={resetForm}>Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex-1 overflow-y-auto print:overflow-visible bg-slate-50 dark:bg-slate-950">
                    <div id="resumo-view-content" className="max-w-2xl mx-auto px-6 sm:px-10 py-8 print:p-0">
                      {/* Bloco de título + meta */}
                      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <h1
                          className="font-bold text-slate-900 dark:text-white leading-tight mb-3 print:text-2xl"
                          style={{ fontSize: `${Math.min(viewFontSize * 1.8, 2.4)}em`, transition: 'font-size 0.2s' }}
                        >
                          {(viewingResumo?.titulo || formData.titulo) || 'Sem título'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge color={getMateriaInfo((viewingResumo?.materiaId || formData.materiaId)).cor} size="sm">
                            {getMateriaInfo((viewingResumo?.materiaId || formData.materiaId)).nome}
                          </Badge>
                          {viewingResumo?.createdAt && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar size={13} />
                              {formatDate(viewingResumo.createdAt)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock size={13} />
                            {estimateReadingTime(viewingResumo?.conteudo || formData.conteudo)} leitura
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <AlignLeft size={13} />
                            {stripHtml(viewingResumo?.conteudo || formData.conteudo).trim().split(/\s+/).filter(Boolean).length} palavras
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo HTML */}
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none
                          prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                          prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                          prose-li:text-slate-700 dark:prose-li:text-slate-300
                          prose-strong:text-slate-900 dark:prose-strong:text-white
                          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                          print:prose-sm"
                        style={{ fontSize: `${viewFontSize}em`, transition: 'font-size 0.2s', wordBreak: 'break-word' }}
                        dangerouslySetInnerHTML={{
                          __html: (viewingResumo?.conteudo || formData.conteudo) || '<p style="color:#94a3b8">Sem conteúdo</p>'
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
        onConfirm={confirmarExclusao}
        title="Excluir Resumo"
        itemName={confirmDelete.nome}
        confirmText="Excluir"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}

export default Resumos;
