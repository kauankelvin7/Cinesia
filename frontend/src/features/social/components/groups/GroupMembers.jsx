/**
 * @file GroupMembers.jsx
 * @description Painel/modal de membros do grupo com opções de gerenciamento.
 */

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Crown,
  UserMinus,
  LogOut,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import OnlineIndicator from '../shared/OnlineIndicator';

const GroupMembers = memo(
  ({ isOpen, onClose, group, membersData = [], onRemoveMember, onLeaveGroup, onMessage }) => {
    const { user } = useAuth();

    const isAdmin = group?.createdBy === user?.uid;
    const memberCount = membersData.length;

    const handleRemove = useCallback(
      (memberId) => {
        if (!window.confirm('Remover este membro do grupo?')) return;
        onRemoveMember?.(memberId);
      },
      [onRemoveMember],
    );

    const handleLeave = useCallback(() => {
      if (!window.confirm('Deseja sair do grupo?')) return;
      onLeaveGroup?.();
    }, [onLeaveGroup]);

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-x-4 top-1/2 z-101 max-w-sm mx-auto"
              initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
              animate={{ opacity: 1, y: '-50%', scale: 1 }}
              exit={{ opacity: 0, y: '-45%', scale: 0.95 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Membros
                    </h3>
                    <p className="text-xs text-slate-500">
                      {memberCount} membro{memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Fechar"
                  >
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>

                {/* Members list */}
                <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
                  {membersData.map((member) => {
                    const isSelf = member.uid === user?.uid;
                    const isCreator = member.uid === group?.createdBy;
                    const initials = getInitials(member.displayName);
                    const bg = getAvatarColor(member.displayName);

                    return (
                      <div
                        key={member.uid}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="relative">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: bg }}
                            >
                              <span className="text-sm font-bold text-white">{initials}</span>
                            </div>
                          )}
                          <OnlineIndicator
                            isOnline={member.isOnline || false}
                            isStudying={member.isStudying || false}
                            size="sm"
                            className="absolute -bottom-0.5 -right-0.5"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {member.displayName}
                              {isSelf && (
                                <span className="ml-1 text-[10px] text-slate-400">(você)</span>
                              )}
                            </p>
                            {isCreator && (
                              <Crown
                                size={13}
                                className="text-amber-500 shrink-0"
                                title="Criador do grupo"
                              />
                            )}
                          </div>
                          {member.email && (
                            <p className="text-[10px] text-slate-400 truncate">
                              {member.email}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isSelf && onMessage && (
                            <button
                              onClick={() => onMessage(member)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Enviar mensagem"
                            >
                              <MessageCircle size={14} className="text-slate-400" />
                            </button>
                          )}
                          {isAdmin && !isSelf && (
                            <button
                              onClick={() => handleRemove(member.uid)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Remover do grupo"
                            >
                              <UserMinus size={14} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Leave group */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    onClick={handleLeave}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    Sair do grupo
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  },
);

GroupMembers.displayName = 'GroupMembers';
export default GroupMembers;
