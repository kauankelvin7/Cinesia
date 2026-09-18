import { z } from 'zod';
import { validateDomain } from '../../../shared/validation/domain';

const nullableText = (max) => z.string().trim().max(max).nullable().optional();

const flashcardBaseSchema = z
  .object({
    pergunta: z.string().trim().min(1).max(5000),
    resposta: z.string().trim().min(1).max(10000),
    materiaId: nullableText(200),
    materiaNome: nullableText(200),
    materiaCor: nullableText(40),
    tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    imagemUrl: nullableText(5000),
    interval: z.number().min(0).optional(),
    easeFactor: z.number().min(1.3).max(10).optional(),
    repetitions: z.number().int().min(0).optional(),
    nextReviewDate: z.any().optional(),
  })
  .passthrough();

export const flashcardCreateSchema = flashcardBaseSchema;
export const flashcardUpdateSchema = flashcardBaseSchema.partial();

export function parseFlashcardCreate(input) {
  return validateDomain(
    flashcardCreateSchema,
    input,
    'Preencha a pergunta e a resposta do flashcard.',
  );
}

export function parseFlashcardUpdate(input) {
  return validateDomain(
    flashcardUpdateSchema,
    input,
    'Não consegui validar as alterações desse flashcard.',
  );
}
