/**
 * 💬 CHAT PANEL
 * * Painel de comunicação em tempo real integrado ao ecossistema Cinesia.
 * - Navegação fluida entre lista e conversa
 * - Design responsivo (Sidepanel vs Fullscreen)
 * - Indicadores de status e notificações dinâmicas
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ArrowLeft, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useSocial } from '../../context/SocialContext';
import { useChat } from '../../hooks/useChat';
import { useFriends } from '../../hooks/useFriends';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NotificationBadge from '../shared/NotificationBadge';

const ChatPanel = memo(({ showButton = true }) => {
  const { user } = useAuth();
  const {
    isChatOpen, toggleChat, closeChat,
    activeConversationId, openConversation, backToList,
    totalUnread,
  } = useSocial();
  
  const { conversations } = useChat(null);
  const { friendsStatus } = useFriends();

  const [activeFriendData, setActiveFriendData] = useState(null);
  const [activeFriendStatus, setActiveFriendStatus] = useState(null);

  // Resolve dados do amigo de forma performática
  useEffect(() => {
    if (!activeConversationId || !user) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const otherUid = conv.participants?.find((uid) => uid !== user.uid);
    if (!otherUid) return;

    const friendData = conv.participantsData?.[otherUid] || { uid: otherUid, displayName: 'Usuário' };
    setActiveFriendData(friendData);
    setActiveFriendStatus(friendsStatus[otherUid] || null);
  }, [activeConversationId, conversations, user, friendsStatus]);

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
      {/* ─── Botão Flutuante (FAB) ─── */}
      {showButton && (
        <motion.button
          onClick={toggleChat}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
            isChatOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
          } bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-500 text-white`}
          aria-label="Abrir mensagens"
        >
          <MessageSquare size={24} strokeWidth={2.5} />
          {totalUnread > 0 && (
            <div className="absolute -top-1 -right-1">
              <NotificationBadge count={totalUnread} pulse />
            </div>
          )}
        </motion.button>
      )}

      {/* ─── Overlay & Panel ─── */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop Mobile/Tablet */}
            <motion.div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[110] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChat}
            />

            {/* Painel Principal */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 z-[120] w-full md:w-[400px] bg-white dark:bg-slate-950 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[-10px_0_40px_rgba(0,0,0,0.4)] flex flex-col border-l border-slate-200/50 dark:border-slate-800/50"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 350 }}
            >
              <AnimatePresence mode="wait">
                {activeConversationId && activeFriendData ? (
                  /* Janela de Conversa Ativa */
                  <motion.div 
                    key="window"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <ChatWindow
                      conversationId={activeConversationId}
                      friendData={activeFriendData}
                      friendStatus={activeFriendStatus}
                      onBack={handleBack}
                      onClose={closeChat}
                    />
                  </motion.div>
                ) : (
                  /* Lista de Conversas */
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    {/* Header Premium da Lista */}
                    <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                          <MessageCircle size={20} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Mensagens</h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              {conversations.length} Ativa{conversations.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={closeChat}
                        aria-label="Fechar painel de mensagens"
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400"
                      >
                        <X size={20} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Lista Scrolável */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950">
                      <ChatList
                        conversations={conversations}
                        friendsStatus={friendsStatus}
                        onSelectConversation={handleSelectConversation}
                      />
                      
                      {/* Estado Vazio Amigável */}
                      {conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                            <Sparkles size={28} className="text-slate-300" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">Nenhuma conversa iniciada.</p>
                          <p className="text-[12px] text-slate-300 mt-1 uppercase tracking-tighter">Escolha um amigo para começar!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

ChatPanel.displayName = 'ChatPanel';
export default ChatPanel;