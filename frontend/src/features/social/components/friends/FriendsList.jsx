/**
 * @file FriendsList.jsx
 * @description Lista de amigos com status online/offline.
 */

import React, { memo } from 'react';
import { Users, Search, Loader2 } from 'lucide-react';
import FriendCard from './FriendCard';

const FriendsList = memo(({ friends, friendsStatus = {}, loading, onMessage, onChallenge, onRemove, onViewProfile, onNavigateSearch }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!friends?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <Users size={24} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Nenhum amigo ainda
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-50">
          Busque outros estudantes de fisioterapia para adicionar!
        </p>
        {onNavigateSearch && (
          <button
            onClick={onNavigateSearch}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            <Search size={14} />
            Buscar estudantes →
          </button>
        )}
      </div>
    );
  }

  // Separa online e offline
  const onlineFriends = friends.filter(
    (f) => friendsStatus[f.uid]?.isOnline
  );
  const offlineFriends = friends.filter(
    (f) => !friendsStatus[f.uid]?.isOnline
  );

  return (
    <div className="space-y-4">
      {/* Online */}
      {onlineFriends.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider px-1 mb-2">
            Online ({onlineFriends.length})
          </p>
          <div className="space-y-1">
            {onlineFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                status={friendsStatus[friend.uid]}
                onMessage={onMessage}
                onChallenge={onChallenge}
                onRemove={onRemove}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </div>
      )}

      {/* Offline */}
      {offlineFriends.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mb-2">
            Offline ({offlineFriends.length})
          </p>
          <div className="space-y-1">
            {offlineFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                status={friendsStatus[friend.uid]}
                onMessage={onMessage}
                onChallenge={onChallenge}
                onRemove={onRemove}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

FriendsList.displayName = 'FriendsList';
export default FriendsList;
