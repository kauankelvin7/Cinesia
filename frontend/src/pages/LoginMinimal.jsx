import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { FcGoogle } from 'react-icons/fc';
import { MdEmail, MdLock, MdPerson } from 'react-icons/md';
import { motion } from 'framer-motion';
import './LoginMinimal.css';

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
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    const result = await loginWithGoogle();
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ nome: '', email: '', password: '' });
    setError('');
  };

  return (
    <div className="login-minimal-container">
      {/* Fundo Sutil */}
      <div className="login-minimal-background">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
      </div>

      {/* Card de Login */}
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo e Título */}
        <div className="login-header">
          <div className="login-logo">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Cinesia Logo" 
              className="logo-image"
            />
          </div>
          <h1 className="login-title">Cinesia</h1>
          <p className="login-subtitle">Sistema de Estudos para Fisioterapia</p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="nome" className="input-label">Nome</label>
              <div className="input-wrapper">
                <MdPerson className="input-icon" />
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome"
                  className="input-field"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email" className="input-label">Email</label>
            <div className="input-wrapper">
              <MdEmail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Senha</label>
            <div className="input-wrapper">
              <MdLock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Botão Principal */}
          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </motion.button>

          {/* Divisor */}
          <div className="divider">
            <span>ou</span>
          </div>

          {/* Botão Google */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            className="btn-google"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <FcGoogle className="google-icon" />
            <span>Continuar com Google</span>
          </motion.button>
        </form>

        {/* Toggle Login/Registro */}
        <div className="toggle-mode">
          <p>
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            {' '}
            <button onClick={toggleMode} className="toggle-link">
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* Rodapé */}
      <div className="login-footer">
        <p>© 2026 Cinesia - Sistema de Estudos para Fisioterapia</p>
      </div>
    </div>
  );
};

export default LoginMinimal;
