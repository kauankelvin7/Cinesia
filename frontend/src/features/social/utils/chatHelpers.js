/**
 * @file chatHelpers.js
 * @description Utilitários para formatação de datas, textos e dados do chat.
 */

/**
 * Formata timestamp para exibição relativa.
 * @param {Date|import('firebase/firestore').Timestamp|{toDate:Function}|number} timestamp
 * @returns {string}
 */
export function formatMessageTime(timestamp) {
  if (!timestamp) return '';

  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Menos de 1 minuto
  if (diffMin < 1) return 'Agora';

  // Menos de 60 minutos
  if (diffMin < 60) return `${diffMin}min`;

  // Mesmo dia
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Ontem
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  }

  // Mesma semana
  if (diffHours < 168) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  }

  // Mais antigo
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Formata timestamp para exibição no chat (hora:minuto).
 */
export function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Trunca texto para preview.
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Retorna as iniciais do nome.
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Gera uma cor de avatar consistente baseada no nome.
 */
export function getAvatarColor(name) {
  const colors = ['#2563EB', '#0D9488', '#7C3AED', '#059669', '#D97706', '#DB2777', '#4F46E5', '#0891B2'];
  const index = (name || '').charCodeAt(0) % colors.length || 0;
  return colors[index];
}

/**
 * Formata duração em milissegundos para exibição legível.
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Agrupa mensagens consecutivas do mesmo remetente.
 */
export function groupConsecutiveMessages(messages) {
  if (!messages?.length) return [];

  const groups = [];
  let currentGroup = null;

  messages.forEach((msg) => {
    if (!currentGroup || currentGroup.senderId !== msg.senderId) {
      currentGroup = {
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderPhoto: msg.senderPhoto,
        messages: [msg],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  return groups;
}
