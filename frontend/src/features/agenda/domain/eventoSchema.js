import { z } from 'zod';
import { validateDomain } from '../../../shared/validation/domain';

const dateInputSchema = z
  .union([z.string(), z.number(), z.date()])
  .transform((value, context) => {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: 'custom',
        message: 'Data inválida',
      });
      return z.NEVER;
    }

    return date;
  });

export const eventoCreateSchema = z
  .object({
    titulo: z.string().trim().min(1).max(300),
    data: dateInputSchema,
    tipo: z.string().trim().min(1).max(80).optional().default('outro'),
  })
  .passthrough();

export function parseEventoCreate(input) {
  return validateDomain(
    eventoCreateSchema,
    input,
    'Confira o título e a data do evento antes de salvar.',
  );
}
