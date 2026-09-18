import {
  createResumo,
  deleteResumo,
  listResumos,
  updateResumo,
} from '../repositories/resumoRepository';

function notifyResumoChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cinesia:resumo:alterado'));
  }
}

export async function criarResumo(resumo, userId) {
  try {
    const result = await createResumo(resumo, userId);
    notifyResumoChanged();
    return result;
  } catch (error) {
    console.error('[RESUMOS] Falha ao criar resumo:', error);
    throw new Error('Não consegui salvar o resumo. Tente de novo.');
  }
}

export async function listarResumos(userId, materiaId = null) {
  try {
    return await listResumos(userId, materiaId);
  } catch (error) {
    console.error('[RESUMOS] Falha ao listar resumos:', error);
    throw new Error('Não consegui carregar seus resumos.');
  }
}

export async function atualizarResumo(resumoId, updates) {
  try {
    await updateResumo(resumoId, updates);
    notifyResumoChanged();
  } catch (error) {
    console.error('[RESUMOS] Falha ao atualizar resumo:', error);
    throw new Error('Não consegui atualizar o resumo.');
  }
}

export async function deletarResumo(resumoId) {
  try {
    await deleteResumo(resumoId);
    notifyResumoChanged();
  } catch (error) {
    console.error('[RESUMOS] Falha ao excluir resumo:', error);
    throw new Error('Não consegui excluir o resumo.');
  }
}
