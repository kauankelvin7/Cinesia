import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { Mail, Lock, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

const LoginMinimal = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      if (!formData.nome.trim()) {
        setError('Por favor, informe seu nome.');
        setLoading(false);
        return;
      }
      result = await register(formData.nome, formData.email, formData.password);
    }

    if (!result.success) {
      setError(result.error || 'Hmm, algo deu errado. Verifique seus dados e tente novamente.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || 'Não conseguimos conectar com o Google. Tente novamente em instantes.');
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ nome: '', email: '', password: '' });
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900 transition-colors">
      {/* Left Panel — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 items-center justify-center p-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary-400/20 blur-3xl" />
        
        <div className="relative z-10 max-w-md text-center">
          {/* Logo icon large */}
          <div className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
              <circle cx="24" cy="12" r="4" fill="white"/>
              <path d="M24 18 C24 22, 22 28, 24 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M16 22 Q20 20, 24 21 Q28 20, 32 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M22 32 L18 40" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M26 32 L30 40" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M32 16 Q36 20, 34 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
            </svg>
          </div>
          
          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 font-heading">
            Estude Fisioterapia<br/>de forma inteligente
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Flashcards, simulados, resumos e muito mais — tudo em um só lugar para você se preparar melhor.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Flashcards', 'Simulados', 'Resumos', 'Consulta Rápida'].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-8 overflow-y-auto">
        <motion.div 
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-10 lg:mb-8">
            <div className="flex justify-center mb-5 lg:hidden">
              <Logo size="medium" iconOnly />
            </div>
            <h1 className="text-2xl sm:text-[1.75rem] font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight font-heading">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? 'Entre para continuar seus estudos' : 'Comece a estudar gratuitamente'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div 
              className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm mb-6 flex items-center gap-2.5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </motion.div>
          )}

          {/* Google Button (top) */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[10px] text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 border-b border-slate-200 dark:border-slate-700" />
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">ou</span>
            <div className="flex-1 border-b border-slate-200 dark:border-slate-700" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <Input
                label="Nome"
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
                leftIcon={UserRound}
                required={!isLogin}
              />
            )}

            <Input
              label="Email"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="voce@email.com"
              leftIcon={Mail}
              required
            />

            <Input
              label="Senha"
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              leftIcon={Lock}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
              className="mt-1"
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              {' '}
              <button onClick={toggleMode} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline transition-colors bg-transparent border-none cursor-pointer p-0">
                {isLogin ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-300 dark:text-slate-600">
            © 2026 Cinesia · Sistema de Estudos para Fisioterapia
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginMinimal;
