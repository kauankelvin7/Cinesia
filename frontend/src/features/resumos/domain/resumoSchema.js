import { z } from 'zod';
import { validateDomain } from '../../../shared/validation/domain';

const resumoBaseSchema = z
  .object({
    titulo: z.string().trim().min(1).max(300),
    conteudo: z.string().max(500000).default(''),
    materiaId: z.string().trim().max(200).nullable().optional(),
  })
  .passthrough();

export const resumoCreateSchema = resumoBaseSchema;
export const resumoUpdateSchema = resumoBaseSchema.partial();

export function parseResumoCreate(input) {
  return validateDomain(
    resumoCreateSchema,
    input,
    'Dê um título ao resumo antes de salvar.',
  );
}

export function parseResumoUpdate(input) {
  return validateDomain(
    resumoUpdateSchema,
    input,
    'Não consegui validar as alterações desse resumo.',
  );
}
