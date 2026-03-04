/**
 * @file useTextToSpeech.js
 * @description Hook para narrar texto usando a Web Speech API (SpeechSynthesis).
 * Limpa markdown antes de falar para não narrar asteriscos e underlines.
 *
 * @sideEffects Nenhum — apenas controla o sintetizador de voz do navegador.
 * @notes Vozes disponíveis variam por sistema operacional. pt-BR funciona bem
 *        no Chrome (Google) e Safari (Siri). Firefox tem suporte limitado.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Remove formatação markdown do texto antes de narrar.
 * NOTE: narrar "**espasticidade**" resultaria em "asterisco asterisco espasticidade..."
 */
const limparMarkdown = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // negrito
    .replace(/\*(.*?)\*/g, '$1')       // itálico
    .replace(/_(.*?)_/g, '$1')         // itálico alternativo
    .replace(/`(.*?)`/g, '$1')         // código inline
    .replace(/#{1,6}\s/g, '')          // títulos
    .replace(/\n{2,}/g, '. ')          // parágrafos viram pausa
    .replace(/\n/g, ' ')              // quebras de linha
    .replace(/[•\-]\s/g, '')           // bullets
    .trim();

/**
 * @returns {{ speak: Function, stop: Function, isSupported: boolean, isSpeaking: boolean, activeId: string|null }}
 */
const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const utteranceRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Cancelar ao desmontar
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  /**
   * Seleciona a melhor voz pt-BR disponível no sistema.
   * Prioridade: Google PT-BR > Microsoft PT-BR > qualquer pt-BR > fallback
   */
  const selecionarVoz = useCallback(() => {
    const vozes = window.speechSynthesis.getVoices();
    return (
      vozes.find(v => v.lang === 'pt-BR' && v.name.includes('Google')) ||
      vozes.find(v => v.lang === 'pt-BR' && v.name.includes('Microsoft')) ||
      vozes.find(v => v.lang === 'pt-BR') ||
      vozes.find(v => v.lang.startsWith('pt')) ||
      null
    );
  }, []);

  const speak = useCallback((text, messageId) => {
    if (!isSupported) return;

    // Se já está narrando a mesma mensagem, para (toggle)
    if (isSpeaking && activeId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveId(null);
      return;
    }

    // Cancelar narração anterior se houver
    window.speechSynthesis.cancel();

    const textoLimpo = limparMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(textoLimpo);

    // Configurações de voz
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;  // Ligeiramente mais lento que o padrão — mais natural
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Tentar aplicar voz pt-BR — vozes carregam de forma assíncrona
    const aplicarVoz = () => {
      const voz = selecionarVoz();
      if (voz) utterance.voice = voz;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      aplicarVoz();
    } else {
      // WARN: vozes podem não estar carregadas ainda — aguardar evento
      window.speechSynthesis.addEventListener('voiceschanged', aplicarVoz, { once: true });
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveId(messageId);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveId(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isSpeaking, activeId, selecionarVoz]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setActiveId(null);
  }, []);

  return { speak, stop, isSupported, isSpeaking, activeId };
};

export default useTextToSpeech;
