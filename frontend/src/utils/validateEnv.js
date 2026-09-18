import { getRuntimeConfigHealth } from '../config/runtime-config';

/**
 * Faz diagnóstico da configuração sem derrubar o produto por features opcionais.
 *
 * O boot só é considerado inválido se a configuração crítica do Firebase estiver
 * incompleta. Gemini, Cloudinary e Analytics degradam de forma independente.
 */
export const validateEnv = () => {
  const health = getRuntimeConfigHealth();

  if (health.missingCritical.length > 0) {
    const message =
      '[Cinesia] Configuração crítica do Firebase incompleta: ' +
      health.missingCritical.join(', ');

    if (import.meta.env.DEV) {
      throw new Error(message);
    }

    console.error(message);
  }

  const disabled = Object.entries(health.optionalFeatures)
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => feature);

  if (disabled.length > 0) {
    console.warn(
      '[Cinesia] Recursos opcionais indisponíveis neste deploy:',
      disabled.join(', '),
    );
  }

  return health;
};
