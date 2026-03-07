import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CreditCard, FileText, Calendar, Flame, Rocket,
  ChevronLeft, ChevronRight, Sun, Moon, Trophy, Sparkles,
  ArrowRight, MessageCircle, Compass
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';
import KakaAvatar from './kakabot/KakaAvatar';

// ─── Confetti CSS Animation ──────────────────────────────────────────────────
const CONFETTI_COLORS = ['#6366f1', '#0d9488', '#f59e0b', '#ec4899', '#22d3ee', '#a855f7', '#34d399'];
const ConfettiPiece = ({ index }) => {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${5 + Math.random() * 90}%`;
  const delay = `${Math.random() * 2}s`;
  const duration = `${2.5 + Math.random() * 2}s`;
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <span
      className="absolute top-0 rounded-sm opacity-0 pointer-events-none"
      style={{
        left,
        width: size,
        height: size * 1.6,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        animation: `confettiFall ${duration} ${delay} ease-out forwards`,
      }}
    />
  );
};

// ─── Step Definitions ────────────────────────────────────────────────────────
const TOTAL_STEPS = 9;
const SKIPPABLE_STEPS = [4, 5, 6, 7, 8]; // tour steps

// ─── Slide variants ──────────────────────────────────────────────────────────
const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export default function OnboardingFlow() {
  const { user } = useAuth();
  const { setMode, isDarkMode } = useTheme();
  const navigate = useNavigate();


  const uid = user?.uid || user?.id;

  // Bloqueia UI até autenticação estar pronta
  if (!uid || !auth.currentUser) {
    return <div style={{textAlign:'center',marginTop:'2rem'}}>Aguardando autenticação...</div>;
  }

  // ─── State ───────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState('checking'); // checking | show | done
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    nomePreferido: user?.displayName || '',
    temaPreferido: isDarkMode ? 'dark' : 'light',
  });
  const [nomeError, setNomeError] = useState('');
  const [savingNome, setSavingNome] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // ─── Check onboarding status ────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid, 'perfil', 'dados'));
        if (snap.exists() && snap.data().onboardingConcluido === true) {
          setStatus('done');
        } else {
          setStatus('show');
        }
      } catch {
        // Se houver erro de permissão ou rede, não bloqueia o app
        setStatus('done');
      }
    };
    check();
  }, [uid]);

  // ─── Navigation helpers ──────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setDirection(1);
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  }, []);

  const skipTour = useCallback(() => {
    setDirection(1);
    setStep(TOTAL_STEPS); // pula direto para conclusão
  }, []);

  // ─── Step 2: Save name ──────────────────────────────────────────────────────
  const handleSaveName = async () => {
    const trimmed = onboardingData.nomePreferido.trim();
    if (trimmed.length < 2) {
      setNomeError('Mínimo 2 caracteres');
      return;
    }
    if (trimmed.length > 30) {
      setNomeError('Máximo 30 caracteres');
      return;
    }
    setNomeError('');
    setSavingNome(true);
    try {
      setOnboardingData((prev) => ({
        ...prev,
        nomePreferido: trimmed,
      }));
      goNext();
    } catch (error) {
      setNomeError('Erro inesperado. Tente novamente.');
      console.error("Erro detalhado:", error);
    } finally {
      setSavingNome(false);
    }
  };

  // ─── Step 3: Save theme ─────────────────────────────────────────────────────
  const handleSaveTheme = async () => {
    setSavingTheme(true);
    try {
      setMode(onboardingData.temaPreferido);
      setOnboardingData((prev) => ({
        ...prev,
        temaPreferido: prev.temaPreferido,
      }));
      goNext();
    } catch (error) {
      console.error("Erro detalhado:", error);
      goNext();
    } finally {
      setSavingTheme(false);
    }
  };

  // ─── Step 9: Finish onboarding ──────────────────────────────────────────────
  const finishOnboarding = useCallback(async (action) => {
    if (!uid || !auth.currentUser) return;
    setFinishing(true);
    try {
      // Atualiza displayName do Auth
      await updateProfile(auth.currentUser, {
        displayName: onboardingData.nomePreferido,
      });

      // Salva todos os dados de uma vez no Firestore
      await setDoc(
        doc(db, 'users', uid, 'perfil', 'dados'),
        {
          nomePreferido: onboardingData.nomePreferido,
          temaPreferido: onboardingData.temaPreferido,
          onboardingConcluido: true,
          onboardingConcluidoEm: serverTimestamp(),
        },
        { merge: true }
      );

      // Força reload do contexto de usuário para garantir nome/displayName atualizados
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cinesia:user:reload'));
      }

      setStatus('done');
      if (action === 'materias') {
        navigate('/materias');
      } else if (action === 'kaka') {
        window.dispatchEvent(new CustomEvent('cinesia:kakabot:abrir'));
      }
    } catch (error) {
      setNomeError('Erro ao concluir onboarding. Tente novamente.');
      console.error("Erro detalhado:", error);
    } finally {
      setFinishing(false);
    }
  }, [uid, onboardingData, navigate]);

  // ─── Render conditions ──────────────────────────────────────────────────────
  if (status !== 'show') return null;

  const isSkippable = SKIPPABLE_STEPS.includes(step);

  const nomePreferido =
    (onboardingData.nomePreferido &&
      onboardingData.nomePreferido.trim()) ||
    user?.displayName ||
    'estudante';

  return (
    <>
      {/* Confetti keyframes */}
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(85vh) rotate(720deg) scale(0.4); }
        }
      `}</style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal container */}
        <motion.div
          className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl
            bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: 'linear-gradient(90deg, var(--primary, #6366f1), #0d9488)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Content area */}
          <div className="relative overflow-hidden" style={{ minHeight: 420 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="p-6 sm:p-8"
              >
                {step === 1 && <StepWelcome onNext={goNext} />}
                {step === 2 && (
                  <StepName
                    nome={onboardingData.nomePreferido}
                    setNome={(nome) => setOnboardingData((prev) => ({ ...prev, nomePreferido: nome }))}
                    nomeError={nomeError}
                    saving={savingNome}
                    onConfirm={handleSaveName}
                  />
                )}
                {step === 3 && (
                  <StepTheme
                    selected={onboardingData.temaPreferido}
                    setSelected={(t) => setOnboardingData((prev) => ({ ...prev, temaPreferido: t }))}
                    saving={savingTheme}
                    onConfirm={handleSaveTheme}
                  />
                )}
                {step === 4 && <StepTourMaterias />}
                {step === 5 && <StepTourFlashcards />}
                {step === 6 && <StepTourResumos />}
                {step === 7 && <StepTourKaka />}
                {step === 8 && <StepTourAgenda />}
                {step === 9 && (
                  <StepConclusion
                    nome={nomePreferido}
                    finishing={finishing}
                    onFinish={finishOnboarding}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="px-6 sm:px-8 pb-5 pt-2 flex items-center justify-between">
            {/* Back button */}
            <div>
              {step > 1 && step < TOTAL_STEPS && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Voltar
                </button>
              )}
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i + 1 === step
                      ? 'w-6 h-2 bg-gradient-to-r from-indigo-500 to-teal-500'
                      : i + 1 < step
                        ? 'w-2 h-2 bg-indigo-400/60'
                        : 'w-2 h-2 bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Skip / Next for tour steps */}
            <div className="flex items-center gap-3">
              {isSkippable && (
                <>
                  <button
                    type="button"
                    onClick={skipTour}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Pular tour
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Próximo
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StepWelcome({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated ring + icon */}
      <div className="relative mb-6">
        <motion.div
          className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #0d9488)' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles size={40} color="#fff" strokeWidth={1.5} />
        </motion.div>
        <motion.div
          className="absolute -inset-2 rounded-3xl border-2 border-indigo-400/30"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </div>

      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent mb-2"
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        Cinesia
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Seu parceiro de estudos em Fisioterapia
      </p>

      <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-sm">
        Seja bem-vindo(a)! Vamos configurar sua conta em menos de 1 minuto.
      </p>

      <button
        type="button"
        onClick={onNext}
        className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white shadow-lg
          bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
          transition-all hover:shadow-xl active:scale-[0.98]"
      >
        Começar <ArrowRight size={16} className="inline ml-1" />
      </button>
    </div>
  );
}

function StepName({ nome, setNome, nomeError, saving, onConfirm }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-5">
        <span className="text-3xl">👋</span>
      </div>

      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        Como podemos te chamar?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Esse nome aparecerá no seu perfil e nas saudações
      </p>

      <div className="w-full max-w-xs mb-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome ou apelido"
          maxLength={30}
          className="w-full px-4 py-3 rounded-xl text-center text-lg font-medium
            border-2 border-slate-200 dark:border-slate-600
            bg-white dark:bg-slate-800 text-slate-800 dark:text-white
            focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            placeholder:text-slate-400 transition-all"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
        />
        <div className="flex justify-between mt-1.5 px-1">
          {nomeError ? (
            <span className="text-xs text-red-500">{nomeError}</span>
          ) : (
            <span className="text-xs text-slate-400">{nome.length}/30 caracteres</span>
          )}
          <span className="text-xs text-slate-400">Min. 2</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={saving || nome.trim().length < 2}
        className="mt-4 w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white shadow-lg
          bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
          transition-all hover:shadow-xl active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Salvando...' : 'Confirmar nome →'}
      </button>
    </div>
  );
}

function StepTheme({ selected, setSelected, saving, onConfirm }) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        Como prefere estudar?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Você pode mudar depois nas configurações
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
        {/* Dark option */}
        <button
          type="button"
          onClick={() => setSelected('dark')}
          className={`relative p-4 rounded-xl border-2 transition-all text-center
            ${selected === 'dark'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
        >
          <Moon size={28} className="mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
          <span className="block text-sm font-semibold text-slate-800 dark:text-white">Modo Escuro</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
            Menos cansaço visual à noite
          </span>
          {selected === 'dark' && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </button>

        {/* Light option */}
        <button
          type="button"
          onClick={() => setSelected('light')}
          className={`relative p-4 rounded-xl border-2 transition-all text-center
            ${selected === 'light'
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-md shadow-amber-500/10'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
        >
          <Sun size={28} className="mx-auto mb-2 text-amber-500" />
          <span className="block text-sm font-semibold text-slate-800 dark:text-white">Modo Claro</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mais clareza durante o dia
          </span>
          {selected === 'light' && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={saving}
        className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white shadow-lg
          bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
          transition-all hover:shadow-xl active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Salvando...' : 'Salvar preferência →'}
      </button>
    </div>
  );
}

// ─── Tour Steps ─────────────────────────────────────────────────────────────

function TourLayout({ icon: Icon, iconColor, title, text, children }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md"
        style={{ background: `linear-gradient(135deg, ${iconColor}20, ${iconColor}10)` }}
      >
        <Icon size={30} style={{ color: iconColor }} strokeWidth={1.8} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mb-5">
        {text}
      </p>
      {children}
    </div>
  );
}

function StepTourMaterias() {
  return (
    <TourLayout
      icon={BookOpen}
      iconColor="#6366f1"
      title="Organize por Matérias"
      text="Crie matérias como 'Neurológico', 'Ortopédico', 'Cardiorrespiratório'. Cada matéria agrupa seus resumos e flashcards. É a base de tudo."
    >
      {/* Mockup: 3 materia cards */}
      <div className="flex gap-2 w-full max-w-xs">
        {[
          { name: 'Neurológico', color: '#6366f1' },
          { name: 'Ortopédico', color: '#0d9488' },
          { name: 'Cardio', color: '#f59e0b' },
        ].map((m) => (
          <div
            key={m.name}
            className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          >
            <div className="w-6 h-6 rounded-lg mb-2" style={{ backgroundColor: m.color }} />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{m.name}</span>
          </div>
        ))}
      </div>
    </TourLayout>
  );
}

function StepTourFlashcards() {
  return (
    <TourLayout
      icon={CreditCard}
      iconColor="#f59e0b"
      title="Flashcards com Revisão Inteligente"
      text="Crie flashcards e o sistema SM-2 agenda automaticamente quando revisar cada um. Você só estuda o que está prestes a esquecer — nada de tempo perdido."
    >
      {/* Mockup: flashcard */}
      <div className="w-full max-w-xs">
        <div className="relative rounded-xl border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">Neurológico</div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Qual nervo é responsável pela inervação do músculo deltóide?
          </p>
          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">Nervo axilar (C5-C6)</p>
          </div>
        </div>
      </div>
    </TourLayout>
  );
}

function StepTourResumos() {
  return (
    <TourLayout
      icon={FileText}
      iconColor="#0d9488"
      title="Resumos Ricos"
      text="Escreva resumos com formatação completa — títulos, listas, destaques. Conecte ao Kaka para gerar flashcards automaticamente a partir do seu resumo."
    />
  );
}

function StepTourKaka() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-5">
        <KakaAvatar size="lg" speaking showStatus />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        Conheça o Kaka, seu agente de IA
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mb-5">
        O Kaka não é um chatbot comum. Ele conhece seu histórico, cria flashcards e resumos
        por você, agenda revisões e responde dúvidas clínicas.
      </p>
      {/* FAB mockup */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488, #0891b2)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <MessageCircle size={18} color="#fff" />
        </motion.div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Acesse pelo botão flutuante no canto inferior direito
        </span>
      </div>
    </div>
  );
}

function StepTourAgenda() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #6366f120, #6366f110)' }}
        >
          <Calendar size={28} className="text-indigo-500" strokeWidth={1.8} />
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #f59e0b20, #f59e0b10)' }}
        >
          <Flame size={28} className="text-amber-500" strokeWidth={1.8} />
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        Agenda e Sequência de Estudos
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mb-5">
        Agende provas e revisões na sua agenda. Mantenha sua sequência diária — cada dia
        estudado alimenta seu streak. Consistência é o que separa quem passa de quem não passa.
      </p>

      {/* Streak mockup */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <div key={d} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
            ${d <= 5
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            {d <= 5 ? '🔥' : d}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepConclusion({ nome, finishing, onFinish }) {
  return (
    <div className="flex flex-col items-center text-center relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 24 }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center mb-5 shadow-xl"
      >
        <Trophy size={36} color="#fff" strokeWidth={1.5} />
      </motion.div>

      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        Tudo pronto, {nome}! 🚀
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mb-6">
        Sua conta está configurada. Comece criando sua primeira matéria ou perguntando algo ao Kaka.
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
        <button
          type="button"
          onClick={() => onFinish('materias')}
          disabled={finishing}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg
            bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
            transition-all hover:shadow-xl active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <BookOpen size={16} />
          Criar primeira matéria
        </button>

        <button
          type="button"
          onClick={() => onFinish('kaka')}
          disabled={finishing}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-md
            bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800
            hover:bg-teal-100 dark:hover:bg-teal-950/60 transition-all active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <MessageCircle size={16} />
          Falar com o Kaka
        </button>
      </div>

      <button
        type="button"
        onClick={() => onFinish('explore')}
        disabled={finishing}
        className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600
          dark:hover:text-slate-300 transition-colors disabled:opacity-50"
      >
        <Compass size={13} />
        Explorar por conta própria
      </button>
    </div>
  );
}
