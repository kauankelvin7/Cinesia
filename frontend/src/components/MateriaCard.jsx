import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react';
import SafeIcon from './SafeIcon';
import { formatTimestamp } from '../utils/dateHelper';
import { hapticClick, hapticSuccess, hapticHeavy } from '../utils/haptics';

const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(20, 184, 166, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16) || 20;
  const g = parseInt(hex.slice(3, 5), 16) || 184;
  const b = parseInt(hex.slice(5, 7), 16) || 166;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MateriaCard = ({ materia, onEdit, onDelete, onToggleConcluida }) => {
  const isConcluida = Boolean(materia.concluida);
  const materiaColor = materia.cor || '#6366F1';

  const handleToggle = (e) => {
    e.stopPropagation();
    hapticSuccess();
    onToggleConcluida?.(materia);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    hapticClick();
    onEdit(materia);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    hapticHeavy();
    onDelete(materia.id);
  };

  return (
    <motion.div
      className={`relative bg-white dark:bg-slate-800 rounded-[24px] border transition-all duration-300 ${
        isConcluida 
        ? 'border-emerald-100 dark:border-emerald-900/30 opacity-80' 
        : 'border-slate-200/80 dark:border-slate-700/80 shadow-sm'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Efeito de Brilho Superior (Substitui a barra sólida) */}
      <div 
        className="absolute top-0 left-0 right-0 h-20 opacity-[0.12] pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${materiaColor}, transparent)` }}
      />

      <div className="p-6">
        {/* Header Principal */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Ícone com Background Translúcido */}
            <div 
              className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm border"
              style={{ 
                backgroundColor: hexToRgba(materiaColor, 0.12),
                borderColor: hexToRgba(materiaColor, 0.2)
              }}
            >
              <SafeIcon 
                name={materia.icone || materia.icon}
                size={22} 
                color={materiaColor}
                strokeWidth={2.5}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-extrabold tracking-tight truncate ${
                isConcluida ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'
              }`}>
                {materia.nome}
              </h3>
              {materia.descricao ? (
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                  {materia.descricao}
                </p>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600">
                  Sem descrição
                </span>
              )}
            </div>
          </div>

          {/* Ações Flutuantes Premium */}
          <div className="flex items-center gap-1.5 ml-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <button
              onClick={handleEdit}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all active:scale-90"
              title="Editar"
            >
              <Edit2 size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all active:scale-90"
              title="Excluir"
            >
              <Trash2 size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 relative z-10">
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400 dark:text-slate-500">
            <Calendar size={14} />
            {formatTimestamp(materia.createdAt)}
          </div>

          <motion.button
            onClick={handleToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
              isConcluida
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-500'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isConcluida ? (
              <>
                <CheckCircle2 size={13} strokeWidth={3} />
                Concluída
              </>
            ) : (
              <>
                <Circle size={13} strokeWidth={3} />
                Concluir
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MateriaCard;