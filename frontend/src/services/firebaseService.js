/**
 * Fachada de compatibilidade para o data layer antigo.
 *
 * Novos módulos devem importar diretamente da feature dona do domínio.
 * Este arquivo permanece para que páginas legadas possam migrar aos poucos,
 * sem um rewrite coordenado.
 */

export {
  criarMateria,
  listarMaterias,
  listarMateriasSimples,
  buscarMateria,
  atualizarMateria,
  deletarMateria,
} from '../features/materias/repositories/materiaRepository';

export {
  criarFlashcard,
  listarFlashcards,
  atualizarFlashcard,
  deletarFlashcard,
} from '../features/flashcards/repositories/flashcardRepository';

export {
  criarResumo,
  listarResumos,
  atualizarResumo,
  deletarResumo,
} from '../features/resumos/services/resumoService';

export {
  salvarSimulado,
  listarSimulados,
} from '../features/simulados/repositories/simuladoRepository';

export {
  salvarEvento,
  listarEventos,
  deletarEvento,
} from '../features/agenda/repositories/eventoRepository';

export { atualizarMetaMensal } from '../features/dashboard/repositories/preferencesRepository';

export { getDashboardStats } from './dashboardService';

export {
  getBase64Pure,
  getDataURI,
} from '../shared/utils/imageData';

import {
  criarMateria,
  listarMaterias,
  listarMateriasSimples,
  buscarMateria,
  atualizarMateria,
  deletarMateria,
} from '../features/materias/repositories/materiaRepository';
import {
  criarFlashcard,
  listarFlashcards,
  atualizarFlashcard,
  deletarFlashcard,
} from '../features/flashcards/repositories/flashcardRepository';
import {
  criarResumo,
  listarResumos,
  atualizarResumo,
  deletarResumo,
} from '../features/resumos/services/resumoService';
import {
  salvarEvento,
  listarEventos,
  deletarEvento,
} from '../features/agenda/repositories/eventoRepository';

export default {
  criarMateria,
  listarMaterias,
  listarMateriasSimples,
  buscarMateria,
  atualizarMateria,
  deletarMateria,
  criarFlashcard,
  listarFlashcards,
  atualizarFlashcard,
  deletarFlashcard,
  criarResumo,
  listarResumos,
  atualizarResumo,
  deletarResumo,
  salvarEvento,
  listarEventos,
  deletarEvento,
};
