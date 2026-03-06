/**
 * @file useFriends.js
 * @description Hook para gerenciar amizades, pedidos e busca de usuários.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext-firebase';
import { friendsService } from '../services/friendsService';
import { presenceService } from '../services/presenceService';

/**
 * @returns {{ friends, pendingRequests, sentRequests, friendsStatus, loading, sendRequest, acceptRequest, declineRequest, removeFriend, searchUsers }}
 */
export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friendsStatus, setFriendsStatus] = useState({});
  const [loading, setLoading] = useState(true);

  // Assina amizades aceitas
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubFriends = friendsService.subscribeFriends(user.uid, (data) => {
      setFriends(data);
      setLoading(false);
    });

    const unsubPending = friendsService.subscribePendingRequests(user.uid, setPendingRequests);
    const unsubSent = friendsService.subscribeSentRequests(user.uid, setSentRequests);

    return () => {
      unsubFriends();
      unsubPending();
      unsubSent();
    };
  }, [user?.uid]);

  // Assina status de presença dos amigos
  useEffect(() => {
    if (friends.length === 0) return;
    const friendIds = friends.map((f) => f.uid);
    const unsub = presenceService.subscribeToFriendsStatus(friendIds, (friendId, status) => {
      setFriendsStatus((prev) => ({ ...prev, [friendId]: status }));
    });
    return unsub;
  }, [friends]);

  const sendRequest = useCallback(
    async (targetUser) => {
      if (!user) throw new Error('Não autenticado');
      const targetComUid = {
        ...targetUser,
        uid: targetUser.uid || targetUser.id || null,
      };
      const currentComUid = {
        ...user,
        uid: user.uid || user.id || null,
      };
      return friendsService.sendFriendRequest(currentComUid, targetComUid);
    },
    [user],
  );

  const acceptRequest = useCallback(
    (friendshipId) => friendsService.acceptFriendRequest(friendshipId),
    [],
  );

  const declineRequest = useCallback(
    (friendshipId) => friendsService.declineFriendRequest(friendshipId),
    [],
  );

  const removeFriend = useCallback(
    (friendshipId) => friendsService.removeFriend(friendshipId),
    [],
  );

  const blockUser = useCallback(
    (friendshipId) => friendsService.blockUser(friendshipId),
    [],
  );

  const searchUsers = useCallback(
    (term) => {
      if (!user?.uid) return Promise.resolve([]);
      return friendsService.searchUsers(term, user.uid);
    },
    [user?.uid],
  );

  return {
    friends,
    pendingRequests,
    sentRequests,
    friendsStatus,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    searchUsers,
  };
}
