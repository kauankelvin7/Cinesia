/**
 * 👤 PROFILE MODAL - Edição de Perfil do Usuário
 * 
 * Modal premium com seções organizadas:
 * - Foto de perfil (upload via Cloudinary)
 * - Dados Pessoais (nome + email)
 * - Preferências (tema + acessibilidade)
 * - Informações da conta
 * 
 * Integrado com Firebase Auth updateProfile
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { uploadImage } from '../services/cloudinaryService';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';
import Button from './ui/Button';
import { Input } from './ui/Input';
import FontSizeControl from './FontSizeControl';
import { hapticSuccess, hapticError } from '../utils/haptics';
import { 
  X, 
  User, 
  Mail, 
  Check, 
  Loader2,
  Camera,
  Type,
  Eye,
  Shield,
  Calendar,
  Sun,
  Moon,
  Monitor,
  Palette,
  Settings2,
  Sparkles,
  ImagePlus,
  Trash2,
} from 'lucide-react';

/* ─── Section wrapper ─── */
const Section = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
        <Icon size={13} className="text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

/* Max file size: 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const { mode, setMode, isDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  const [displayName, setDisplayName] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoPreview(user.photoURL || null);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) { setSuccess(false); setError(null); setPhotoFile(null); setDragOver(false); }
  }, [isOpen]);

  /* ─── Photo handling ─── */
  const handlePhotoSelect = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida (JPG, PNG, etc.)');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande. Máximo: 5MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoSelect(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoSelect(file);
  }, [handlePhotoSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!displayName.trim()) { setError('Por favor, digite um nome.'); return; }
    setLoading(true);
    setError(null);

    try {
      let photoURL = user?.photoURL || null;

      // Upload new photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          const uploadResult = await uploadImage(photoFile);
          photoURL = uploadResult;
        } catch (uploadErr) {
          console.error('Erro no upload da foto:', uploadErr);
          toast.error('Não foi possível enviar a foto. Salvando sem ela.');
        } finally {
          setUploadingPhoto(false);
        }
      } else if (!photoPreview && user?.photoURL) {
        // User removed photo
        photoURL = '';
      }

      await updateProfile(auth.currentUser, { 
        displayName: displayName.trim(),
        photoURL: photoURL || '',
      });

      if (setUser) {
        const updatedUser = { 
          ...user, 
          nome: displayName.trim(), 
          displayName: displayName.trim(),
          photoURL: photoURL || '',
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      hapticSuccess();
      setSuccess(true);
      toast.success('Perfil atualizado! ✨');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      hapticError();
      setError('Ops, não conseguimos salvar. Tente novamente.');
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (displayName) return displayName[0]?.toUpperCase();
    if (user?.email) return user.email[0]?.toUpperCase();
    return 'U';
  };

  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const themeOptions = [
    { key: 'light',  icon: Sun,     label: 'Claro' },
    { key: 'dark',   icon: Moon,    label: 'Escuro' },
    { key: 'system', icon: Monitor, label: 'Sistema' },
  ];

  const hasPhotoChange = (photoFile !== null) || (!photoPreview && user?.photoURL);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-1000 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[3px]" onClick={onClose} />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }}
            exit={{ opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.2 } }}
          >
            {/* ─── Header with Photo Upload ─── */}
            <div
              className={`relative bg-linear-to-br from-primary-600 to-primary-700 px-6 py-7 text-center shrink-0 transition-colors ${dragOver ? 'ring-4 ring-inset ring-white/40' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <button
                onClick={onClose}
                aria-label="Fechar perfil"
                className="absolute top-3.5 right-3.5 p-1.5 bg-white/15 hover:bg-white/25 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />

              <motion.div
                className="relative inline-block"
                animate={{ scale: success ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Avatar */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative w-20 h-20 mx-auto rounded-full border-[3px] border-white/30 ring-4 ring-white/10 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 transition-all"
                  title="Clique para alterar sua foto"
                  disabled={loading || success}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/15 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{getInitials()}</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Uploading spinner */}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </button>

                {/* Camera badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 hover:bg-primary-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-colors"
                  title="Alterar foto"
                  disabled={loading || success}
                >
                  {success ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-white" />
                  )}
                </button>

                {/* Remove photo button */}
                {photoPreview && !success && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -bottom-1 -left-1 w-7 h-7 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-colors"
                    title="Remover foto"
                    disabled={loading}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </motion.div>

              <h2 id="profile-modal-title" className="mt-3 text-lg font-bold text-white">Meu Perfil</h2>
              <p className="text-white/70 text-xs mt-0.5">
                {dragOver ? 'Solte a imagem aqui!' : 'Toque na foto para alterar'}
              </p>
            </div>

            {/* ─── Scrollable Content ─── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Seção: Dados Pessoais */}
              <Section icon={User} title="Dados Pessoais">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Nome de exibição</label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Dr. João, Maria, Prof. Silva..."
                      leftIcon={User}
                      disabled={loading || success}
                      className="py-3 h-auto"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-500 mb-1.5 block">Email</label>
                    <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <Mail size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email || '—'}</span>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Seção: Aparência */}
              <Section icon={Palette} title="Aparência">
                <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
                  {themeOptions.map(({ key, icon: ThIcon, label }) => {
                    const active = mode === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setMode(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          active
                            ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-300 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <ThIcon size={13} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Seção: Acessibilidade */}
              <Section icon={Eye} title="Acessibilidade">
                <FontSizeControl />
              </Section>

              {/* Seção: Conta */}
              {createdAt && (
                <Section icon={Shield} title="Informações da Conta">
                  <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <Calendar size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Membro desde</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{createdAt}</p>
                    </div>
                  </div>
                </Section>
              )}

              {/* Mensagens de erro/sucesso */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 rounded-xl text-red-600 dark:text-red-400 text-xs"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    Perfil atualizado com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Footer ─── */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0 bg-slate-50/80 dark:bg-slate-800/80">
              <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSave}
                loading={loading}
                disabled={success}
                leftIcon={success ? <Check className="w-4 h-4" /> : null}
              >
                {success ? 'Salvo!' : 'Salvar'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
