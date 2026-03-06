/**
 * @file ChatPanel.jsx
 * @description Painel flutuante do chat — desliza da direita sobre o conteúdo.
 * Mobile: full-screen; Desktop: w-80 fixed right.
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useSocial } from '../../context/SocialContext';
import { useChat } from '../../hooks/useChat';
import { useFriends } from '../../hooks/useFriends';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NotificationBadge from '../shared/NotificationBadge';
import { chatService } from '../../services/chatService';
import { presenceService } from '../../services/presenceService';

const ChatPanel = memo(() => {
  const { user } = useAuth();
  const {
    isChatOpen, toggleChat, closeChat,
    activeConversationId, openConversation, backToList,
    totalUnread,
  } = useSocial();
  const { conversations } = useChat(null);
  const { friends, friendsStatus } = useFriends();

  // State for the friend data of active conversation
  const [activeFriendData, setActiveFriendData] = useState(null);
  const [activeFriendStatus, setActiveFriendStatus] = useState(null);

  // Resolve friend data when opening a conversation
  useEffect(() => {
    if (!activeConversationId || !conversations.length) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const otherUid = conv.participants?.find((uid) => uid !== user?.uid);
    if (!otherUid) return;

    const friendData = conv.participantsData?.[otherUid] || { uid: otherUid, displayName: 'Usuário' };
    setActiveFriendData(friendData);
    setActiveFriendStatus(friendsStatus[otherUid] || null);
  }, [activeConversationId, conversations, user?.uid, friendsStatus]);

  const handleSelectConversation = (conv) => {
    openConversation(conv.id);
  };

  const handleBack = () => {
    setActiveFriendData(null);
    setActiveFriendStatus(null);
    backToList();
  };

  // Open chat from friend (create or get conversation)
  const openChatWithFriend = async (friend) => {
    if (!user?.uid || !friend?.uid) return;
    const convId = await chatService.getOrCreateConversation(
      user.uid,
      friend.uid,
      user,
      friend,
    );
    openConversation(convId);
  };

  return (
    <>
      {/* Floating button — positioned by parent container in Layout.jsx */}
      {/* Oculta no desktop quando o painel está aberto (X no header basta) */}
      <button
        onClick={toggleChat}
        className={`relative w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group
          ${isChatOpen ? 'hidden md:hidden' : ''}
        `}
        aria-label="Abrir chat"
        title="Mensagens"
      >
        <motion.div key="open" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }}>
          <MessageCircle size={20} />
        </motion.div>

        {!isChatOpen && (
          <NotificationBadge count={totalUnread} className="-top-1 -right-1" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Mobile: backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-48 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChat}
            />

            {/* Panel slide from right */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 z-49 w-full md:w-80 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {activeConversationId && activeFriendData ? (
                <ChatWindow
                  conversationId={activeConversationId}
                  friendData={activeFriendData}
                  friendStatus={activeFriendStatus}
                  onBack={handleBack}
                />
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      Mensagens
                    </h2>
                    <button
                      onClick={closeChat}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      aria-label="Fechar"
                      title="Fechar"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Conversations list */}
                  <div className="flex-1 overflow-y-auto p-2">
                    <ChatList
                      conversations={conversations}
                      friendsStatus={friendsStatus}
                      onSelectConversation={handleSelectConversation}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

ChatPanel.displayName = 'ChatPanel';
export default ChatPanel;
