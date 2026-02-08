/**
 * 📋 CONSULTA RÁPIDA - Tabelas de Referência para Fisioterapia
 * 
 * Dados de referência rápida para estudantes:
 * - Sinais Vitais (FC, FR, PA, Temperatura)
 * - Dermátomos
 * - Amplitude de Movimento (ADM)
 * - Graus de Força Muscular
 * - Escalas de Dor
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Heart,
  Activity,
  Thermometer,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { Input } from '../components/ui/Input';

// ===================== DADOS DE REFERÊNCIA =====================

const sinaisVitais = {
  titulo: 'Sinais Vitais',
  icon: Heart,
  cor: 'from-rose-500 to-pink-500',
  dados: [
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
  ]
};

const dermatomos = {
  titulo: 'Dermátomos',
  icon: Activity,
  cor: 'from-blue-500 to-cyan-500',
  dados: [
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
  ]
};

const admReferencia = {
  titulo: 'Amplitude de Movimento (ADM)',
  icon: Activity,
  cor: 'from-emerald-500 to-teal-500',
  dados: [
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
  ]
};

const forcaMuscular = {
  titulo: 'Graus de Força Muscular',
  icon: Activity,
  cor: 'from-amber-500 to-orange-500',
  dados: [
    { grau: '0', descricao: 'Zero', definicao: 'Nenhuma contração muscular detectada' },
    { grau: '1', descricao: 'Traço', definicao: 'Contração palpável, sem movimento articular' },
    { grau: '2', descricao: 'Fraco', definicao: 'Movimento completo sem gravidade' },
    { grau: '3', descricao: 'Regular', definicao: 'Movimento completo contra gravidade' },
    { grau: '4', descricao: 'Bom', definicao: 'Movimento contra resistência moderada' },
    { grau: '5', descricao: 'Normal', definicao: 'Movimento contra resistência máxima' }
  ]
};

const escalasDor = {
  titulo: 'Escalas de Dor',
  icon: Thermometer,
  cor: 'from-purple-500 to-pink-500',
  dados: {
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
  }
};

// ===================== COMPONENTES =====================

const AccordionItem = ({ item, isOpen, onToggle, children }) => {
  const IconComponent = item.icon;
  
  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.cor} flex items-center justify-center shadow-lg`}>
            <IconComponent size={24} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900">{item.titulo}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={24} className="text-slate-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Tabela estilizada
const Table = ({ headers, children }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full text-sm">
      <thead className="bg-slate-50">
        <tr>
          {headers.map((header, idx) => (
            <th key={idx} className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {children}
      </tbody>
    </table>
  </div>
);

function ConsultaRapida() {
  const [openSections, setOpenSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (section) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // 🔍 Função para verificar se um texto contém o termo de busca
  const matchSearch = (text) => {
    if (!searchTerm.trim()) return true;
    return text?.toString().toLowerCase().includes(searchTerm.toLowerCase());
  };

  // 🔍 Filtrar SINAIS VITAIS
  const filteredSinaisVitais = {
    ...sinaisVitais,
    dados: sinaisVitais.dados
      .map(param => ({
        ...param,
        valores: param.valores.filter(v => 
          matchSearch(v.faixa) || 
          matchSearch(v.normal) || 
          matchSearch(v.observacao) ||
          matchSearch(param.parametro)
        )
      }))
      .filter(param => param.valores.length > 0 || matchSearch(param.parametro))
  };

  // 🔍 Filtrar DERMÁTOMOS
  const filteredDermatomos = {
    ...dermatomos,
    dados: dermatomos.dados.filter(d => 
      matchSearch(d.nivel) || 
      matchSearch(d.area) || 
      matchSearch(d.musculo)
    )
  };

  // 🔍 Filtrar ADM
  const filteredAdm = {
    ...admReferencia,
    dados: admReferencia.dados
      .map(art => ({
        ...art,
        movimentos: art.movimentos.filter(m => 
          matchSearch(m.movimento) || 
          matchSearch(m.graus) ||
          matchSearch(art.articulacao)
        )
      }))
      .filter(art => art.movimentos.length > 0 || matchSearch(art.articulacao))
  };

  // 🔍 Filtrar FORÇA MUSCULAR
  const filteredForca = {
    ...forcaMuscular,
    dados: forcaMuscular.dados.filter(f => 
      matchSearch(f.grau) || 
      matchSearch(f.descricao) || 
      matchSearch(f.definicao)
    )
  };

  // 🔍 Filtrar ESCALAS DE DOR
  const filteredDor = {
    ...escalasDor,
    dados: {
      evn: escalasDor.dados.evn.filter(e => 
        matchSearch(e.valor) || 
        matchSearch(e.descricao)
      ),
      observacoes: escalasDor.dados.observacoes.filter(obs => matchSearch(obs))
    }
  };

  // 🔍 Verificar se seção tem resultados
  const hasResults = {
    sinais: filteredSinaisVitais.dados.some(p => p.valores.length > 0),
    dermatomos: filteredDermatomos.dados.length > 0,
    adm: filteredAdm.dados.some(a => a.movimentos.length > 0),
    forca: filteredForca.dados.length > 0,
    dor: filteredDor.dados.evn.length > 0 || filteredDor.dados.observacoes.length > 0
  };

  // 🔍 Auto-abrir seções com resultados quando buscando
  const shouldShow = (sectionKey) => {
    if (!searchTerm.trim()) return true;
    return hasResults[sectionKey];
  };

  const sections = [
    { key: 'sinais', data: sinaisVitais },
    { key: 'dermatomos', data: dermatomos },
    { key: 'adm', data: admReferencia },
    { key: 'forca', data: forcaMuscular },
    { key: 'dor', data: escalasDor }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 pb-32 pt-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col ipad:flex-row ipad:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <ClipboardList size={32} className="text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl ipad:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Consulta Rápida
                </h1>
                <p className="text-slate-600 flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-500" />
                  Valores de referência para Fisioterapia
                </p>
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar referência... (Ex: FC adulto, C5, flexão ombro)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </motion.div>

        {/* Accordions */}
        <div className="space-y-4">
          {/* Mensagem quando não há resultados */}
          {searchTerm.trim() && !Object.values(hasResults).some(v => v) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-white rounded-2xl border border-slate-200"
            >
              <Search size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">
                Nenhum resultado para "{searchTerm}"
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Tente buscar por: FC, PA, C5, ombro, flexão...
              </p>
            </motion.div>
          )}

          {/* === SINAIS VITAIS === */}
          {shouldShow('sinais') && (
            <AccordionItem
              item={sinaisVitais}
              isOpen={openSections.includes('sinais') || (searchTerm.trim() && hasResults.sinais)}
              onToggle={() => toggleSection('sinais')}
            >
              <div className="space-y-6">
                {filteredSinaisVitais.dados.map((param, idx) => (
                  param.valores.length > 0 && (
                    <div key={idx}>
                      <h4 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        {param.parametro}
                        <span className="text-xs font-normal text-slate-500">({param.unidade})</span>
                      </h4>
                      <Table headers={['Faixa Etária', 'Valor Normal', 'Observação']}>
                        {param.valores.map((v, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-4 py-3 text-slate-700 font-medium">{v.faixa}</td>
                            <td className="px-4 py-3 text-emerald-700 font-semibold">{v.normal}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{v.observacao || '-'}</td>
                          </tr>
                        ))}
                      </Table>
                    </div>
                  )
                ))}
              </div>
            </AccordionItem>
          )}

          {/* === DERMÁTOMOS === */}
          {shouldShow('dermatomos') && (
            <AccordionItem
              item={dermatomos}
              isOpen={openSections.includes('dermatomos') || (searchTerm.trim() && hasResults.dermatomos)}
              onToggle={() => toggleSection('dermatomos')}
            >
              <Table headers={['Nível', 'Área Sensorial', 'Músculo-Chave']}>
                {filteredDermatomos.dados.map((d, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 font-bold text-blue-600">{d.nivel}</td>
                    <td className="px-4 py-3 text-slate-700">{d.area}</td>
                    <td className="px-4 py-3 text-slate-600">{d.musculo}</td>
                  </tr>
                ))}
              </Table>
            </AccordionItem>
          )}

          {/* === ADM === */}
          {shouldShow('adm') && (
            <AccordionItem
              item={admReferencia}
              isOpen={openSections.includes('adm') || (searchTerm.trim() && hasResults.adm)}
              onToggle={() => toggleSection('adm')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAdm.dados.map((art, idx) => (
                  art.movimentos.length > 0 && (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <ChevronRight size={18} className="text-emerald-500" />
                        {art.articulacao}
                      </h4>
                      <div className="space-y-2">
                        {art.movimentos.map((m, i) => (
                          <div key={i} className="flex items-center justify-between py-1 border-b border-slate-200 last:border-0">
                            <span className="text-slate-700 text-sm">{m.movimento}</span>
                            <span className="text-emerald-600 font-semibold text-sm">{m.graus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </AccordionItem>
          )}

          {/* === FORÇA MUSCULAR === */}
          {shouldShow('forca') && (
            <AccordionItem
              item={forcaMuscular}
              isOpen={openSections.includes('forca') || (searchTerm.trim() && hasResults.forca)}
              onToggle={() => toggleSection('forca')}
            >
              <Table headers={['Grau', 'Descrição', 'Definição']}>
                {filteredForca.dados.map((f, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 font-bold text-amber-600 text-lg">{f.grau}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{f.descricao}</td>
                    <td className="px-4 py-3 text-slate-600">{f.definicao}</td>
                  </tr>
                ))}
              </Table>
            </AccordionItem>
          )}

          {/* === ESCALAS DE DOR === */}
          {shouldShow('dor') && (
            <AccordionItem
              item={escalasDor}
              isOpen={openSections.includes('dor') || (searchTerm.trim() && hasResults.dor)}
              onToggle={() => toggleSection('dor')}
            >
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-slate-800 mb-3">
                  Escala Verbal Numérica (EVN) / Escala Visual Analógica (EVA)
                </h4>
                {filteredDor.dados.evn.length > 0 && (
                  <Table headers={['Valor', 'Classificação']}>
                    {filteredDor.dados.evn.map((e, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-3 font-bold text-purple-600">{e.valor}</td>
                        <td className="px-4 py-3 text-slate-700">{e.descricao}</td>
                      </tr>
                    ))}
                  </Table>
                )}
                
                {filteredDor.dados.observacoes.length > 0 && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                    <h5 className="text-sm font-semibold text-purple-800 mb-2">Observações Importantes:</h5>
                    <ul className="space-y-1">
                      {filteredDor.dados.observacoes.map((obs, idx) => (
                        <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          {obs}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionItem>
          )}
        </div>

        {/* Dica */}
        <motion.div
          className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Dica de Estudo
              </p>
              <p className="text-sm text-emerald-700">
                Use esses valores como referência rápida durante estudos e práticas clínicas. 
                Lembre-se: valores podem variar de acordo com a fonte bibliográfica e condição do paciente.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ConsultaRapida;
