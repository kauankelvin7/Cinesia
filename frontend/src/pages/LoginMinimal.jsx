import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { Mail, Lock, UserRound, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

const LoginMinimal = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🛡️ Limites de caracteres para evitar flood
  const LIMITS = {
    nome: 50,
    email: 100,
    password: 64
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Bloqueia entrada acima do limite
    if (value.length > LIMITS[name]) return;

    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações básicas antes de enviar ao Firebase
    if (!isLogin && formData.nome.trim().length < 3) {
      setError('O nome deve ter pelo menos 3 caracteres.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

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
      // Mapeamento de erros comuns para mensagens amigáveis
      const errorMap = {
        'auth/user-not-found': 'Usuário não encontrado. Verifique seu email.',
        'auth/wrong-password': 'Senha incorreta. Tente novamente.',
        'auth/email-already-in-use': 'Este email já está sendo usado.',
        'auth/invalid-email': 'O formato do email não é válido.'
      };
      setError(errorMap[result.code] || result.error || 'Algo deu errado. Tente novamente.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || 'Não conseguimos conectar com o Google.');
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ nome: '', email: '', password: '' });
    setError('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors">
      
      {/* ─── PAINEL ESQUERDO (Apenas Desktop) ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative items-center justify-center p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #0d2540 35%, #0a3040 65%, #083c3c 100%)' }}>
        
        {/* Orbes Decorativas (Glow Premium) */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-md text-center">
          <motion.div 
            className="mx-auto mb-10 w-24 h-24 rounded-[24px] bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Logo size="large" iconOnly />
          </motion.div>
          
          <motion.h2 
            className="text-4xl xl:text-5xl font-black text-white mb-6 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            A evolução do seu <br/> <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">estudo clínico</span>.
          </motion.h2>
          
          <motion.p 
            className="text-slate-400 text-lg leading-relaxed mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Uma plataforma completa para dominar a Fisioterapia com auxílio de Inteligência Artificial.
          </motion.p>

          {/* Badges de Feature */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {['Atlas 3D', 'Simulados IA', 'Flashcards', 'Kaka Agent'].map((f) => (
              <span key={f} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-white/70 text-xs font-bold uppercase tracking-widest">
                {f}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── PAINEL DIREITO (Formulário) ─── */}
      <div className="flex-1 flex items-center justify-center py-12 px-6 sm:px-12 overflow-y-auto">
        <motion.div 
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6 lg:hidden">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-indigo-500/10">
                <Logo size="medium" iconOnly />
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              {isLogin ? 'Fazer Login' : 'Criar Conta'}
            </h1>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400">
              {isLogin ? 'Que bom ver você de novo!' : 'Junte-se a milhares de estudantes.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3.5 text-red-600 dark:text-red-400 text-sm mb-6 flex items-start gap-3 shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Login Refinado */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-12 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-200 font-bold text-[14px] flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 shadow-sm"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com o Google
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Ou use seu email</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Input
                label="Nome Completo"
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Ana Silva"
                leftIcon={UserRound}
                required={!isLogin}
                maxLength={LIMITS.nome}
                className="h-12 bg-slate-50 dark:bg-slate-900"
              />
            )}

            <Input
              label="Endereço de Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              leftIcon={Mail}
              required
              maxLength={LIMITS.email}
              className="h-12 bg-slate-50 dark:bg-slate-900"
            />

            <div className="relative">
              <Input
                label="Sua Senha"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                leftIcon={Lock}
                required
                maxLength={LIMITS.password}
                className="h-12 bg-slate-50 dark:bg-slate-900 pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-[29.8px] text-slate-400 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              className="h-14 rounded-2xl bg-indigo-600 border-none font-bold text-[16px] shadow-lg shadow-indigo-500/20"
            >
              {isLogin ? 'Entrar no Sistema' : 'Criar Minha Conta'}
            </Button>
          </form>

          <div className="mt-8 text-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400">
              {isLogin ? 'Novo por aqui?' : 'Já é membro?'}
              {' '}
              <button 
                onClick={toggleMode} 
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors bg-transparent border-none cursor-pointer"
              >
                {isLogin ? 'Crie sua conta grátis' : 'Faça login agora'}
              </button>
            </p>
          </div>

          <p className="mt-10 text-center text-[11px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
            © 2026 Cinesia · Medical Precision
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const AlertTriangle = ({ size, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default LoginMinimal;