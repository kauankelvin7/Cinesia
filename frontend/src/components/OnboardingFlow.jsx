import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CreditCard, FileText, Calendar, Flame, Rocket,
  ChevronLeft, ChevronRight, Sun, Moon, Trophy, Sparkles,
  ArrowRight, MessageCircle, Compass, User, Zap, Dna
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
  enter: (direction) => ({ x: direction > 0 ? 400 : -400, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ x: direction > 0 ? -400 : 400, opacity: 0, scale: 0.95 }),
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

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop Refinado (Mais desfoque, cor mais elegante) */}
        <motion.div
          className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal container - Efeito Glassmorphism */}
        <motion.div
          className="relative w-full max-w-[520px] max-h-[90vh] overflow-hidden rounded-[24px] border shadow-2xl
            bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20 dark:border-slate-700/60 flex flex-col"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800/80">
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: 'linear-gradient(90deg, #6366f1, #0d9488)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Content area */}
          <div className="relative overflow-hidden flex-1" style={{ minHeight: 440 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-10"
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
          <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
            {/* Back button */}
            <div className="w-24">
              {step > 1 && step < TOTAL_STEPS && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                  Voltar
                </button>
              )}
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 flex-1">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-500 ${
                    i + 1 === step
                      ? 'w-6 h-2 bg-gradient-to-r from-indigo-500 to-teal-500 shadow-sm'
                      : i + 1 < step
                        ? 'w-2 h-2 bg-indigo-400/80'
                        : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Skip / Next for tour steps */}
            <div className="w-24 flex justify-end">
              {isSkippable && (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={skipTour}
                    className="hidden sm:block text-[13px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors whitespace-nowrap"
                  >
                    Pular tour
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
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
    <div className="flex flex-col items-center text-center w-full">
      {/* Animated ring + icon */}
      <div className="relative mb-8">
        <motion.div
          className="w-24 h-24 rounded-[24px] flex items-center justify-center shadow-xl relative z-10"
          style={{ background: 'linear-gradient(135deg, #6366f1, #0d9488)' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles size={44} color="#fff" strokeWidth={1.5} />
        </motion.div>
        {/* Glow effect behind */}
        <motion.div
          className="absolute inset-0 rounded-[24px] bg-indigo-500 blur-xl opacity-40"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent mb-3 tracking-tight"
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        Cinesia
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium mb-8">
        Seu parceiro premium de estudos em Fisioterapia
      </p>

      <p className="text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-sm text-[15px]">
        Seja bem-vindo(a)! Vamos configurar sua plataforma em menos de 1 minuto para a melhor experiência.
      </p>

      <button
        type="button"
        onClick={onNext}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg flex items-center justify-center gap-2
          bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
          transition-all hover:shadow-indigo-500/25 active:scale-[0.98]"
      >
        Começar <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function StepName({ nome, setNome, nomeError, saving, onConfirm }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
        <span className="text-4xl">👋</span>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
        Como podemos te chamar?
      </h2>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        Esse nome será usado pelo Kaka e no seu painel principal.
      </p>

      <div className="w-full max-w-sm mb-8 relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <User size={20} />
        </div>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome ou apelido"
          maxLength={30}
          className="w-full pl-12 pr-4 h-14 rounded-2xl text-[16px] font-semibold
            border-2 border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-900 text-slate-800 dark:text-white
            focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10
            placeholder:text-slate-400 transition-all shadow-sm"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
        />
        <div className="flex justify-between mt-2 px-2">
          {nomeError ? (
            <span className="text-[12px] font-medium text-red-500">{nomeError}</span>
          ) : (
            <span className="text-[12px] font-medium text-slate-400">{nome.length}/30 caracteres</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={saving || nome.trim().length < 2}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg flex items-center justify-center gap-2
          bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
          transition-all hover:shadow-indigo-500/25 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Salvando...' : 'Continuar'} <ArrowRight size={18} />
      </button>
    </div>
  );
}

function StepTheme({ selected, setSelected, saving, onConfirm }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
        Como prefere estudar?
      </h2>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8">
        Escolha o tema que cansa menos a sua vista.
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-[360px] mb-10">
        {/* Dark option */}
        <button
          type="button"
          onClick={() => setSelected('dark')}
          className={`relative p-5 rounded-3xl border-2 transition-all text-center flex flex-col items-center group
            ${selected === 'dark'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/15'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${selected === 'dark' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500'}`}>
            <Moon size={24} strokeWidth={2} />
          </div>
          <span className="block text-[15px] font-bold text-slate-800 dark:text-white mb-1">Modo Escuro</span>
          <span className="block text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Ideal para focar à noite
          </span>
          {selected === 'dark' && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </button>

        {/* Light option */}
        <button
          type="button"
          onClick={() => setSelected('light')}
          className={`relative p-5 rounded-3xl border-2 transition-all text-center flex flex-col items-center group
            ${selected === 'light'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 shadow-lg shadow-amber-500/15'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
            }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${selected === 'light' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-amber-500'}`}>
            <Sun size={24} strokeWidth={2} />
          </div>
          <span className="block text-[15px] font-bold text-slate-800 dark:text-white mb-1">Modo Claro</span>
          <span className="block text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Mais energia durante o dia
          </span>
          {selected === 'light' && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={saving}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg flex items-center justify-center gap-2
          bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
          transition-all hover:shadow-indigo-500/25 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Salvando...' : 'Avançar'} <ArrowRight size={18} />
      </button>
    </div>
  );
}

// ─── Tour Steps ─────────────────────────────────────────────────────────────

function TourLayout({ icon: Icon, iconColor, title, text, children }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg relative z-10 border border-white/20 dark:border-white/5"
          style={{ background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)` }}
        >
          <Icon size={36} color="#fff" strokeWidth={1.8} />
        </div>
        {/* Glow subjacente */}
        <div 
          className="absolute inset-0 blur-xl opacity-40 rounded-3xl" 
          style={{ backgroundColor: iconColor }} 
        />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%] mb-8">
        {text}
      </p>
      
      <div className="w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}

function StepTourMaterias() {
  return (
    <TourLayout
      icon={BookOpen}
      iconColor="#6366f1"
      title="Organize por Matérias"
      text="Crie pastas como 'Neurologia' ou 'Anatomia'. Tudo o que você produzir ficará perfeitamente categorizado dentro delas."
    >
      {/* Mockup Premium: 3 materia cards estilo SectionCard */}
      <div className="flex flex-col w-full max-w-[320px] gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
        {[
          { name: 'Neurologia', color: '#6366f1', count: 12 },
          { name: 'Ortopedia', color: '#0d9488', count: 8 },
          { name: 'Anatomia', color: '#f59e0b', count: 24 },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
              {m.name.charAt(0)}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{m.name}</p>
              <p className="text-[11px] font-medium text-slate-400">{m.count} itens salvos</p>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
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
      title="Revisão Inteligente"
      text="Nosso algoritmo SM-2 agenda a revisão exata de cada flashcard. Você estuda apenas o que o seu cérebro está prestes a esquecer."
    >
      {/* Mockup Premium: Flashcard 3D effect */}
      <div className="relative w-full max-w-[320px] h-[160px] flex items-center justify-center mt-2">
        {/* Card Traseiro (Stack effect) */}
        <div className="absolute top-4 left-4 right-4 bottom-[-16px] rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 transform rotate-[-2deg] scale-[0.92]" />
        <div className="absolute top-2 left-2 right-2 bottom-[-8px] rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 transform rotate-[1deg] scale-[0.96]" />
        
        {/* Card Principal */}
        <div className="relative z-10 w-full h-full rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-lg p-5 flex flex-col text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center justify-between">
            Neurologia <Sparkles size={12} />
          </div>
          <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100 mb-4 leading-snug">
            Qual nervo é responsável pela inervação primária do músculo deltóide?
          </p>
          <div className="mt-auto border-t border-dashed border-slate-200 dark:border-slate-700 pt-3">
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 blur-sm select-none">
              Nervo axilar (C5-C6)
            </p>
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
      title="Resumos Poderosos"
      text="Crie resumos completos no editor e peça para nossa IA gerar dezenas de flashcards automaticamente a partir do seu texto."
    >
      {/* Mockup Premium: Rich Text Editor */}
      <div className="w-full max-w-[320px] bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-4 text-left">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
          <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="ml-auto flex items-center gap-1 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded text-[10px] font-bold text-teal-600 dark:text-teal-400">
            <Zap size={10} /> Gerar Cards
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="w-3/4 h-3 rounded bg-slate-300 dark:bg-slate-600" />
          <div className="w-full h-2 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="w-full h-2 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="w-5/6 h-2 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="w-1/2 h-2 rounded bg-slate-100 dark:bg-slate-700 mt-2" />
        </div>
      </div>
    </TourLayout>
  );
}

function StepTourKaka() {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="relative mb-6 flex justify-center">
        <KakaAvatar size="lg" speaking showStatus />
        <motion.div 
          className="absolute -right-4 -top-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl rounded-bl-none shadow-md border border-slate-100 dark:border-slate-700"
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <span className="text-[12px] font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Oi, eu sou o Kaka!</span>
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
        Seu Agente Pessoal
      </h2>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%] mb-8">
        Ele tira dúvidas de fisioterapia, cria cards pra você e acompanha seu progresso em tempo real.
      </p>

      {/* FAB mockup animado */}
      <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-inner">
        <motion.div
          className="w-12 h-12 rounded-[16px] flex items-center justify-center shadow-md relative"
          style={{ background: 'linear-gradient(135deg, #0f766e, #0891b2)' }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Dna size={22} color="#fff" strokeWidth={1.8} />
        </motion.div>
        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 text-left leading-tight">
          Clique no ícone flutuante<br/>para abrir o chat a qualquer hora
        </span>
      </div>
    </div>
  );
}

function StepTourAgenda() {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="flex items-center gap-4 mb-8 relative">
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shadow-lg border border-indigo-100 dark:border-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', backgroundColor: 'transparent' }}
        >
          <Calendar size={30} className="text-indigo-600" strokeWidth={2} />
        </div>
        <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shadow-lg border border-orange-100 dark:border-orange-500/20"
          style={{ background: 'linear-gradient(135deg, #fffbeb, #ffedd5)', backgroundColor: 'transparent' }}
        >
          <Flame size={32} className="text-orange-500" strokeWidth={2} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
        Mantenha a Sequência
      </h2>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%] mb-8">
        Cada dia que você estuda acende seu fogo de sequência (Streak). A consistência é o maior segredo para a aprovação.
      </p>

      {/* Streak mockup premium */}
      <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 w-full max-w-[320px]">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const isActive = d <= 5;
          const isToday = d === 5;
          return (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <div 
                className={`w-8 h-10 rounded-[10px] flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-gradient-to-b from-orange-400 to-orange-500 shadow-md shadow-orange-500/20' 
                    : 'bg-slate-200 dark:bg-slate-700'
                } ${isToday ? 'scale-110 border-2 border-white dark:border-slate-800' : ''}`}
              >
                {isActive && <Flame size={16} color="#fff" strokeWidth={2.5} />}
              </div>
              <span className="text-[10px] font-bold text-slate-400">D{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepConclusion({ nome, finishing, onFinish }) {
  return (
    <div className="flex flex-col items-center text-center relative overflow-hidden w-full h-full justify-center">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center mb-6 shadow-2xl border-4 border-white/20 dark:border-slate-800"
      >
        <Trophy size={44} color="#fff" strokeWidth={1.5} />
      </motion.div>

      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Tudo pronto, {nome}! 🚀
      </h2>
      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[85%] mb-10">
        A plataforma foi ajustada para você. Chegou a hora de transformar seus estudos.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[360px]">
        <button
          type="button"
          onClick={() => onFinish('materias')}
          disabled={finishing}
          className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-lg
            bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600
            transition-all hover:shadow-indigo-500/25 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed text-[14px]"
        >
          <BookOpen size={18} strokeWidth={2} />
          Criar Matéria
        </button>

        <button
          type="button"
          onClick={() => onFinish('kaka')}
          disabled={finishing}
          className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold shadow-sm
            bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-2 border-teal-100 dark:border-teal-800/50
            hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed text-[14px]"
        >
          <MessageCircle size={18} strokeWidth={2} />
          Falar com Kaka
        </button>
      </div>

      <button
        type="button"
        onClick={() => onFinish('explore')}
        disabled={finishing}
        className="mt-6 flex items-center justify-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600
          dark:hover:text-slate-300 transition-colors disabled:opacity-50"
      >
        <Compass size={15} />
        Explorar o painel principal
      </button>
    </div>
  );
}