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

import React, { useState, useEffect, Suspense, lazy, memo } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { 
  listarResumos, 
  criarResumo, 
  atualizarResumo, 
  deletarResumo, 
  listarMaterias 
} from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
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
const TEMPLATE_CASO_CLINICO = `<h2>📋 Caso Clínico</h2>

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

// Função para formatar data
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

function Resumos() {
  const { user } = useAuth();
  const [resumos, setResumos] = useState([]);
  const [resumosFiltrados, setResumosFiltrados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingResumo, setViewingResumo] = useState(null); // Novo estado para visualização
  const [modalMode, setModalMode] = useState('edit'); // 'edit' ou 'view'
  const [viewFontSize, setViewFontSize] = useState(1); // Zoom da visualização
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [formData, setFormData] = useState({ titulo: '', conteudo: '', materiaId: '' });
  const [error, setError] = useState(null);

  // Estado do Modal de Confirmação
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) carregarDados();
  }, [user]);

  useEffect(() => {
    let filtered = [...resumos];
    if (searchTerm) {
      filtered = filtered.filter(resumo => 
        resumo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stripHtml(resumo.conteudo).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedMateria !== 'all') {
      filtered = filtered.filter(resumo => resumo.materiaId === selectedMateria);
    }
    setResumosFiltrados(filtered);
  }, [searchTerm, selectedMateria, resumos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.uid;
      const [resumosData, materiasData] = await Promise.all([
        listarResumos(userId),
        listarMaterias(userId)
      ]);
      setResumos(resumosData);
      setResumosFiltrados(resumosData);
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
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm h-[280px] flex flex-col" style={{animationDelay:`${i*80}ms`}}>
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

          <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <Input type="text" placeholder="Buscar resumos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select value={selectedMateria} onChange={(e) => setSelectedMateria(e.target.value)}>
                <option value="all">Todas as Matérias</option>
                {materias.map(materia => <option key={materia.id} value={materia.id}>{materia.nome}</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
              <FileText size={16} className="text-purple-500" />
              <span className="font-bold text-slate-900 dark:text-white">{resumosFiltrados.length}</span> 
              {resumosFiltrados.length === 1 ? 'resumo' : 'resumos'}
            </div>
          </div>
        </motion.div>

        {resumosFiltrados.length === 0 ? (
          <motion.div className="text-center py-20" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 bg-violet-50 dark:bg-violet-950 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText size={40} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {searchTerm || selectedMateria !== 'all' ? 'Nenhum resumo encontrado' : 'Sua biblioteca começa aqui \u2728'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {searchTerm || selectedMateria !== 'all' ? 'Tente ajustar os filtros de busca' : 'Resumos são como mapas do conhecimento. Crie seu primeiro e comece a organizar seus estudos!'}
            </p>
            {!searchTerm && selectedMateria === 'all' && (
              <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} onClick={() => setShowModal(true)}>
                Criar Primeiro Resumo
              </Button>
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
            {resumosFiltrados.map((resumo, index) => {
              const materiaInfo = getMateriaInfo(resumo.materiaId);
              const preview = stripHtml(resumo.conteudo);
              return (
                <motion.div
                  key={resumo.id}
                  className="group"
                  variants={cardItemVariants}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                >
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col min-h-[280px]">
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <Badge color={materiaInfo.cor} size="sm">
                          <span className="truncate block max-w-[140px]">{materiaInfo.nome}</span>
                        </Badge>
                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(resumo)} className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-400 sm:text-purple-600 sm:dark:text-purple-400 transition-colors active:scale-95" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleView(resumo)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-400 sm:text-blue-600 sm:dark:text-blue-400 transition-colors active:scale-95" title="Visualizar/Salvar PDF">
                            <FileText size={16} />
                          </button>
                          <button onClick={() => handleDelete(resumo)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 sm:text-red-600 sm:dark:text-red-400 transition-colors active:scale-95" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 truncate">{resumo.titulo}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">{preview}</p>
                    </div>
                    <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar size={14} />
                        <span>{formatDate(resumo.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(resumo)} className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleView(resumo)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                          Visualizar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm}>
              <motion.div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print:max-h-full print:rounded-none print:shadow-none" initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800 print:bg-white print:border-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center print:bg-white print:shadow-none">
                      <FileText size={18} className="text-violet-600 print:text-violet-700" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{modalMode === 'edit' ? (editingId ? 'Editar Resumo' : 'Novo Resumo') : 'Visualização do Resumo'}</h2>
                  </div>
                  <div className="flex gap-2">
                    {modalMode === 'edit' && (
                      <button
                        onClick={() => {
                          setModalMode('view');
                          setViewingResumo({
                            titulo: formData.titulo,
                            conteudo: formData.conteudo,
                            materiaId: formData.materiaId,
                            createdAt: viewingResumo?.createdAt // mantém data se já existia
                          });
                        }}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors print:hidden"
                        title="Visualizar"
                      >
                        <FileText size={20} />
                      </button>
                    )}
                    {modalMode === 'view' && (
                      <>
                        <div className="flex items-center gap-1 mr-2">
                          <button
                            onClick={() => setViewFontSize(f => Math.max(0.8, +(f - 0.1).toFixed(2)))}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Diminuir fonte"
                            style={{fontSize: '1em'}}
                            aria-label="Diminuir fonte"
                            disabled={viewFontSize <= 0.8}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                          <span className="text-xs text-slate-400 select-none" style={{minWidth:32,display:'inline-block',textAlign:'center'}}>{Math.round(viewFontSize*100)}%</span>
                          <button
                            onClick={() => setViewFontSize(f => Math.min(2, +(f + 0.1).toFixed(2)))}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Aumentar fonte"
                            style={{fontSize: '1em'}}
                            aria-label="Aumentar fonte"
                            disabled={viewFontSize >= 2}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setModalMode('edit');
                            setFormData({
                              titulo: viewingResumo?.titulo || '',
                              conteudo: viewingResumo?.conteudo || '',
                              materiaId: viewingResumo?.materiaId || ''
                            });
                            setViewingResumo(null);
                          }}
                          className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors print:hidden"
                          title="Editar"
                        >
                          <Edit2 size={20} />
                        </button>
                      </>
                    )}
                    <button onClick={resetForm} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors print:hidden">
                      <X size={24} />
                    </button>
                  </div>
                </div>
                {modalMode === 'edit' ? (
                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Título do Resumo" placeholder="Ex: Sistema Nervoso Central" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} required />
                        <Select label="Matéria" value={formData.materiaId} onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })} required>
                          <option value="">Selecione uma matéria</option>
                          {materias.map(materia => <option key={materia.id} value={materia.id}>{materia.nome}</option>)}
                        </Select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Conteúdo do Resumo<span className="text-red-500 ml-1">*</span></label>
                          {!editingId && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFormData({ ...formData, conteudo: TEMPLATE_CASO_CLINICO })}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              <ClipboardList size={16} />
                              Usar Template Caso Clínico
                            </motion.button>
                          )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all">
                          <Suspense fallback={<div className='text-center py-10 text-slate-400'>Carregando editor...</div>}>
                            <ReactQuill theme="snow" value={formData.conteudo} onChange={(content) => setFormData({ ...formData, conteudo: content })} modules={quillModules} formats={quillFormats} placeholder="Escreva seu resumo aqui... Use a barra de ferramentas para formatar o texto." className="quill-editor-custom" style={{ minHeight: '320px' }} />
                          </Suspense>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Use as ferramentas acima para formatar seu texto (negrito, listas, cores, etc.)</p>
                      </div>
                      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
                    </div>
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-3 print:hidden">
                      <Button type="submit" variant="primary" size="lg" className="flex-1">{editingId ? 'Atualizar Resumo' : 'Salvar Resumo'}</Button>
                      <Button type="button" variant="secondary" size="lg" onClick={resetForm}>Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex-1 overflow-y-auto print:overflow-visible">
                    <div className="p-8 print:p-0 max-w-3xl mx-auto" style={{ fontSize: `${viewFontSize}em`, transition: 'font-size 0.2s' }}>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 print:mb-1 print:text-2xl">{(viewingResumo?.titulo || formData.titulo) || 'Sem título'}</h1>
                      <div className="mb-4 flex gap-2 items-center print:mb-2">
                        <Badge color={getMateriaInfo((viewingResumo?.materiaId || formData.materiaId)).cor} size="sm">
                          <span>{getMateriaInfo((viewingResumo?.materiaId || formData.materiaId)).nome}</span>
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(viewingResumo?.createdAt)}</span>
                      </div>
                      <div 
                        className="prose prose-purple max-w-none print:prose print:prose-sm"
                        style={{ wordBreak: 'break-word', fontSize: `${viewFontSize}em`, transition: 'font-size 0.2s' }}
                        dangerouslySetInnerHTML={{ __html: (viewingResumo?.conteudo || formData.conteudo) || '<p class="text-slate-400">Sem conteúdo</p>' }}
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
