/**
 * ⚙️ CONFIGURAÇÕES — Página de Configurações do Usuário Premium
 * * Seções:
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
  ChevronRight,
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

/* ─── Section wrapper Refinado ─── */
const Section = ({ icon: Icon, title, description, children, danger = false }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white dark:bg-slate-800 rounded-[24px] border ${
      danger ? 'border-red-200 dark:border-red-900/40' : 'border-slate-200/60 dark:border-slate-700/60'
    } shadow-sm overflow-hidden transition-all`}
  >
    <div className={`px-6 py-5 border-b ${
      danger ? 'bg-red-50/30 dark:bg-red-950/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center shadow-sm ${
          danger ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400'
        }`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className={`text-[16px] font-bold ${danger ? 'text-red-900 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>{title}</h3>
          {description && <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
    </div>
    <div className="p-6 space-y-6">{children}</div>
  </motion.div>
);

/* ─── Toggle component Premium ─── */
const Toggle = ({ label, description, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="flex-1">
      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{label}</p>
      {description && <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
    </div>
    <button
      onClick={() => onChange?.(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
        checked ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={checked}
    >
      <motion.span 
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0" 
      />
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

  // Handlers (Mantidos como originais)
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') { toast.error('Digite "EXCLUIR" para confirmar.'); return; }
    setDeletingAccount(true);
    try {
      if (deletePassword && user.email) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

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

      const notifRef = collection(db, 'users', user.uid, 'notifications');
      const notifSnap = await getDocs(notifRef);
      const notifBatch = writeBatch(db);
      notifSnap.docs.forEach(d => notifBatch.delete(d.ref));
      await notifBatch.commit();
      await deleteDoc(doc(db, 'users', user.uid));

      try {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        const listResult = await listAll(storageRef);
        await Promise.all(listResult.items.map(item => deleteObject(item)));
      } catch (e) { }

      try {
        const flashStorageRef = ref(storage, `flashcards/${user.uid}`);
        const flashList = await listAll(flashStorageRef);
        await Promise.all(flashList.items.map(item => deleteObject(item)));
      } catch (e) { }

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
    <div className="min-h-screen pb-32 pt-8 px-4 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Premium */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/20">
              <Settings size={32} className="text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Configurações
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] mt-1">
                Personalize sua conta e preferências de interface
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Conta ── */}
        <Section icon={User} title="Dados do Perfil" description="Gerencie como você aparece no Cinesia">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Seu Nome</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Kauan Kelvin"
                leftIcon={User}
                disabled={savingName}
                className="flex-1 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
              <Button 
                variant="primary" 
                size="md" 
                onClick={handleSaveName} 
                loading={savingName} 
                className="h-12 px-8 shadow-md bg-indigo-600 border-none font-bold"
              >
                Salvar
              </Button>
            </div>
          </div>

          {!isGoogleUser && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Endereço de Email</label>
                <div className="space-y-3">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="novo@email.com"
                    leftIcon={Mail}
                    disabled={savingEmail}
                    className="h-12 bg-white dark:bg-slate-900"
                  />
                  <Input
                    type="password"
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    placeholder="Sua senha atual para confirmar"
                    leftIcon={Lock}
                    disabled={savingEmail}
                    className="h-12 bg-white dark:bg-slate-900"
                  />
                  <Button variant="secondary" size="sm" onClick={handleSaveEmail} loading={savingEmail} className="font-bold border-slate-200 dark:border-slate-700">
                    Atualizar Email
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isGoogleUser && (
            <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <Mail size={16} className="text-blue-500" />
              </div>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                Você está conectado via Google: <span className="font-bold text-slate-800 dark:text-slate-200">{user?.email}</span>
              </p>
            </div>
          )}
        </Section>

        {/* ── Senha ── */}
        {!isGoogleUser && (
          <Section icon={Shield} title="Segurança" description="Mantenha sua conta protegida">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">Alterar Senha</label>
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-primary-600 transition-colors flex items-center gap-1.5"
                >
                  {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPasswords ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <div className="space-y-3">
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPasswordForPwd}
                  onChange={(e) => setCurrentPasswordForPwd(e.target.value)}
                  placeholder="Senha atual"
                  leftIcon={Lock}
                  disabled={savingPassword}
                  className="h-12 bg-white dark:bg-slate-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                    leftIcon={Lock}
                    disabled={savingPassword}
                    className="h-12 bg-white dark:bg-slate-900"
                  />
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar nova"
                    leftIcon={Lock}
                    disabled={savingPassword}
                    className="h-12 bg-white dark:bg-slate-900"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={handleSavePassword} loading={savingPassword} className="font-bold border-slate-200 dark:border-slate-700">
                  Redefinir Senha
                </Button>
              </div>
            </div>
          </Section>
        )}

        {/* ── Aparência ── */}
        <Section icon={Palette} title="Customização" description="Ajuste o visual do sistema ao seu gosto">
          <div className="space-y-6">
            <div>
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">Esquema de Cores</p>
              <div className="relative flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-[16px] border border-slate-200/50 dark:border-slate-800">
                {themeOptions.map(({ key, icon: ThIcon, label }) => {
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      disabled={savingPrefs}
                      className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 z-10 ${
                        active
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {active && (
                        <motion.div 
                          layoutId="activeTheme"
                          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <ThIcon size={16} className="relative z-20" strokeWidth={2.5} />
                      <span className="relative z-20">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700/60">
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">Acessibilidade</p>
              <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <FontSizeControl />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Notificações ── */}
        <Section icon={Bell} title="Alertas" description="Escolha como deseja ser notificado">
          <Toggle
            label="Notificações Push"
            description="Lembretes de revisão, metas diárias e novidades do Cinesia"
            checked={notificationsEnabled}
            onChange={handleNotificationsToggle}
          />
        </Section>

        {/* ── Zona de Perigo ── */}
        <Section icon={AlertTriangle} title="Zona Crítica" description="Ações permanentes na sua conta" danger>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[14px] font-bold text-red-900 dark:text-red-300">Encerrar e Excluir Conta</p>
              <p className="text-[12px] font-medium text-red-600/70 dark:text-red-400/70 mt-1 max-w-sm leading-relaxed">
                Esta ação removerá todos os seus resumos, matérias e progresso. Não há como desfazer.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 size={16} />} className="font-bold px-6 border-none shadow-md shadow-red-500/20">
              Excluir permanentemente
            </Button>
          </div>
        </Section>
      </div>

      {/* ── Modal de Exclusão (Glassmorphism + Segurança) ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deletingAccount && setShowDeleteModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md border border-white/20 dark:border-slate-700/60 overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-10 pb-6 px-8 text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-800/50">
                  <AlertTriangle size={40} className="text-red-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  Tem certeza absoluta?
                </h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Você está prestes a apagar sua jornada no Cinesia. Todos os seus dados serão <span className="text-red-600 dark:text-red-400 font-bold underline">destruídos para sempre</span>.
                </p>
              </div>

              <div className="px-8 pb-8 space-y-5">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Confirmação de segurança</label>
                  <Input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Digite EXCLUIR para confirmar'
                    disabled={deletingAccount}
                    className="h-12 text-center font-black tracking-widest bg-white dark:bg-slate-900"
                  />
                </div>

                {!isGoogleUser && (
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Senha da conta</label>
                    <Input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Sua senha secreta..."
                      leftIcon={Lock}
                      disabled={deletingAccount}
                      className="h-12 bg-white dark:bg-slate-900"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleDeleteAccount}
                    loading={deletingAccount}
                    disabled={deleteConfirmText !== 'EXCLUIR'}
                    className="h-14 rounded-2xl text-[15px] font-bold shadow-lg shadow-red-500/20 border-none"
                  >
                    Sim, excluir tudo
                  </Button>
                  <button
                    onClick={() => !deletingAccount && setShowDeleteModal(false)}
                    disabled={deletingAccount}
                    className="py-3 text-[14px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Mudei de ideia
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}