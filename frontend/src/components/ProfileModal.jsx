/**
 * 👤 PROFILE MODAL - Edição de Perfil do Usuário Premium
 * * Modal premium com seções organizadas e Glassmorphism.
 * Integrado com Firebase Auth + Cloudinary.
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

/* ─── Section wrapper Refinado ─── */
const Section = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center gap-2.5 px-1">
      <div className="w-8 h-8 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
        <Icon size={14} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
      </div>
      <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{title}</h3>
    </div>
    <div className="bg-slate-50/50 dark:bg-slate-900/20 rounded-[20px] p-4 border border-slate-100 dark:border-slate-800/50">
      {children}
    </div>
  </div>
);

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

  const handlePhotoSelect = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande (máx 5MB)');
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

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Digite seu nome para continuar.'); return; }
    setLoading(true);
    setError(null);

    try {
      let photoURL = user?.photoURL || null;

      if (photoFile) {
        setUploadingPhoto(true);
        try {
          photoURL = await uploadImage(photoFile);
        } catch (uploadErr) {
          toast.error('Erro ao enviar foto. Salvando dados básicos.');
        } finally {
          setUploadingPhoto(false);
        }
      } else if (!photoPreview && user?.photoURL) {
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
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      hapticError();
      setError('Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (displayName) return displayName[0]?.toUpperCase();
    return 'U';
  };

  const themeOptions = [
    { key: 'light',  icon: Sun,     label: 'Claro' },
    { key: 'dark',   icon: Moon,    label: 'Escuro' },
    { key: 'system', icon: Monitor, label: 'Auto' },
  ];

  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop Glass */}
          <motion.div 
            className="absolute inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-md" 
            onClick={onClose} 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20 dark:border-slate-800"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── Header: Photo Section Premium ─── */}
            <div
              className={`relative h-44 flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${
                dragOver ? 'bg-indigo-600' : 'bg-slate-900 dark:bg-slate-800'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* Background Orbs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-indigo-500 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-teal-500 rounded-full blur-3xl" />
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-20"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              <div className="relative z-10 group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center transition-all ${
                    dragOver ? 'ring-8 ring-white/20' : ''
                  }`}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-white">{getInitials()}</span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>

                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="text-white animate-spin" size={24} />
                    </div>
                  )}
                </motion.button>

                {/* Edit Badge */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg text-white pointer-events-none">
                  {success ? <Check size={14} strokeWidth={3} /> : <Camera size={14} strokeWidth={2.5} />}
                </div>

                {/* Remove Button */}
                {photoPreview && !success && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg text-white transition-transform hover:scale-110"
                  >
                    <Trash2 size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* ─── Scrollable Body ─── */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">
              
              {/* Seção: Identidade */}
              <Section icon={User} title="Identidade">
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Como você quer ser chamado?</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome ou apelido"
                      leftIcon={User}
                      disabled={loading || success}
                      className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold text-[15px]"
                    />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400 truncate">{user?.email || 'Sem email'}</span>
                  </div>
                </div>
              </Section>

              {/* Seção: Interface */}
              <Section icon={Palette} title="Customização">
                <div className="space-y-6">
                  <div className="relative flex p-1 bg-slate-200/50 dark:bg-slate-950/50 rounded-[14px] border border-slate-200/50 dark:border-slate-800">
                    {themeOptions.map(({ key, icon: ThIcon, label }) => {
                      const active = mode === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setMode(key)}
                          className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-bold transition-all duration-300 z-10 ${
                            active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-500'
                          }`}
                        >
                          {active && (
                            <motion.div 
                              layoutId="profileTheme"
                              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <ThIcon size={14} className="relative z-20" strokeWidth={2.5} />
                          <span className="relative z-20">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <FontSizeControl variant="compact" />
                  </div>
                </div>
              </Section>

              {/* Seção: Segurança e Datas */}
              {createdAt && (
                <Section icon={Shield} title="Segurança">
                  <div className="flex items-center gap-4 text-slate-500">
                    <Calendar size={18} className="text-slate-300 dark:text-slate-600" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Início da Jornada</p>
                      <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{createdAt}</p>
                    </div>
                  </div>
                </Section>
              )}

              {/* Feedback Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 text-[13px] font-bold flex items-center gap-2"
                  >
                    <AlertTriangle size={16} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Footer Premium ─── */}
            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 shrink-0">
              <Button variant="secondary" fullWidth onClick={onClose} disabled={loading} className="h-12 rounded-xl font-bold">
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSave}
                loading={loading}
                disabled={success}
                className={`h-12 rounded-xl font-bold border-none shadow-lg transition-all ${
                  success ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-500/20'
                }`}
                leftIcon={success ? <Check size={18} strokeWidth={3} /> : null}
              >
                {success ? 'Concluído!' : 'Salvar Mudanças'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AlertTriangle = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default ProfileModal;  