/**
 * @file ChallengeInvite.jsx
 * @description Modal para convidar um amigo para desafio de flashcards.
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Loader2 } from 'lucide-react';
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

  // Busca flashcards do usuário para escolher deck
  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    setLoading(true);

    const fetchDecks = async () => {
      try {
        const q = query(
          collection(db, 'flashcards'),
          where('uid', '==', user.uid),
          limit(50),
        );
        const snap = await getDocs(q);
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Agrupa por matéria para criar "decks"
        const deckMap = {};
        raw.forEach((card) => {
          const key = card.materiaId || card.materia || 'Geral';
          if (!deckMap[key]) {
            deckMap[key] = {
              id: key,
              name: card.materiaNome || card.materia || 'Flashcards',
              materia: card.materia || '',
              cards: [],
            };
          }
          deckMap[key].cards.push(card);
        });

        setDecks(Object.values(deckMap).filter((d) => d.cards.length >= 3));
      } catch {
        setDecks([]);
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
      toast.success('Desafio enviado!');
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="relative bg-linear-to-r from-amber-500 to-orange-500 px-4 py-4">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 flex items-center justify-center p-1.5 rounded-lg bg-black/20 text-white hover:bg-black/30 transition-colors"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <Swords size={24} className="text-white" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Desafiar</h3>
                    <p className="text-sm text-white/80">{friend.displayName}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Escolha um deck de flashcards para o duelo:
                </p>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                  </div>
                ) : decks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Você precisa ter pelo menos 3 flashcards para criar um desafio.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-62.5 overflow-y-auto">
                    {decks.map((deck) => (
                      <div
                        key={deck.id}
                        onClick={() => setSelectedDeck(deck)}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                          ${selectedDeck?.id === deck.id
                            ? 'bg-amber-500/15 border-2 border-amber-500/40 ring-1 ring-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                          }
                        `}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <span className="text-lg">🃏</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {deck.name}
                          </p>
                          <p className="text-xs text-slate-500">{deck.cards.length} cards</p>
                        </div>
                        {selectedDeck?.id === deck.id && (
                          <span className="text-amber-500 text-sm font-bold">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={handleSend}
                  disabled={!selectedDeck || sending}
                  className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Swords size={16} /> Enviar Desafio!
                    </>
                  )}
                </button>
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
