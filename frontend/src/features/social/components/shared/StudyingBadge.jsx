/**
 * @file StudyingBadge.jsx
 * @description Badge que mostra "Estudando agora 📚" quando o usuário está ativo.
 */

import React, { memo } from 'react';

const pageLabels = {
  home: 'Início',
  materias: 'Matérias',
  resumos: 'Resumos',
  flashcards: 'Flashcards',
  simulado: 'Simulados',
  'consulta-rapida': 'Consulta Rápida',
  'quadro-branco': 'Quadro Branco',
  'atlas-3d': 'Atlas 3D',
  analytics: 'Analytics',
  conquistas: 'Conquistas',
  amigos: 'Social',
};

const StudyingBadge = memo(({ isStudying, currentPage }) => {
  if (!isStudying) return null;

  const label = pageLabels[currentPage] || currentPage;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
      <span className="text-xs">📚</span>
      <span>Estudando {label}</span>
    </span>
  );
});

StudyingBadge.displayName = 'StudyingBadge';
export default StudyingBadge;
