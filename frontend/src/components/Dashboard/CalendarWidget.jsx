import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

const CalendarWidget = ({ eventos = [], onAddEvento }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Verifica se uma data tem eventos
  const hasEventOnDate = (date) => {
    return eventos.some(evento => {
      const eventoDate = evento.data?.toDate?.() || new Date(evento.data);
      return (
        eventoDate.getDate() === date.getDate() &&
        eventoDate.getMonth() === date.getMonth() &&
        eventoDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Customiza os tiles do calendário
  const tileContent = ({ date, view }) => {
    if (view === 'month' && hasEventOnDate(date)) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
        </div>
      );
    }
    return null;
  };

  // Filtra e ordena próximos eventos
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const proximosEventos = eventos
    .map(evento => ({
      ...evento,
      dataObj: evento.data?.toDate?.() || new Date(evento.data)
    }))
    .filter(evento => evento.dataObj >= hoje)
    .sort((a, b) => a.dataObj - b.dataObj)
    .slice(0, 3);

  // Handler para adicionar evento
  const handleAddEvento = () => {
    const titulo = window.prompt('Título do evento:');
    if (!titulo) return;

    const data = window.prompt('Data (DD/MM/YYYY):');
    if (!data) return;

    const [dia, mes, ano] = data.split('/');
    const novaData = new Date(ano, mes - 1, dia);

    if (onAddEvento) {
      onAddEvento({
        titulo,
        data: novaData,
        tipo: 'estudo'
      });
    }
  };

  // Formata data para exibição
  const formatarData = (date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Calendário
          </h3>
        </div>
        <button
          onClick={handleAddEvento}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          title="Adicionar Evento"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar */}
      <div className="calendar-widget mb-6">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={tileContent}
          locale="pt-BR"
          className="w-full border-none"
        />
      </div>

      {/* Próximos Eventos */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Próximos Eventos
        </h4>
        
        {proximosEventos.length > 0 ? (
          <div className="space-y-2">
            {proximosEventos.map((evento, index) => (
              <div
                key={evento.id || index}
                className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {formatarData(evento.dataObj)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {evento.titulo || evento.title}
                  </p>
                  {evento.tipo && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {evento.tipo}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Nenhum evento próximo
          </p>
        )}
      </div>

      <style>{`
        .calendar-widget :global(.react-calendar) {
          background: transparent;
          border: none;
          font-family: inherit;
        }

        .calendar-widget :global(.react-calendar__navigation button) {
          color: #1f2937;
          min-width: 44px;
          background: none;
          font-size: 16px;
          margin-top: 8px;
        }

        :global(.dark) .calendar-widget :global(.react-calendar__navigation button) {
          color: #f9fafb;
        }

        .calendar-widget :global(.react-calendar__navigation button:enabled:hover) {
          background-color: #f3f4f6;
        }

        :global(.dark) .calendar-widget :global(.react-calendar__navigation button:enabled:hover) {
          background-color: #334155;
        }

        .calendar-widget :global(.react-calendar__month-view__weekdays) {
          text-transform: uppercase;
          font-weight: 500;
          font-size: 0.75rem;
          color: #6b7280;
        }

        :global(.dark) .calendar-widget :global(.react-calendar__month-view__weekdays) {
          color: #9ca3af;
        }

        .calendar-widget :global(.react-calendar__tile) {
          color: #374151;
          padding: 0.75rem 0.5rem;
          background: none;
          font-size: 0.875rem;
        }

        :global(.dark) .calendar-widget :global(.react-calendar__tile) {
          color: #e5e7eb;
        }

        .calendar-widget :global(.react-calendar__tile:enabled:hover) {
          background-color: #dbeafe;
          border-radius: 0.5rem;
        }

        :global(.dark) .calendar-widget :global(.react-calendar__tile:enabled:hover) {
          background-color: #1e3a8a;
        }

        .calendar-widget :global(.react-calendar__tile--active) {
          background: #2563eb;
          color: white;
          border-radius: 0.5rem;
        }

        .calendar-widget :global(.react-calendar__tile--active:enabled:hover) {
          background: #1d4ed8;
        }

        .calendar-widget :global(.react-calendar__tile--now) {
          background: #fef3c7;
          border-radius: 0.5rem;
        }

        :global(.dark) .calendar-widget :global(.react-calendar__tile--now) {
          background: #78350f;
        }

        .calendar-widget :global(.react-calendar__tile--now:enabled:hover) {
          background: #fde68a;
        }

        :global(.dark) .calendar-widget :global(.react-calendar__tile--now:enabled:hover) {
          background: #92400e;
        }
      `}</style>
    </div>
  );
};

export default CalendarWidget;
