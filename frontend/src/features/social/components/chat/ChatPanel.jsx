/**
 * @file ChatPanel.jsx
 * @description Painel flutuante do chat estilo WhatsApp — desliza da direita.
 * Mobile: full-screen; Desktop: w-96 fixed right.
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useSocial } from '../../context/SocialContext';
import { useChat } from '../../hooks/useChat';
import { useFriends } from '../../hooks/useFriends';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NotificationBadge from '../shared/NotificationBadge';
import { chatService } from '../../services/chatService';

const ChatPanel = memo(({ showButton = true }) => {
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
    if (!activeConversationId) return;
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

  return (
    <>
      {/* Floating button — hidden on mobile (chat is accessed via bottom sheet "Mais") */}
      {showButton && (
      <button
        onClick={toggleChat}
        className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 hover:from-primary-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl hover:shadow-primary-500/20 transition-all flex items-center justify-center group
          ${isChatOpen ? 'hidden md:hidden' : ''}
        `}
        aria-label="Abrir chat"
        title="Mensagens"
      >
        <motion.div
          key="open"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <MessageCircle size={20} />
        </motion.div>

        {!isChatOpen && (
          <NotificationBadge count={totalUnread} className="-top-1 -right-1" />
        )}
      </button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Mobile: backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChat}
            />

            {/* Panel slide from right */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 z-[61] w-full md:w-96 bg-white dark:bg-slate-900 shadow-2xl shadow-black/10 dark:shadow-black/30 border-l border-slate-200/80 dark:border-slate-700/80 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              {activeConversationId && activeFriendData ? (
                <ChatWindow
                  conversationId={activeConversationId}
                  friendData={activeFriendData}
                  friendStatus={activeFriendStatus}
                  onBack={handleBack}
                  onClose={closeChat}
                />
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary-500/5 to-cyan-500/5 dark:from-primary-500/10 dark:to-cyan-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                        <MessageCircle size={16} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Mensagens
                        </h2>
                        {conversations.length > 0 && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={closeChat}
                      className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
