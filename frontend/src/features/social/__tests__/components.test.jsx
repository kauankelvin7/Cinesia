/**
 * @file components.test.jsx
 * @description Testes de renderização para componentes sociais críticos.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── Firebase mocks ──
vi.mock('../../../../config/firebase-config', () => ({
  db: {},
  auth: { currentUser: { uid: 'user1' } },
  rtdb: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  getDoc: vi.fn(),
  getDocs: vi.fn(() => ({ docs: [] })),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), commit: vi.fn() })),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
  increment: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(() => vi.fn()),
  onDisconnect: vi.fn(() => ({ set: vi.fn() })),
  serverTimestamp: vi.fn(),
}));

vi.mock('../../../../contexts/AuthContext-firebase', () => ({
  useAuth: () => ({
    user: { uid: 'user1', displayName: 'Test User', email: 'test@test.com', photoURL: null },
    isAuthenticated: true,
    loading: false,
  }),
}));

// ── Testes dos componentes shared ──
import OnlineIndicator from '../../components/shared/OnlineIndicator';
import StudyingBadge from '../../components/shared/StudyingBadge';
import NotificationBadge from '../../components/shared/NotificationBadge';

describe('OnlineIndicator', () => {
  it('renderiza dot verde para online', () => {
    const { container } = render(<OnlineIndicator status="online" />);
    const dot = container.firstChild;
    expect(dot).toBeTruthy();
    expect(dot.className).toContain('bg-green');
  });

  it('renderiza dot cinza para offline', () => {
    const { container } = render(<OnlineIndicator status="offline" />);
    const dot = container.firstChild;
    expect(dot).toBeTruthy();
    expect(dot.className).toContain('bg-slate');
  });

  it('renderiza dot cyan para studying', () => {
    const { container } = render(<OnlineIndicator status="studying" />);
    const dot = container.firstChild;
    expect(dot).toBeTruthy();
    expect(dot.className).toContain('bg-cyan');
  });
});

describe('StudyingBadge', () => {
  it('renderiza com nome da página', () => {
    render(<StudyingBadge page="Flashcards" />);
    expect(screen.getByText('Flashcards')).toBeTruthy();
  });

  it('renderiza sem nome de página', () => {
    render(<StudyingBadge />);
    expect(screen.getByText('Estudando')).toBeTruthy();
  });
});

describe('NotificationBadge', () => {
  it('renderiza contagem', () => {
    render(<NotificationBadge count={5} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('mostra 9+ para contagem maior que 9', () => {
    render(<NotificationBadge count={15} />);
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('não renderiza para contagem 0', () => {
    const { container } = render(<NotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });
});

// ── Testes do TypingIndicator ──
import TypingIndicator from '../../components/chat/TypingIndicator';

describe('TypingIndicator', () => {
  it('renderiza 3 dots de animação', () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll('[class*="rounded-full"]');
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });
});

// ── Testes do MessageStatus ──
import MessageStatus from '../../components/chat/MessageStatus';

describe('MessageStatus', () => {
  it('renderiza check para enviada', () => {
    const { container } = render(<MessageStatus status="sent" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renderiza double check para lida', () => {
    const { container } = render(<MessageStatus status="read" />);
    expect(container.firstChild).toBeTruthy();
  });
});
