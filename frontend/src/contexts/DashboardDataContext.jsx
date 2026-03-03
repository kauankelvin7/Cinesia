/**
 * 📦 DASHBOARD DATA CONTEXT - Cache compartilhado de dados
 * 
 * Evita queries duplicadas ao Firestore quando o usuário
 * navega entre Home e Matérias (ambas usam getDashboardStats).
 * 
 * - Carrega dados uma vez por sessão
 * - Invalida com refreshData() após mutações (criar/editar/deletar)
 * - Fornece loading e error states
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboardService';

const DashboardDataContext = createContext(null);

// Tempo mínimo entre refetches automáticos (30 segundos)
const MIN_REFETCH_INTERVAL = 30 * 1000;

export const DashboardDataProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const dataRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
  const currentUserRef = useRef(null);

  // Keep dataRef in sync with data state to avoid stale closures in loadData
  useEffect(() => { dataRef.current = data; }, [data]);

  /**
   * Carrega dados se ainda não foram carregados ou se forçado
   * @param {string} userId - UID do usuário
   * @param {boolean} force - Forçar refetch mesmo se já carregado
   */
  const loadData = useCallback(async (userId, force = false) => {
    if (!userId) return null;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    // Se já tem dados para o mesmo usuário e não é forçado,
    // e o último fetch foi há menos de 30s, retorna o cache
    if (
      !force &&
      dataRef.current &&
      currentUserRef.current === userId &&
      timeSinceLastFetch < MIN_REFETCH_INTERVAL
    ) {
      return dataRef.current;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getDashboardStats(userId);
      setData(result);
      currentUserRef.current = userId;
      lastFetchRef.current = Date.now();
      return result;
    } catch (err) {
      console.error('[DashboardDataContext] Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados');
      return null;
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Força refetch dos dados (chamar após mutações)
   * @param {string} userId - UID do usuário
   */
  const refreshData = useCallback(async (userId) => {
    return loadData(userId, true);
  }, [loadData]);

  /**
   * Limpa o cache (usar no logout)
   */
  const clearCache = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    lastFetchRef.current = 0;
    currentUserRef.current = null;
  }, []);

  return (
    <DashboardDataContext.Provider
      value={{
        data,
        isLoading,
        error,
        loadData,
        refreshData,
        clearCache,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
};

/**
 * Hook para acessar o cache de dados do dashboard
 */
export const useDashboardData = () => {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData deve ser usado dentro de DashboardDataProvider');
  }
  return context;
};

export default DashboardDataContext;
