/**
 * @file index.js
 * @description Exports públicos da feature social (Estude Juntos).
 */

// Context
export { SocialProvider, useSocial } from './context/SocialContext';

// Hooks
export { useFriends } from './hooks/useFriends';
export { useChat } from './hooks/useChat';
export { usePresence } from './hooks/usePresence';
export { useChallenge } from './hooks/useChallenge';
export { useGroups } from './hooks/useGroups';
export { useSocialNotifications } from './hooks/useSocialNotifications';

// Services
export { friendsService } from './services/friendsService';
export { chatService } from './services/chatService';
export { presenceService } from './services/presenceService';
export { challengeService } from './services/challengeService';
export { groupService } from './services/groupService';
export { notificationService } from './services/notificationService';

// Utils
export { formatMessageTime, formatChatTime, truncateText, getInitials, getAvatarColor, groupConsecutiveMessages } from './utils/chatHelpers';
export { calculateScore, averageResponseTime, formatTimer, calculateProgress, getResultData } from './utils/challengeHelpers';
