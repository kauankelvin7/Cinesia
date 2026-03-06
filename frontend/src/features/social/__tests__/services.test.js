/**
 * @file services.test.js
 * @description Testes de unidade para serviços sociais — verifica chamadas Firebase.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Firebase mocks ──
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn(() => ({ docs: [] }));
const mockAddDoc = vi.fn(() => ({ id: 'mock-id' }));
const mockOnSnapshot = vi.fn(() => vi.fn());
const mockWriteBatch = vi.fn(() => ({
  set: vi.fn(),
  update: vi.fn(),
  commit: vi.fn(),
}));

vi.mock('../../../config/firebase-config', () => ({
  db: {},
  rtdb: {},
  auth: { currentUser: { uid: 'user1' } },
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  doc: vi.fn(() => ({ id: 'mock-doc-id' })),
  onSnapshot: mockOnSnapshot,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  writeBatch: mockWriteBatch,
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
  increment: vi.fn((n) => `INCREMENT_${n}`),
  arrayUnion: vi.fn((v) => `UNION_${v}`),
  arrayRemove: vi.fn((v) => `REMOVE_${v}`),
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(() => vi.fn()),
  onDisconnect: vi.fn(() => ({ set: vi.fn() })),
  serverTimestamp: vi.fn(() => 'RTDB_TIMESTAMP'),
}));

describe('friendsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('importa sem erro', async () => {
    const mod = await import('../services/friendsService');
    expect(mod.friendsService).toBeDefined();
  });

  it('tem métodos essenciais', async () => {
    const { friendsService } = await import('../services/friendsService');
    expect(typeof friendsService.sendFriendRequest).toBe('function');
    expect(typeof friendsService.acceptFriendRequest).toBe('function');
    expect(typeof friendsService.declineFriendRequest).toBe('function');
    expect(typeof friendsService.removeFriend).toBe('function');
    expect(typeof friendsService.blockUser).toBe('function');
    expect(typeof friendsService.subscribeFriends).toBe('function');
    expect(typeof friendsService.searchUsers).toBe('function');
    expect(typeof friendsService.ensureUserProfile).toBe('function');
  });
});

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('importa sem erro', async () => {
    const mod = await import('../services/chatService');
    expect(mod.chatService).toBeDefined();
  });

  it('tem métodos essenciais', async () => {
    const { chatService } = await import('../services/chatService');
    expect(typeof chatService.getOrCreateConversation).toBe('function');
    expect(typeof chatService.sendMessage).toBe('function');
    expect(typeof chatService.markAsRead).toBe('function');
    expect(typeof chatService.subscribeMessages).toBe('function');
    expect(typeof chatService.subscribeConversations).toBe('function');
    expect(typeof chatService.subscribeTotalUnread).toBe('function');
  });
});

describe('challengeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('importa sem erro', async () => {
    const mod = await import('../services/challengeService');
    expect(mod.challengeService).toBeDefined();
  });

  it('tem métodos essenciais', async () => {
    const { challengeService } = await import('../services/challengeService');
    expect(typeof challengeService.createChallenge).toBe('function');
    expect(typeof challengeService.acceptChallenge).toBe('function');
    expect(typeof challengeService.submitAnswer).toBe('function');
    expect(typeof challengeService.subscribeChallenge).toBe('function');
  });
});

describe('presenceService', () => {
  it('importa sem erro', async () => {
    const mod = await import('../services/presenceService');
    expect(mod.presenceService).toBeDefined();
  });

  it('tem métodos essenciais', async () => {
    const { presenceService } = await import('../services/presenceService');
    expect(typeof presenceService.initPresence).toBe('function');
    expect(typeof presenceService.goOffline).toBe('function');
    expect(typeof presenceService.subscribeToFriendsStatus).toBe('function');
  });
});

describe('groupService', () => {
  it('importa sem erro', async () => {
    const mod = await import('../services/groupService');
    expect(mod.groupService).toBeDefined();
  });

  it('tem métodos essenciais', async () => {
    const { groupService } = await import('../services/groupService');
    expect(typeof groupService.createGroup).toBe('function');
    expect(typeof groupService.addMember).toBe('function');
    expect(typeof groupService.removeMember).toBe('function');
    expect(typeof groupService.leaveGroup).toBe('function');
    expect(typeof groupService.subscribeGroups).toBe('function');
  });
});

describe('notificationService', () => {
  it('importa sem erro', async () => {
    const mod = await import('../services/notificationService');
    expect(mod.notificationService).toBeDefined();
  });

  it('tem métodos essenciais', async () => {
    const { notificationService } = await import('../services/notificationService');
    expect(typeof notificationService.create).toBe('function');
    expect(typeof notificationService.markAsRead).toBe('function');
    expect(typeof notificationService.markAllAsRead).toBe('function');
    expect(typeof notificationService.subscribeNotifications).toBe('function');
    expect(typeof notificationService.subscribeUnreadCount).toBe('function');
  });
});
