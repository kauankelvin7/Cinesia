/**
 * RESUMOS - Biblioteca de Estudos
 * * Editor rico com React Quill para criação de resumos formatados
 * Features:
 * - Editor de texto rico (bold, listas, cores)
 * - Busca em tempo real e Filtro por matéria
 * - Grid responsivo com preview inteligente e Glow de Matéria
 * - Modal full-screen para edição e modo leitura
 * - Carregamento Consistente Sincronizado
 */

import React, { useState, useEffect, useMemo, Suspense, lazy, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-quill/dist/quill.snow.css';

// Stagger animation variants
const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const cardItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const ReactQuill = lazy(() => import('react-quill'));
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
  Loader2,
  AlertTriangle,
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

// Helper para cor rgba com base em HEX
const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(139, 92, 246, ${alpha})`; // Violeta fallback
  const r = parseInt(hex.slice(1, 3), 16) || 139;
  const g = parseInt(hex.slice(3, 5), 16) || 92;
  const b = parseInt(hex.slice(5, 7), 16) || 246;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  // ==================== LOADING STATE CONSISTENTE ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center text-center animate-pulse"
        >
          <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 rounded-[20px] flex items-center justify-center mb-5 border border-violet-100/50 dark:border-violet-800/30">
            <FileText size={32} className="text-violet-400 dark:text-violet-500" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Buscando Resumos...
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
        <motion.div className="mb-10" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
                <div className="w-12 h-12 shrink-0 rounded-[14px] bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <FileText size={24} className="text-white" strokeWidth={2} />
                </div>
                <span className="truncate">Biblioteca de Resumos</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium ml-1 sm:ml-16 lg:ml-1">
                Sintetize seu conhecimento e revise de forma inteligente.
              </p>
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              leftIcon={<Plus size={20} />} 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto shadow-md bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-none shrink-0"
            >
              Novo Resumo
            </Button>
          </div>

          {/* STATS RÁPIDOS PREMIUM */}
          {resumos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-5 mt-8">
              
              {/* Total */}
              <motion.div 
                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-4 lg:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col"
                whileHover={{ y: -2 }}
              >
                <div className="mb-3">
                  <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-[12px] flex items-center justify-center shadow-sm mb-3 shrink-0">
                    <FileText size={20} className="text-violet-500" strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] lg:text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 line-clamp-1">Total de Resumos</p>
                </div>
                <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
                  {statsResumos.total}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-auto pt-2">Documentos salvos no total</p>
              </motion.div>

              {/* Matérias Cobertas */}
              <motion.div 
                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-4 lg:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col"
                whileHover={{ y: -2 }}
              >
                <div className="mb-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-[12px] flex items-center justify-center shadow-sm mb-3 shrink-0">
                    <Layers size={20} className="text-blue-500" strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] lg:text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 line-clamp-1">Matérias Cobertas</p>
                </div>
                <p className="text-3xl lg:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter leading-none mb-1">
                  {statsResumos.materiasCobertas}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-auto pt-2">Categorias diferentes estudadas</p>
              </motion.div>

              {/* Esta Semana */}
              <motion.div 
                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[24px] p-4 lg:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col"
                whileHover={{ y: -2 }}
              >
                <div className="mb-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-[12px] flex items-center justify-center shadow-sm mb-3 shrink-0">
                    <BarChart2 size={20} className="text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] lg:text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 line-clamp-1">Esta Semana</p>
                </div>
                <p className="text-3xl lg:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none mb-1">
                  +{statsResumos.novosNaSemana}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-auto pt-2">Novos conteúdos gerados</p>
              </motion.div>
            </div>
          )}

          {/* BUSCA + FILTROS (Consistente com Matérias) */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[24px] p-3 sm:p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm w-full mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold text-sm shrink-0">
              <Search size={16} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            
            <div className="flex flex-col sm:flex-row flex-1 gap-3 min-w-0 w-full">
              <div className="flex-1 min-w-0">
                <input 
                  type="text" 
                  placeholder="Buscar em todos os resumos..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full px-4 h-12 rounded-[14px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-[14px] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner" 
                />
              </div>

              <div className="flex-1 sm:max-w-[200px] min-w-0">
                <Select 
                  value={selectedMateria} 
                  onChange={(e) => setSelectedMateria(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm truncate h-12"
                >
                  <option value="all">Todas as Matérias</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </Select>
              </div>

              <div className="flex-1 sm:max-w-[160px] min-w-0">
                <Select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm truncate h-12"
                >
                  <option value="recente">Mais Recentes</option>
                  <option value="antigo">Mais Antigos</option>
                  <option value="nome">A-Z</option>
                  <option value="materia">Por Matéria</option>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between w-full lg:w-auto border-t lg:border-t-0 border-slate-100 dark:border-slate-700 pt-3 lg:pt-0 shrink-0">
              <span className="lg:hidden text-xs font-medium text-slate-500">Total:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                {resumosFiltrados.length} iten{resumosFiltrados.length !== 1 && 's'}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* ==================== LISTAGEM DE RESUMOS ==================== */}
        {resumosFiltrados.length === 0 ? (
          <motion.div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 dark:bg-slate-800/30 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {searchTerm || selectedMateria !== 'all' ? (
              <>
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-slate-700">
                  <Search size={40} className="text-slate-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
                  Verifique os termos da busca ou limpe os filtros para ver tudo.
                </p>
              </>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100 dark:border-indigo-800/50 relative z-10">
                    <FileText size={48} className="text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
                  </div>
                  <motion.div 
                    className="absolute inset-0 bg-violet-400 blur-2xl opacity-20 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  Sua biblioteca começa aqui 📚
                </h3>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
                  Resumos são como mapas do conhecimento. Crie seu primeiro e organize seus estudos de forma impecável!
                </p>

                <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} onClick={() => setShowModal(true)} className="shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 to-violet-600 border-none rounded-2xl h-14 px-8">
                  Criar Primeiro Resumo
                </Button>

                <motion.div
                  className="mt-8 inline-flex items-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-800/50 shadow-sm"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                >
                  <Lightbulb size={16} className="text-amber-500 shrink-0" strokeWidth={2.5} />
                  <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">
                    Dica Pro: Use o template de "Caso Clínico" para estruturar raciocínios rapidamente!
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-5 sm:gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
            variants={gridVariants}
            initial="hidden"
            animate="visible"
          >
            {resumosFiltrados.map((resumo) => {
              const materiaInfo = getMateriaInfo(resumo.materiaId);
              const preview = stripHtml(resumo.conteudo);
              const readTime = estimateReadingTime(resumo.conteudo);
              const cor = materiaInfo.cor || '#8B5CF6';
              
              return (
                <motion.div
                  key={resumo.id}
                  className="group h-[260px]"
                  variants={cardItemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                >
                  <div
                    className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 h-full flex flex-col relative cursor-pointer group-hover:ring-1 group-hover:ring-offset-1 dark:group-hover:ring-offset-slate-950"
                    style={{ '--tw-ring-color': cor }}
                    onClick={() => handleView(resumo)}
                  >
                    {/* Brilho superior dinâmico e Borda de Topo */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-24 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
                      style={{ background: `linear-gradient(to bottom, ${cor}, transparent)` }}
                    />
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: cor }} />

                    <div className="p-6 flex-1 flex flex-col relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm"
                          style={{ backgroundColor: hexToRgba(cor, 0.15), color: cor, border: `1px solid ${hexToRgba(cor, 0.3)}` }}
                        >
                          <span className="truncate max-w-[140px]">{materiaInfo.nome}</span>
                        </div>
                        
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[12px] p-1 border border-slate-200 dark:border-slate-700 shadow-sm ml-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(resumo); }}
                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-400 transition-colors shadow-sm"
                            title="Editar"
                          >
                            <Edit2 size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(resumo); }}
                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-[17px] font-black text-slate-900 dark:text-white mb-2 line-clamp-2 tracking-tight leading-snug">{resumo.titulo}</h3>
                      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">{preview}</p>
                    </div>
                    
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3 text-[12px] font-semibold text-slate-400">
                        <span className="flex items-center gap-1.5 bg-white dark:bg-slate-700/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm">
                          <Calendar size={12} className="text-slate-500" />
                          {formatDate(resumo.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white dark:bg-slate-700/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm">
                          <Clock size={12} className="text-slate-500" />
                          {readTime}
                        </span>
                      </div>
                      <span className="text-[12px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300" style={{ color: cor }}>
                        Ler <ArrowRight size={14} strokeWidth={2.5} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ==================== MODAL DE CRIAÇÃO/EDIÇÃO E VISUALIZAÇÃO ==================== */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={resetForm}
            >
              <motion.div
                className="bg-white dark:bg-slate-900 w-full sm:rounded-[32px] shadow-2xl border border-white/20 dark:border-slate-700/60 sm:max-w-5xl max-h-[96dvh] sm:max-h-[90vh] overflow-hidden flex flex-col print:max-h-full print:rounded-none"
                initial={{ y: 50, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* ── HEADER MODAL ── */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md print:hidden shrink-0 relative z-20">
                  <button
                    onClick={resetForm}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-sm"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>

                  <div className="w-10 h-10 rounded-[12px] bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-violet-600 dark:text-violet-400" strokeWidth={2} />
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white text-[16px] truncate flex-1 min-w-0 tracking-tight">
                    {formData.titulo || (editingId ? 'Editar Resumo' : 'Novo Resumo')}
                  </span>

                  {/* Tab switcher — Editar / Visualizar */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0 shadow-inner">
                    <button
                      onClick={() => {
                        setModalMode('edit');
                        if (viewingResumo) {
                          setFormData({ titulo: viewingResumo.titulo, conteudo: viewingResumo.conteudo, materiaId: viewingResumo.materiaId || '', imagens: viewingResumo.imagens || [] });
                          setViewingResumo(null);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                        modalMode === 'edit'
                          ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Edit2 size={14} strokeWidth={2.5} />
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
                          createdAt: viewingResumo?.createdAt || new Date()
                        });
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                        modalMode === 'view'
                          ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Eye size={14} strokeWidth={2.5} />
                      <span className="hidden xs:inline">Ler</span>
                    </button>
                  </div>

                  {/* Ações contextuais */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {modalMode === 'edit' && (
                      <button
                        form="resumo-form"
                        type="submit"
                        disabled={!formData.titulo.trim() || !formData.conteudo.trim()}
                        className="px-5 py-2.5 rounded-[14px] text-[14px] font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-violet-500/20 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {editingId ? 'Atualizar' : 'Salvar'}
                      </button>
                    )}
                    {modalMode === 'view' && (
                      <>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
                          <button
                            onClick={() => setViewFontSize(f => Math.max(0.8, +(f - 0.1).toFixed(2)))}
                            disabled={viewFontSize <= 0.8}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors font-bold shadow-sm"
                          >
                            <ZoomOut size={16} strokeWidth={2.5} />
                          </button>
                          <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 select-none px-2 min-w-[50px] text-center tabular-nums">
                            {Math.round(viewFontSize * 100)}%
                          </span>
                          <button
                            onClick={() => setViewFontSize(f => Math.min(2, +(f + 0.1).toFixed(2)))}
                            disabled={viewFontSize >= 2}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors shadow-sm"
                          >
                            <ZoomIn size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                        <button
                          onClick={exportarPdf}
                          disabled={exportingPdf}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={2.5} />}
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── BODY MODAL ── */}
                {modalMode === 'edit' ? (
                  <form id="resumo-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
                    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Input
                            label="Título do Documento"
                            placeholder="Ex: Anatomia do Sistema Nervoso..."
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            required
                            className="h-14 text-[16px] font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 shadow-inner"
                          />
                        </div>
                        <Select
                          label="Vincular à Matéria"
                          value={formData.materiaId}
                          onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })}
                          required
                          className="h-14 text-[15px] font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 shadow-inner"
                        >
                          <option value="">Selecione uma matéria</option>
                          {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </Select>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm p-3">
                        <div className="flex items-center justify-between mb-4 px-4 pt-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[15px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                              Conteúdo
                            </label>
                            {formData.conteudo && (
                              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                <AlignLeft size={12} />
                                {stripHtml(formData.conteudo).trim().split(/\s+/).filter(Boolean).length} palavras
                              </span>
                            )}
                          </div>
                          {!editingId && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFormData({ ...formData, conteudo: TEMPLATE_CASO_CLINICO })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg transition-colors shadow-sm"
                            >
                              <ClipboardList size={14} strokeWidth={2.5} />
                              Usar Template Clínico
                            </motion.button>
                          )}
                        </div>
                        <div className="rounded-[16px] overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 transition-shadow">
                          <Suspense fallback={<div className="text-center py-20 text-slate-400 text-[14px] font-medium flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16}/> Carregando editor...</div>}>
                            <ReactQuill
                              theme="snow"
                              value={formData.conteudo}
                              onChange={(content) => setFormData({ ...formData, conteudo: content })}
                              modules={quillModules}
                              formats={quillFormats}
                              placeholder="Comece a digitar seu resumo incrível aqui..."
                              className="quill-editor-custom"
                              style={{ minHeight: '350px' }}
                            />
                          </Suspense>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-[14px] font-bold flex items-center gap-2 shadow-sm">
                          <AlertTriangle size={18} strokeWidth={2.5} /> {error}
                        </div>
                      )}

                      {/* Imagens Anexadas Premium */}
                      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <label className="text-[15px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-widest">
                              <Paperclip size={18} className="text-slate-400" strokeWidth={2.5} />
                              Anexos Visuais
                            </label>
                            <span className="text-[12px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                              {formData.imagens?.length || 0}/6 imagens
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingImages || (formData.imagens?.length || 0) >= 6}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 shadow-sm"
                          >
                            {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} strokeWidth={2.5} />}
                            {uploadingImages ? 'Enviando...' : 'Fazer Upload'}
                          </button>
                          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
                        </div>

                        {(formData.imagens?.length || 0) === 0 ? (
                          <div
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[20px] p-10 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all cursor-pointer group"
                          >
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                              <ImageIcon2 size={32} strokeWidth={1.5} className="group-hover:text-violet-500" />
                            </div>
                            <span className="text-[16px] font-bold text-slate-600 dark:text-slate-300">Arraste fotos ou clique aqui</span>
                            <span className="text-[13px] font-medium">Anexe fotos do caderno, slides ou atlas 3D</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {formData.imagens.map((url, idx) => (
                              <div key={idx} className="relative group rounded-[16px] overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 aspect-4/3 shadow-sm">
                                <img src={url} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-90 transition-transform opacity-0 group-hover:opacity-100"
                                >
                                  <X size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                            ))}
                            {(formData.imagens.length < 6) && (
                              <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={uploadingImages}
                                className="aspect-4/3 rounded-[16px] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all"
                              >
                                <Plus size={24} strokeWidth={2.5} />
                                <span className="text-[13px] font-bold">Adicionar mais</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                ) : (
                  // MODO DE LEITURA (VIEW)
                  <div className="flex-1 overflow-y-auto print:overflow-visible bg-white dark:bg-slate-950 custom-scrollbar">
                    <div id="resumo-view-content" className="max-w-[720px] mx-auto px-6 sm:px-10 py-10 print:p-0">
                      
                      {/* Bloco de título + meta Premium */}
                      <div className="mb-10 pb-8 border-b border-slate-100 dark:border-slate-800">
                        <Badge color={getMateriaInfo((viewingResumo?.materiaId || formData.materiaId)).cor} size="lg" className="mb-5 shadow-sm">
                          {getMateriaInfo((viewingResumo?.materiaId || formData.materiaId)).nome}
                        </Badge>
                        <h1
                          className="font-black text-slate-900 dark:text-white leading-tight mb-5 tracking-tight print:text-2xl"
                          style={{ fontSize: `${Math.min(viewFontSize * 2.5, 3.5)}em`, transition: 'font-size 0.2s' }}
                        >
                          {(viewingResumo?.titulo || formData.titulo) || 'Documento sem título'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {viewingResumo?.createdAt && (
                            <span className="flex items-center gap-1.5">
                              <Calendar size={16} className="text-slate-400" />
                              Criado em {formatDate(viewingResumo.createdAt)}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Clock size={16} className="text-slate-400" />
                            {estimateReadingTime(viewingResumo?.conteudo || formData.conteudo)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <AlignLeft size={16} className="text-slate-400" />
                            {stripHtml(viewingResumo?.conteudo || formData.conteudo).trim().split(/\s+/).filter(Boolean).length} palavras
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo HTML Tipográfico */}
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none
                          prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:tracking-tight
                          prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:text-[1.05em]
                          prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:leading-[1.7]
                          prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
                          prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h2:mt-10 prose-h3:mt-8
                          prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                          print:prose-sm"
                        style={{ fontSize: `${viewFontSize}em`, transition: 'font-size 0.2s', wordBreak: 'break-word' }}
                        dangerouslySetInnerHTML={{
                          __html: (viewingResumo?.conteudo || formData.conteudo) || '<p style="color:#94a3b8; font-style: italic;">Este resumo ainda não possui conteúdo.</p>'
                        }}
                      />

                      {/* Imagens Anexadas — Galeria de Leitura */}
                      {(() => {
                        const imgs = viewingResumo?.imagens || formData.imagens || [];
                        if (imgs.length === 0) return null;
                        return (
                          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-[15px] font-black text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 uppercase tracking-widest">
                              <ImagePlus size={18} className="text-violet-500" strokeWidth={2.5} /> Anexos e Referências
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              {imgs.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-[20px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                                  <img src={url} alt={`Anexo ${idx + 1}`} className="w-full h-auto object-cover max-h-[300px]" />
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

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
        onConfirm={confirmarExclusao}
        title="Excluir Resumo"
        itemName={confirmDelete.nome}
        confirmText="Excluir Documento"
        isLoading={isDeleting}
        type="danger"
      />
      
      {/* Estilos para Scrollbar Customizada no Modal */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
}

export default Resumos;