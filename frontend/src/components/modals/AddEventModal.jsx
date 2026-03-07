/**
 * 📅 ADD EVENT MODAL
 * * Modal refinado para criação de eventos no cronograma.
 * - Header adaptativo por categoria
 * - Seleção tátil otimizada
 * - Animações fluidas e Glassmorphism
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  BookOpen, 
  FileText, 
  GraduationCap,
  Check,
  Sparkles
} from 'lucide-react';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

const EVENT_TYPES = [
  { id: 'estudo', label: 'Estudo', icon: BookOpen, color: 'from-indigo-500 to-blue-600', lightColor: 'bg-indigo-50 text-indigo-600', darkColor: 'dark:bg-indigo-900/30 dark:text-indigo-400' },
  { id: 'prova', label: 'Prova', icon: GraduationCap, color: 'from-rose-500 to-red-600', lightColor: 'bg-red-50 text-red-600', darkColor: 'dark:bg-red-900/30 dark:text-red-400' },
  { id: 'trabalho', label: 'Trabalho', icon: FileText, color: 'from-purple-500 to-fuchsia-600', lightColor: 'bg-purple-50 text-purple-600', darkColor: 'dark:bg-purple-900/30 dark:text-purple-400' },
];

const formatDateShort = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AddEventModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate = new Date() 
}) => {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('estudo');
  const [eventDate, setEventDate] = useState(selectedDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const selectedTypeConfig = EVENT_TYPES.find(t => t.id === tipo);

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setTipo('estudo');
      setEventDate(selectedDate || new Date());
      setError('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('Dê um nome ao seu evento');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ titulo: titulo.trim(), tipo, data: eventDate });
      onClose();
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop Blur Premium */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Adaptativo */}
            <div className={`px-6 py-8 bg-gradient-to-br ${selectedTypeConfig.color} relative overflow-hidden transition-colors duration-500`}>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                    <Calendar className="text-white" size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight leading-none">Novo Evento</h2>
                    <p className="text-white/70 text-[13px] font-bold mt-1.5 flex items-center gap-1">
                      {formatDateShort(eventDate)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar criação de evento"
                  className="w-9 h-9 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full text-white transition-all"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Form Area */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
              <div className="space-y-4">
                <Input
                  ref={inputRef}
                  label="O que você vai fazer?"
                  type="text"
                  value={titulo}
                  onChange={(e) => { setTitulo(e.target.value); setError(''); }}
                  placeholder="Ex: Revisar Neuroanatomia"
                  error={error}
                  maxLength={60}
                  className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-bold"
                />

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</label>
                  <div className="grid grid-cols-3 gap-3">
                    {EVENT_TYPES.map((et) => {
                      const Icon = et.icon;
                      const active = tipo === et.id;
                      return (
                        <button
                          key={et.id}
                          type="button"
                          onClick={() => setTipo(et.id)}
                          className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                            active
                              ? `border-transparent bg-gradient-to-br ${et.color} text-white shadow-lg`
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                          <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-400'}`}>
                            {et.label}
                          </span>
                          {active && (
                            <motion.div 
                              layoutId="check-event"
                              className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                            >
                              <Check size={12} strokeWidth={4} className="text-slate-900" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={onClose}
                  className="h-12 rounded-xl font-bold order-2 sm:order-1 border-slate-200 dark:border-slate-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  className="h-12 rounded-xl font-bold order-1 sm:order-2 bg-indigo-600 shadow-lg shadow-indigo-500/20 border-none"
                >
                  Confirmar Evento
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddEventModal;