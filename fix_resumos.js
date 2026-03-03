const fs = require('fs');
const file = 'c:/Users/Kauan/Desktop/Cinesia/frontend/src/pages/Resumos.jsx';
let content = fs.readFileSync(file, 'utf8');

const newTemplate = `// Template de Caso Clínico para Fisioterapia
const TEMPLATE_CASO_CLINICO = \`<h2>🩺 Caso Clínico</h2>

<h3>Queixa Principal</h3>
<p>Descreva a queixa principal do paciente...</p>

<h3>Histórico da Moléstia Atual (HMA)</h3>
<p>Evolução dos sintomas, início, fatores de melhora/piora...</p>

<h3>Avaliação Física</h3>
<ul>
<li><strong>Inspeção:</strong> </li>
<li><strong>Palpação:</strong> </li>
<li><strong>Amplitude de Movimento:</strong> </li>
<li><strong>Força Muscular:</strong> </li>
<li><strong>Testes Especiais:</strong> </li>
</ul>

<h3>Diagnóstico Cinético-Funcional</h3>
<p>Conclusão baseada na avaliação...</p>

<h3>Objetivos de Tratamento</h3>
<ul>
<li><strong>Curto Prazo:</strong> </li>
<li><strong>Médio Prazo:</strong> </li>
<li><strong>Longo Prazo:</strong> </li>
</ul>

<h3>Plano de Tratamento</h3>
<p>Condutas e intervenções planejadas...</p>
\`;`;

// Find start and end of the template block
const startMarker = '// Template de Caso Cl';
const endMarker = '`;\n\n// Fun';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found. startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

const before = content.slice(0, startIdx);
const after = content.slice(endIdx + '`;\n'.length);
const newContent = before + newTemplate + '\n\n// Fun' + after.slice('// Fun'.length);

// Actually just replace the bracket
const newContent2 = before + newTemplate + '\n' + content.slice(endIdx + '`;'.length);

fs.writeFileSync(file, newContent2, 'utf8');
console.log('Done! Replaced template block.');
