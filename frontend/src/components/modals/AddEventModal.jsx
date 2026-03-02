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
  Check
} from 'lucide-react';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

// Tipos de evento disponíveis
const EVENT_TYPES = [
  { id: 'estudo', label: 'Estudo', icon: BookOpen, color: 'bg-primary-600' },
  { id: 'prova', label: 'Prova', icon: GraduationCap, color: 'bg-red-600' },
  { id: 'trabalho', label: 'Trabalho', icon: FileText, color: 'bg-purple-600' },
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
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-event-modal-title"
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com Gradiente */}
            <div className="bg-primary-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                    <Calendar className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 id="add-event-modal-title" className="text-xl font-semibold text-white">Novo Evento</h2>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      {formatDateShort(eventDate)}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  aria-label="Fechar modal"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
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
              <Input
                ref={inputRef}
                label="Título do Evento"
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  setError('');
                }}
                placeholder="Ex: Prova de Anatomia"
                error={error}
                maxLength={100}
                className="py-3 h-auto bg-slate-50"
              />

              {/* Seletor de Data */}
              <Input
                label="Data"
                type="date"
                value={formatDateForInput(eventDate)}
                onChange={handleDateChange}
                leftIcon={Calendar}
                className="py-3 h-auto bg-slate-50"
              />

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
                            ? 'border-transparent ' + eventType.color + ' text-white shadow-sm'
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
                            className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check size={12} className="text-primary-600 dark:text-primary-400" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Salvar Evento
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
