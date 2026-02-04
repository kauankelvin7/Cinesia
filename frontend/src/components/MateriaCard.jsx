import React from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiCheckCircle, FiCircle } from 'react-icons/fi';
import SafeIcon from './SafeIcon';
import { formatTimestamp } from '../utils/dateHelper';
import { hapticClick, hapticSuccess, hapticHeavy } from '../utils/haptics';

const MateriaCard = ({ materia, onEdit, onDelete, onToggleConcluida }) => {
  const isConcluida = Boolean(materia.concluida);

  const handleToggle = () => {
    hapticSuccess();
    onToggleConcluida?.(materia);
  };

  const handleEdit = () => {
    hapticClick();
    onEdit(materia);
  };

  const handleDelete = () => {
    hapticHeavy();
    onDelete(materia.id);
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Color Bar */}
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: materia.cor || '#14B8A6' }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${materia.cor || '#14B8A6'}15` }}
            >
              <SafeIcon 
                name={materia.icone || materia.icon}
                size={24} 
                color={materia.cor || '#14B8A6'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 truncate">
                {materia.nome}
              </h3>
              {materia.descricao && (
                <p className="text-sm text-slate-500 line-clamp-1">
                  {materia.descricao}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-2">
            <motion.button
              onClick={handleToggle}
              className={
                isConcluida
                  ? 'p-2 text-emerald-600 bg-emerald-50 rounded-lg transition-colors'
                  : 'p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors'
              }
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isConcluida ? 'Marcar como não concluída' : 'Marcar como concluída'}
            >
              {isConcluida ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
            </motion.button>
            <motion.button
              onClick={handleEdit}
              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Editar"
            >
              <FiEdit2 size={18} />
            </motion.button>
            <motion.button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Excluir"
            >
              <FiTrash2 size={18} />
            </motion.button>
          </div>
        </div>

        {isConcluida && (
          <div className="mb-3">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              Concluída
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-slate-500">Criada em:</span>
            <span className="font-medium text-slate-900">
              {formatTimestamp(materia.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MateriaCard;
