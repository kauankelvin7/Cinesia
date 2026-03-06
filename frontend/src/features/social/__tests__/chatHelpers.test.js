/**
 * @file chatHelpers.test.js
 * @description Testes para utilitários de chat.
 */

import { describe, it, expect } from 'vitest';
import {
  formatMessageTime,
  formatChatTime,
  truncateText,
  getInitials,
  getAvatarColor,
  groupConsecutiveMessages,
} from '../utils/chatHelpers';

describe('chatHelpers', () => {
  describe('truncateText', () => {
    it('retorna texto curto inalterado', () => {
      expect(truncateText('Olá', 50)).toBe('Olá');
    });

    it('trunca texto longo com reticências', () => {
      const long = 'A'.repeat(60);
      const result = truncateText(long, 50);
      expect(result.length).toBe(53); // 50 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('retorna string vazia para null/undefined', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
    });
  });

  describe('getInitials', () => {
    it('retorna iniciais de nome completo', () => {
      expect(getInitials('João Silva')).toBe('JS');
    });

    it('retorna primeira letra para nome simples', () => {
      expect(getInitials('Maria')).toBe('M');
    });

    it('limita a 2 iniciais', () => {
      expect(getInitials('Ana Beatriz Costa')).toBe('AC');
    });

    it('retorna ? para input vazio', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials(null)).toBe('?');
    });
  });

  describe('getAvatarColor', () => {
    it('retorna uma classe CSS de cor', () => {
      const color = getAvatarColor('João');
      expect(color).toMatch(/^bg-/);
    });

    it('é determinístico - mesmo nome, mesma cor', () => {
      const c1 = getAvatarColor('Maria');
      const c2 = getAvatarColor('Maria');
      expect(c1).toBe(c2);
    });

    it('diferentes nomes podem gerar cores diferentes', () => {
      const c1 = getAvatarColor('Ana');
      const c2 = getAvatarColor('Zé');
      // Não garante sempre diferente, mas testa que funciona sem erro
      expect(c1).toMatch(/^bg-/);
      expect(c2).toMatch(/^bg-/);
    });
  });

  describe('groupConsecutiveMessages', () => {
    it('agrupa mensagens do mesmo remetente', () => {
      const messages = [
        { id: '1', senderId: 'a', text: 'oi' },
        { id: '2', senderId: 'a', text: 'tudo bem?' },
        { id: '3', senderId: 'b', text: 'sim!' },
      ];
      const groups = groupConsecutiveMessages(messages);
      expect(groups.length).toBe(2);
      expect(groups[0].messages.length).toBe(2);
      expect(groups[1].messages.length).toBe(1);
    });

    it('retorna array vazio para input vazio', () => {
      expect(groupConsecutiveMessages([])).toEqual([]);
    });

    it('separa mensagens de sistema', () => {
      const messages = [
        { id: '1', senderId: 'a', text: 'oi' },
        { id: '2', senderId: 'system', type: 'system', text: 'Entrou no grupo' },
        { id: '3', senderId: 'a', text: 'olá' },
      ];
      const groups = groupConsecutiveMessages(messages);
      expect(groups.length).toBe(3);
    });
  });

  describe('formatMessageTime', () => {
    it('formata timestamp válido', () => {
      const now = new Date();
      const timestamp = { toDate: () => now };
      const result = formatMessageTime(timestamp);
      expect(result).toBeTruthy();
      // Deve conter horas e minutos (formato HH:MM)
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('retorna string vazia para null', () => {
      expect(formatMessageTime(null)).toBe('');
    });
  });

  describe('formatChatTime', () => {
    it('formata timestamp para preview de conversa', () => {
      const now = new Date();
      const timestamp = { toDate: () => now };
      const result = formatChatTime(timestamp);
      expect(result).toBeTruthy();
    });

    it('retorna string vazia para null', () => {
      expect(formatChatTime(null)).toBe('');
    });
  });
});
