/**
 * @file Amigos/index.jsx
 * @description Página principal do sistema social – 4 abas: Amigos, Pedidos, Buscar, Grupos.
 */

import React, { memo, useState, useCallback, useMemo, lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, BookOpen, Swords, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { useSocial } from '../../features/social/context/SocialContext';
import { useFriends } from '../../features/social/hooks/useFriends';
import { useGroups } from '../../features/social/hooks/useGroups';
import { challengeService } from '../../features/social/services/challengeService';
import { chatService } from '../../features/social/services/chatService';
import { getStreakData } from '../../services/streakService';
import FriendsList from '../../features/social/components/friends/FriendsList';
import FriendRequests from '../../features/social/components/friends/FriendRequests';
import FriendSearch from '../../features/social/components/friends/FriendSearch';
import FriendProfile from '../../features/social/components/friends/FriendProfile';
import GroupList from '../../features/social/components/groups/GroupList';
import GroupCreate from '../../features/social/components/groups/GroupCreate';
import GroupChat from '../../features/social/components/groups/GroupChat';
import GroupMembers from '../../features/social/components/groups/GroupMembers';
import ChallengeInvite from '../../features/social/components/challenges/ChallengeInvite';
import NotificationBadge from '../../features/social/components/shared/NotificationBadge';

const TABS = [
  { id: 'friends', label: 'Amigos', icon: Users },
  { id: 'requests', label: 'Pedidos', icon: UserPlus },
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'groups', label: 'Grupos', icon: BookOpen },
];

const Amigos = memo(() => {
  const { user } = useAuth();
  const { pendingRequestsCount, startChallenge, openConversation } =
    useSocial();
  const {
    friends,
    pendingRequests,
    sentRequests,
    friendsStatus,
    loading: friendsLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    searchUsers,
  } = useFriends();
  const { groups, loading: groupsLoading, createGroup, leaveGroup, removeMember } = useGroups();

  const [myStreakDays, setMyStreakDays] = useState(0);
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showChallengeInvite, setShowChallengeInvite] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);

  // Busca streak do usuário logado para exibir na comparação
  useEffect(() => {
    if (!user?.uid) return;
    getStreakData(user.uid)
      .then((data) => setMyStreakDays(data?.currentStreak ?? 0))
      .catch(() => {});
  }, [user?.uid]);

  // Abrir perfil do amigo
  const handleOpenProfile = useCallback((friend) => {
    setSelectedFriend(friend);
    setShowProfile(true);
  }, []);

  // Mensagem direta
  const handleMessage = useCallback(
    async (friend) => {
      try {
        const convId = await chatService.getOrCreateConversation(
          user.uid, friend.uid, user, friend,
        );
        openConversation(convId);
      } catch (err) {
        toast.error('Erro ao abrir conversa');
      }
    },
    [user, openConversation],
  );

  // Abrir modal de desafio
  const handleChallengeOpen = useCallback((friend) => {
    setChallengeTarget(friend);
    setShowChallengeInvite(true);
  }, []);

  // Envia desafio
  const handleSendChallenge = useCallback(
    async (friend, deck) => {
      try {
        // Precisa de uma conversa para enviar o desafio
        const convId = await chatService.getOrCreateConversation(
          user.uid, friend.uid, user, friend,
        );
        const challengeId = await challengeService.createChallenge(
          user,
          friend,
          deck,
          convId,
        );
        startChallenge(challengeId);
        toast.success('Desafio enviado!');
      } catch (err) {
        toast.error(err.message || 'Erro ao criar desafio');
      }
    },
    [user, startChallenge],
  );

  // Criar grupo
  const handleCreateGroup = useCallback(
    async ({ name, description, memberIds }) => {
      try {
        await createGroup(name, description, memberIds);
        toast.success('Grupo criado!');
      } catch (err) {
        toast.error(err.message || 'Erro ao criar grupo');
      }
    },
    [createGroup],
  );

  // Abrir chat do grupo
  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group);
  }, []);

  // Sair do grupo
  const handleLeaveGroup = useCallback(async () => {
    if (!selectedGroup) return;
    try {
      await leaveGroup(selectedGroup.id);
      setSelectedGroup(null);
      setShowGroupMembers(false);
      toast.success('Você saiu do grupo');
    } catch (err) {
      toast.error(err.message || 'Erro ao sair do grupo');
    }
  }, [selectedGroup, leaveGroup]);

  // Remover membro
  const handleRemoveMember = useCallback(
    async (memberId) => {
      if (!selectedGroup) return;
      try {
        await removeMember(selectedGroup.id, memberId);
        toast.success('Membro removido');
      } catch (err) {
        toast.error(err.message || 'Erro ao remover membro');
      }
    },
    [selectedGroup, removeMember],
  );

  // Se grupo selecionado, mostra chat do grupo
  if (selectedGroup) {
    return (
      <div className="h-full flex flex-col">
        <GroupChat
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onShowMembers={() => setShowGroupMembers(true)}
        />
        <GroupMembers
          isOpen={showGroupMembers}
          onClose={() => setShowGroupMembers(false)}
          group={selectedGroup}
          membersData={selectedGroup?.participantsData
            ? Object.values(selectedGroup.participantsData)
            : []
          }
          onRemoveMember={handleRemoveMember}
          onLeaveGroup={handleLeaveGroup}
          onMessage={async (member) => {
            setShowGroupMembers(false);
            try {
              const mConvId = await chatService.getOrCreateConversation(user.uid, member.uid, user, member);
              openConversation(mConvId);
            } catch (err) {
              toast.error('Erro ao abrir conversa');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users size={24} className="text-amber-500" />
          Estude Juntos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Conecte-se, estude e desafie seus colegas de fisioterapia
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === 'requests' && pendingRequestsCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 relative flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all
                ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }
              `}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              {showBadge && (
                <NotificationBadge count={pendingRequestsCount} size="sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'friends' && (
            <FriendsList
              friends={friends}
              friendsStatus={friendsStatus}
              loading={friendsLoading}
              onViewProfile={handleOpenProfile}
              onMessage={handleMessage}
              onChallenge={handleChallengeOpen}
              onRemove={removeFriend}
              onNavigateSearch={() => setActiveTab('search')}
            />
          )}

          {activeTab === 'requests' && (
            <FriendRequests
              pendingRequests={pendingRequests}
              sentRequests={sentRequests}
              onAccept={async (id) => {
                try { await acceptRequest(id); toast.success('Pedido aceito!'); }
                catch (e) { toast.error(e.message || 'Erro ao aceitar'); }
              }}
              onDecline={async (id) => {
                try { await declineRequest(id); toast.success('Pedido recusado'); }
                catch (e) { toast.error(e.message || 'Erro ao recusar'); }
              }}
            />
          )}

          {activeTab === 'search' && (
            <FriendSearch
              onSearch={searchUsers}
              onSendRequest={async (targetUser) => {
                try { await sendRequest(targetUser); toast.success('Pedido enviado!'); }
                catch (e) { toast.error(e.message || 'Erro ao enviar pedido'); }
              }}
              sentRequests={sentRequests}
              friends={friends}
            />
          )}

          {activeTab === 'groups' && (
            <GroupList
              groups={groups}
              onSelectGroup={handleSelectGroup}
              onCreateGroup={() => setShowGroupCreate(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <FriendProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        friend={selectedFriend}
        friendStatus={selectedFriend ? friendsStatus[selectedFriend.uid] : null}
        onMessage={handleMessage}
        onChallenge={handleChallengeOpen}
        onRemove={removeFriend}
        onBlock={blockUser}
        myStreak={myStreakDays}
      />

      <ChallengeInvite
        isOpen={showChallengeInvite}
        onClose={() => setShowChallengeInvite(false)}
        friend={challengeTarget}
        onSendChallenge={handleSendChallenge}
      />

      <GroupCreate
        isOpen={showGroupCreate}
        onClose={() => setShowGroupCreate(false)}
        friends={friends}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
});

Amigos.displayName = 'Amigos';
export default Amigos;
