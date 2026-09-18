import { z } from 'zod';
import { validateDomain } from '../../../shared/validation/domain';

export const simuladoResultSchema = z
  .object({
    tema: z.string().trim().min(1).max(500),
    score: z.number().min(0).max(100),
    acertos: z.number().int().min(0),
    total: z.number().int().min(0),
    tempoSegundos: z.number().min(0).optional().default(0),
    questoes: z.array(z.unknown()).optional().default([]),
  })
  .passthrough()
  .refine((value) => value.acertos <= value.total, {
    message: 'Acertos não podem superar o total',
    path: ['acertos'],
  });

export function parseSimuladoResult(input) {
  return validateDomain(
    simuladoResultSchema,
    input,
    'Não consegui validar o resultado deste simulado.',
  );
}
