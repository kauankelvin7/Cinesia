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
