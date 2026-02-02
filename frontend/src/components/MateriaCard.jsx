import React from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiCheckCircle, FiCircle } from 'react-icons/fi';
import SafeIcon from './SafeIcon';
import { formatTimestamp } from '../utils/dateHelper';

const MateriaCard = ({ materia, onEdit, onDelete, onToggleConcluida }) => {
  const isConcluida = Boolean(materia.concluida);

  return (
    <motion.div
      className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Color Bar */}
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: materia.cor || '#0D9488' }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${materia.cor || '#0D9488'}15` }}
            >
              <SafeIcon 
                name={materia.icone || materia.icon}
                size={24} 
                color={materia.cor || '#0D9488'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-text-primary truncate">
                {materia.nome}
              </h3>
              {materia.descricao && (
                <p className="text-sm text-text-secondary line-clamp-1">
                  {materia.descricao}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-2">
            <motion.button
              onClick={() => onToggleConcluida?.(materia)}
              className={
                isConcluida
                  ? 'p-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg transition-colors'
                  : 'p-2 text-text-secondary hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors'
              }
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={isConcluida ? 'Marcar como não concluída' : 'Marcar como concluída'}
            >
              {isConcluida ? <FiCheckCircle size={18} /> : <FiCircle size={18} />}
            </motion.button>
            <motion.button
              onClick={() => onEdit(materia)}
              className="p-2 text-text-secondary hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Editar"
            >
              <FiEdit2 size={18} />
            </motion.button>
            <motion.button
              onClick={() => onDelete(materia.id)}
              className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Excluir"
            >
              <FiTrash2 size={18} />
            </motion.button>
          </div>
        </div>

        {isConcluida && (
          <div className="mb-3">
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
              Concluída
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-text-secondary">Criada em:</span>
            <span className="font-medium text-text-primary">
              {formatTimestamp(materia.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MateriaCard;
