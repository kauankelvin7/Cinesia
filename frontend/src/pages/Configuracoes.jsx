/**
 * ⚙️ CONFIGURAÇÕES — Página de Configurações do Usuário
 * 
 * Seções:
 * - Conta (nome, email, senha)
 * - Aparência (tema persistido no Firestore)
 * - Notificações (toggle push)
 * - Zona de Perigo (excluir conta)
 *
 * Integrado com Firebase Auth + Firestore
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Settings,
  User,
  Mail,
  Lock,
  Palette,
  Bell,
  Sun,
  Moon,
  Monitor,
  Trash2,
  AlertTriangle,
  Save,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import FontSizeControl from '../components/FontSizeControl';

/* ─── Section wrapper ─── */
const Section = ({ icon: Icon, title, description, children, danger = false }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl border ${
    danger ? 'border-red-200 dark:border-red-900/60' : 'border-slate-200/60 dark:border-slate-700/60'
  } shadow-sm overflow-hidden`}>
    <div className={`px-6 py-4 border-b ${
      danger ? 'border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20' : 'border-slate-100 dark:border-slate-700/60'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          danger ? 'bg-red-100 dark:bg-red-900/40' : 'bg-primary-50 dark:bg-primary-950'
        }`}>
          <Icon size={18} className={danger ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'} />
        </div>
        <div>
          <h3 className={`text-sm font-bold ${danger ? 'text-red-900 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>{title}</h3>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
    </div>
    <div className="px-6 py-5 space-y-4">{children}</div>
  </div>
);

/* ─── Toggle component ─── */
const Toggle = ({ label, description, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange?.(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
        checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  </div>
);

export default function Configuracoes() {
  const { user, setUser, logout } = useAuth();
  const { mode, setMode } = useTheme();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordForPwd, setCurrentPasswordForPwd] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Loading states
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Load user preferences from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    setDisplayName(user.displayName || '');
    setNewEmail(user.email || '');

    const loadPrefs = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.preferences?.theme) {
            setMode(data.preferences.theme);
          }
          if (data.preferences?.notifications !== undefined) {
            setNotificationsEnabled(data.preferences.notifications);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar preferências:', err);
      }
    };
    loadPrefs();
  }, [user]);

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

  // Save email (requires reauthentication)
  const handleSaveEmail = async () => {
    if (!newEmail.trim()) { toast.error('Digite um email válido.'); return; }
    if (!currentPasswordForEmail) { toast.error('Digite sua senha atual para alterar o email.'); return; }
    setSavingEmail(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPasswordForEmail);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail.trim());
      await setDoc(doc(db, 'users', user.uid), { email: newEmail.trim() }, { merge: true });
      toast.success('Email atualizado!');
      setCurrentPasswordForEmail('');
    } catch (err) {
      console.error('Erro ao atualizar email:', err);
      if (err.code === 'auth/wrong-password') toast.error('Senha atual incorreta.');
      else if (err.code === 'auth/email-already-in-use') toast.error('Este email já está em uso.');
      else if (err.code === 'auth/requires-recent-login') toast.error('Por favor, faça login novamente para alterar o email.');
      else toast.error('Erro ao atualizar email.');
    } finally {
      setSavingEmail(false);
    }
  };

  // Save password
  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem.'); return; }
    if (!currentPasswordForPwd) { toast.error('Digite sua senha atual.'); return; }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPasswordForPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordForPwd('');
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      if (err.code === 'auth/wrong-password') toast.error('Senha atual incorreta.');
      else if (err.code === 'auth/requires-recent-login') toast.error('Por favor, faça login novamente para alterar a senha.');
      else toast.error('Erro ao atualizar senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Save theme preference to Firestore
  const handleThemeChange = async (newMode) => {
    setMode(newMode);
    if (!user?.uid) return;
    setSavingPrefs(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        preferences: { theme: newMode }
      }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar preferência de tema:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Save notifications preference
  const handleNotificationsToggle = async (enabled) => {
    setNotificationsEnabled(enabled);
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        preferences: { notifications: enabled }
      }, { merge: true });
      toast.success(enabled ? 'Notificações ativadas' : 'Notificações desativadas');
    } catch (err) {
      console.error('Erro ao salvar preferência de notificações:', err);
      toast.error('Erro ao salvar preferência');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') { toast.error('Digite "EXCLUIR" para confirmar.'); return; }
    setDeletingAccount(true);
    try {
      // Reauthenticate if provider is email/password
      if (deletePassword && user.email) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Delete Firestore data
      const collections = ['materias', 'resumos', 'flashcards'];
      for (const col of collections) {
        const q = collection(db, col);
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          if (d.data().uid === user.uid) batch.delete(d.ref);
        });
        await batch.commit();
      }

      // Delete user doc and subcollections
      const notifRef = collection(db, 'users', user.uid, 'notifications');
      const notifSnap = await getDocs(notifRef);
      const notifBatch = writeBatch(db);
      notifSnap.docs.forEach(d => notifBatch.delete(d.ref));
      await notifBatch.commit();
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete storage files
      try {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        const listResult = await listAll(storageRef);
        await Promise.all(listResult.items.map(item => deleteObject(item)));
      } catch (e) { /* Storage folder may not exist */ }

      try {
        const flashStorageRef = ref(storage, `flashcards/${user.uid}`);
        const flashList = await listAll(flashStorageRef);
        await Promise.all(flashList.items.map(item => deleteObject(item)));
      } catch (e) { /* May not exist */ }

      // Delete Firebase Auth user
      await deleteUser(auth.currentUser);
      toast.success('Conta excluída permanentemente.');
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      if (err.code === 'auth/requires-recent-login') {
        toast.error('Por favor, faça login novamente antes de excluir a conta.');
      } else {
        toast.error('Erro ao excluir conta. Tente novamente.');
      }
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const themeOptions = [
    { key: 'light', icon: Sun, label: 'Claro' },
    { key: 'dark', icon: Moon, label: 'Escuro' },
    { key: 'system', icon: Monitor, label: 'Sistema' },
  ];

  const isGoogleUser = auth.currentUser?.providerData?.some(p => p.providerId === 'google.com');

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center">
              <Settings size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Configurações
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Personalize sua experiência no Cinesia
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Conta ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Section icon={User} title="Conta" description="Gerencie seus dados pessoais">
            {/* Nome */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Nome de exibição</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome..."
                  leftIcon={User}
                  disabled={savingName}
                  className="flex-1"
                />
                <Button variant="primary" size="md" onClick={handleSaveName} loading={savingName} leftIcon={<Save size={16} />}>
                  Salvar
                </Button>
              </div>
            </div>

            {/* Email */}
            {!isGoogleUser && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Alterar email</label>
                <div className="space-y-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="novo@email.com"
                    leftIcon={Mail}
                    disabled={savingEmail}
                  />
                  <Input
                    type="password"
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    placeholder="Senha atual (para confirmar)"
                    leftIcon={Lock}
                    disabled={savingEmail}
                  />
                  <Button variant="secondary" size="sm" onClick={handleSaveEmail} loading={savingEmail} leftIcon={<Save size={14} />}>
                    Atualizar Email
                  </Button>
                </div>
              </div>
            )}

            {isGoogleUser && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Mail size={16} className="text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Email gerenciado pelo Google: <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>
                </p>
              </div>
            )}

            {/* Senha */}
            {!isGoogleUser && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Alterar senha</label>
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPasswords ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="space-y-2">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPasswordForPwd}
                    onChange={(e) => setCurrentPasswordForPwd(e.target.value)}
                    placeholder="Senha atual"
                    leftIcon={Lock}
                    disabled={savingPassword}
                  />
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mín. 6 caracteres)"
                    leftIcon={Lock}
                    disabled={savingPassword}
                  />
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar nova senha"
                    leftIcon={Lock}
                    disabled={savingPassword}
                  />
                  <Button variant="secondary" size="sm" onClick={handleSavePassword} loading={savingPassword} leftIcon={<Save size={14} />}>
                    Atualizar Senha
                  </Button>
                </div>
              </div>
            )}
          </Section>
        </motion.div>

        {/* ── Aparência ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section icon={Palette} title="Aparência" description="Tema e acessibilidade">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Tema</p>
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
                {themeOptions.map(({ key, icon: ThIcon, label }) => {
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      disabled={savingPrefs}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-300 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <ThIcon size={16} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Acessibilidade</p>
              <FontSizeControl />
            </div>
          </Section>
        </motion.div>

        {/* ── Notificações ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Section icon={Bell} title="Notificações" description="Controle de alertas e avisos">
            <Toggle
              label="Notificações push"
              description="Receba avisos sobre seus estudos e novidades"
              checked={notificationsEnabled}
              onChange={handleNotificationsToggle}
            />
          </Section>
        </motion.div>

        {/* ── Zona de Perigo ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Section icon={AlertTriangle} title="Zona de Perigo" description="Ações irreversíveis" danger>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Excluir conta permanentemente</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                  Todos os seus dados serão apagados e não poderão ser recuperados.
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 size={14} />}>
                Excluir
              </Button>
            </div>
          </Section>
        </motion.div>
      </div>

      {/* ── Delete Account Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deletingAccount && setShowDeleteModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-200/80 dark:border-slate-700/60 overflow-hidden"
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-8 pb-4 px-6 text-center">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Excluir Conta Permanentemente
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Esta ação é <strong className="text-red-600 dark:text-red-400">irreversível</strong>. Todos os seus dados, matérias, resumos, flashcards e foto de perfil serão excluídos permanentemente.
                </p>
              </div>

              <div className="px-6 pb-6 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar
                  </label>
                  <Input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="EXCLUIR"
                    disabled={deletingAccount}
                  />
                </div>

                {!isGoogleUser && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Senha atual</label>
                    <Input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Sua senha..."
                      leftIcon={Lock}
                      disabled={deletingAccount}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deletingAccount}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleDeleteAccount}
                    loading={deletingAccount}
                    disabled={deleteConfirmText !== 'EXCLUIR'}
                    leftIcon={<Trash2 size={16} />}
                  >
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
