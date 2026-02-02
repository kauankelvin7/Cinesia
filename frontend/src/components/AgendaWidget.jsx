import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiPlus, FiX, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { salvarEvento, listarEventos, deletarEvento } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';

const AgendaWidget = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    titulo: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    tipo: 'prova'
  });

  useEffect(() => {
    if (user) {
      carregarEventos();
    }
  }, [user]);

  const carregarEventos = async () => {
    try {
      setLoading(true);
      const data = await listarEventos(user.id);
      setEventos(data);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salvarEvento(formData, user.id);
      await carregarEventos();
      setFormData({ titulo: '', data: format(new Date(), 'yyyy-MM-dd'), tipo: 'prova' });
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      alert('Erro ao salvar evento. Tente novamente.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este evento?')) {
      try {
        await deletarEvento(id);
        await carregarEventos();
      } catch (err) {
        console.error('Erro ao deletar evento:', err);
        alert('Erro ao deletar evento.');
      }
    }
  };

  const tileClassName = ({ date }) => {
    const hasEvento = eventos.some(evento => {
      const eventoDate = evento.data?.toDate?.() ?? new Date(evento.data);
      return isSameDay(eventoDate, date);
    });
    return hasEvento ? 'has-evento' : null;
  };

  const proximosEventos = eventos
    .map(evento => ({
      ...evento,
      dataObj: evento.data?.toDate?.() ?? new Date(evento.data)
    }))
    .filter(evento => evento.dataObj >= new Date())
    .sort((a, b) => a.dataObj - b.dataObj)
    .slice(0, 5);

  const tipoColors = {
    prova: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    trabalho: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    outro: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-brand-primary" size={24} />
          <h2 className="text-xl font-bold text-text-primary">Agenda</h2>
        </div>
        <motion.button
          onClick={() => setShowModal(true)}
          className="p-2 bg-teal-600 dark:bg-teal-500 text-black dark:text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus size={20} />
        </motion.button>
      </div>

      {/* Calendário */}
      <div className="agenda-calendar mb-6">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          locale="pt-BR"
          tileClassName={tileClassName}
          className="w-full"
        />
      </div>

      {/* Próximos Eventos */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Próximos Eventos
        </h3>
        
        {loading ? (
          <div className="text-text-secondary text-sm">Carregando...</div>
        ) : proximosEventos.length === 0 ? (
          <div className="text-text-secondary text-sm">Nenhum evento agendado</div>
        ) : (
          <div className="space-y-2">
            {proximosEventos.map(evento => (
              <motion.div
                key={evento.id}
                className="bg-background border border-border rounded-lg p-3 flex items-start justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoColors[evento.tipo]}`}>
                      {evento.tipo}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {evento.titulo}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {format(evento.dataObj, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <motion.button
                  onClick={() => handleDelete(evento.id)}
                  className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiTrash2 size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Novo Evento */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-text-primary">Novo Evento</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Prova de Anatomia"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="prova">Prova</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="submit"
                    className="flex-1 px-6 py-2.5 bg-teal-600 dark:bg-teal-500 text-black dark:text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Salvar
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 bg-background border border-border text-text-primary rounded-lg hover:bg-brand-light transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS customizado para o calendário */}
      <style>{`
        .agenda-calendar .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
          background: transparent;
        }

        .agenda-calendar .react-calendar__navigation {
          display: flex;
          margin-bottom: 1rem;
        }

        .agenda-calendar .react-calendar__navigation button {
          color: rgb(var(--text-primary));
          font-weight: 600;
          font-size: 1rem;
          background: transparent;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .agenda-calendar .react-calendar__navigation button:hover:not(:disabled) {
          background: rgb(var(--brand-light));
          color: rgb(var(--brand-primary));
        }

        .agenda-calendar .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgb(var(--text-secondary));
        }

        .agenda-calendar .react-calendar__tile {
          padding: 0.75rem 0.5rem;
          background: transparent;
          color: rgb(var(--text-primary));
          border-radius: 0.5rem;
          transition: all 0.2s;
          position: relative;
        }

        .agenda-calendar .react-calendar__tile:hover:not(:disabled) {
          background: rgb(var(--brand-light));
          color: rgb(var(--brand-primary));
        }

        .agenda-calendar .react-calendar__tile--active {
          background: rgb(var(--brand-primary)) !important;
          color: white !important;
        }

        .agenda-calendar .react-calendar__tile--now {
          background: rgb(var(--brand-light));
        }

        .agenda-calendar .react-calendar__tile.has-evento::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: rgb(var(--brand-primary));
          border-radius: 50%;
        }

        .agenda-calendar .react-calendar__tile--active.has-evento::after {
          background: white;
        }

        .agenda-calendar .react-calendar__month-view__days__day--neighboringMonth {
          color: rgb(var(--text-tertiary));
        }
      `}</style>
    </div>
  );
};

export default AgendaWidget;
