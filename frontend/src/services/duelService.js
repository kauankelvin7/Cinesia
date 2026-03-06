import { GoogleGenerativeAI } from '@google/generative-ai';

// Estratégia 1: IA Gemini
export async function gerarDistratoresComIA(pergunta, respostaCorreta, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Você é um gerador de questões de múltipla escolha para fisioterapia.\n\nPergunta: "${pergunta}"\nResposta correta: "${respostaCorreta}"\n\nGere EXATAMENTE 3 alternativas ERRADAS para esta questão.\n\nREGRAS OBRIGATÓRIAS:\n- As alternativas erradas devem ser do MESMO TIPO que a resposta certa\n- Devem parecer plausíveis para quem não estudou bem\n- NÃO podem ser obviamente absurdas ou de outro tema completamente diferente\n- NÃO podem ser iguais à resposta correta\n- Devem ter tamanho e formato parecidos com a resposta correta\n- Devem ser tecnicamente incorretas para ESTA pergunta específica\n\nResponda APENAS com JSON puro, sem markdown, sem explicação:\n{"distratores": ["alternativa errada 1", "alternativa errada 2", "alternativa errada 3"]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonLimpo = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(jsonLimpo);
    if (
      !Array.isArray(parsed.distratores) ||
      parsed.distratores.length < 3 ||
      parsed.distratores.some(d => typeof d !== 'string' || d.trim() === '')
    ) {
      throw new Error('Resposta da IA inválida');
    }
    return parsed.distratores.map(d => d.trim());
  } catch (err) {
    console.warn('[Duelo] IA falhou ao gerar distratores:', err?.message);
    return null;
  }
}

// Estratégia 2: Fallback
export function gerarDistratoresFallback(cardAtual, todosOsCards) {
  const candidatos = todosOsCards
    .filter(c => c.id !== cardAtual.id)
    .filter(c => c.back && c.back.trim() !== '')
    .filter(c => c.back.trim() !== cardAtual.back.trim());

  const palavrasChave = (cardAtual.front || '')
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(' ')
    .filter(p => p.length > 4);

  const relacionados = candidatos.filter(c =>
    palavrasChave.some(palavra =>
      (c.front || '').toLowerCase().includes(palavra) ||
      (c.back || '').toLowerCase().includes(palavra)
    )
  );

  const pool = relacionados.length >= 3 ? relacionados : candidatos;

  return pool
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c.back.trim());
}
