import { z } from 'zod';

export class DomainValidationError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'DomainValidationError';
  }
}

export const uidSchema = z.string().trim().min(1);

export const idSchema = z.string().trim().min(1);

export const optionalText = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''));

export function validateDomain(schema, input, message) {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  if (import.meta.env.DEV) {
    console.warn('[VALIDATION] Payload rejeitado:', result.error.issues);
  }

  throw new DomainValidationError(message, { cause: result.error });
}

export function cleanWritePayload(payload, immutableFields = []) {
  const clean = { ...payload };

  for (const field of immutableFields) {
    delete clean[field];
  }

  return Object.fromEntries(
    Object.entries(clean).filter(([, value]) => value !== undefined),
  );
}

export function requireUserId(userId) {
  return validateDomain(
    uidSchema,
    userId,
    'Sua sessão não está pronta. Entre novamente e tente de novo.',
  );
}

export function requireDocumentId(id) {
  return validateDomain(
    idSchema,
    id,
    'Não consegui identificar este item. Atualize a página e tente de novo.',
  );
}
