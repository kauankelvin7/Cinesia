/**
 * @file kakabotActions.js
 * @description Parser e executor de ações do agente KakaBot. Extrai blocos ```action```
 * das respostas do Gemini e executa operações reais no Firestore.
 *
 * @dependencies
 *  - firebaseService.js (criarMateria, criarFlashcard, criarResumo, salvarEvento)
 *
 * @sideEffects
 *  - Escreve em `materias/{docId}`, `flashcards/{docId}`, `resumos/{docId}`, `eventos/{docId}`
 *  - Dispara CustomEvents (window) para notificar outros componentes:
 *    'cinesia:materia:alterada', 'cinesia:flashcard:alterado',
 *    'cinesia:resumo:alterado', 'cinesia:evento:alterado'
 *
 * @notes
 *  - Ações suportadas: CRIAR_MATERIA, CRIAR_FLASHCARD, CRIAR_MULTIPLOS_FLASHCARDS,
 *    CRIAR_RESUMO, AGENDAR_REVISAO, ATUALIZAR_PREFERENCIAS
 *  - WARN: ATUALIZAR_PREFERENCIAS não escreve no Firestore — retorna dados para
 *          o KakaBot.jsx atualizar a memória (trata separado)
 *  - NOTE: o bloco JSON esperado é delimitado por ```action ... ``` na resposta do Gemini
 */

import {
  criarMateria,
  criarFlashcard,
  criarResumo,
  salvarEvento,
} from '../services/firebaseService';

/**
 * Extrai o bloco ```action { ... }``` da resposta do Gemini.
 * Retorna o texto limpo (sem o bloco JSON) e a ação parseada.
 *
 * @param {string} texto - Resposta completa do Gemini
 * @returns {{ textoLimpo: string, acao: object|null }}
 */
export const extrairAcao = (texto) => {
  const regex = /```action\s*([\s\S]*?)```/;
  const match = texto.match(regex);

  if (!match) return { textoLimpo: texto, acao: null };

  try {
    const acao = JSON.parse(match[1].trim());
    const textoLimpo = texto.replace(regex, '').trim();
    return { textoLimpo, acao };
  } catch {
    console.warn('[KakaBot] Falha ao parsear bloco action:', match[1]);
    return { textoLimpo: texto, acao: null };
  }
};

/**
 * Executa uma ação no Firestore utilizando os serviços existentes.
 *
 * @param {object} acao        - { acao: string, dados: object }
 * @param {string} uid         - UID do usuário autenticado
 * @param {Array}  materias    - Lista de matérias do contexto (para lookup)
 * @returns {Promise<{ sucesso: boolean, mensagem: string, dadosRetorno?: any }>}
 */
export const executarAcao = async (acao, uid, materias = []) => {
  if (!acao || !uid) {
    return { sucesso: false, mensagem: '❌ Dados insuficientes para executar a ação.' };
  }

  try {
    switch (acao.acao) {
      /* ─── CRIAR MATÉRIA ─────────────────────────────── */
      case 'CRIAR_MATERIA': {
        const { nome, cor, descricao } = acao.dados || {};
        if (!nome) return { sucesso: false, mensagem: '❌ Nome da matéria é obrigatório.' };

        const result = await criarMateria(
          {
            nome,
            cor: cor || '#2563EB',
            descricao: descricao || '',
            criadoPorKaka: true,
          },
          uid
        );

        // Disparar evento para atualizar dashboard
        window.dispatchEvent(new CustomEvent('cinesia:materia:alterada'));

        return {
          sucesso: true,
          mensagem: `✅ Matéria **"${nome}"** criada com sucesso!`,
          dadosRetorno: { id: result.id, nome },
        };
      }

      /* ─── CRIAR FLASHCARD ───────────────────────────── */
      case 'CRIAR_FLASHCARD': {
        const { pergunta, resposta, materiaId } = acao.dados || {};
        if (!pergunta || !resposta) {
          return { sucesso: false, mensagem: '❌ Pergunta e resposta são obrigatórias.' };
        }

        // Resolver nome/cor da matéria se fornecido
        let materiaNome = null;
        let materiaCor = null;
        if (materiaId) {
          const mat = materias.find((m) => m.id === materiaId);
          if (mat) {
            materiaNome = mat.nome;
            materiaCor = mat.cor;
          }
        }

        const result = await criarFlashcard(
          {
            pergunta,
            resposta,
            materiaId: materiaId || null,
            materiaNome,
            materiaCor,
            criadoPorKaka: true,
          },
          null, // sem imagem
          uid
        );

        window.dispatchEvent(new CustomEvent('cinesia:flashcard:alterado'));

        return {
          sucesso: true,
          mensagem: `✅ Flashcard criado com sucesso!`,
          dadosRetorno: { id: result.id },
        };
      }

      /* ─── CRIAR MÚLTIPLOS FLASHCARDS ────────────────── */
      case 'CRIAR_MULTIPLOS_FLASHCARDS': {
        const { flashcards, materiaId } = acao.dados || {};
        if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
          return { sucesso: false, mensagem: '❌ Nenhum flashcard fornecido.' };
        }

        let materiaNome = null;
        let materiaCor = null;
        if (materiaId) {
          const mat = materias.find((m) => m.id === materiaId);
          if (mat) {
            materiaNome = mat.nome;
            materiaCor = mat.cor;
          }
        }

        const promises = flashcards.map((fc) =>
          criarFlashcard(
            {
              pergunta: fc.pergunta,
              resposta: fc.resposta,
              materiaId: materiaId || null,
              materiaNome,
              materiaCor,
              criadoPorKaka: true,
            },
            null,
            uid
          )
        );

        await Promise.all(promises);
        window.dispatchEvent(new CustomEvent('cinesia:flashcard:alterado'));

        return {
          sucesso: true,
          mensagem: `✅ **${flashcards.length} flashcards** criados com sucesso!`,
        };
      }

      /* ─── CRIAR RESUMO ─────────────────────────────── */
      case 'CRIAR_RESUMO': {
        const { titulo, conteudo, materiaId, tags } = acao.dados || {};
        if (!titulo || !conteudo) {
          return { sucesso: false, mensagem: '❌ Título e conteúdo são obrigatórios.' };
        }

        const result = await criarResumo(
          {
            titulo,
            conteudo,
            materiaId: materiaId || null,
            tags: tags || [],
            criadoPorKaka: true,
          },
          uid
        );

        // cinesia:resumo:alterado já é disparado dentro de criarResumo

        return {
          sucesso: true,
          mensagem: `✅ Resumo **"${titulo}"** criado com sucesso!`,
          dadosRetorno: { id: result.id },
        };
      }

      /* ─── AGENDAR REVISÃO (cria evento na agenda) ───── */
      case 'AGENDAR_REVISAO': {
        const { data, descricao, materiaId } = acao.dados || {};
        if (!data) {
          return { sucesso: false, mensagem: '❌ Data da revisão é obrigatória.' };
        }

        let titulo = descricao || 'Revisão agendada pelo Kaka';
        if (materiaId) {
          const mat = materias.find((m) => m.id === materiaId);
          if (mat) titulo = `📖 Revisão: ${mat.nome}`;
        }

        await salvarEvento(
          {
            titulo,
            data: new Date(data),
            tipo: 'estudo',
          },
          uid
        );

        window.dispatchEvent(new CustomEvent('cinesia:evento:alterado'));

        return {
          sucesso: true,
          mensagem: `✅ Revisão agendada para **${new Date(data).toLocaleDateString('pt-BR')}**!`,
        };
      }

      /* ─── ATUALIZAR PREFERÊNCIAS ────────────────────── */
      case 'ATUALIZAR_PREFERENCIAS': {
        // Retorna os dados para o caller atualizar a memória
        return {
          sucesso: true,
          mensagem: `✅ Preferências atualizadas! Vou me adaptar melhor para você.`,
          dadosRetorno: { preferencias: acao.dados },
        };
      }

      default:
        return { sucesso: false, mensagem: `❌ Ação desconhecida: **${acao.acao}**` };
    }
  } catch (error) {
    console.error('[KakaBot Action Error]', error);
    return {
      sucesso: false,
      mensagem: `❌ Erro ao executar ação: ${error.message || String(error)}`,
    };
  }
};
