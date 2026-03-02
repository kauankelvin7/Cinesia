/**
 * CalendarWidget — Flat calendar + upcoming events
 * 
 * Renders WITHOUT its own card wrapper — the parent provides the card.
 * Uses calendar-container-compact CSS class for compact sizing.
 */

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../styles/calendar.css';
import { CalendarDays, Trash2 } from 'lucide-react';

const CalendarWidget = ({ eventos = [], onOpenAddModal, onClickDay, onDeleteEvento }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Check if date has events
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

  // Event dot indicator on tiles
  const tileContent = ({ date, view }) => {
    if (view === 'month' && hasEventOnDate(date)) {
      return (
        <div className="flex justify-center mt-0.5">
          <div className="w-1 h-1 bg-primary-500 rounded-full" />
        </div>
      );
    }
    return null;
  };

  // Upcoming events (sorted, max 3)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximosEventos = eventos
    .map(evento => ({
      ...evento,
      dataObj: evento.data?.toDate?.() || new Date(evento.data),
    }))
    .filter(evento => evento.dataObj >= hoje)
    .sort((a, b) => a.dataObj - b.dataObj)
    .slice(0, 3);

  const handleDayClick = (date) => {
    setSelectedDate(date);
    if (onClickDay) onClickDay(date);
  };

  return (
    <div className="calendar-container-compact">
      {/* Calendar grid */}
      <Calendar
        onChange={setSelectedDate}
        onClickDay={handleDayClick}
        value={selectedDate}
        tileContent={tileContent}
        locale="pt-BR"
        className="w-full border-none"
      />

      {/* Upcoming events */}
      <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-700/50">
        <h4 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          Próximos Eventos
        </h4>

        {proximosEventos.length > 0 ? (
          <div className="space-y-2">
            {proximosEventos.map((evento, index) => (
              <div
                key={evento.id || index}
                className="group flex items-center gap-3 p-2.5 bg-slate-50/80 dark:bg-slate-700/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
              >
                {/* Date badge */}
                <div className="flex-shrink-0 w-10 h-10 bg-primary-50 dark:bg-primary-950/80 rounded-lg flex flex-col items-center justify-center border border-primary-100 dark:border-primary-900/50">
                  <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 leading-none">
                    {evento.dataObj.getDate()}
                  </span>
                  <span className="text-[8px] text-primary-500 dark:text-primary-400 uppercase leading-none mt-0.5">
                    {evento.dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {evento.titulo || evento.title}
                  </p>
                  {evento.tipo && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {evento.tipo}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                {onDeleteEvento && evento.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteEvento(evento); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-950 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    title="Excluir evento"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CalendarDays size={18} className="text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Nenhum evento próximo
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarWidget;
