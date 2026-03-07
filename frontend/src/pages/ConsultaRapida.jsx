/**
 * 📋 CONSULTA RÁPIDA - Tabelas de Referência para Fisioterapia
 * * Dados de referência rápida para estudantes:
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
  Search,
  BookOpen,
  Lightbulb,
  Ruler,
  Dumbbell,
  Stethoscope,
  BrainCircuit,
  ActivitySquare,
  Flame,
  FileHeart
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import {
  sinaisVitaisData,
  dermatomosData,
  admData,
  forcaMuscularData,
  escalasDorData,
  testesOrtopedicosData,
  glasgowData,
  barthelData,
  borgData,
  protocolosReabData
} from '../data/consultaRapidaData';

// ===================== SEÇÕES DE REFERÊNCIA =====================

const sinaisVitais = {
  titulo: 'Sinais Vitais',
  icon: Heart,
  cor: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
  dados: sinaisVitaisData
};

const dermatomos = {
  titulo: 'Dermátomos',
  icon: BrainCircuit,
  cor: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
  dados: dermatomosData
};

const admReferencia = {
  titulo: 'Amplitude de Movimento (ADM)',
  icon: Ruler,
  cor: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
  dados: admData
};

const forcaMuscular = {
  titulo: 'Graus de Força Muscular',
  icon: Dumbbell,
  cor: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
  dados: forcaMuscularData
};

const escalasDor = {
  titulo: 'Escalas de Dor',
  icon: Flame,
  cor: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50',
  dados: escalasDorData
};

const testesOrtopedicos = {
  titulo: 'Testes Ortopédicos',
  icon: Stethoscope,
  cor: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/50',
  dados: testesOrtopedicosData
};

const glasgow = {
  titulo: 'Escala de Glasgow',
  icon: ActivitySquare,
  cor: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50',
  dados: glasgowData
};

const barthel = {
  titulo: 'Índice de Barthel (AVDs)',
  icon: ClipboardList,
  cor: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50',
  dados: barthelData
};

const borg = {
  titulo: 'Escala de Borg (Esforço Percebido)',
  icon: Activity,
  cor: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
  dados: borgData
};

const protocolosReab = {
  titulo: 'Protocolos de Reabilitação',
  icon: FileHeart,
  cor: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
  dados: protocolosReabData
};

// ===================== COMPONENTES =====================

const AccordionItem = ({ item, isOpen, onToggle, children }) => {
  const IconComponent = item.icon;
  const sectionId = `section-${item.titulo.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <motion.div
      className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden mb-4 transition-all duration-300"
      style={{
        boxShadow: isOpen ? '0 12px 24px -10px rgba(0,0,0,0.08)' : '0 2px 8px -2px rgba(0,0,0,0.04)'
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={sectionId}
        className="w-full px-6 py-5 flex items-center justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/30 focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center border shadow-sm ${item.cor}`}>
            <IconComponent size={22} strokeWidth={2} aria-hidden="true" />
          </div>
          <span className="text-[17px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">{item.titulo}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
        >
          <ChevronDown size={20} aria-hidden="true" className="text-slate-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={sectionId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 pb-6 pt-2">
              <div className="w-full h-px bg-slate-100 dark:bg-slate-700/50 mb-6" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Tabela estilizada Premium
const Table = ({ headers, children }) => (
  <div className="overflow-x-auto rounded-[16px] shadow-sm border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800">
    <table className="w-full text-sm min-w-full border-collapse">
      <thead className="bg-slate-50 dark:bg-slate-900/50">
        <tr>
          {headers.map((header, idx) => (
            <th key={idx} scope="col" className="px-5 py-3.5 text-left font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
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

  // 🔍 Filtrar TESTES ORTOPÉDICOS
  const filteredTestes = {
    ...testesOrtopedicos,
    dados: testesOrtopedicos.dados
      .map(reg => ({
        ...reg,
        testes: reg.testes.filter(t =>
          matchSearch(t.nome) || matchSearch(t.objetivo) || matchSearch(t.tecnica) || matchSearch(t.positivo) || matchSearch(reg.regiao)
        )
      }))
      .filter(reg => reg.testes.length > 0)
  };

  // 🔍 Filtrar GLASGOW
  const filteredGlasgow = {
    ...glasgow,
    dados: {
      componentes: glasgow.dados.componentes.map(c => ({
        ...c,
        respostas: c.respostas.filter(r => matchSearch(r.resposta) || matchSearch(c.componente))
      })).filter(c => c.respostas.length > 0),
      classificacao: glasgow.dados.classificacao.filter(c => matchSearch(c.faixa) || matchSearch(c.descricao))
    }
  };

  // 🔍 Filtrar BARTHEL
  const filteredBarthel = {
    ...barthel,
    dados: barthel.dados.filter(b => matchSearch(b.atividade) || matchSearch(b.descricao))
  };

  // 🔍 Filtrar BORG
  const filteredBorg = {
    ...borg,
    dados: borg.dados.filter(b => matchSearch(b.valor) || matchSearch(b.descricao) || matchSearch(b.zona))
  };

  // 🔍 Filtrar PROTOCOLOS
  const filteredProtocolos = {
    ...protocolosReab,
    dados: protocolosReab.dados
      .map(p => ({
        ...p,
        fases: p.fases.filter(f => matchSearch(f.fase) || matchSearch(f.objetivos) || matchSearch(f.exercicios) || matchSearch(p.protocolo))
      }))
      .filter(p => p.fases.length > 0)
  };

  // 🔍 Verificar se seção tem resultados
  const hasResults = {
    sinais: filteredSinaisVitais.dados.some(p => p.valores.length > 0),
    dermatomos: filteredDermatomos.dados.length > 0,
    adm: filteredAdm.dados.some(a => a.movimentos.length > 0),
    forca: filteredForca.dados.length > 0,
    dor: filteredDor.dados.evn.length > 0 || filteredDor.dados.observacoes.length > 0,
    testes: filteredTestes.dados.length > 0,
    glasgow: filteredGlasgow.dados.componentes.length > 0 || filteredGlasgow.dados.classificacao.length > 0,
    barthel: filteredBarthel.dados.length > 0,
    borg: filteredBorg.dados.length > 0,
    protocolos: filteredProtocolos.dados.length > 0
  };

  // 🔍 Auto-abrir seções com resultados quando buscando
  const shouldShow = (sectionKey) => {
    if (!searchTerm.trim()) return true;
    return hasResults[sectionKey];
  };

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Premium */}
        <motion.div
          className="mb-10 text-center sm:text-left"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-8">
            <motion.div 
              className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ClipboardList size={30} className="text-white" strokeWidth={2} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                Consulta Rápida
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-1.5 text-[15px]">
                <BookOpen size={16} className="text-teal-500" />
                Dicionário de bolso e valores de referência para prática clínica
              </p>
            </div>
          </div>

          {/* Busca Glassmorphism (Floating Style) */}
          <div className="relative max-w-2xl mx-auto sm:mx-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar (Ex: FC adulto, C5, força grau 3...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-14 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-[20px] text-slate-900 dark:text-white text-[15px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
            />
          </div>
        </motion.div>

        {/* Lista de Acordeões */}
        <div className="space-y-4">
          {/* Mensagem quando não há resultados */}
          <AnimatePresence>
            {searchTerm.trim() && !Object.values(hasResults).some(v => v) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="text-center py-16 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/80 dark:border-slate-700/80 shadow-sm"
              >
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-[18px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nenhum resultado para "{searchTerm}"
                </p>
                <p className="text-[14px] text-slate-500 dark:text-slate-400">
                  Tente buscar por termos mais genéricos (Ex: FC, C5, ombro, dor).
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === SINAIS VITAIS === */}
          {shouldShow('sinais') && (
            <AccordionItem
              item={sinaisVitais}
              isOpen={openSections.includes('sinais') || (searchTerm.trim() && hasResults.sinais)}
              onToggle={() => toggleSection('sinais')}
            >
              <div className="space-y-8">
                {filteredSinaisVitais.dados.map((param, idx) => (
                  param.valores.length > 0 && (
                    <div key={idx}>
                      <h4 className="text-[15px] font-bold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span>
                        {param.parametro}
                        <span className="text-[13px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md ml-1">{param.unidade}</span>
                      </h4>
                      <Table headers={['Faixa Etária', 'Valor Normal', 'Observação']}>
                        {param.valores.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">{v.faixa}</td>
                            <td className="px-5 py-4 text-[15px] font-bold text-rose-600 dark:text-rose-400">{v.normal}</td>
                            <td className="px-5 py-4 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{v.observacao || '-'}</td>
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
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 font-extrabold text-[15px] text-blue-600 dark:text-blue-400 w-24">{d.nivel}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-300 leading-snug">{d.area}</td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500 dark:text-slate-400 leading-snug">{d.musculo}</td>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAdm.dados.map((art, idx) => (
                  art.movimentos.length > 0 && (
                    <div key={idx} className="rounded-[16px] p-5 bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[14px] font-bold mb-4 flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200">
                        <ChevronRight size={16} className="text-indigo-500" strokeWidth={3} />
                        {art.articulacao}
                      </h4>
                      <div className="space-y-1">
                        {art.movimentos.map((m, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                            <span className="text-[13.5px] font-medium text-slate-600 dark:text-slate-400">{m.movimento}</span>
                            <span className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{m.graus}</span>
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
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-black text-[18px] text-amber-600 dark:text-amber-400 w-20">{f.grau}</td>
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 leading-snug w-48">{f.descricao}</td>
                    <td className="px-5 py-4 text-[13.5px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{f.definicao}</td>
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
              <div className="space-y-6">
                <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 px-1">
                  Escala Verbal Numérica (EVN) / Escala Visual Analógica (EVA)
                </h4>
                {filteredDor.dados.evn.length > 0 && (
                  <Table headers={['Valor', 'Classificação']}>
                    {filteredDor.dados.evn.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3 font-black text-[16px] text-orange-600 dark:text-orange-400 w-32">{e.valor}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">{e.descricao}</td>
                      </tr>
                    ))}
                  </Table>
                )}
                
                {filteredDor.dados.observacoes.length > 0 && (
                  <div className="p-5 bg-orange-50/80 dark:bg-orange-950/20 rounded-[16px] border border-orange-100 dark:border-orange-900/50">
                    <h5 className="text-[13px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-1.5">
                      <Lightbulb size={14} strokeWidth={2.5} /> Observações Importantes
                    </h5>
                    <ul className="space-y-2">
                      {filteredDor.dados.observacoes.map((obs, idx) => (
                        <li key={idx} className="text-[13.5px] font-medium text-orange-900/80 dark:text-orange-200/70 flex items-start gap-2">
                          <span className="text-orange-500 mt-1.5 text-[8px]">●</span>
                          <span className="leading-relaxed">{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionItem>
          )}

          {/* === TESTES ORTOPÉDICOS === */}
          {shouldShow('testes') && (
            <AccordionItem
              item={testesOrtopedicos}
              isOpen={openSections.includes('testes') || (searchTerm.trim() && hasResults.testes)}
              onToggle={() => toggleSection('testes')}
            >
              <div className="space-y-8">
                {filteredTestes.dados.map((reg, idx) => (
                  <div key={idx}>
                    <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200 bg-teal-50 dark:bg-teal-900/30 inline-flex px-3 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      {reg.regiao}
                    </h4>
                    <Table headers={['Teste', 'Objetivo', 'Técnica Resumida', 'Sinal Positivo']}>
                      {reg.testes.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-4 font-bold text-teal-700 dark:text-teal-400 align-top min-w-[140px]">{t.nome}</td>
                          <td className="px-5 py-4 text-[13.5px] font-medium text-slate-700 dark:text-slate-300 align-top leading-relaxed">{t.objetivo}</td>
                          <td className="px-5 py-4 text-[13px] text-slate-500 dark:text-slate-400 align-top leading-relaxed min-w-[200px]">{t.tecnica}</td>
                          <td className="px-5 py-4 text-[13.5px] font-semibold text-rose-600 dark:text-rose-400 align-top leading-relaxed">{t.positivo}</td>
                        </tr>
                      ))}
                    </Table>
                  </div>
                ))}
              </div>
            </AccordionItem>
          )}

          {/* === ESCALA DE GLASGOW === */}
          {shouldShow('glasgow') && (
            <AccordionItem
              item={glasgow}
              isOpen={openSections.includes('glasgow') || (searchTerm.trim() && hasResults.glasgow)}
              onToggle={() => toggleSection('glasgow')}
            >
              <div className="space-y-8">
                {filteredGlasgow.dados.componentes.map((comp, idx) => (
                  <div key={idx}>
                    <h4 className="text-[14px] font-bold uppercase tracking-wider mb-3 text-red-800 dark:text-red-400 px-1">
                      {comp.componente}
                    </h4>
                    <Table headers={['Pontuação', 'Resposta']}>
                      {comp.respostas.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-3 font-black text-red-600 dark:text-red-400 text-[16px] w-28">{r.pontuacao}</td>
                          <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300 leading-snug">{r.resposta}</td>
                        </tr>
                      ))}
                    </Table>
                  </div>
                ))}
                
                {filteredGlasgow.dados.classificacao.length > 0 && (
                  <div className="p-5 bg-red-50/80 dark:bg-red-950/20 rounded-[16px] border border-red-100 dark:border-red-900/50">
                    <h5 className="text-[13px] font-bold uppercase tracking-wider text-red-800 dark:text-red-400 mb-4 flex items-center gap-1.5">
                      <ActivitySquare size={14} strokeWidth={2.5} /> Classificação Global (3-15)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {filteredGlasgow.dados.classificacao.map((c, i) => (
                        <div key={i} className="flex flex-col bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                          <span className="font-mono font-black text-[18px] text-red-600 dark:text-red-400 mb-1">{c.faixa}</span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{c.descricao}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionItem>
          )}

          {/* === ÍNDICE DE BARTHEL === */}
          {shouldShow('barthel') && (
            <AccordionItem
              item={barthel}
              isOpen={openSections.includes('barthel') || (searchTerm.trim() && hasResults.barthel)}
              onToggle={() => toggleSection('barthel')}
            >
              <Table headers={['Atividade', 'Pontuação', 'Descrição da Dependência']}>
                {filteredBarthel.dados.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 min-w-[140px]">{b.atividade}</td>
                    <td className="px-5 py-4 font-mono font-black text-[16px] text-cyan-600 dark:text-cyan-400 whitespace-nowrap">{b.pontuacao}</td>
                    <td className="px-5 py-4 text-[13.5px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{b.descricao}</td>
                  </tr>
                ))}
              </Table>
              
              <div className="mt-6 p-5 bg-cyan-50/80 dark:bg-cyan-950/20 rounded-[16px] border border-cyan-100 dark:border-cyan-900/50">
                <h5 className="text-[13px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 mb-3 flex items-center gap-1.5">
                  <ClipboardList size={14} strokeWidth={2.5} /> Resultados (0-100)
                </h5>
                <div className="flex flex-wrap gap-2">
                  {['0-20: Total', '21-60: Severa', '61-90: Moderada', '91-99: Leve', '100: Independente'].map((nivel, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[12px] font-bold text-cyan-900 dark:text-cyan-100 shadow-sm border border-cyan-100 dark:border-cyan-800">
                      {nivel}
                    </span>
                  ))}
                </div>
              </div>
            </AccordionItem>
          )}

          {/* === ESCALA DE BORG === */}
          {shouldShow('borg') && (
            <AccordionItem
              item={borg}
              isOpen={openSections.includes('borg') || (searchTerm.trim() && hasResults.borg)}
              onToggle={() => toggleSection('borg')}
            >
              <Table headers={['Nível', 'Percepção de Esforço', 'Zona Fisiológica']}>
                {filteredBorg.dados.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 font-black text-[18px] text-purple-600 dark:text-purple-400 font-mono w-24">{b.valor}</td>
                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{b.descricao}</td>
                    <td className="px-5 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">{b.zona}</td>
                  </tr>
                ))}
              </Table>
            </AccordionItem>
          )}

          {/* === PROTOCOLOS DE REABILITAÇÃO === */}
          {shouldShow('protocolos') && (
            <AccordionItem
              item={protocolosReab}
              isOpen={openSections.includes('protocolos') || (searchTerm.trim() && hasResults.protocolos)}
              onToggle={() => toggleSection('protocolos')}
            >
              <div className="space-y-8">
                {filteredProtocolos.dados.map((p, idx) => (
                  <div key={idx}>
                    <h4 className="text-[16px] font-bold mb-4 text-emerald-800 dark:text-emerald-400 px-1 border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                      {p.protocolo}
                    </h4>
                    <div className="space-y-3 pl-2 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
                      {p.fases.map((f, i) => (
                        <div key={i} className="relative rounded-[16px] p-5 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 ml-4">
                          <div className="absolute top-6 -left-[27px] w-3 h-3 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800" />
                          <h5 className="font-extrabold text-[14px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">{f.fase}</h5>
                          <div className="space-y-2">
                            <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                              <strong className="text-slate-900 dark:text-white">Objetivos:</strong> {f.objetivos}
                            </p>
                            <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                              <strong className="text-slate-900 dark:text-white">Exercícios:</strong> {f.exercicios}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionItem>
          )}
        </div>

        {/* Dica Premium Style */}
        <motion.div
          className="mt-10 p-5 bg-gradient-to-r from-indigo-50 to-teal-50 dark:from-indigo-950/20 dark:to-teal-950/20 rounded-[20px] border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
              <Lightbulb size={20} className="text-amber-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                Lembrete de Estudo
              </p>
              <p className="text-[13.5px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                Utilize estes valores como consulta rápida. Parâmetros clínicos podem variar ligeiramente dependendo da literatura base adotada pela sua instituição ou das condições específicas do paciente.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ConsultaRapida;