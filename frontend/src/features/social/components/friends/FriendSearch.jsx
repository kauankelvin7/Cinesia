/**
 * 🔍 FRIEND SEARCH PREMIUM — v2.0
 * * Busca de usuários com debounce e animação em cascata.
 * - Input responsivo com estados de foco imersivos
 * - Result cards com micro-interações de hover
 * - Integração fluida com o sistema de convites
 */

import React, { memo, useState, useRef, useCallback } from 'react';
import { Search, UserPlus, Clock, Check, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const FriendSearch = memo(({ onSearch, onSendRequest, sentRequests = [], friends = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState({});
  const debounceRef = useRef(null);

  const sentUserIds = new Set(sentRequests.map((r) => r.requestedTo));
  const friendUserIds = new Set(friends.map((f) => f.uid));

  const handleSearch = useCallback((value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await onSearch(value.trim());
        setResults(data || []);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 350); // Aumentei um pouco o debounce para evitar flickering
  }, [onSearch]);

  const handleSendRequest = async (targetUser) => {
    const targetComUid = { ...targetUser, uid: targetUser.uid || targetUser.id || null };
    setSending((prev) => ({ ...prev, [targetComUid.uid]: true }));
    try {
      await onSendRequest(targetComUid);
      toast.success(`Pedido enviado para ${targetComUid.displayName}! 🚀`);
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar pedido');
    }
    setSending((prev) => ({ ...prev, [targetComUid.uid]: false }));
  };

  const getStatus = (userId) => {
    if (friendUserIds.has(userId)) return 'friend';
    if (sentUserIds.has(userId)) return 'pending';
    return 'none';
  };

  // Variantes para a animação em cascata (Stagger)
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6">
      {/* ─── Search Input Premium ─── */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Busque por nome ou email..."
          className="w-full pl-12 pr-12 py-4 text-[15px] font-medium rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          autoFocus
        />
        {searching && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <Loader2 size={20} className="animate-spin text-teal-500" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* ─── Search Results ─── */}
      <AnimatePresence mode="wait">
        {results.length > 0 && !searching ? (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1"
          >
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Resultados ({results.length})</p>
            
            {results.map((user) => {
              const status = getStatus(user.uid);
              const initials = getInitials(user.displayName);
              const key = user.uid || user.email || `${user.displayName}-${Math.random()}`;

              return (
                <motion.div
                  variants={itemVariants}
                  key={key}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all group"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-100 dark:group-hover:border-slate-700 transition-all" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shadow-inner" style={{ backgroundColor: getAvatarColor(user.displayName) }}>
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight">
                      {user.displayName}
                    </p>
                    {user.institution ? (
                      <p className="text-[12px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <BookOpen size={12} /> {user.institution}
                      </p>
                    ) : (
                      <p className="text-[12px] text-slate-400 truncate mt-0.5">Estudante Cinesia</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 pl-2">
                    {status === 'friend' ? (
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" title="Amigo">
                        <Check size={20} strokeWidth={3} />
                      </span>
                    ) : status === 'pending' ? (
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400" title="Convite Pendente">
                        <Clock size={20} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user)}
                        disabled={sending[user.uid]}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-teal-500 text-slate-700 hover:text-white font-bold text-[13px] transition-all disabled:opacity-50 active:scale-95"
                      >
                        {sending[user.uid] ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} strokeWidth={2.5} />}
                        <span className="hidden sm:inline">Adicionar</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : query.trim().length >= 2 && !searching ? (
          /* Empty State da Busca */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center px-4">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-4">
                <Search size={28} className="text-slate-300" />
             </div>
             <p className="text-[14px] font-bold text-slate-600 dark:text-slate-400">Ninguém encontrado.</p>
             <p className="text-[12px] text-slate-400 mt-1 max-w-[200px]">Verifique a ortografia ou tente buscar apenas pelo primeiro nome.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

FriendSearch.displayName = 'FriendSearch';
export default FriendSearch;