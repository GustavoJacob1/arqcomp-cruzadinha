/* ==========================================================================
   The Legend of CPU — matching.js
   "Conecte os Componentes": ligar cada componente à sua função.
   - Interação por clique/toque e teclado (os itens são botões).
   - Feedback imediato, explicação de cada par correto.
   - Rodadas de 6 pares sorteados entre os 16 conceitos; "Nova rodada"
     embaralha tudo de novo.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var KEY = 'associacao';
  var ROUND_SIZE = 6;

  var state = {
    round: 0,
    pairs: [],        // conceitos da rodada
    selected: null,   // { side, id, btn }
    matched: {},      // id -> número do par
    matchCount: 0,
    attempts: 0,
    errors: 0,
    used: {},         // conceitos já usados (para variar as rodadas)
    stats: { rounds: 0, perfect: 0 }
  };
  var dom = {};

  function shortLabel(concept) {
    return concept.label.split(' — ')[0];
  }

  function load() {
    var saved = LCPU.Storage.read(KEY);
    if (saved.status !== 'ok' || !saved.value || typeof saved.value !== 'object') return;
    var s = saved.value;
    if (typeof s.rounds === 'number' && s.rounds >= 0 && s.rounds < 1e6) state.stats.rounds = Math.floor(s.rounds);
    if (typeof s.perfect === 'number' && s.perfect >= 0 && s.perfect <= state.stats.rounds) state.stats.perfect = Math.floor(s.perfect);
  }

  function save() {
    LCPU.Storage.write(KEY, { v: 1, rounds: state.stats.rounds, perfect: state.stats.perfect });
  }

  /** Sorteia os pares da rodada, priorizando conceitos que ainda não apareceram. */
  function pickPairs() {
    var all = LCPU.CONCEPTS;
    var fresh = U.shuffle(all.filter(function (c) { return !state.used[c.id]; }));
    if (fresh.length < ROUND_SIZE) {
      var others = U.shuffle(all.filter(function (c) { return fresh.indexOf(c) === -1; }));
      fresh = fresh.concat(others.slice(0, ROUND_SIZE - fresh.length));
      state.used = {};
    }
    var chosen = fresh.slice(0, ROUND_SIZE);
    chosen.forEach(function (c) { state.used[c.id] = true; });
    return chosen;
  }

  function makeItem(side, concept) {
    var text = side === 'left' ? shortLabel(concept) : concept.match.func;
    var btn = U.el('button', {
      type: 'button',
      class: 'match-item match-' + side,
      'data-side': side,
      'data-id': concept.id,
      'data-sound': 'none',
      'aria-pressed': 'false'
    }, [
      U.el('span', { class: 'match-badge', 'aria-hidden': 'true' }),
      U.el('span', { class: 'match-text', text: text })
    ]);
    btn.addEventListener('click', function () { onPick(btn); });
    return U.el('li', null, [btn]);
  }

  function newRound() {
    state.round += 1;
    state.pairs = pickPairs();
    state.selected = null;
    state.matched = {};
    state.matchCount = 0;
    state.attempts = 0;
    state.errors = 0;

    dom.left.textContent = '';
    dom.right.textContent = '';
    U.shuffle(state.pairs).forEach(function (c) { dom.left.appendChild(makeItem('left', c)); });
    U.shuffle(state.pairs).forEach(function (c) { dom.right.appendChild(makeItem('right', c)); });

    dom.explanations.textContent = '';
    dom.explanations.appendChild(U.el('li', { class: 'match-exp-empty', text: 'Os pares que você conectar aparecem aqui, com uma explicação curta.' }));
    dom.done.hidden = true;
    dom.feedback.removeAttribute('data-state');
    dom.feedback.textContent = 'Rodada ' + state.round + ': escolha um componente ou uma função para começar.';
    updateStats();
  }

  function updateStats() {
    dom.round.textContent = 'Rodada ' + state.round;
    dom.pairsText.textContent = state.matchCount + ' de ' + state.pairs.length + ' pares';
    dom.attempts.textContent = U.plural(state.attempts, 'tentativa', 'tentativas');
  }

  function select(btn) {
    state.selected = { side: btn.getAttribute('data-side'), id: btn.getAttribute('data-id'), btn: btn };
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('is-selected');
    var other = state.selected.side === 'left' ? 'a função correspondente' : 'o componente correspondente';
    dom.feedback.removeAttribute('data-state');
    dom.feedback.textContent = 'Selecionado: “' + btn.textContent.trim() + '”. Agora escolha ' + other + '.';
    LCPU.Audio.play('select');
  }

  function deselect() {
    if (!state.selected) return;
    state.selected.btn.setAttribute('aria-pressed', 'false');
    state.selected.btn.classList.remove('is-selected');
    state.selected = null;
  }

  function onPick(btn) {
    if (btn.disabled) return;
    var side = btn.getAttribute('data-side');
    var id = btn.getAttribute('data-id');

    if (!state.selected) {
      select(btn);
      return;
    }
    if (state.selected.side === side) {
      // mesmo lado: clicar no mesmo item desmarca; em outro, troca a seleção
      var same = state.selected.id === id;
      deselect();
      if (same) dom.feedback.textContent = 'Seleção desfeita.';
      else select(btn);
      return;
    }

    var first = state.selected.btn;
    var leftBtn = side === 'left' ? btn : first;
    var rightBtn = side === 'right' ? btn : first;
    state.attempts += 1;
    deselect();

    if (leftBtn.getAttribute('data-id') === rightBtn.getAttribute('data-id')) connect(leftBtn, rightBtn);
    else reject(leftBtn, rightBtn);
    updateStats();
  }

  function connect(leftBtn, rightBtn) {
    var id = leftBtn.getAttribute('data-id');
    var concept = LCPU.CONCEPTS.filter(function (c) { return c.id === id; })[0];
    state.matchCount += 1;
    state.matched[id] = state.matchCount;
    [leftBtn, rightBtn].forEach(function (b) {
      b.disabled = true;
      b.classList.add('is-matched');
      b.setAttribute('data-pair', String(state.matchCount));
      b.querySelector('.match-badge').textContent = String(state.matchCount);
    });
    leftBtn.setAttribute('aria-label', shortLabel(concept) + ': conectado com “' + concept.match.func + '”.');
    rightBtn.setAttribute('aria-label', concept.match.func + ': conectado com ' + shortLabel(concept) + '.');

    var empty = U.$('.match-exp-empty', dom.explanations);
    if (empty) empty.remove();
    dom.explanations.appendChild(U.el('li', { class: 'match-exp' }, [
      U.el('strong', { text: concept.label }),
      U.el('span', { class: 'match-exp-func', text: ' → ' + concept.match.func + '. ' }),
      U.el('span', { text: concept.match.explain })
    ]));

    dom.feedback.setAttribute('data-state', 'correct');
    dom.feedback.textContent = '✓ Conectado! ' + shortLabel(concept) + ' → ' + concept.match.func + '.';
    LCPU.Audio.play('correct');

    if (state.matchCount === state.pairs.length) roundDone();
  }

  function reject(leftBtn, rightBtn) {
    state.errors += 1;
    var left = LCPU.CONCEPTS.filter(function (c) { return c.id === leftBtn.getAttribute('data-id'); })[0];
    var right = LCPU.CONCEPTS.filter(function (c) { return c.id === rightBtn.getAttribute('data-id'); })[0];
    [leftBtn, rightBtn].forEach(function (b) {
      b.classList.remove('is-wrong');
      void b.offsetWidth;
      b.classList.add('is-wrong');
      window.setTimeout(function () { b.classList.remove('is-wrong'); }, 650);
    });
    dom.feedback.setAttribute('data-state', 'wrong');
    dom.feedback.textContent = '✗ Não combina: “' + shortLabel(left) + '” não é “' + right.match.func + '”. Tente outra combinação.';
    LCPU.Audio.play('wrong');
  }

  function roundDone() {
    state.stats.rounds += 1;
    var perfect = state.errors === 0;
    if (perfect) state.stats.perfect += 1;
    save();
    var precision = Math.round((state.pairs.length / state.attempts) * 100);
    dom.doneText.textContent = (perfect ? 'Conexão perfeita! ' : 'Rodada concluída! ') +
      state.pairs.length + ' pares em ' + U.plural(state.attempts, 'tentativa', 'tentativas') +
      ' (precisão de ' + precision + '%).';
    dom.done.hidden = false;
    dom.doneText.focus({ preventScroll: true });
    if (perfect) LCPU.Achievements.unlock('conexao-perfeita');
    LCPU.emit('matching:progress', { rounds: state.stats.rounds, perfect: state.stats.perfect });
  }

  function init() {
    dom.left = U.$('#match-left');
    if (!dom.left) return;
    dom.right = U.$('#match-right');
    dom.feedback = U.$('#match-feedback');
    dom.done = U.$('#match-done');
    dom.doneText = U.$('#match-done-text');
    dom.explanations = U.$('#match-explanations');
    dom.round = U.$('#match-round');
    dom.pairsText = U.$('#match-pairs');
    dom.attempts = U.$('#match-attempts');

    load();
    U.$('#match-new').addEventListener('click', newRound);
    U.$('#match-next').addEventListener('click', function () {
      newRound();
      var first = U.$('.match-item', dom.left);
      if (first) first.focus();
    });
    newRound();
  }

  LCPU.Matching = {
    get stats() { return Object.assign({}, state.stats); }
  };

  LCPU.register('matching', init);
})(window.LCPU = window.LCPU || {});
