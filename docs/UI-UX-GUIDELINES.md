# Cinesia — Diretrizes de UI/UX

**Status:** canônico  
**Atualizado em:** 18/09/2026

Este documento define a direção visual e de experiência do Cinesia. Ele existe para evitar que cada tela resolva os mesmos problemas de uma forma diferente.

## 1. Princípio central

O Cinesia é uma ferramenta de estudo.

A interface deve ajudar a pessoa a responder rapidamente:

1. onde estou;
2. o que tenho para fazer agora;
3. o que acontece se eu tocar aqui;
4. se meu dado foi salvo;
5. como volto ou me recupero de um erro.

Decoração só entra quando melhora compreensão, hierarquia ou identidade.

## 2. O que evitar

Não usar como padrão:

- frases motivacionais genéricas;
- “premium”, “revolucionário”, “medical precision” ou linguagem promocional dentro do produto;
- social proof inventado;
- gradiente em todo CTA;
- glow para simular importância;
- excesso de pills;
- títulos inteiros em caixa alta;
- tracking exagerado em textos pequenos;
- cards dentro de cards sem necessidade;
- animação contínua apenas para “dar vida”;
- ícone animado quando estado textual simples comunica melhor.

## 3. Linguagem

Copy deve parecer escrita por uma pessoa que conhece o produto.

### Preferir

> Não consegui salvar o resumo. Tente de novo.

> 4 flashcards estão prontos para revisar.

> Sem revisões pendentes agora.

> Preparando seu espaço de estudo…

### Evitar

> ERRO CRÍTICO DE PERSISTÊNCIA.

> Você está construindo um futuro extraordinário!

> Aguarde enquanto sincronizamos sua experiência premium.

> Seu futuro paciente agradece cada minuto de estudo.

### Mensagem de erro

Uma boa mensagem responde, quando possível:

1. o que não deu certo;
2. se algo foi perdido;
3. o que a pessoa pode fazer agora.

Detalhes técnicos ficam no console de desenvolvimento, não na interface.

## 4. Hierarquia visual

### Tela

- uma ação principal clara por contexto;
- ações secundárias visualmente abaixo da principal;
- informação de contexto antes de métricas decorativas;
- espaço em branco é parte da composição.

### Cards

Cards representam agrupamento real de conteúdo, não são a moldura padrão de todo elemento.

Raio recomendado:

- controles: 8–12 px;
- cards: 12–16 px;
- modal: até 20 px quando necessário;
- pill: somente status, filtro ou controle cuja semântica justifique cápsula.

### Cor

A paleta atual continua:

- azul: ação/estrutura;
- teal: suporte/estudo;
- laranja: atenção/revisão;
- vermelho: destrutivo/erro;
- verde: sucesso.

Cor nunca é o único indicador de estado.

## 5. Tipografia

Inter permanece como fonte principal e JetBrains Mono fica reservada para números, métricas e conteúdo que se beneficia de alinhamento monoespaçado.

Regras:

- sentence case por padrão;
- uppercase apenas em micro-rótulos realmente categóricos;
- evitar `tracking-widest` em textos corridos;
- peso 600 é suficiente para a maioria dos títulos;
- 700/800 deve indicar prioridade, não ser o padrão de tudo.

## 6. Controles

### Botões

Primário:

- cor sólida;
- sem gradiente obrigatório;
- movimento máximo de 1 px no hover;
- loading mantém contexto da ação.

Exemplos:

- `Entrar`
- `Salvar resumo`
- `Revisar agora`

Evitar:

- `Entrar no Sistema`
- `Começar Minha Jornada`
- `Confirmar Operação`

### Campos

Todo campo precisa de:

- label associado via `htmlFor/id`;
- estado de erro com `aria-invalid`;
- descrição/erro ligado por `aria-describedby`;
- autocomplete quando aplicável;
- placeholder como exemplo, não substituto de label.

## 7. Estados

### Loading

Loading global deve ser calmo e curto.

Não usar partículas aleatórias, vários glows, shimmer de marca e animação de texto ao mesmo tempo.

### Empty state

Um vazio deve explicar:

- o que está vazio;
- por que isso importa;
- qual é o próximo passo possível.

### Sucesso

Feedback de sucesso precisa confirmar a ação, não comemorar excessivamente.

Preferir:

> Perfil atualizado.

Evitar:

> Perfil atualizado! ✨

## 8. Motion

Motion deve explicar mudança, não chamar atenção para si.

Padrões:

- hover: 120–180 ms;
- entrada de conteúdo: 180–300 ms;
- modal/drawer: até 350 ms;
- deslocamentos pequenos;
- evitar spring elástico em controles comuns;
- nenhuma animação essencial;
- respeitar `prefers-reduced-motion`.

Animação contínua é reservada a progresso/loading que realmente está acontecendo.

## 9. Acessibilidade

Mínimo obrigatório:

- foco visível;
- teclado;
- nome acessível em botões de ícone;
- touch target de cerca de 44 px em mobile;
- contraste suficiente;
- reflow em 200%;
- reduced motion;
- erros anunciáveis;
- modal com gerenciamento de foco quando aplicável;
- gesto nunca como único meio de ação.

## 10. Dashboard

O dashboard deve priorizar ação.

Ordem conceitual:

1. contexto atual;
2. revisões pendentes;
3. agenda próxima;
4. atalhos;
5. progresso;
6. métricas históricas.

Frases motivacionais aleatórias não fazem parte da hierarquia.

## 11. Login

O login deve comunicar produto sem virar landing page.

A copy atual usa benefício factual:

> Estude sem espalhar tudo em cinco lugares.

E explica o que isso significa:

> Matérias, resumos, flashcards, simulados e ferramentas de apoio ficam juntos para você continuar de onde parou.

Não usar números de usuários, resultados ou promessas que o produto não mede.

## 12. Revisão de copy

Antes de adicionar texto à interface, perguntar:

- isso ajuda a tomar uma decisão?
- isso explica um estado?
- isso reduz incerteza?
- isso é factual?
- parece algo que uma pessoa diria?

Se a resposta for “não” para tudo, provavelmente o texto pode ser removido.

## 13. Definition of Done de UI

Uma mudança visual relevante só está pronta quando:

- desktop e mobile mantêm hierarquia;
- teclado funciona;
- loading/erro/vazio foram considerados;
- reduced motion não quebra a leitura;
- copy foi revisada;
- não adicionou dependência visual sem necessidade;
- lint, testes e build passam;
- regressões visuais importantes entram no plano de E2E/visual regression.
