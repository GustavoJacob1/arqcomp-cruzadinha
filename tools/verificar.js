/* ==========================================================================
   The Legend of CPU — tools/verificar.js  (opcional, precisa do Node.js)
   Roda a MESMA validação do site fora do navegador e mostra um relatório:
   integridade da grade, regras das pistas, quiz e campos dos conceitos.

   Uso (na pasta do projeto):   node tools/verificar.js
   Sai com código 1 se algo estiver errado (útil depois de editar o data.js).
   O site NÃO depende deste arquivo: ele é só uma ferramenta de conferência.
   ========================================================================== */
'use strict';

const path = require('path');

// Os scripts do site usam "window.LCPU"; no Node, "window" vira o objeto global.
global.window = global;
require(path.join(__dirname, '..', 'assets', 'js', 'data.js'));
require(path.join(__dirname, '..', 'assets', 'js', 'crossword-model.js'));

const { CONCEPTS, QUIZ, CrosswordModel: M } = global.LCPU;
let ok = true;

// 1) Grade
const model = M.build(CONCEPTS);
const report = M.validate(model);
console.log('\n=== Integridade da grade ===');
report.checks.forEach((c) => console.log((c.ok ? '  [ok]   ' : '  [ERRO] ') + c.text));
report.errors.forEach((e) => console.log('  -> ' + e));
const s = report.stats;
console.log(`  ${s.words} palavras (${s.across} H, ${s.down} V), ${s.crossings} cruzamentos, ${s.cells} casas, grade ${s.rows}x${s.cols}`);
ok = ok && report.ok;

// Desenho da solução
console.log('\n=== Solução (contém as respostas!) ===');
for (let r = 0; r < model.rows; r++) {
  let line = '';
  for (let c = 0; c < model.cols; c++) {
    const cell = model.cellAt(r, c);
    line += cell ? ` ${cell.solution} ` : ' · ';
  }
  console.log(String(r + 1).padStart(3) + ' ' + line);
}

// 2) Pistas
console.log('\n=== Pistas ===');
const clues = M.checkClues(CONCEPTS);
const byId = {};
clues.forEach((c) => { byId[c.id] = c; });
[['HORIZONTAIS', model.across], ['VERTICAIS', model.down]].forEach(([title, words]) => {
  console.log('  ' + title);
  words.forEach((w) => {
    const r = byId[w.id];
    const flag = r.ok ? 'ok  ' : 'ERRO';
    const extra = r.issues.concat(r.warnings).join('; ');
    console.log(`   ${flag} ${String(w.number).padStart(2)}. ${w.answer.padEnd(16)} (${r.words} palavras) ${w.clue}${extra ? '  <- ' + extra : ''}`);
    ok = ok && r.ok;
  });
});

// 3) Quiz: 4 alternativas, exatamente uma correta, sem repetição, conceito existente
console.log('\n=== Quiz ===');
const ids = new Set(CONCEPTS.map((c) => c.id));
QUIZ.forEach((q) => {
  const corrects = q.options.filter((o) => o.correct).length;
  const unique = new Set(q.options.map((o) => o.text)).size === q.options.length;
  const good = corrects === 1 && q.options.length === 4 && unique && ids.has(q.concept) && q.explain;
  if (!good) console.log(`  [ERRO] ${q.id}: corretas=${corrects}, alternativas=${q.options.length}, únicas=${unique}`);
  ok = ok && !!good;
});
console.log(`  ${QUIZ.length} questões verificadas (mínimo exigido: 10).`);
ok = ok && QUIZ.length >= 10;

// 4) Conceitos com todos os campos usados pelo site
const missing = CONCEPTS.filter((c) => !(c.id && c.label && c.answer && c.clue && c.grid && c.group &&
  c.card && c.card.front && c.card.back && c.card.tip && c.match && c.match.func && c.match.explain));
console.log(`\n=== Conceitos ===\n  ${CONCEPTS.length} conceitos; incompletos: ${missing.length ? missing.map((c) => c.id).join(', ') : 'nenhum'}`);
ok = ok && missing.length === 0;

console.log(ok ? '\nTudo certo!\n' : '\nHá problemas: veja as linhas marcadas com ERRO.\n');
process.exit(ok ? 0 : 1);
