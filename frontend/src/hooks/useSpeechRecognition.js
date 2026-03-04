/**
 * @file useSpeechRecognition.js
 * @description Hook que abstrai a Web Speech API para reconhecimento de voz em português.
 * Converte áudio do microfone em texto e chama um callback com o resultado final.
 *
 * @dependencies
 *  - Web Speech API nativa do browser (SpeechRecognition / webkitSpeechRecognition)
 *
 * @sideEffects
 *  - Acessa o microfone do dispositivo (requer permissão do usuário)
 *  - Nenhum efeito colateral externo (não escreve em store ou Firestore)
 *
 * @notes
 *  - Suporte: Chrome/Edge (total), Safari (parcial), Firefox (não suportado em v2026)
 *  - `continuous: false` — a gravação para automaticamente após uma pausa de fala
 *  - `interimResults: true` — exibe texto parcial enquanto o usuário fala (feedback visual)
 *  - WARN: `onFinalResult` deve ser estabilizado com useCallback no componente pai —
 *          caso contrário, o hook recria o SpeechRecognition a cada render
 */

import { useState, useRef, useCallback } from 'react';

/**
 * Hook para reconhecimento de voz via Web Speech API.
 *
 * @param {(text: string) => void} onFinalResult - Callback chamado com o texto final reconhecido.
 *   WARN: estabilize com useCallback para evitar recriação desnecessária.
 * @returns {{ isListening, transcript, startListening, stopListening, isSupported, error }}
 */
const useSpeechRecognition = (onFinalResult) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);

  const isSupported =
    typeof window !== 'undefined' &&
    // NOTE: Chrome/Edge usam 'SpeechRecognition'; Safari usa o prefixo 'webkit'
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Navegador não suporta reconhecimento de voz.');
      return;
    }

    // Speech API pode falhar silenciosamente sem contexto seguro.
    // Localhost costuma ser permitido; em produção exige HTTPS.
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setError('Comando de voz requer contexto seguro (HTTPS).');
      return;
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Microfone não disponível neste navegador/dispositivo.');
        return;
      }

      if (navigator.permissions?.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          if (permission.state === 'denied') {
            setError('Permissão de microfone bloqueada no navegador. Libere e tente novamente.');
            return;
          }
        } catch {
          // Alguns browsers não suportam query para microphone — segue fluxo normal.
        }
      }

      // Força o prompt de permissão quando necessário e valida acesso real ao dispositivo.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      const errorName = err?.name || '';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setError('Permissão de microfone negada. Habilite nas configurações do navegador.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setError('Nenhum microfone encontrado no dispositivo.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setError('Não foi possível acessar o microfone (em uso por outro app).');
      } else {
        setError('Falha ao iniciar o microfone. Tente novamente.');
      }
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setError(null);
    };

    rec.onresult = (e) => {
      const res = e.results[e.resultIndex];
      const t = res[0].transcript;
      setTranscript(t);
      if (res.isFinal) {
        onFinalResult(t);
        setTranscript('');
      }
    };

    rec.onerror = (e) => {
      setError(
        e.error === 'not-allowed'
          ? 'Permissão de microfone negada. Habilite nas configurações do navegador.'
          : `Erro de voz: ${e.error}`
      );
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);

    recRef.current = rec;
    rec.start();
  }, [isSupported, onFinalResult]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported, error };
};

export default useSpeechRecognition;
