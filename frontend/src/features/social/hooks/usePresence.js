/**
 * @file usePresence.js
 * @description Hook para gerenciar sistema de presença (online/offline/estudando).
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext-firebase';
import { presenceService } from '../services/presenceService';

/**
 * Inicializa o sistema de presença para o usuário autenticado.
 * Atualiza a página atual automaticamente quando `currentPage` muda.
 *
 * @param {string} currentPage - Nome da página atual (ex: 'home', 'flashcards')
 */
export function usePresence(currentPage = 'home') {
  const { user } = useAuth();
  const unsubRef = useRef(null);

  // Inicializa presença no login
  useEffect(() => {
    if (!user?.uid) return;

    unsubRef.current = presenceService.initPresence(user.uid, currentPage);

    return () => {
      if (typeof unsubRef.current === 'function') {
        unsubRef.current();
      }
    };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualiza página atual
  useEffect(() => {
    if (!user?.uid) return;
    presenceService.setCurrentPage(user.uid, currentPage);
  }, [currentPage, user?.uid]);

  return null;
}
