/**
 * @file GroupCreate.jsx
 * @description Modal para criar um novo grupo de estudo.
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Plus, Loader2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const MAX_MEMBERS = 10;

const GroupCreate = memo(({ isOpen, onClose, friends = [], onCreateGroup }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredFriends = friends.filter((f) =>
    f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleFriend = useCallback((friend) => {
    setSelectedFriends((prev) => {
      const exists = prev.find((s) => s.uid === friend.uid);
      if (exists) return prev.filter((s) => s.uid !== friend.uid);
      if (prev.length >= MAX_MEMBERS - 1) return prev; // -1 conta o próprio usuário
      return [...prev, friend];
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const memberIds = selectedFriends.map((f) => f.uid);
      await onCreateGroup({
        name: name.trim(),
        description: description.trim(),
        memberIds,
      });
      toast.success('Grupo criado com sucesso!');
      // Reset
      setName('');
      setDescription('');
      setSelectedFriends([]);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar grupo');
    }
    setCreating(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 top-1/2 z-101 max-w-md mx-auto"
            initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
            animate={{ opacity: 1, y: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: '-45%', scale: 0.95 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="relative bg-linear-to-r from-violet-500 to-purple-600 px-4 py-4 shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 flex items-center justify-center p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/30 transition-colors"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <Users size={24} className="text-white" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Criar Grupo</h3>
                    <p className="text-sm text-white/80">Até {MAX_MEMBERS} membros</p>
                  </div>
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                {/* Name */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                    Nome do grupo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Fisioterapia Esportiva 2024"
                    maxLength={50}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do grupo"
                    maxLength={100}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  />
                </div>

                {/* Separator */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Adicionar amigos ({selectedFriends.length}/{MAX_MEMBERS - 1})
                  </span>
                  <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                </div>

                {/* Search friends */}
                {friends.length > 5 && (
                  <div className="relative mb-3">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar amigo..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>
                )}

                {/* Selected friends chips */}
                {selectedFriends.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedFriends.map((f) => (
                      <span
                        key={f.uid}
                        onClick={() => toggleFriend(f)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-800/40"
                      >
                        {f.displayName?.split(' ')[0]}
                        <X size={12} />
                      </span>
                    ))}
                  </div>
                )}

                {/* Friend list */}
                <div className="space-y-1.5 max-h-50 overflow-y-auto">
                  {filteredFriends.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      {friends.length === 0
                        ? 'Adicione amigos primeiro'
                        : 'Nenhum amigo encontrado'}
                    </p>
                  ) : (
                    filteredFriends.map((friend) => {
                      const isSelected = selectedFriends.some((s) => s.uid === friend.uid);
                      const initials = getInitials(friend.displayName);
                      const bg = getAvatarColor(friend.displayName);

                      return (
                        <div
                          key={friend.uid}
                          onClick={() => toggleFriend(friend)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-300 dark:border-violet-700'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          {friend.photoURL ? (
                            <img
                              src={friend.photoURL}
                              alt={friend.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: bg }}
                            >
                              <span className="text-xs font-bold text-white">{initials}</span>
                            </div>
                          )}
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
                            {friend.displayName}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-violet-500 border-violet-500'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} /> Criar Grupo
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

GroupCreate.displayName = 'GroupCreate';
export default GroupCreate;
