/**
 * 🏆 HOOK DE CONQUISTAS (Achievements)
 * 
 * Verifica conquistas do usuário com base nos dados do Firestore.
 * Totalmente client-side, sem coleção extra no banco.
 */

import { useState, useEffect, useCallback } from 'react';
import { listarFlashcards, listarResumos, listarMaterias, listarSimulados } from '../services/firebaseService';

// Definição de todas as conquistas
const CONQUISTAS = [
  // === Flashcards ===
  { id: 'fc_1',   icon: '🃏', titulo: 'Primeiro Passo',       desc: 'Crie seu primeiro flashcard',              categoria: 'Flashcards', check: (d) => d.flashcards >= 1 },
  { id: 'fc_10',  icon: '📚', titulo: 'Estudante Dedicado',   desc: 'Crie 10 flashcards',                       categoria: 'Flashcards', check: (d) => d.flashcards >= 10 },
  { id: 'fc_50',  icon: '🧠', titulo: 'Memória de Elefante',  desc: 'Crie 50 flashcards',                       categoria: 'Flashcards', check: (d) => d.flashcards >= 50 },
  { id: 'fc_100', icon: '🏅', titulo: 'Mestre dos Flashcards', desc: 'Crie 100 flashcards',                     categoria: 'Flashcards', check: (d) => d.flashcards >= 100 },
  { id: 'fc_200', icon: '💎', titulo: 'Enciclopédia Viva',     desc: 'Crie 200 flashcards',                     categoria: 'Flashcards', check: (d) => d.flashcards >= 200 },

  // === Resumos ===
  { id: 'rs_1',   icon: '📝', titulo: 'Primeira Anotação',    desc: 'Crie seu primeiro resumo',                  categoria: 'Resumos', check: (d) => d.resumos >= 1 },
  { id: 'rs_10',  icon: '📖', titulo: 'Escriba',              desc: 'Crie 10 resumos',                           categoria: 'Resumos', check: (d) => d.resumos >= 10 },
  { id: 'rs_25',  icon: '✍️', titulo: 'Autor Dedicado',       desc: 'Crie 25 resumos',                           categoria: 'Resumos', check: (d) => d.resumos >= 25 },
  { id: 'rs_50',  icon: '📕', titulo: 'Bibliotecário',        desc: 'Crie 50 resumos',                           categoria: 'Resumos', check: (d) => d.resumos >= 50 },

  // === Matérias ===
  { id: 'mt_3',   icon: '📂', titulo: 'Organizador',          desc: 'Tenha 3 matérias cadastradas',              categoria: 'Matérias', check: (d) => d.materias >= 3 },
  { id: 'mt_5',   icon: '🗂️', titulo: 'Multidisciplinar',     desc: 'Tenha 5 matérias cadastradas',              categoria: 'Matérias', check: (d) => d.materias >= 5 },
  { id: 'mt_10',  icon: '🎓', titulo: 'Currículo Completo',   desc: 'Tenha 10 matérias cadastradas',             categoria: 'Matérias', check: (d) => d.materias >= 10 },

  // === Simulados ===
  { id: 'sm_1',   icon: '🎯', titulo: 'Desbravador',          desc: 'Complete seu primeiro simulado',            categoria: 'Simulados', check: (d) => d.simulados >= 1 },
  { id: 'sm_5',   icon: '🔥', titulo: 'Em Chamas',            desc: 'Complete 5 simulados',                      categoria: 'Simulados', check: (d) => d.simulados >= 5 },
  { id: 'sm_20',  icon: '⚡', titulo: 'Imbatível',            desc: 'Complete 20 simulados',                     categoria: 'Simulados', check: (d) => d.simulados >= 20 },
  { id: 'sm_100', icon: '🏆', titulo: 'Nota Máxima',          desc: 'Tire 100% em um simulado',                  categoria: 'Simulados', check: (d) => d.bestSimulado === 100 },

  // === Streak ===
  { id: 'sk_3',   icon: '🔥', titulo: 'Consistente',          desc: 'Mantenha 3 dias de ofensiva',               categoria: 'Streak', check: (d) => d.streak >= 3 },
  { id: 'sk_7',   icon: '🗓️', titulo: 'Semana Perfeita',      desc: 'Mantenha 7 dias de ofensiva',               categoria: 'Streak', check: (d) => d.streak >= 7 },
  { id: 'sk_30',  icon: '🌟', titulo: 'Mês de Ouro',          desc: 'Mantenha 30 dias de ofensiva',              categoria: 'Streak', check: (d) => d.streak >= 30 },
  { id: 'sk_100', icon: '👑', titulo: 'Lenda',                desc: 'Mantenha 100 dias de ofensiva',              categoria: 'Streak', check: (d) => d.streak >= 100 },
];

export const useConquistas = (userId, streakData = null) => {
  const [conquistas, setConquistas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const calcular = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    
    try {
      setLoading(true);
      
      // Buscar dados em paralelo
      const [flashcards, resumos, materias, simulados] = await Promise.all([
        listarFlashcards(userId).catch(() => []),
        listarResumos(userId).catch(() => []),
        listarMaterias(userId).catch(() => []),
        listarSimulados(userId, 200).catch(() => []),
      ]);

      const bestSimulado = simulados.length > 0
        ? Math.max(...simulados.map(s => s.score || 0))
        : 0;

      const currentStreak = streakData?.currentStreak || 0;
      const bestStreak = streakData?.bestStreak || currentStreak;

      const dados = {
        flashcards: flashcards.length,
        resumos: resumos.length,
        materias: materias.length,
        simulados: simulados.length,
        bestSimulado,
        streak: Math.max(currentStreak, bestStreak),
      };

      setStats(dados);

      // Checar cada conquista
      const resultado = CONQUISTAS.map(c => ({
        ...c,
        desbloqueada: c.check(dados),
      }));

      setConquistas(resultado);
    } catch (err) {
      console.error('Erro ao calcular conquistas:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, streakData]);

  useEffect(() => {
    calcular();
  }, [calcular]);

  const totalDesbloqueadas = conquistas.filter(c => c.desbloqueada).length;
  const totalConquistas = conquistas.length;
  const percentual = totalConquistas > 0 ? Math.round((totalDesbloqueadas / totalConquistas) * 100) : 0;

  return {
    conquistas,
    stats,
    loading,
    totalDesbloqueadas,
    totalConquistas,
    percentual,
    recalcular: calcular,
  };
};

export default useConquistas;
