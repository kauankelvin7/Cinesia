import { z } from 'zod';
import { optionalText, validateDomain } from '../../../shared/validation/domain';

const materiaBaseSchema = z
  .object({
    nome: z.string().trim().min(1).max(100),
    descricao: optionalText(1000),
    cor: z.string().trim().max(40).optional(),
    semestre: z.union([z.string(), z.number()]).optional().nullable(),
    icone: z.string().trim().max(100).optional().nullable(),
    concluida: z.boolean().optional(),
  })
  .passthrough();

export const materiaCreateSchema = materiaBaseSchema;
export const materiaUpdateSchema = materiaBaseSchema.partial();

export function parseMateriaCreate(input) {
  return validateDomain(
    materiaCreateSchema,
    input,
    'Informe um nome para a matéria antes de salvar.',
  );
}

export function parseMateriaUpdate(input) {
  return validateDomain(
    materiaUpdateSchema,
    input,
    'Não consegui validar as alterações dessa matéria.',
  );
}
