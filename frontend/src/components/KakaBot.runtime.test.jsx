import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const noop = vi.fn();
const setMensagensVisiveis = vi.fn();

vi.mock('../contexts/AuthContext-firebase', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', id: 'user-1', displayName: 'Usuário Teste', email: 'teste@cinesia.dev' },
  }),
}));

vi.mock('../config/firebase-config', () => ({
  db: {},
}));

vi.mock('../hooks/useKakabotContext', () => ({
  default: () => ({
    dadosSistema: {
      materias: [],
      totalFlashcards: 0,
      totalResumos: 0,
      streakAtual: 0,
      cardsParaRevisarHoje: 0,
      longestStreak: 0,
    },
    materiasLista: [],
    isLoadingContext: false,
  }),
}));

vi.mock('../hooks/useSpeechRecognition', () => ({
  default: () => ({
    isListening: false,
    transcript: '',
    startListening: noop,
    stopListening: noop,
    isSupported: false,
    error: null,
  }),
}));

vi.mock('../hooks/useKakabotSessoes', () => ({
  default: () => ({
    sessaoAtual: null,
    mensagensVisiveis: [],
    temMais: false,
    carregando: false,
    novaSessao: noop,
    carregarSessao: noop,
    carregarMais: noop,
    adicionarMensagem: noop,
    adicionarMensagemSemUI: noop,
    listarSessoes: vi.fn(async () => []),
    setMensagensVisiveis,
  }),
}));

vi.mock('../hooks/useTextToSpeech', () => ({
  default: () => ({
    speak: noop,
    stop: noop,
    isSupported: false,
    isSpeaking: false,
    activeId: null,
  }),
}));

vi.mock('../utils/kakabotActions', () => ({
  extrairAcoes: (text) => ({ textoLimpo: text, acoes: [] }),
  executarAcoes: vi.fn(async () => []),
}));

vi.mock('../components/kakabot/KakaAvatar', () => ({
  default: () => <div data-testid="kaka-avatar" />,
}));

vi.mock('../components/kakabot/KakaSkeleton', () => ({
  default: () => <div data-testid="kaka-skeleton" />,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  setDoc: vi.fn(async () => undefined),
  serverTimestamp: vi.fn(() => new Date()),
}));

import KakaBot from './KakaBot';

describe('KakaBot runtime smoke test', () => {
  it('renderiza sem erro de inicialização/TDZ', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <KakaBot />
        </MemoryRouter>,
      );
    }).not.toThrow();
  });
});
