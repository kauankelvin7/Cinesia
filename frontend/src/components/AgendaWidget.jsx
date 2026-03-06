import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
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
    prova: 'bg-red-100 text-red-600',
    trabalho: 'bg-blue-100 text-blue-600',
    outro: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
            <CalendarIcon className="text-primary-600 dark:text-primary-400" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Agenda</h2>
        </div>
        <motion.button
          onClick={() => setShowModal(true)}
          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={20} />
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
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
          Próximos Eventos
        </h3>
        
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            Carregando...
          </div>
        ) : proximosEventos.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
            <CalendarIcon className="mx-auto mb-2 text-slate-300" size={32} />
            Nenhum evento agendado
          </div>
        ) : (
          <div className="space-y-2">
            {proximosEventos.map((evento, index) => (
              <motion.div
                key={evento.id}
                className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-lg p-3 flex items-start justify-between hover:bg-slate-50 transition-colors duration-150 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoColors[evento.tipo]}`}>
                      {evento.tipo}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {evento.titulo}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {format(evento.dataObj, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <motion.button
                  onClick={() => handleDelete(evento.id)}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-white hover:bg-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Excluir evento"
                >
                  <Trash2 size={14} />
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                    <CalendarIcon className="text-primary-600 dark:text-primary-400" size={16} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Novo Evento</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Prova de Anatomia"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="prova">🎯 Prova</option>
                    <option value="trabalho">📝 Trabalho</option>
                    <option value="outro">📌 Outro</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✓ Salvar
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
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