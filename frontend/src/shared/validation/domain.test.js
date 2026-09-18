import { describe, expect, it } from 'vitest';
import {
  cleanWritePayload,
  DomainValidationError,
  requireUserId,
} from './domain';
import { parseMateriaCreate } from '../../features/materias/domain/materiaSchema';
import {
  parseFlashcardCreate,
  parseFlashcardUpdate,
} from '../../features/flashcards/domain/flashcardSchema';
import { parseResumoCreate } from '../../features/resumos/domain/resumoSchema';
import { parseEventoCreate } from '../../features/agenda/domain/eventoSchema';
import { parseSimuladoResult } from '../../features/simulados/domain/simuladoSchema';

describe('contratos de domínio', () => {
  it('normaliza o nome da matéria e preserva campos compatíveis', () => {
    const result = parseMateriaCreate({
      nome: '  Anatomia  ',
      cor: '#2563EB',
      customLegacyField: 'mantido',
    });

    expect(result.nome).toBe('Anatomia');
    expect(result.customLegacyField).toBe('mantido');
  });

  it('rejeita matéria sem nome', () => {
    expect(() => parseMateriaCreate({ nome: '   ' })).toThrow(DomainValidationError);
  });

  it('aceita flashcard sem matéria para histórico de simulados', () => {
    const result = parseFlashcardCreate({
      pergunta: 'Qual estrutura?',
      resposta: 'Fêmur',
      materiaId: null,
    });

    expect(result.materiaId).toBeNull();
  });

  it('rejeita flashcard incompleto', () => {
    expect(() =>
      parseFlashcardCreate({ pergunta: 'Pergunta', resposta: '' }),
    ).toThrow(DomainValidationError);
  });

  it('aceita atualização parcial de SM-2', () => {
    const result = parseFlashcardUpdate({
      interval: 6,
      easeFactor: 2.3,
      repetitions: 3,
    });

    expect(result.repetitions).toBe(3);
  });

  it('rejeita ease factor abaixo do limite do SM-2', () => {
    expect(() => parseFlashcardUpdate({ easeFactor: 1 })).toThrow(
      DomainValidationError,
    );
  });

  it('aceita resumo com conteúdo vazio, mas exige título', () => {
    expect(parseResumoCreate({ titulo: 'Joelho', conteudo: '' }).titulo).toBe('Joelho');
    expect(() => parseResumoCreate({ titulo: '', conteudo: 'texto' })).toThrow(
      DomainValidationError,
    );
  });

  it('converte data válida da agenda para Date', () => {
    const result = parseEventoCreate({
      titulo: 'Prova',
      data: '2026-09-30',
      tipo: 'prova',
    });

    expect(result.data).toBeInstanceOf(Date);
    expect(Number.isNaN(result.data.getTime())).toBe(false);
  });

  it('rejeita data inválida da agenda', () => {
    expect(() =>
      parseEventoCreate({ titulo: 'Prova', data: 'não-é-data' }),
    ).toThrow(DomainValidationError);
  });

  it('impede resultado de simulado com mais acertos que questões', () => {
    expect(() =>
      parseSimuladoResult({
        tema: 'Anatomia',
        score: 100,
        acertos: 11,
        total: 10,
      }),
    ).toThrow(DomainValidationError);
  });

  it('remove metadados imutáveis antes de um update', () => {
    const result = cleanWritePayload(
      {
        id: 'doc-1',
        uid: 'user-1',
        nome: 'Anatomia',
        updatedAt: 'old',
        extra: undefined,
      },
      ['id', 'uid', 'updatedAt'],
    );

    expect(result).toEqual({ nome: 'Anatomia' });
  });

  it('rejeita operação sem sessão', () => {
    expect(() => requireUserId('')).toThrow(DomainValidationError);
  });
});
