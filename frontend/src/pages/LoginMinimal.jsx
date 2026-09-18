import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext-firebase';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

const LIMITS = {
  nome: 50,
  email: 100,
  password: 64,
};

const highlights = [
  'Revisões e flashcards no mesmo fluxo',
  'Simulados com histórico de desempenho',
  'Atlas 3D, quadro branco e KakaBot',
];

const LoginMinimal = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (value.length > LIMITS[name]) return;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const nome = formData.nome.trim();
    const email = formData.email.trim();

    if (!isLogin && nome.length < 3) {
      setError('Use pelo menos 3 caracteres no nome.');
      return;
    }

    if (!email) {
      setError('Informe seu email para continuar.');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, formData.password)
        : await register(nome, email, formData.password);

      if (!result.success) {
        setError(result.error || 'Não consegui concluir o acesso. Confira os dados e tente de novo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || 'Não consegui entrar com o Google. Tente de novo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((current) => !current);
    setFormData({ nome: '', email: '', password: '' });
    setError('');
    setShowPassword(false);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(360px,0.9fr)_minmax(480px,1.1fr)]">
        <section
          className="relative hidden overflow-hidden border-r border-white/10 bg-slate-950 px-12 py-16 lg:flex lg:flex-col lg:justify-between"
          aria-label="Sobre o Cinesia"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
              maskImage: 'linear-gradient(to bottom, black, transparent 92%)',
            }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 text-white">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Logo size="small" iconOnly />
              </div>
              <span className="text-sm font-semibold tracking-tight">Cinesia</span>
            </div>
          </div>

          <div className="relative z-10 max-w-lg">
            <p className="mb-5 text-sm font-medium text-teal-300">
              Seu espaço de estudo
            </p>

            <h1 className="max-w-md text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white xl:text-5xl">
              Estude sem espalhar tudo em cinco lugares.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Matérias, resumos, flashcards, simulados e ferramentas de apoio ficam juntos para você continuar de onde parou.
            </p>

            <ul className="mt-9 space-y-3" aria-label="Recursos do Cinesia">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={17} className="shrink-0 text-teal-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-slate-600">
            Feito para a rotina de estudos em Fisioterapia.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <motion.div
            className="w-full max-w-[420px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="mb-9 lg:hidden">
              <div className="mb-7 grid h-12 w-12 place-items-center rounded-xl bg-slate-950 dark:bg-white">
                <Logo size="small" iconOnly />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">
                {isLogin ? 'Entrar no Cinesia' : 'Criar sua conta'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {isLogin
                  ? 'Continue de onde parou.'
                  : 'Preencha seus dados e comece a organizar os estudos.'}
              </p>
            </div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  role="alert"
                  className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar com Google
            </button>

            <div className="my-7 flex items-center gap-4" aria-hidden="true">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs text-slate-400">ou com email</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  label="Nome"
                  type="text"
                  name="nome"
                  autoComplete="name"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Como você quer ser chamado?"
                  leftIcon={UserRound}
                  required
                  maxLength={LIMITS.nome}
                />
              )}

              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="voce@exemplo.com"
                leftIcon={Mail}
                required
                maxLength={LIMITS.email}
              />

              <div className="relative">
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo de 6 caracteres"
                  leftIcon={Lock}
                  required
                  maxLength={LIMITS.password}
                  className="pr-11 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-[31px] grid h-9 w-9 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {showPassword
                    ? <EyeOff size={18} aria-hidden="true" />
                    : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                loadingLabel={isLogin ? 'Entrando…' : 'Criando conta…'}
                disabled={loading}
                className="mt-2"
              >
                {isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? 'Primeira vez no Cinesia?' : 'Já tem uma conta?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
              >
                {isLogin ? 'Criar conta' : 'Entrar'}
              </button>
            </p>

            <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-600">
              Cinesia · Seu estudo continua daqui.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
};

export default LoginMinimal;
