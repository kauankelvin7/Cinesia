/**
 * 📳 Haptic Feedback Utility - Micro-interações Táteis
 *
 * Utilitário para fornecer feedback tátil (vibração) em ações do usuário, melhorando a experiência em dispositivos móveis.
 *
 * - Compatível com Android e alguns iPhones (limitado no iOS)
 * - Fallback seguro: não faz nada em dispositivos sem suporte
 * - Padrões prontos para sucesso, erro, seleção, celebração, etc.
 *
 * Exemplo de uso:
 *   import { hapticSuccess } from './haptics';
 *   hapticSuccess(); // Vibra para indicar sucesso
 */

/**
 * Verifica se a API de vibração está disponível no navegador/dispositivo.
 * @returns {boolean} true se suportado, false caso contrário
 */
const isVibrationSupported = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Padrões de vibração pré-definidos para diferentes tipos de feedback.
 * Valores em milissegundos. Para padrões: [vibrar, pausar, vibrar, pausar, ...]
 */
export const HAPTIC_PATTERNS = {
  // Clique sutil - Feedback de toque básico
  click: 5,
  
  // Sucesso - Confirmação positiva
  success: 10,
  
  // Erro - Duas vibrações rápidas para alertar
  error: [50, 50, 50],
  
  // Warning - Vibração média
  warning: 30,
  
  // Heavy - Para ações importantes (deletar, etc)
  heavy: 50,
  
  // Double tap - Duas vibrações curtas
  doubleTap: [10, 30, 10],
  
  // Triple - Três vibrações (conclusão de tarefa)
  celebration: [10, 50, 10, 50, 10],
  
  // Selection change
  selection: 3,
};

/**
 * Executa vibração com um padrão específico.
 *
 * @param {number|number[]|string} pattern - Duração em ms, array de padrão, ou nome do padrão
 * @returns {boolean} true se a vibração foi executada
 *
 * Exemplos:
 *   vibrate('click')           // Vibração de clique
 *   vibrate('success')         // Vibração de sucesso
 *   vibrate('error')           // Vibração de erro
 *   vibrate(100)               // Vibração de 100ms
 *   vibrate([50, 30, 50])      // Padrão customizado
 */
export const vibrate = (pattern = 'click') => {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    // Se for string, buscar no padrão pré-definido
    const vibrationPattern = typeof pattern === 'string' 
      ? HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.click
      : pattern;

    navigator.vibrate(vibrationPattern);
    return true;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
};

/**
 * Cancela qualquer vibração em andamento no dispositivo.
 */
export const cancelVibration = () => {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
};

/**
 * Helper estilo hook para criar handlers que executam haptic feedback antes do callback.
 *
 * @param {Function} callback - Função a ser executada após a vibração
 * @param {string} pattern - Padrão de vibração
 * @returns {Function} Handler que vibra e executa o callback
 *
 * Exemplo:
 *   const handleClick = withHaptic(() => setCount(c => c + 1), 'click');
 *   <button onClick={handleClick}>Incrementar</button>
 */
export const withHaptic = (callback, pattern = 'click') => {
  return (...args) => {
    vibrate(pattern);
    if (typeof callback === 'function') {
      return callback(...args);
    }
  };
};

/**
 * Vibração para feedback de sucesso (ação concluída)
 */
export const hapticSuccess = () => vibrate('success');

/**
 * Vibração para feedback de erro (ação inválida ou falha)
 */
export const hapticError = () => vibrate('error');

/**
 * Vibração para clique/toque básico (micro-interação)
 */
export const hapticClick = () => vibrate('click');

/**
 * Vibração para ações pesadas (deletar, confirmar importante)
 */
export const hapticHeavy = () => vibrate('heavy');

/**
 * Vibração de celebração (completar tarefa, meta atingida)
 */
export const hapticCelebration = () => vibrate('celebration');

/**
 * Vibração de seleção (trocar opção, toggle)
 */
export const hapticSelection = () => vibrate('selection');

export default {
  vibrate,
  cancelVibration,
  withHaptic,
  hapticSuccess,
  hapticError,
  hapticClick,
  hapticHeavy,
  hapticCelebration,
  hapticSelection,
  HAPTIC_PATTERNS,
};
