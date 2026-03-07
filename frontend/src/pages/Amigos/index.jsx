/**
 * 👥 HUB SOCIAL PREMIUM — v2.0
 * * Página principal do ecossistema comunitário.
 * - Magic Sliding Tabs com Framer Motion
 * - Transições de Blur-Fade entre as seções
 * - Header imersivo com identidade visual Cinesia
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, BookOpen, Swords, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { useSocial } from '../../features/social/context/SocialContext';
import { useFriends } from '../../features/social/hooks/useFriends';
import { useGroups } from '../../features/social/hooks/useGroups';
import { challengeService } from '../../features/social/services/challengeService';
import { chatService } from '../../features/social/services/chatService';
import { getStreakData } from '../../services/streakService';

// Componentes da aba
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
  const { pendingRequestsCount, startChallenge, openConversation } = useSocial();
  
  const {
    friends, pendingRequests, sentRequests, friendsStatus,
    loading: friendsLoading, sendRequest, acceptRequest,
    declineRequest, removeFriend, blockUser, searchUsers,
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

  useEffect(() => {
    if (!user?.uid) return;
    getStreakData(user.uid)
      .then((data) => setMyStreakDays(data?.currentStreak ?? 0))
      .catch(() => {});
  }, [user?.uid]);

  const handleOpenProfile = useCallback((friend) => {
    setSelectedFriend(friend);
    setShowProfile(true);
  }, []);

  const handleMessage = useCallback(async (friend) => {
    try {
      const convId = await chatService.getOrCreateConversation(user.uid, friend.uid, user, friend);
      openConversation(convId);
    } catch (err) {
      toast.error('Erro ao abrir conversa');
    }
  }, [user, openConversation]);

  const handleChallengeOpen = useCallback((friend) => {
    setChallengeTarget(friend);
    setShowChallengeInvite(true);
  }, []);

  const handleSendChallenge = useCallback(async (friend, deck) => {
    try {
      const convId = await chatService.getOrCreateConversation(user.uid, friend.uid, user, friend);
      const challengeId = await challengeService.createChallenge(user, friend, deck, convId);
      startChallenge(challengeId);
      toast.success('Desafio enviado com sucesso!');
    } catch (err) {
      toast.error(err.message || 'Erro ao criar desafio');
    }
  }, [user, startChallenge]);

  const handleCreateGroup = useCallback(async ({ name, description, memberIds }) => {
    try {
      await createGroup(name, description, memberIds);
      toast.success('Grupo criado com sucesso!');
    } catch (err) {
      toast.error(err.message || 'Erro ao criar grupo');
    }
  }, [createGroup]);

  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group);
  }, []);

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

  const handleRemoveMember = useCallback(async (memberId) => {
    if (!selectedGroup) return;
    try {
      await removeMember(selectedGroup.id, memberId);
      toast.success('Membro removido');
    } catch (err) {
      toast.error(err.message || 'Erro ao remover membro');
    }
  }, [selectedGroup, removeMember]);

  // Se grupo selecionado, mostra chat do grupo (Lógica de retorno após os Hooks!)
  if (selectedGroup) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-950">
        <GroupChat
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onShowMembers={() => setShowGroupMembers(true)}
        />
        <GroupMembers
          isOpen={showGroupMembers}
          onClose={() => setShowGroupMembers(false)}
          group={selectedGroup}
          membersData={selectedGroup?.participantsData ? Object.values(selectedGroup.participantsData) : []}
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
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      {/* ─── Header Premium ─── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
          <Users size={28} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Comunidade
          </h1>
          <p className="text-[13px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Conecte-se, estude e desafie seus colegas
          </p>
        </div>
      </div>

      {/* ─── Magic Sliding Tabs ─── */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[20px] mb-8 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === 'requests' && pendingRequestsCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-[13px] sm:text-sm font-bold transition-colors z-10 whitespace-nowrap min-w-[100px]
                ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabAmigos"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-[14px] shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
              
              {showBadge && (
                <div className="relative z-10 ml-1">
                  <NotificationBadge count={pendingRequestsCount} size="sm" pulse />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Conteúdo com Fade-Blur ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-h-[400px]"
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
                try { await acceptRequest(id); toast.success('Novo amigo adicionado! 🎉'); }
                catch (e) { toast.error(e.message || 'Erro ao aceitar'); }
              }}
              onDecline={async (id) => {
                try { await declineRequest(id); }
                catch (e) { toast.error(e.message || 'Erro ao recusar'); }
              }}
            />
          )}

          {activeTab === 'search' && (
            <FriendSearch
              onSearch={searchUsers}
              onSendRequest={async (targetUser) => {
                try { await sendRequest(targetUser); toast.success('Convite enviado! 🚀'); }
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

      {/* ─── Modais ─── */}
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