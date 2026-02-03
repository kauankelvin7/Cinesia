/**
 * 📅 ADD EVENT MODAL - Modal Premium para Adicionar Eventos
 * 
 * Design System HealthTech
 * Features:
 * - Glassmorphism com backdrop-blur
 * - Animações suaves com Framer Motion
 * - Input com validação visual
 * - Seletor de tipo de evento
 * - Responsivo (mobile-first)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  BookOpen, 
  FileText, 
  GraduationCap,
  Sparkles,
  Check
} from 'lucide-react';

// Tipos de evento disponíveis
const EVENT_TYPES = [
  { id: 'estudo', label: 'Estudo', icon: BookOpen, color: 'from-teal-500 to-emerald-500' },
  { id: 'prova', label: 'Prova', icon: GraduationCap, color: 'from-red-500 to-orange-500' },
  { id: 'trabalho', label: 'Trabalho', icon: FileText, color: 'from-purple-500 to-pink-500' },
];

// Formata a data para exibição amigável
const formatDateDisplay = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long',
    year: 'numeric'
  });
};

const formatDateShort = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short'
  });
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

  // Reset form quando modal abre
  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setTipo('estudo');
      setEventDate(selectedDate || new Date());
      setError('');
      // Foca no input após animação
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, selectedDate]);

  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setError('Digite um título para o evento');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        titulo: titulo.trim(),
        tipo,
        data: eventDate
      });
      onClose();
    } catch (err) {
      setError('Erro ao salvar evento. Tente novamente.');
      console.error('Erro ao salvar evento:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (e) => {
    const [year, month, day] = e.target.value.split('-');
    setEventDate(new Date(year, month - 1, day));
  };

  const formatDateForInput = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com Gradiente */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Novo Evento</h2>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <Sparkles size={12} />
                      {formatDateShort(eventDate)}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="text-white" size={22} />
                </motion.button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Input de Título */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Título do Evento
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    setError('');
                  }}
                  placeholder="Ex: Prova de Anatomia"
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none ${
                    error 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'
                  }`}
                  maxLength={100}
                />
                {error && (
                  <motion.p 
                    className="text-red-500 text-sm mt-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Seletor de Data */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={formatDateForInput(eventDate)}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 transition-all duration-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              {/* Tipo de Evento */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Tipo de Evento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {EVENT_TYPES.map((eventType) => {
                    const Icon = eventType.icon;
                    const isSelected = tipo === eventType.id;
                    
                    return (
                      <motion.button
                        key={eventType.id}
                        type="button"
                        onClick={() => setTipo(eventType.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-transparent bg-gradient-to-br ' + eventType.color + ' text-white shadow-lg'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Icon size={24} />
                          <span className="text-xs font-semibold">{eventType.label}</span>
                        </div>
                        {isSelected && (
                          <motion.div 
                            className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <Check size={12} className="text-teal-600" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Salvando...
                    </span>
                  ) : (
                    'Salvar Evento'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddEventModal;
