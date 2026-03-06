/**
 * @file FriendSearch.jsx
 * @description Busca de usuários cadastrados com debounce para adicionar como amigo.
 */

import React, { memo, useState, useRef, useCallback } from 'react';
import { Search, UserPlus, Clock, Check, Loader2 } from 'lucide-react';
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

  const handleSearch = useCallback(
    (value) => {
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
      }, 300);
    },
    [onSearch],
  );

  const handleSendRequest = async (targetUser) => {
    setSending((prev) => ({ ...prev, [targetUser.uid]: true }));
    try {
      await onSendRequest(targetUser);
      toast.success(`Pedido enviado para ${targetUser.displayName}!`);
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar pedido');
    }
    setSending((prev) => ({ ...prev, [targetUser.uid]: false }));
  };

  const getStatus = (userId) => {
    if (friendUserIds.has(userId)) return 'friend';
    if (sentUserIds.has(userId)) return 'pending';
    return 'none';
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
          autoFocus
        />
        {searching && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
          />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1 max-h-100 overflow-y-auto">
          {results.map((user) => {
            const status = getStatus(user.uid);
            const initials = getInitials(user.displayName);
            const avatarBg = getAvatarColor(user.displayName);
            // Garante key única: uid || email || index
            const key = user.uid || user.email || `${user.displayName}-${Math.random()}`;

            return (
              <div
                key={key}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Avatar */}
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {user.displayName}
                  </p>
                  {user.institution && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.institution}
                    </p>
                  )}
                </div>

                {/* Action button */}
                {status === 'friend' ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium px-2 py-1 rounded-lg bg-green-500/10">
                    <Check size={12} /> Amigo
                  </span>
                ) : status === 'pending' ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium px-2 py-1 rounded-lg bg-amber-500/10">
                    <Clock size={12} /> Pendente
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendRequest(user)}
                    disabled={sending[user.uid]}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50"
                  >
                    {sending[user.uid] ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <UserPlus size={12} />
                    )}
                    Adicionar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
          Nenhum usuário encontrado com "{query}"
        </p>
      )}
    </div>
  );
});

FriendSearch.displayName = 'FriendSearch';
export default FriendSearch;
