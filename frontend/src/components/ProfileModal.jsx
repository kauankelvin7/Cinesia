/**
 * 👤 PROFILE MODAL - Edição de Perfil do Usuário
 * 
 * Modal elegante para personalização do nome de exibição
 * Integrado com Firebase Auth updateProfile
 * 
 * Features:
 * - Edição do displayName
 * - Preview do avatar
 * - Animações suaves (Framer Motion)
 * - Design Glassmorphism Premium
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from './ui/Button';
import FontSizeControl from './FontSizeControl';
import { hapticSuccess, hapticError } from '../utils/haptics';
import { 
  X, 
  User, 
  Mail, 
  Sparkles, 
  Check, 
  Loader2,
  Camera,
  Type,
  Eye
} from 'lucide-react';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar com o nome atual
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user, isOpen]);

  // Reset estados quando fechar
  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Por favor, digite um nome.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Atualizar no Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });

      // Atualizar estado local (ambas as propriedades para compatibilidade)
      if (setUser) {
        const updatedUser = {
          ...user,
          nome: displayName.trim(),
          displayName: displayName.trim()
        };
        setUser(updatedUser);
        
        // Atualizar localStorage também
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Haptic feedback de sucesso
      hapticSuccess();
      setSuccess(true);
      
      // Fechar após 1.5s de sucesso
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      hapticError();
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Animações do modal
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  const getInitials = () => {
    if (displayName) return displayName[0]?.toUpperCase();
    if (user?.email) return user.email[0]?.toUpperCase();
    return 'U';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop com blur */}
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header com gradiente */}
            <div className="relative bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-8 text-center">
              {/* Botão fechar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Avatar Preview */}
              <motion.div
                className="relative inline-block"
                animate={{ scale: success ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center shadow-xl">
                  <span className="text-4xl font-bold text-white">
                    {getInitials()}
                  </span>
                </div>
                
                {/* Badge de sucesso */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <h2 className="mt-4 text-xl font-bold text-white">
                Seu Perfil
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Personalize como você quer ser chamado
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Campo de Nome */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  Como gostaria de ser chamado?
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Dr. João, Maria, Prof. Silva..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                    disabled={loading || success}
                  />
                </div>
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2">
                  <Mail className="w-4 h-4" />
                  Email (não editável)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Seção de Acessibilidade */}
              <div className="pt-4 border-t border-slate-200">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Eye className="w-4 h-4 text-teal-500" />
                  Acessibilidade
                </label>
                <FontSizeControl />
              </div>

              {/* Mensagens de erro/sucesso */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  >
                    <X className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Perfil atualizado com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSave}
                  loading={loading}
                  disabled={success}
                  leftIcon={success ? <Check className="w-5 h-5" /> : null}
                >
                  {success ? 'Salvo!' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                💡 O nome será exibido em todo o sistema para uma experiência personalizada
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
