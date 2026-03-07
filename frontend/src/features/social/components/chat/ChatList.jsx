/**
 * 📱 CHAT LIST
 * * Lista de conversas otimizada com hierarquia visual clara.
 * - Suporte a badges dinâmicos e previews de conteúdo especial
 * - Diferenciação visual entre grupos e chats diretos
 * - Feedback tátil e estados de hover refinados
 */

import React, { memo } from 'react';
import { MessageCircle, Search, Swords, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import OnlineIndicator from '../shared/OnlineIndicator';
import { formatMessageTime, truncateText, getInitials, getAvatarColor } from '../../utils/chatHelpers';

const ChatList = memo(({ conversations, friendsStatus, onSelectConversation }) => {
  const { user } = useAuth();

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800 shadow-inner">
          <MessageCircle size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-[14px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Silêncio por aqui...</h3>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-2 max-w-[200px] leading-relaxed font-medium">
          Escolha um amigo para começar a trocar conhecimentos!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const otherUid = conv.participants?.find((uid) => uid !== user?.uid);
        const otherData = conv.participantsData?.[otherUid] || {};
        const unreadCount = conv.unreadCount?.[user?.uid] || 0;
        const status = friendsStatus?.[otherUid];
        const isOnline = status?.isOnline || false;
        const isStudying = status?.isStudying || false;

        const displayName = conv.type === 'group'
          ? conv.groupName || 'Grupo de Estudo'
          : otherData.displayName || 'Usuário Cinesia';

        const initials = getInitials(displayName);
        const avatarBg = getAvatarColor(displayName);
        const photoURL = conv.type === 'group' ? conv.groupPhoto : otherData.photoURL;

        // Preview de conteúdo inteligente
        const renderPreview = () => {
          if (!conv.lastMessage) return 'Nenhuma mensagem ainda';
          const prefix = conv.lastMessage.senderId === user?.uid ? 'Você: ' : '';
          
          if (conv.lastMessage.type === 'challenge_invite') return <span className="text-amber-500 font-bold flex items-center gap-1"><Swords size={12} /> Desafio enviado</span>;
          if (conv.lastMessage.type === 'resumo') return <span className="text-indigo-500 font-bold flex items-center gap-1"><FileText size={12} /> Resumo compartilhado</span>;
          
          return `${prefix}${truncateText(conv.lastMessage.text || '', 35)}`;
        };

        return (
          <motion.div
            key={conv.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectConversation(conv)}
            className={`
              relative flex items-center gap-4 px-4 py-4 rounded-[22px] cursor-pointer transition-all duration-200 group
              ${unreadCount > 0
                ? 'bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/40 shadow-sm'
                : 'hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:shadow-md'
              }
            `}
          >
            {/* Indicador lateral de Unread */}
            {unreadCount > 0 && (
              <div className="absolute left-1 w-1 h-8 bg-indigo-500 rounded-full" />
            )}

            {/* Avatar Section */}
            <div className="relative shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className={`w-14 h-14 object-cover shadow-sm transition-transform group-hover:scale-105 ${conv.type === 'group' ? 'rounded-2xl' : 'rounded-full border-2 border-white dark:border-slate-800'}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-14 h-14 flex items-center justify-center text-white text-base font-black shadow-inner ${conv.type === 'group' ? 'rounded-2xl' : 'rounded-full'}`}
                  style={{ backgroundColor: avatarBg }}
                >
                  {conv.type === 'group' ? <Sparkles size={20} /> : initials}
                </div>
              )}
              
              {conv.type === 'direct' && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineIndicator isOnline={isOnline} isStudying={isStudying} size="md" pulse />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h4 className={`text-[15px] truncate tracking-tight ${unreadCount > 0 ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                  {displayName}
                </h4>
                {conv.lastMessage?.timestamp && (
                  <span className={`text-[10px] font-bold uppercase tracking-tighter shrink-0 ${unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                    {formatMessageTime(conv.lastMessage.timestamp)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className={`text-[13px] truncate ${unreadCount > 0 ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-500 dark:text-slate-500 font-medium'}`}>
                  {renderPreview()}
                </p>
                
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                    className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black shadow-lg shadow-indigo-500/30"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

ChatList.displayName = 'ChatList';
export default ChatList;