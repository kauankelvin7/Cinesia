/**
 * keyboard.js — Utilitário de guard para atalhos de teclado globais
 *
 * Garante que atalhos globais (Espaço, Enter, Escape, números) nunca
 * interceptem digitação em campos de texto.
 */

/**
 * Retorna true se o foco do documento estiver em um campo de digitação.
 * Use como guard no início de todo handler de keydown global.
 *
 * @returns {boolean}
 */
export function isTypingInInput() {
  const active = document.activeElement;
  if (!active) return false;

  const tag = active.tagName.toLowerCase();

  // Campo de texto nativo
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;

  // Editor rich text (contentEditable)
  if (active.contentEditable === 'true') return true;

  // Dentro de um editor rico (Quill, TipTap, CodeMirror, etc.)
  if (active.closest('[role="textbox"]')) return true;
  if (active.closest('.ql-editor')) return true;

  return false;
}
