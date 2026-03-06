/**
 * @file useGroups.js
 * @description Hook para gerenciamento de grupos de estudo.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext-firebase';
import { groupService } from '../services/groupService';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = groupService.subscribeGroups(user.uid, (data) => {
      setGroups(data);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const createGroup = useCallback(
    async (groupName, description, initialMembers = []) => {
      if (!user) throw new Error('Não autenticado');
      return groupService.createGroup(user, groupName, description, initialMembers);
    },
    [user],
  );

  const addMember = useCallback(
    async (conversationId, newMember) => {
      if (!user) throw new Error('Não autenticado');
      return groupService.addMember(conversationId, newMember, user.uid);
    },
    [user],
  );

  const removeMember = useCallback(
    async (conversationId, memberId) => {
      if (!user) throw new Error('Não autenticado');
      return groupService.removeMember(conversationId, memberId, user.uid);
    },
    [user],
  );

  const leaveGroup = useCallback(
    async (conversationId) => {
      if (!user) throw new Error('Não autenticado');
      return groupService.leaveGroup(conversationId, user.uid);
    },
    [user],
  );

  const updateGroup = useCallback(
    (conversationId, updates) => groupService.updateGroup(conversationId, updates),
    [],
  );

  return {
    groups,
    loading,
    createGroup,
    addMember,
    removeMember,
    leaveGroup,
    updateGroup,
  };
}
