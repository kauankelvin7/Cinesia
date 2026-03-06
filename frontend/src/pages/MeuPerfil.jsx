/**
 * 👤 MEU PERFIL — Página de Perfil do Usuário com Upload de Foto
 *
 * Features:
 * - Upload de foto de perfil para Firebase Storage
 * - Preview da imagem com crop circular
 * - Salva downloadURL no Firestore + Auth updateProfile
 * - Remoção de foto
 * - Limites: 2MB, .jpg/.png/.webp
 * - photoURL propagada via AuthContext
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera,
  Upload,
  Trash2,
  Save,
  UserCircle2,
  Image as ImageIcon,
  Loader2,
  X,
  CheckCircle2,
  Calendar,
  Mail,
  Shield,
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MeuPerfil() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [memberSince, setMemberSince] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || user.nome || '');
    setPhotoURL(user.photoURL || null);

    // Member since
    const creationTime = auth.currentUser?.metadata?.creationTime;
    if (creationTime) setMemberSince(new Date(creationTime));
  }, [user]);

  // File validation
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande. Limite: 2MB.');
      return false;
    }
    return true;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  // Drag & Drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  }, []);

  // Upload photo
  const handleUploadPhoto = async () => {
    if (!selectedFile || !user?.uid) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}/avatar.${selectedFile.type.split('/')[1]}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Auth profile
      await updateProfile(auth.currentUser, { photoURL: downloadURL });

      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), { photoURL: downloadURL }, { merge: true });

      // Update local state
      setPhotoURL(downloadURL);
      setPreviewURL(null);
      setSelectedFile(null);

      if (setUser) {
        const updated = { ...user, photoURL: downloadURL };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }

      toast.success('Foto de perfil atualizada!');
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      toast.error('Erro ao fazer upload da foto.');
    } finally {
      setUploading(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    if (!user?.uid) return;
    setRemovingPhoto(true);
    try {
      // Delete from Storage (try common extensions)
      for (const ext of ['jpeg', 'png', 'webp', 'jpg']) {
        try {
          const storageRef = ref(storage, `profile-pictures/${user.uid}/avatar.${ext}`);
          await deleteObject(storageRef);
        } catch (e) { /* File may not exist */ }
      }

      // Update Auth profile
      await updateProfile(auth.currentUser, { photoURL: '' });

      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), { photoURL: null }, { merge: true });

      // Update local state
      setPhotoURL(null);
      setPreviewURL(null);
      setSelectedFile(null);

      if (setUser) {
        const updated = { ...user, photoURL: null };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }

      toast.success('Foto de perfil removida.');
    } catch (err) {
      console.error('Erro ao remover foto:', err);
      toast.error('Erro ao remover foto.');
    } finally {
      setRemovingPhoto(false);
    }
  };

  // Save display name
  const handleSaveName = async () => {
    if (!displayName.trim()) { toast.error('Digite um nome válido.'); return; }
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await setDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() }, { merge: true });

      if (setUser) {
        const updated = { ...user, displayName: displayName.trim(), nome: displayName.trim() };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
      toast.success('Nome atualizado!');
    } catch (err) {
      console.error('Erro ao atualizar nome:', err);
      toast.error('Erro ao atualizar nome.');
    } finally {
      setSavingName(false);
    }
  };

  const currentPhoto = previewURL || photoURL;
  const initials = (user?.displayName || user?.nome || user?.email || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
              <UserCircle2 size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Meu Perfil
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Gerencie sua foto e informações pessoais
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Photo Section ── */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                <Camera size={18} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Foto de Perfil</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG ou WebP — máximo 2MB</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary-100 dark:ring-primary-900/40 shadow-lg flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-950 dark:to-primary-900">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                    {initials}
                  </span>
                )}
              </div>
              {/* Overlay on hover */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera size={24} className="text-white" />
              </button>
            </div>

            <div className="flex-1 w-full">
              {/* Dropzone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                    : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-700 bg-slate-50 dark:bg-slate-700/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 size={20} className="text-green-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate max-w-[180px]">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => { setSelectedFile(null); setPreviewURL(null); }}
                      className="flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={24} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Arraste ou{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                      >
                        clique aqui
                      </button>
                    </p>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedFile && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUploadPhoto}
                    loading={uploading}
                    leftIcon={<Upload size={14} />}
                  >
                    Enviar Foto
                  </Button>
                )}
                {photoURL && !selectedFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    loading={removingPhoto}
                    leftIcon={<Trash2 size={14} />}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Remover Foto
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Info Section ── */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
                <Shield size={18} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Informações Pessoais</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Seus dados de perfil</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Nome de exibição</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome..."
                  disabled={savingName}
                  className="flex-1"
                />
                <Button variant="primary" size="md" onClick={handleSaveName} loading={savingName} leftIcon={<Save size={16} />}>
                  Salvar
                </Button>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Mail size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{user?.email}</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Para alterar o email, acesse as Configurações.
              </p>
            </div>

            {/* Provider */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Provedor de login</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Shield size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                  {auth.currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email e Senha'}
                </span>
              </div>
            </div>

            {/* Member Since */}
            {memberSince && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Membro desde</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {memberSince.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
