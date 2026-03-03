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
  Search,
  BookOpen,
  Lightbulb
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
  cor: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
  dados: sinaisVitaisData
};

const dermatomos = {
  titulo: 'Dermátomos',
  icon: Activity,
  cor: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  dados: dermatomosData
};

const admReferencia = {
  titulo: 'Amplitude de Movimento (ADM)',
  icon: Activity,
  cor: 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400',
  dados: admData
};

const forcaMuscular = {
  titulo: 'Graus de Força Muscular',
  icon: Activity,
  cor: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  dados: forcaMuscularData
};

const escalasDor = {
  titulo: 'Escalas de Dor',
  icon: Thermometer,
  cor: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  dados: escalasDorData
};

const testesOrtopedicos = {
  titulo: 'Testes Ortopédicos',
  icon: Activity,
  cor: 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400',
  dados: testesOrtopedicosData
};

const glasgow = {
  titulo: 'Escala de Glasgow',
  icon: Activity,
  cor: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
  dados: glasgowData
};

const barthel = {
  titulo: 'Índice de Barthel (AVDs)',
  icon: ClipboardList,
  cor: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400',
  dados: barthelData
};

const borg = {
  titulo: 'Escala de Borg (Esforço Percebido)',
  icon: Activity,
  cor: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
  dados: borgData
};

const protocolosReab = {
  titulo: 'Protocolos de Reabilitação',
  icon: BookOpen,
  cor: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
  dados: protocolosReabData
};

// ===================== COMPONENTES =====================

const AccordionItem = ({ item, isOpen, onToggle, children }) => {
  const IconComponent = item.icon;
  const sectionId = `section-${item.titulo.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <motion.div
      className="rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={sectionId}
        className="w-full px-6 py-5 flex items-center justify-between transition-colors active:scale-[0.995] hover:opacity-90"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${item.cor} flex items-center justify-center`}>
            <IconComponent size={24} aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{item.titulo}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={24} aria-hidden="true" style={{ color: 'var(--text-3)' }} />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={sectionId}
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
  <div className="overflow-x-auto -mx-4 px-4 rounded-xl shadow-sm" style={{ border: '1px solid var(--border)' }}>
    <table className="w-full text-sm min-w-full">
      <thead style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <tr>
          {headers.map((header, idx) => (
            <th key={idx} scope="col" className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
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

  const sections = [
    { key: 'sinais', data: sinaisVitais },
    { key: 'dermatomos', data: dermatomos },
    { key: 'adm', data: admReferencia },
    { key: 'forca', data: forcaMuscular },
    { key: 'dor', data: escalasDor }
  ];

  return (
    <div className="min-h-screen pb-32 pt-8 px-4">
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
                className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center"
              >
                <ClipboardList size={32} className="text-primary-600 dark:text-primary-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl ipad:text-3xl font-semibold" style={{ color: 'var(--text-1)' }}>
                  Consulta Rápida
                </h1>
                <p className="flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
                  <BookOpen size={16} className="text-emerald-500" />
                  Valores de referência para Fisioterapia
                </p>
              </div>
            </div>
          </div>

          {/* Busca */}
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
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
              className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <Search size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium" style={{ color: 'var(--text-2)' }}>
                Nenhum resultado para "{searchTerm}"
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
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
                      <h4 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        {param.parametro}
                        <span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>({param.unidade})</span>
                      </h4>
                      <Table headers={['Faixa Etária', 'Valor Normal', 'Observação']}>
                        {param.valores.map((v, i) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                            <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-2)' }}>{v.faixa}</td>
                            <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-semibold">{v.normal}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-3)' }}>{v.observacao || '-'}</td>
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
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                    <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{d.nivel}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{d.area}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{d.musculo}</td>
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
                    <div key={idx} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <h4 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                        <ChevronRight size={18} className="text-emerald-500" />
                        {art.articulacao}
                      </h4>
                      <div className="space-y-2">
                        {art.movimentos.map((m, i) => (
                            <div key={i} className="flex items-center justify-between py-1 last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="text-sm" style={{ color: 'var(--text-2)' }}>{m.movimento}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{m.graus}</span>
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
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                    <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400 text-lg">{f.grau}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-1)' }}>{f.descricao}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{f.definicao}</td>
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
                <h4 className="text-base font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
                  Escala Verbal Numérica (EVN) / Escala Visual Analógica (EVA)
                </h4>
                {filteredDor.dados.evn.length > 0 && (
                  <Table headers={['Valor', 'Classificação']}>
                    {filteredDor.dados.evn.map((e, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                        <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">{e.valor}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{e.descricao}</td>
                      </tr>
                    ))}
                  </Table>
                )}
                
                {filteredDor.dados.observacoes.length > 0 && (
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/50 rounded-xl">
                    <h5 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">Observações Importantes:</h5>
                    <ul className="space-y-1">
                      {filteredDor.dados.observacoes.map((obs, idx) => (
                        <li key={idx} className="text-sm text-purple-700 dark:text-purple-400 flex items-start gap-2">
                          <span className="text-purple-400 dark:text-purple-500 mt-1">•</span>
                          {obs}
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
              <div className="space-y-6">
                {filteredTestes.dados.map((reg, idx) => (
                  <div key={idx}>
                    <h4 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      {reg.regiao}
                    </h4>
                    <Table headers={['Teste', 'Objetivo', 'Técnica', 'Positivo']}>
                      {reg.testes.map((t, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                          <td className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">{t.nome}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-2)' }}>{t.objetivo}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-2)' }}>{t.tecnica}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-3)' }}>{t.positivo}</td>
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
              <div className="space-y-6">
                {filteredGlasgow.dados.componentes.map((comp, idx) => (
                  <div key={idx}>
                    <h4 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {comp.componente}
                    </h4>
                    <Table headers={['Pontuação', 'Resposta']}>
                      {comp.respostas.map((r, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                          <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400 text-lg">{r.pontuacao}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{r.resposta}</td>
                        </tr>
                      ))}
                    </Table>
                  </div>
                ))}
                {filteredGlasgow.dados.classificacao.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/50 rounded-xl">
                    <h5 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Classificação (Total: 3-15)</h5>
                    <div className="space-y-1">
                      {filteredGlasgow.dados.classificacao.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="font-mono font-bold text-red-600 dark:text-red-400 w-10">{c.faixa}</span>
                          <span style={{ color: 'var(--text-2)' }}>{c.descricao}</span>
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
              <Table headers={['Atividade', 'Pontuação', 'Descrição']}>
                {filteredBarthel.dados.map((b, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-1)' }}>{b.atividade}</td>
                    <td className="px-4 py-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{b.pontuacao}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-2)' }}>{b.descricao}</td>
                  </tr>
                ))}
              </Table>
              <div className="mt-4 p-4 bg-cyan-50 dark:bg-cyan-950/50 rounded-xl">
                <h5 className="text-sm font-semibold text-cyan-800 dark:text-cyan-300 mb-1">Classificação (Total: 0-100)</h5>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>0-20: Dependência total • 21-60: Dependência severa • 61-90: Dependência moderada • 91-99: Dependência leve • 100: Independente</p>
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
              <Table headers={['Valor', 'Percepção', 'Zona']}>
                {filteredBorg.dados.map((b, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                    <td className="px-4 py-3 font-bold text-orange-600 dark:text-orange-400 font-mono">{b.valor}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{b.descricao}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-3)' }}>{b.zona}</td>
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
              <div className="space-y-6">
                {filteredProtocolos.dados.map((p, idx) => (
                  <div key={idx}>
                    <h4 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {p.protocolo}
                    </h4>
                    <div className="space-y-3">
                      {p.fases.map((f, i) => (
                        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <h5 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-1">{f.fase}</h5>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-1)' }}><strong>Objetivos:</strong> {f.objetivos}</p>
                          <p className="text-sm" style={{ color: 'var(--text-2)' }}><strong>Exercícios:</strong> {f.exercicios}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionItem>
          )}
        </div>

        {/* Dica */}
        <motion.div
          className="mt-8 p-4 bg-primary-50 dark:bg-primary-950 rounded-xl border border-primary-100 dark:border-primary-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
                Dica de Estudo
              </p>
              <p className="text-sm text-primary-700 dark:text-primary-400">
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
