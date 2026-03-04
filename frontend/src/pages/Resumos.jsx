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
  ImagePlus,
  Paperclip,
  XCircle,
  Image as ImageIcon2,
} from 'lucide-react';
import { 
  listarResumos, 
  criarResumo, 
  atualizarResumo, 
  deletarResumo, 
  listarMateriasSimples
} from '../services/firebaseService';
import { uploadImage } from '../services/cloudinaryService';
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
  const [formData, setFormData] = useState({ titulo: '', conteudo: '', materiaId: '', imagens: [] });
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = React.useRef(null);

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
    setFormData({ titulo: resumo.titulo, conteudo: resumo.conteudo, materiaId: resumo.materiaId || '', imagens: resumo.imagens || [] });
    setEditingId(resumo.id);
    setModalMode('edit');
    setViewingResumo(null);
    setShowModal(true);
  };

  const handleView = (resumo) => {
    setViewingResumo(resumo);
    setModalMode('view');
    setEditingId(resumo.id);
    setFormData({ titulo: resumo.titulo, conteudo: resumo.conteudo, materiaId: resumo.materiaId || '', imagens: resumo.imagens || [] });
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

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const uploads = Array.from(files).slice(0, 6 - (formData.imagens?.length || 0));
      const urls = await Promise.all(uploads.map(f => uploadImage(f)));
      setFormData(prev => ({ ...prev, imagens: [...(prev.imagens || []), ...urls] }));
      toast.success(`${urls.length} imagem(ns) adicionada(s)!`);
    } catch (err) {
      toast.error('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeImage = (idx) => {
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== idx)
    }));
  };

  const exportarPdf = async () => {
    const resumo = viewingResumo || { titulo: formData.titulo, conteudo: formData.conteudo, materiaId: formData.materiaId, imagens: formData.imagens };
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Build a hidden off-screen print container with forced white background
      const container = document.createElement('div');
      container.style.cssText = [
        'position:fixed', 'top:-9999px', 'left:0', 'z-index:-1',
        'width:794px', 'background:#ffffff', 'color:#1e293b',
        'font-family:Georgia,serif', 'font-size:14px', 'line-height:1.7',
        'padding:56px 72px 72px', 'box-sizing:border-box'
      ].join(';');

      const materiaInfo = getMateriaInfo(resumo.materiaId);
      const dataStr = resumo.createdAt ? formatDate(resumo.createdAt) : '';

      container.innerHTML = `
        <div style="border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:28px">
          <p style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7c3aed;margin:0 0 8px">${materiaInfo.nome}</p>
          <h1 style="font-size:26px;font-weight:700;color:#0f172a;margin:0 0 12px;line-height:1.3">${resumo.titulo || 'Sem título'}</h1>
          <div style="display:flex;gap:16px;font-size:12px;color:#94a3b8;align-items:center">
            ${dataStr ? `<span>📅 ${dataStr}</span>` : ''}
            <span>⏱ ${estimateReadingTime(resumo.conteudo)} de leitura</span>
            <span>≡ ${stripHtml(resumo.conteudo).trim().split(/\s+/).filter(Boolean).length} palavras</span>
          </div>
        </div>
        <div style="color:#1e293b;line-height:1.8">${resumo.conteudo || ''}</div>
        ${(resumo.imagens && resumo.imagens.length > 0) ? `
          <div style="margin-top:36px;border-top:1px solid #e2e8f0;padding-top:24px">
            <p style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin:0 0 16px">Imagens Anexadas</p>
            <div style="display:flex;flex-wrap:wrap;gap:12px">
              ${resumo.imagens.map(url => `<img src="${url}" style="max-width:340px;max-height:480px;border-radius:8px;border:1px solid #e2e8f0;object-fit:contain" crossorigin="anonymous" />`).join('')}
            </div>
          </div>` : ''}
        <div style="margin-top:48px;padding-top:12px;border-top:1px solid #f1f5f9;font-size:11px;color:#cbd5e1;text-align:center">Cinesia — Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
      `;

      document.body.appendChild(container);

      // Wait for images to load
      const imgs = container.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img =>
        img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
      ));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      document.body.removeChild(container);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      const totalPages = Math.ceil(imgHeight / pdfHeight);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        const srcY = page * (canvas.height / totalPages);
        const sliceH = canvas.height / totalPages;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      const fileName = (resumo.titulo || 'resumo').replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_');
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
    setFormData({ titulo: '', conteudo: '', materiaId: '', imagens: [] });
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
                          imagens: formData.imagens || [],
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

                      {/* Imagens Anexadas */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Paperclip size={14} className="text-slate-400" />
                              Imagens Anexadas
                            </label>
                            <span className="text-xs text-slate-400">
                              ({formData.imagens?.length || 0}/6) &mdash; fotos do caderno, iPad, etc.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingImages || (formData.imagens?.length || 0) >= 6}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors disabled:opacity-40"
                          >
                            {uploadingImages ? (
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" /></svg>
                            ) : (
                              <ImagePlus size={14} />
                            )}
                            {uploadingImages ? 'Enviando...' : 'Adicionar Imagem'}
                          </button>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleImageUpload(e.target.files)}
                          />
                        </div>

                        {(formData.imagens?.length || 0) === 0 ? (
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingImages}
                            className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center gap-2 text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors cursor-pointer group"
                          >
                            <ImageIcon2 size={28} className="group-hover:scale-105 transition-transform" />
                            <span className="text-sm font-medium">Clique para adicionar imagens</span>
                            <span className="text-xs">Foto do caderno, iPad, quadro branco &mdash; at&eacute; 6 imagens</span>
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {formData.imagens.map((url, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 aspect-[4/3]">
                                <img src={url} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                                  title="Remover imagem"
                                >
                                  <X size={12} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-white text-xs">{idx + 1} / {formData.imagens.length}</span>
                                </div>
                              </div>
                            ))}
                            {(formData.imagens.length < 6) && (
                              <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={uploadingImages}
                                className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
                              >
                                <ImagePlus size={20} />
                                <span className="text-xs">Mais</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>{/* end space-y-5 */}

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

                      {/* Imagens Anexadas — visualização */}
                      {(() => {
                        const imgs = viewingResumo?.imagens || formData.imagens || [];
                        if (imgs.length === 0) return null;
                        return (
                          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                              <Paperclip size={12} /> Imagens Anexadas ({imgs.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {imgs.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                  <img src={url} alt={`Imagem ${idx + 1}`} className="w-full h-auto object-contain" />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
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
