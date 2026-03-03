/**
 * 📋 CONSULTA RÁPIDA - Dados de Referência para Fisioterapia
 * 
 * Arquivo separado para manter o componente limpo e os dados reutilizáveis.
 * Contém: Sinais Vitais, Dermátomos, ADM, Força Muscular, Escalas de Dor.
 */

export const sinaisVitaisData = [
  {
    parametro: 'Frequência Cardíaca (FC)',
    unidade: 'bpm',
    valores: [
      { faixa: 'Recém-nascido', normal: '120-160', observacao: 'Pode variar com choro' },
      { faixa: 'Lactente (1-12m)', normal: '100-150', observacao: '' },
      { faixa: 'Criança (1-10 anos)', normal: '70-120', observacao: '' },
      { faixa: 'Adolescente', normal: '60-100', observacao: '' },
      { faixa: 'Adulto', normal: '60-100', observacao: 'Bradicardia <60, Taquicardia >100' },
      { faixa: 'Idoso', normal: '60-100', observacao: 'Variabilidade diminuída' },
      { faixa: 'Atleta', normal: '40-60', observacao: 'Bradicardia fisiológica' }
    ]
  },
  {
    parametro: 'Frequência Respiratória (FR)',
    unidade: 'irpm',
    valores: [
      { faixa: 'Recém-nascido', normal: '30-60', observacao: 'Respiração abdominal' },
      { faixa: 'Lactente', normal: '25-50', observacao: '' },
      { faixa: 'Criança (1-5 anos)', normal: '20-30', observacao: '' },
      { faixa: 'Criança (6-12 anos)', normal: '18-25', observacao: '' },
      { faixa: 'Adolescente/Adulto', normal: '12-20', observacao: 'Eupneia' },
      { faixa: 'Idoso', normal: '12-20', observacao: 'Pode apresentar padrões alterados' }
    ]
  },
  {
    parametro: 'Pressão Arterial (PA)',
    unidade: 'mmHg',
    valores: [
      { faixa: 'Lactente', normal: '80/50', observacao: 'Aproximado' },
      { faixa: 'Criança (3-5 anos)', normal: '95/60', observacao: '' },
      { faixa: 'Criança (6-10 anos)', normal: '100/65', observacao: '' },
      { faixa: 'Adolescente', normal: '110/70', observacao: '' },
      { faixa: 'Adulto (Normal)', normal: '<120/80', observacao: 'Ótima' },
      { faixa: 'Adulto (Elevada)', normal: '120-129/<80', observacao: 'Monitorar' },
      { faixa: 'Hipertensão Estágio 1', normal: '130-139/80-89', observacao: 'Tratamento' },
      { faixa: 'Hipertensão Estágio 2', normal: '≥140/90', observacao: 'Tratamento intensivo' },
      { faixa: 'Crise Hipertensiva', normal: '>180/120', observacao: 'Emergência!' }
    ]
  },
  {
    parametro: 'Temperatura Corporal',
    unidade: '°C',
    valores: [
      { faixa: 'Hipotermia', normal: '<35.0', observacao: 'Emergência abaixo de 32°C' },
      { faixa: 'Normal (Axilar)', normal: '35.5-37.0', observacao: 'Referência mais comum' },
      { faixa: 'Normal (Oral)', normal: '36.0-37.4', observacao: '' },
      { faixa: 'Normal (Retal)', normal: '36.6-38.0', observacao: 'Padrão ouro em crianças' },
      { faixa: 'Febrícula', normal: '37.3-37.8', observacao: 'Axilar' },
      { faixa: 'Febre', normal: '>37.8', observacao: 'Axilar' },
      { faixa: 'Febre Alta', normal: '>39.0', observacao: 'Atenção especial' },
      { faixa: 'Hiperpirexia', normal: '>41.0', observacao: 'Emergência!' }
    ]
  },
  {
    parametro: 'Saturação de O₂ (SpO₂)',
    unidade: '%',
    valores: [
      { faixa: 'Normal', normal: '95-100', observacao: 'Em ar ambiente' },
      { faixa: 'Hipoxemia Leve', normal: '91-94', observacao: 'Monitorar' },
      { faixa: 'Hipoxemia Moderada', normal: '86-90', observacao: 'Oxigenoterapia' },
      { faixa: 'Hipoxemia Grave', normal: '<85', observacao: 'Emergência!' }
    ]
  }
];

export const dermatomosData = [
  { nivel: 'C3', area: 'Região supraclavicular', musculo: '-' },
  { nivel: 'C4', area: 'Região do ombro (parte superior)', musculo: 'Trapézio Superior' },
  { nivel: 'C5', area: 'Face lateral do braço (deltoide)', musculo: 'Deltoide, Bíceps' },
  { nivel: 'C6', area: 'Face lateral do antebraço, polegar, indicador', musculo: 'Extensores do Punho' },
  { nivel: 'C7', area: 'Dedo médio, dorso da mão', musculo: 'Tríceps' },
  { nivel: 'C8', area: 'Dedos anular e mínimo, borda ulnar', musculo: 'Flexores dos Dedos' },
  { nivel: 'T1', area: 'Face medial do antebraço', musculo: 'Intrínsecos da Mão' },
  { nivel: 'T4', area: 'Linha mamilar', musculo: '-' },
  { nivel: 'T10', area: 'Linha umbilical', musculo: '-' },
  { nivel: 'T12', area: 'Região suprapúbica', musculo: '-' },
  { nivel: 'L1', area: 'Região inguinal', musculo: 'Iliopsoas' },
  { nivel: 'L2', area: 'Face anterior da coxa (superior)', musculo: 'Iliopsoas' },
  { nivel: 'L3', area: 'Face anterior da coxa (inferior), joelho', musculo: 'Quadríceps' },
  { nivel: 'L4', area: 'Face medial da perna, maléolo medial', musculo: 'Tibial Anterior' },
  { nivel: 'L5', area: 'Dorso do pé, hálux', musculo: 'Extensor Longo do Hálux' },
  { nivel: 'S1', area: 'Face lateral e planta do pé, maléolo lateral', musculo: 'Fibulares, Tríceps Sural' },
  { nivel: 'S2', area: 'Face posterior da coxa', musculo: 'Isquiotibiais' },
  { nivel: 'S3-S5', area: 'Região perineal (sela)', musculo: 'Esfíncteres' }
];

export const admData = [
  {
    articulacao: 'Ombro',
    movimentos: [
      { movimento: 'Flexão', graus: '0-180°' },
      { movimento: 'Extensão', graus: '0-45°' },
      { movimento: 'Abdução', graus: '0-180°' },
      { movimento: 'Adução', graus: '0-30°' },
      { movimento: 'Rotação Interna', graus: '0-70°' },
      { movimento: 'Rotação Externa', graus: '0-90°' }
    ]
  },
  {
    articulacao: 'Cotovelo',
    movimentos: [
      { movimento: 'Flexão', graus: '0-145°' },
      { movimento: 'Extensão', graus: '145-0°' },
      { movimento: 'Pronação', graus: '0-90°' },
      { movimento: 'Supinação', graus: '0-90°' }
    ]
  },
  {
    articulacao: 'Punho',
    movimentos: [
      { movimento: 'Flexão', graus: '0-80°' },
      { movimento: 'Extensão', graus: '0-70°' },
      { movimento: 'Desvio Radial', graus: '0-20°' },
      { movimento: 'Desvio Ulnar', graus: '0-35°' }
    ]
  },
  {
    articulacao: 'Quadril',
    movimentos: [
      { movimento: 'Flexão', graus: '0-120°' },
      { movimento: 'Extensão', graus: '0-30°' },
      { movimento: 'Abdução', graus: '0-45°' },
      { movimento: 'Adução', graus: '0-30°' },
      { movimento: 'Rotação Interna', graus: '0-45°' },
      { movimento: 'Rotação Externa', graus: '0-45°' }
    ]
  },
  {
    articulacao: 'Joelho',
    movimentos: [
      { movimento: 'Flexão', graus: '0-140°' },
      { movimento: 'Extensão', graus: '140-0°' }
    ]
  },
  {
    articulacao: 'Tornozelo',
    movimentos: [
      { movimento: 'Dorsiflexão', graus: '0-20°' },
      { movimento: 'Plantiflexão', graus: '0-50°' },
      { movimento: 'Inversão', graus: '0-35°' },
      { movimento: 'Eversão', graus: '0-20°' }
    ]
  },
  {
    articulacao: 'Coluna Cervical',
    movimentos: [
      { movimento: 'Flexão', graus: '0-45°' },
      { movimento: 'Extensão', graus: '0-45°' },
      { movimento: 'Inclinação Lateral', graus: '0-45°' },
      { movimento: 'Rotação', graus: '0-60°' }
    ]
  },
  {
    articulacao: 'Coluna Lombar',
    movimentos: [
      { movimento: 'Flexão', graus: '0-60°' },
      { movimento: 'Extensão', graus: '0-25°' },
      { movimento: 'Inclinação Lateral', graus: '0-25°' },
      { movimento: 'Rotação', graus: '0-30°' }
    ]
  }
];

export const forcaMuscularData = [
  { grau: '0', descricao: 'Zero', definicao: 'Nenhuma contração muscular detectada' },
  { grau: '1', descricao: 'Traço', definicao: 'Contração palpável, sem movimento articular' },
  { grau: '2', descricao: 'Fraco', definicao: 'Movimento completo sem gravidade' },
  { grau: '3', descricao: 'Regular', definicao: 'Movimento completo contra gravidade' },
  { grau: '4', descricao: 'Bom', definicao: 'Movimento contra resistência moderada' },
  { grau: '5', descricao: 'Normal', definicao: 'Movimento contra resistência máxima' }
];

export const escalasDorData = {
  evn: [
    { valor: '0', descricao: 'Sem dor' },
    { valor: '1-3', descricao: 'Dor leve (não interfere nas atividades)' },
    { valor: '4-6', descricao: 'Dor moderada (interfere parcialmente)' },
    { valor: '7-9', descricao: 'Dor intensa (interfere significativamente)' },
    { valor: '10', descricao: 'Pior dor imaginável' }
  ],
  observacoes: [
    'EVA (Escala Visual Analógica): Linha de 10cm, paciente marca o ponto',
    'EVN (Escala Verbal Numérica): Paciente escolhe número de 0 a 10',
    'Escala de Faces: Útil para crianças e pacientes com dificuldade cognitiva',
    'Questionário McGill: Avaliação multidimensional da dor'
  ]
};

// ==================== TESTES ORTOPÉDICOS ====================
export const testesOrtopedicosData = [
  {
    regiao: 'Ombro',
    testes: [
      { nome: 'Neer', objetivo: 'Impacto subacromial', tecnica: 'Elevação passiva do membro com rotação interna', positivo: 'Dor no arco de elevação (60-120°)' },
      { nome: 'Hawkins-Kennedy', objetivo: 'Impacto subacromial', tecnica: 'Flexão 90° + rotação interna passiva', positivo: 'Dor na região subacromial' },
      { nome: 'Jobe (Empty Can)', objetivo: 'Supraespinhal', tecnica: 'Abdução 90°, 30° flexão horizontal, rotação interna, resistência', positivo: 'Dor ou fraqueza' },
      { nome: 'Speed', objetivo: 'Bíceps (cabeça longa)', tecnica: 'Flexão resistida com cotovelo estendido e supinado', positivo: 'Dor no sulco bicipital' },
      { nome: 'Apprehension', objetivo: 'Instabilidade anterior', tecnica: 'Abdução 90° + rotação externa passiva', positivo: 'Apreensão ou dor' },
      { nome: 'Drop Arm', objetivo: 'Manguito rotador (ruptura completa)', tecnica: 'Abaixar lentamente o braço da abdução completa', positivo: 'Incapacidade de controlar a descida' },
    ]
  },
  {
    regiao: 'Joelho',
    testes: [
      { nome: 'Lachman', objetivo: 'LCA (Ligamento Cruzado Anterior)', tecnica: 'Flexão 20-30°, translação anterior da tíbia', positivo: 'Translação excessiva sem endpoint firme' },
      { nome: 'Gaveta Anterior', objetivo: 'LCA', tecnica: 'Flexão 90°, puxar tíbia anteriormente', positivo: 'Translação anterior excessiva' },
      { nome: 'Gaveta Posterior', objetivo: 'LCP', tecnica: 'Flexão 90°, empurrar tíbia posteriormente', positivo: 'Translação posterior excessiva' },
      { nome: 'McMurray', objetivo: 'Meniscos', tecnica: 'Flexão máxima → extensão com rotação e varo/valgo', positivo: 'Estalido ou dor na interlinha articular' },
      { nome: 'Apley', objetivo: 'Meniscos', tecnica: 'Decúbito ventral, flexão 90°, compressão + rotação', positivo: 'Dor com compressão (menisco), alívio com distração (ligamento)' },
      { nome: 'Varo/Valgo Stress', objetivo: 'Ligamentos colaterais', tecnica: 'Estresse em valgo (LCM) ou varo (LCL) em 0° e 30°', positivo: 'Abertura articular excessiva' },
    ]
  },
  {
    regiao: 'Coluna Lombar',
    testes: [
      { nome: 'Lasègue (SLR)', objetivo: 'Compressão radicular (ciática)', tecnica: 'Elevação da perna estendida em decúbito dorsal', positivo: 'Dor irradiada entre 30-70° de elevação' },
      { nome: 'Slump Test', objetivo: 'Tensão neural', tecnica: 'Sentado: flexão cervical → extensão do joelho → dorsiflexão', positivo: 'Reprodução dos sintomas, alívio com extensão cervical' },
      { nome: 'Valsalva', objetivo: 'Hérnia discal / massa ocupando espaço', tecnica: 'Paciente faz força como "expulsar"', positivo: 'Dor radicular' },
    ]
  },
  {
    regiao: 'Quadril',
    testes: [
      { nome: 'Patrick (FABER)', objetivo: 'Articulação sacroilíaca / quadril', tecnica: 'Flexão, Abdução, Rotação Externa + pressão no joelho e EIAS contralateral', positivo: 'Dor inguinal (quadril) ou sacral (SI)' },
      { nome: 'Thomas', objetivo: 'Contratura do iliopsoas', tecnica: 'Uma perna fletida ao peito, observar a outra', positivo: 'Coxa contralateral se eleva da maca' },
      { nome: 'Trendelenburg', objetivo: 'Fraqueza dos abdutores (glúteo médio)', tecnica: 'Apoio unipodal', positivo: 'Pelve cai para o lado não apoiado' },
    ]
  },
  {
    regiao: 'Tornozelo',
    testes: [
      { nome: 'Gaveta Anterior', objetivo: 'LTFA (Ligamento Talofibular Anterior)', tecnica: 'Pé em plantiflexão, translação anterior do tálus', positivo: 'Translação anterior excessiva' },
      { nome: 'Thompson', objetivo: 'Ruptura do tendão de Aquiles', tecnica: 'Compressão da panturrilha com paciente em decúbito ventral', positivo: 'Ausência de plantiflexão passiva' },
    ]
  }
];

// ==================== ESCALA DE GLASGOW ====================
export const glasgowData = {
  componentes: [
    {
      componente: 'Abertura Ocular (AO)',
      respostas: [
        { pontuacao: 4, resposta: 'Espontânea' },
        { pontuacao: 3, resposta: 'Ao estímulo verbal' },
        { pontuacao: 2, resposta: 'Ao estímulo doloroso' },
        { pontuacao: 1, resposta: 'Nenhuma' },
      ]
    },
    {
      componente: 'Resposta Verbal (RV)',
      respostas: [
        { pontuacao: 5, resposta: 'Orientada' },
        { pontuacao: 4, resposta: 'Confusa' },
        { pontuacao: 3, resposta: 'Palavras inapropriadas' },
        { pontuacao: 2, resposta: 'Sons incompreensíveis' },
        { pontuacao: 1, resposta: 'Nenhuma' },
      ]
    },
    {
      componente: 'Resposta Motora (RM)',
      respostas: [
        { pontuacao: 6, resposta: 'Obedece comandos' },
        { pontuacao: 5, resposta: 'Localiza dor' },
        { pontuacao: 4, resposta: 'Flexão normal (retirada)' },
        { pontuacao: 3, resposta: 'Flexão anormal (decorticação)' },
        { pontuacao: 2, resposta: 'Extensão (descerebração)' },
        { pontuacao: 1, resposta: 'Nenhuma' },
      ]
    }
  ],
  classificacao: [
    { faixa: '15', descricao: 'Normal' },
    { faixa: '13-14', descricao: 'TCE Leve' },
    { faixa: '9-12', descricao: 'TCE Moderado' },
    { faixa: '3-8', descricao: 'TCE Grave' },
    { faixa: '3', descricao: 'Coma profundo' },
  ]
};

// ==================== ESCALA DE BARTHEL (AVDs) ====================
export const barthelData = [
  { atividade: 'Alimentação', pontuacao: '0/5/10', descricao: '0=Dependente, 5=Necessita ajuda, 10=Independente' },
  { atividade: 'Banho', pontuacao: '0/5', descricao: '0=Dependente, 5=Independente' },
  { atividade: 'Higiene Pessoal', pontuacao: '0/5', descricao: '0=Necessita ajuda, 5=Independente' },
  { atividade: 'Vestuário', pontuacao: '0/5/10', descricao: '0=Dependente, 5=Necessita ajuda, 10=Independente' },
  { atividade: 'Controle Intestinal', pontuacao: '0/5/10', descricao: '0=Incontinente, 5=Acidente ocasional, 10=Continente' },
  { atividade: 'Controle Vesical', pontuacao: '0/5/10', descricao: '0=Incontinente, 5=Acidente ocasional, 10=Continente' },
  { atividade: 'Uso do Banheiro', pontuacao: '0/5/10', descricao: '0=Dependente, 5=Necessita ajuda, 10=Independente' },
  { atividade: 'Transferências', pontuacao: '0/5/10/15', descricao: '0=Incapaz, 5=Grande ajuda, 10=Pequena ajuda, 15=Independente' },
  { atividade: 'Mobilidade', pontuacao: '0/5/10/15', descricao: '0=Imóvel, 5=Cadeira de rodas, 10=Anda com ajuda, 15=Independente' },
  { atividade: 'Escadas', pontuacao: '0/5/10', descricao: '0=Incapaz, 5=Necessita ajuda, 10=Independente' },
];

// ==================== ESCALA DE BORG ====================
export const borgData = [
  { valor: '6', descricao: 'Nenhum esforço', zona: 'Repouso' },
  { valor: '7-8', descricao: 'Extremamente leve', zona: 'Muito leve' },
  { valor: '9-10', descricao: 'Muito leve', zona: 'Leve' },
  { valor: '11-12', descricao: 'Leve', zona: 'Moderado' },
  { valor: '13-14', descricao: 'Um pouco difícil', zona: 'Moderado-intenso' },
  { valor: '15-16', descricao: 'Difícil', zona: 'Intenso' },
  { valor: '17-18', descricao: 'Muito difícil', zona: 'Muito intenso' },
  { valor: '19-20', descricao: 'Extremamente difícil / Máximo', zona: 'Exaustivo' },
];

// ==================== PROTOCOLOS DE REABILITAÇÃO ====================
export const protocolosReabData = [
  {
    protocolo: 'Pós-operatório LCA (Ligamento Cruzado Anterior)',
    fases: [
      { fase: 'Fase 1 (0-2 sem)', objetivos: 'Controle da dor e edema, ADM 0-90°, ativação do quadríceps', exercicios: 'Crioterapia, isométricos de quadríceps, elevação do membro, flexão passiva' },
      { fase: 'Fase 2 (2-6 sem)', objetivos: 'ADM completa, propriocepção, marcha sem muletas', exercicios: 'Bicicleta, agachamento parcial, propriocepção bipodal, fortalecimento progressivo' },
      { fase: 'Fase 3 (6-12 sem)', objetivos: 'Fortalecimento avançado, atividades funcionais', exercicios: 'Leg press, agachamento completo, propriocepção unipodal, exercícios em cadeia fechada' },
      { fase: 'Fase 4 (3-6 meses)', objetivos: 'Retorno ao esporte, treino pliométrico', exercicios: 'Corrida progressiva, saltos, agilidade, treino esporte-específico' },
    ]
  },
  {
    protocolo: 'Reabilitação Pós-AVC',
    fases: [
      { fase: 'Fase Aguda (UTI/Enfermaria)', objetivos: 'Posicionamento, prevenção de complicações', exercicios: 'Mudanças de decúbito, mobilização precoce, exercícios respiratórios' },
      { fase: 'Fase Subaguda', objetivos: 'Mobilidade, transferências, treino de equilíbrio', exercicios: 'Treino de sedestação, transferências, ortostase, treino de marcha com apoio' },
      { fase: 'Fase Crônica', objetivos: 'Independência funcional, reintegração social', exercicios: 'Treino de marcha comunitária, AVDs, fortalecimento, atividades bimanuais' },
    ]
  },
  {
    protocolo: 'Pós-operatório Manguito Rotador',
    fases: [
      { fase: 'Fase 1 (0-6 sem)', objetivos: 'Proteção do reparo, controle de dor', exercicios: 'Pendulares de Codman, tipoia, mobilização passiva assistida do terapeuta' },
      { fase: 'Fase 2 (6-12 sem)', objetivos: 'ADM ativa, início do fortalecimento leve', exercicios: 'Exercícios ativo-assistidos, isométricos em cadeia fechada, fortalecimento de escápula' },
      { fase: 'Fase 3 (12-24 sem)', objetivos: 'Fortalecimento progressivo, retorno funcional', exercicios: 'Fortalecimento com elásticos, exercícios excêntricos, cadeia cinética completa' },
    ]
  }
];
