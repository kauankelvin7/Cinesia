/**
 * ⚔️ CHALLENGE INVITE MODAL PREMIUM — v2.0
 * * Modal gamificado para seleção e envio de desafios.
 * - Header temático com contexto do oponente
 * - Cards de deck interativos com feedback visual de seleção
 * - Botões de ação com alta proeminência (Gamification UI)
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Loader2, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../../config/firebase-config';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const ChallengeInvite = memo(({ isOpen, onClose, friend, onSendChallenge }) => {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    setLoading(true);
    setSelectedDeck(null); // Resetar seleção ao abrir

    const fetchDecks = async () => {
      try {
        const q = query(
          collection(db, 'flashcards'),
          where('uid', '==', user.uid),
          limit(50),
        );
        const snap = await getDocs(q);
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const deckMap = {};
        raw.forEach((card) => {
          const key = card.materiaId || card.materia || 'Geral';
          if (!deckMap[key]) {
            deckMap[key] = {
              id: key,
              name: card.materiaNome || card.materia || 'Estudos Gerais',
              materia: card.materia || '',
              cards: [],
            };
          }
          deckMap[key].cards.push(card);
        });

        // Ordena por quantidade de cards (maiores primeiro)
        const validDecks = Object.values(deckMap)
          .filter((d) => d.cards.length >= 3)
          .sort((a, b) => b.cards.length - a.cards.length);

        setDecks(validDecks);
      } catch {
        setDecks([]);
        toast.error('Erro ao carregar seus flashcards.');
      }
      setLoading(false);
    };
    fetchDecks();
  }, [isOpen, user?.uid]);

  const handleSend = async () => {
    if (!selectedDeck || !friend) return;
    setSending(true);
    try {
      await onSendChallenge(friend, selectedDeck);
      // O toast de sucesso já é disparado no onSendChallenge, mas se precisar:
      // toast.success('Desafio enviado! Prepare-se! 🚀');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar desafio');
    }
    setSending(false);
  };

  if (!friend) return null;
  const initials = getInitials(friend.displayName);
  const avatarBg = getAvatarColor(friend.displayName);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Escuro */}
          <motion.div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="fixed inset-x-4 top-1/2 z-[101] max-w-sm mx-auto"
            initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
            animate={{ opacity: 1, y: '-50%', scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }}
            exit={{ opacity: 0, y: '-45%', scale: 0.95, transition: { duration: 0.2 } }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden flex flex-col max-h-[85vh]">
              
              {/* ─── Header Gamificado ─── */}
              <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 px-5 py-6 shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 flex items-center justify-center p-2 rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-md transition-all active:scale-90 z-10"
                  aria-label="Fechar"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border-2 border-white/30 shadow-inner">
                       <Swords size={32} className="text-white drop-shadow-md" strokeWidth={2} />
                    </div>
                    {/* Mini avatar do oponente */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-amber-500 overflow-hidden bg-white">
                      {friend.photoURL ? (
                        <img src={friend.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white" style={{ backgroundColor: avatarBg }}>
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-sm leading-none mb-1">Duelo Real</h3>
                  <p className="text-sm font-bold text-orange-50 opacity-90">Desafiando {friend.displayName.split(' ')[0]}</p>
                </div>
              </div>

              {/* ─── Body (Seleção de Deck) ─── */}
              <div className="p-5 flex flex-col flex-1 min-h-0">
                <div className="mb-4 text-center shrink-0">
                  <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Escolha sua arma</h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Selecione um deck de estudos para a batalha</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <Loader2 size={24} className="animate-spin text-amber-500" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Buscando decks...</span>
                    </div>
                  ) : decks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <BrainCircuit size={32} className="text-slate-300 mb-3" strokeWidth={1.5} />
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Seu arsenal está vazio
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Você precisa ter pelo menos 3 flashcards da mesma matéria para iniciar um duelo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {decks.map((deck) => {
                        const isSelected = selectedDeck?.id === deck.id;
                        return (
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            key={deck.id}
                            onClick={() => setSelectedDeck(deck)}
                            className={`
                              relative flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 shadow-md shadow-amber-500/10'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/50'
                              }
                            `}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              <BrainCircuit size={20} strokeWidth={isSelected ? 2.5 : 2} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-[14px] font-bold truncate transition-colors ${isSelected ? 'text-amber-700 dark:text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                {deck.name}
                              </p>
                              <p className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                {deck.cards.length} cards
                              </p>
                            </div>
                            
                            {/* Checkmark animado */}
                            <div className="shrink-0 w-6 flex justify-end">
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                    <CheckCircle2 size={20} className="text-amber-500" strokeWidth={2.5} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ─── Footer (Ação) ─── */}
                <div className="pt-4 mt-2 shrink-0 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleSend}
                    disabled={!selectedDeck || sending || decks.length === 0}
                    className={`
                      w-full py-3.5 rounded-2xl font-black text-[15px] uppercase tracking-wider transition-all flex items-center justify-center gap-2
                      ${(!selectedDeck || decks.length === 0) 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/25 active:scale-[0.98]'
                      }
                    `}
                  >
                    {sending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Swords size={20} strokeWidth={2.5} /> Lançar Desafio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

ChallengeInvite.displayName = 'ChallengeInvite';
export default ChallengeInvite;