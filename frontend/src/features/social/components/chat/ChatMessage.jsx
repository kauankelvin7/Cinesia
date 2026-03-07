import React, { memo, useState, useCallback, useEffect } from 'react';
import { Trash2, Copy, Check, Swords, Trophy, Clock, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase-config';
import MessageStatus from './MessageStatus';
import ShareContent from '../shared/ShareContent';
import { formatChatTime } from '../../utils/chatHelpers';
import { toast } from 'sonner';

/* ─── Challenge Invite Message ─── */
const ChallengeInviteMessage = memo(({ attachedContent, isOwn, createdAt, onAcceptChallenge, onDeclineChallenge }) => {
  const [challengeStatus, setChallengeStatus] = useState(null);
  const challengeId = attachedContent?.challengeId;

  useEffect(() => {
    if (!challengeId) return;
    const unsub = onSnapshot(
      doc(db, 'challenges', challengeId),
      (snap) => setChallengeStatus(snap.exists() ? snap.data().status : 'expired'),
      () => setChallengeStatus('expired'),
    );
    return () => unsub();
  }, [challengeId]);

  const status = challengeStatus ?? 'pending';

  const renderStatus = () => {
    if (status === 'in_progress') return <div className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"><Loader2 size={12} className="animate-spin" /> Duelo em curso!</div>;
    if (status === 'cancelled' || status === 'declined') return <div className="py-1.5 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg uppercase tracking-tighter">Desafio recusado</div>;
    if (status === 'expired') return <div className="py-1.5 text-center text-[11px] font-bold text-slate-400 bg-slate-100 rounded-lg uppercase tracking-tighter"><Clock size={12} className="inline mr-1" /> Expirado</div>;
    if (status === 'finished') return <div className="py-1.5 text-center text-[11px] font-bold text-indigo-500 bg-indigo-50 rounded-lg uppercase tracking-tighter"><Trophy size={12} className="inline mr-1" /> Finalizado</div>;

    if (!isOwn && status === 'pending') return (
      <div className="flex gap-2">
        <button onClick={() => onAcceptChallenge?.(challengeId)} className="flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Aceitar ⚔️</button>
        <button onClick={() => onDeclineChallenge?.(challengeId)} className="flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all">Recusar</button>
      </div>
    );
    return <p className="text-[11px] font-bold text-amber-600/80 text-center py-1.5 uppercase tracking-widest animate-pulse">Aguardando resposta...</p>;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <motion.div whileHover={{ y: -2 }} className="max-w-[80%] rounded-[24px] overflow-hidden border-2 border-amber-400/40 bg-white dark:bg-slate-900 shadow-xl">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 pb-3">
           <div className="flex items-center justify-between mb-3 text-white">
             <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shadow-inner"><Swords size={20} strokeWidth={2.5} /></div>
             <span className="text-[10px] font-black uppercase tracking-widest bg-black/10 px-2 py-1 rounded-md">Desafio Real</span>
           </div>
           <h4 className="text-[15px] font-black text-white leading-tight mb-1">Duelo de Flashcards!</h4>
           <p className="text-amber-50 text-[11px] font-bold uppercase tracking-tighter opacity-90 italic">Deck: {attachedContent.deckName}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4 mb-4">
             <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="w-full h-full bg-amber-400" /></div>
             <span className="text-[10px] font-black text-slate-400">{attachedContent.cardCount} Cards</span>
          </div>
          {renderStatus()}
          <div className="mt-3 flex justify-end">
            <span className="text-[9px] font-bold text-slate-300 uppercase">{formatChatTime(createdAt)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

/* ─── Chat Message Main Component ─── */
const ChatMessage = memo(({ message, isOwn, isFirstInGroup, isLastInGroup, onOpenContent, onAcceptChallenge, onDeclineChallenge, onDelete }) => {
  // 1. Extração de dados
  const { type, text, attachedContent, createdAt, status, readBy, senderId } = message;

  // 2. TODOS OS HOOKS DEVEM FICAR NO TOPO, SEMPRE!
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e) => {
    e.stopPropagation();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setShowActions(false);
      toast.success('Mensagem copiada');
    }
  }, [text]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete?.(message.id);
    setShowActions(false);
  }, [message.id, onDelete]);

  const isEmojiOnly = text && /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}\u200d\uFE0F\s]{1,11}$/u.test(text.trim()) && text.trim().length <= 11;

  // 3. APENAS DEPOIS DOS HOOKS PODEMOS TER RETORNOS CONDICIONAIS
  if (type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 px-4 py-1.5 rounded-full backdrop-blur-md">
          {text}
        </span>
      </div>
    );
  }

  if (type === 'challenge_invite' && attachedContent) {
    return <ChallengeInviteMessage attachedContent={attachedContent} isOwn={isOwn} createdAt={createdAt} onAcceptChallenge={onAcceptChallenge} onDeclineChallenge={onDeclineChallenge} />;
  }

  const bubbleStyles = isOwn 
    ? `${isFirstInGroup ? 'rounded-t-[20px]' : 'rounded-t-[6px]'} ${isLastInGroup ? 'rounded-bl-[20px] rounded-br-[4px]' : 'rounded-b-[6px]'} rounded-l-[20px] bg-indigo-600 text-white shadow-md shadow-indigo-500/10`
    : `${isFirstInGroup ? 'rounded-t-[20px]' : 'rounded-t-[6px]'} ${isLastInGroup ? 'rounded-br-[20px] rounded-bl-[4px]' : 'rounded-b-[6px]'} rounded-r-[20px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm`;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'} group px-2`}>
      <div className="relative max-w-[80%]">
        <AnimatePresence>
          {showActions && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 z-20 flex gap-1 p-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl`}>
              <button onClick={handleCopy} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all active:scale-90">{copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}</button>
              {isOwn && <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-all active:scale-90"><Trash2 size={16} /></button>}
            </motion.div>
          )}
        </AnimatePresence>

        <div onClick={() => setShowActions(!showActions)} className={`relative px-4 py-2.5 cursor-pointer transition-all duration-200 active:scale-[0.98] ${isEmojiOnly ? 'bg-transparent shadow-none border-none !px-1' : bubbleStyles}`}>
          {type === 'challenge_result' && (
             <div className="mb-2 p-3 bg-white/10 dark:bg-black/20 rounded-xl border border-white/10 text-center">
                <Trophy size={20} className="mx-auto text-amber-300 mb-1" />
                <p className="text-[12px] font-black uppercase tracking-tighter italic">Resultado: {attachedContent.deckName}</p>
                <div className="flex justify-center gap-4 mt-2">
                   {Object.entries(attachedContent.scores || {}).map(([uid, d]) => (
                     <div key={uid} className="flex flex-col"><span className="text-lg font-black">{d.correct}/{d.total}</span><span className="text-[8px] uppercase opacity-60">{attachedContent.winnerId === uid ? '🏅 Win' : 'Ponto'}</span></div>
                   ))}
                </div>
             </div>
          )}
          {(type === 'resumo' || type === 'flashcard') && attachedContent && <div className="mb-2 -mx-1"><ShareContent content={attachedContent} onOpen={onOpenContent} /></div>}
          <p className={`${isEmojiOnly ? 'text-5xl' : 'text-[14px]'} font-medium leading-relaxed whitespace-pre-wrap break-words`}>{text}</p>
          {!isEmojiOnly && (
            <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[9px] font-bold uppercase tracking-tighter ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>{formatChatTime(createdAt)}</span>
              {isOwn && <MessageStatus status={status} readBy={readBy} senderId={senderId} />}
            </div>
          )}
        </div>
        {isEmojiOnly && (
           <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
             <span className="text-[9px] font-bold text-slate-400 uppercase">{formatChatTime(createdAt)}</span>
             {isOwn && <MessageStatus status={status} readBy={readBy} senderId={senderId} />}
           </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;