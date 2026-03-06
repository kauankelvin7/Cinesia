/**
 * @file GroupList.jsx
 * @description Lista de grupos de estudo do usuário com preview de atividade.
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, MessageCircle, ChevronRight, BookOpen } from 'lucide-react';
import { formatChatTime } from '../../utils/chatHelpers';
import OnlineIndicator from '../shared/OnlineIndicator';

const GroupList = memo(({ groups, onSelectGroup, onCreateGroup }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
          <Users size={28} className="text-violet-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
          Nenhum grupo ainda
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
          Crie um grupo para estudar com seus amigos!
        </p>
        <button
          onClick={onCreateGroup}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Criar Grupo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Create button */}
      <button
        onClick={onCreateGroup}
        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-sm text-violet-600 dark:text-violet-400 font-medium"
      >
        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <Plus size={18} className="text-violet-500" />
        </div>
        Criar novo grupo
      </button>

      <AnimatePresence mode="popLayout">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            onClick={() => onSelectGroup(group)}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors border border-slate-100 dark:border-slate-700"
          >
            {/* Group avatar */}
            <div className="relative w-12 h-12 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              {group.photoURL ? (
                <img
                  src={group.photoURL}
                  alt={group.groupName}
                  className="w-12 h-12 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <BookOpen size={20} className="text-white" />
              )}
              <span className="absolute -bottom-1 -right-1 bg-violet-600 text-white text-[9px] font-bold px-1.5 rounded-full border-2 border-white dark:border-slate-800">
                {group.participants?.length || 0}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {group.groupName}
                </h4>
                {group.lastMessage?.timestamp && (
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {formatChatTime(group.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              {group.lastMessage && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {group.lastMessage.senderName ? (
                    <span className="font-medium">{group.lastMessage.senderName}: </span>
                  ) : null}
                  {group.lastMessage.text}
                </p>
              )}
              {group.description && !group.lastMessage && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{group.description}</p>
              )}
            </div>

            <ChevronRight size={16} className="text-slate-300 shrink-0" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

GroupList.displayName = 'GroupList';
export default GroupList;
