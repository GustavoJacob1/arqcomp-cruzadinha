/* ==========================================================================
   The Legend of CPU — quiz.js
   "Desafio dos Circuitos": questões de múltipla escolha (LCPU.QUIZ) com
   ordem e alternativas embaralhadas a cada rodada, explicação depois de
   cada resposta, pontuação final e opção de refazer só as erradas.
   A alternativa correta é marcada no dado (correct: true), não pela posição,
   então embaralhar nunca troca a resposta.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var KEY = 'quiz';
  var LETTERS = ['A', 'B', 'C', 'D'];

  var state = {
    queue: [],      // [{ q, options }] da rodada atual
    index: 0,
    answers: [],    // [{ q, correct, chosen }]
    full: true,     // rodada completa (true) ou só as erradas (false)
    answered: false,
    lastWrong: [],  // questões erradas da última rodada
    best: null      // melhor % em rodadas completas
  };
  var dom = {};

  function load() {
    var saved = LCPU.Storage.read(KEY);
    if (saved.status === 'ok' && saved.value && typeof saved.value.best === 'number' &&
        saved.value.best >= 0 && saved.value.best <= 100) {
      state.best = Math.round(saved.value.best);
    }
  }

  function save() {
    LCPU.Storage.write(KEY, { v: 1, best: state.best });
  }

  function show(mode) {
    dom.intro.hidden = mode !== 'intro';
    dom.question.hidden = mode !== 'question';
    dom.result.hidden = mode !== 'result';
  }

  function renderBest() {
    dom.best.textContent = state.best === null
      ? 'Melhor resultado: ainda não registrado.'
      : 'Melhor resultado em rodada completa: ' + state.best + '%.';
  }

  /** Começa uma rodada embaralhando questões e alternativas. */
  function start(questions, full) {
    state.queue = U.shuffle(questions).map(function (q) {
      return { q: q, options: U.shuffle(q.options) };
    });
    state.index = 0;
    state.answers = [];
    state.full = full;
    show('question');
    renderQuestion();
  }

  function renderQuestion() {
    var item = state.queue[state.index];
    var total = state.queue.length;
    var right = state.answers.filter(function (a) { return a.correct; }).length;
    state.answered = false;

    dom.counter.textContent = 'Questão ' + (state.index + 1) + ' de ' + total;
    dom.mode.textContent = state.full ? 'Rodada completa' : 'Revisão das erradas';
    dom.score.textContent = U.plural(right, 'acerto', 'acertos');
    dom.progress.style.width = (state.index / total) * 100 + '%';
    dom.text.textContent = item.q.question;

    dom.options.textContent = '';
    item.options.forEach(function (opt, i) {
      var btn = U.el('button', { type: 'button', class: 'quiz-option', 'data-index': i, 'data-sound': 'none' }, [
        U.el('span', { class: 'quiz-letter', 'aria-hidden': 'true', text: LETTERS[i] }),
        U.el('span', { class: 'quiz-option-text', text: opt.text }),
        U.el('span', { class: 'quiz-option-mark' })
      ]);
      btn.setAttribute('aria-label', LETTERS[i] + ': ' + opt.text);
      btn.addEventListener('click', function () { choose(i); });
      dom.options.appendChild(btn);
    });

    dom.feedback.hidden = true;
    dom.next.hidden = true;
    dom.text.focus({ preventScroll: true });
  }

  function choose(i) {
    if (state.answered) return;
    state.answered = true;
    var item = state.queue[state.index];
    var chosen = item.options[i];
    var correct = chosen.correct === true;
    var correctText = item.options.filter(function (o) { return o.correct; })[0].text;
    state.answers.push({ q: item.q, correct: correct, chosen: chosen.text });

    U.$$('.quiz-option', dom.options).forEach(function (btn, j) {
      var opt = item.options[j];
      btn.disabled = true;
      var markEl = btn.querySelector('.quiz-option-mark');
      if (opt.correct) {
        btn.classList.add('is-correct');
        markEl.textContent = '✓ Correta';
        btn.setAttribute('aria-label', LETTERS[j] + ': ' + opt.text + '. Alternativa correta.');
      }
      if (j === i && !correct) {
        btn.classList.add('is-wrong');
        markEl.textContent = '✗ Sua resposta';
        btn.setAttribute('aria-label', LETTERS[j] + ': ' + opt.text + '. Sua resposta, incorreta.');
      }
      if (j === i) btn.classList.add('is-chosen');
    });

    dom.feedback.hidden = false;
    dom.feedback.setAttribute('data-state', correct ? 'correct' : 'wrong');
    dom.verdict.textContent = correct ? '✓ Correto! Mandou bem.' : '✗ Não foi dessa vez. A resposta certa é: “' + correctText + '”.';
    dom.explain.textContent = item.q.explain;
    dom.reviewLink.setAttribute('data-concept', item.q.concept);
    dom.live.textContent = (correct ? 'Correto. ' : 'Incorreto. A resposta certa é: ' + correctText + '. ') + item.q.explain;

    var right = state.answers.filter(function (a) { return a.correct; }).length;
    dom.score.textContent = U.plural(right, 'acerto', 'acertos');
    dom.progress.style.width = ((state.index + 1) / state.queue.length) * 100 + '%';

    var last = state.index === state.queue.length - 1;
    dom.next.hidden = false;
    dom.next.firstChild.textContent = last ? 'Ver resultado ' : 'Próxima questão ';
    dom.next.focus({ preventScroll: true });
    LCPU.Audio.play(correct ? 'correct' : 'wrong');
  }

  function next() {
    state.index += 1;
    if (state.index >= state.queue.length) finish();
    else renderQuestion();
  }

  function finish() {
    var total = state.queue.length;
    var right = state.answers.filter(function (a) { return a.correct; }).length;
    var pct = Math.round((right / total) * 100);
    state.lastWrong = state.answers.filter(function (a) { return !a.correct; }).map(function (a) { return a.q; });

    var rank;
    var msg;
    if (pct === 100) { rank = 'S'; msg = 'Circuito perfeito! Nenhum bit fora do lugar.'; }
    else if (pct >= 80) { rank = 'A'; msg = 'Excelente! Só faltam alguns ajustes finos.'; }
    else if (pct >= 60) { rank = 'B'; msg = 'Bom caminho. Refaça as erradas para fixar os conceitos.'; }
    else { rank = 'C'; msg = 'Hora de visitar o Inventário do Conhecimento e tentar de novo. Você consegue!'; }

    dom.rank.textContent = rank;
    dom.rank.setAttribute('data-rank', rank);
    dom.resultTitle.textContent = (state.full ? 'Você acertou ' : 'Revisão: você acertou ') + right + ' de ' + total + ' (' + pct + '%)';
    dom.resultMsg.textContent = 'Rank ' + rank + ' — ' + msg;

    if (state.full) {
      if (state.best === null || pct > state.best) state.best = pct;
      save();
      renderBest();
      if (pct === 100) LCPU.Achievements.unlock('circuito-perfeito');
    }

    dom.reviewList.textContent = '';
    state.answers.forEach(function (a) {
      var correctText = a.q.options.filter(function (o) { return o.correct; })[0].text;
      dom.reviewList.appendChild(U.el('li', { class: a.correct ? 'is-correct' : 'is-wrong' }, [
        U.el('span', { class: 'quiz-review-mark', 'aria-hidden': 'true', text: a.correct ? '✓' : '✗' }),
        U.el('div', null, [
          U.el('p', { class: 'quiz-review-q', text: a.q.question }),
          U.el('p', { class: 'quiz-review-a', text: a.correct
            ? 'Correta: ' + correctText
            : 'Sua resposta: ' + a.chosen + ' · Correta: ' + correctText }),
          U.el('span', { class: 'sr-only', text: a.correct ? 'Você acertou.' : 'Você errou.' })
        ])
      ]));
    });

    var wrongCount = state.lastWrong.length;
    dom.retryWrong.hidden = wrongCount === 0;
    dom.retryWrong.textContent = 'Refazer as erradas (' + wrongCount + ')';

    show('result');
    dom.resultTitle.focus({ preventScroll: true });
    LCPU.Audio.play(pct === 100 ? 'victory' : pct >= 60 ? 'correct' : 'click');
    LCPU.emit('quiz:result', { correct: right, total: total, percent: pct, full: state.full, best: state.best });
  }

  /** Atalhos 1–4 / A–D enquanto uma questão está aberta. */
  function onKeyDown(event) {
    if (!LCPU.App || LCPU.App.currentView !== 'quiz' || dom.question.hidden || state.answered) return;
    if (event.ctrlKey || event.metaKey || event.altKey || LCPU.UI.modalOpen) return;
    var tag = (event.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    var key = event.key.toUpperCase();
    var i = '1234'.indexOf(key);
    if (i === -1) i = LETTERS.indexOf(key);
    if (i >= 0 && i < state.queue[state.index].options.length) {
      event.preventDefault();
      choose(i);
    }
  }

  function init() {
    dom.intro = U.$('#quiz-intro');
    if (!dom.intro) return;
    dom.question = U.$('#quiz-question');
    dom.result = U.$('#quiz-result');
    dom.best = U.$('#quiz-best');
    dom.counter = U.$('#quiz-counter');
    dom.mode = U.$('#quiz-mode');
    dom.score = U.$('#quiz-score');
    dom.progress = U.$('#quiz-progress');
    dom.text = U.$('#quiz-text');
    dom.options = U.$('#quiz-options');
    dom.feedback = U.$('#quiz-feedback');
    dom.verdict = U.$('#quiz-verdict');
    dom.explain = U.$('#quiz-explain');
    dom.reviewLink = U.$('#quiz-review-link');
    dom.live = U.$('#quiz-live');
    dom.next = U.$('#quiz-next');
    dom.rank = U.$('#quiz-rank');
    dom.resultTitle = U.$('#quiz-result-title');
    dom.resultMsg = U.$('#quiz-result-msg');
    dom.reviewList = U.$('#quiz-review-list');
    dom.retryWrong = U.$('#quiz-retry-wrong');

    U.$('#quiz-total').textContent = LCPU.QUIZ.length + ' questões';
    load();
    renderBest();

    U.$('#quiz-start').addEventListener('click', function () { start(LCPU.QUIZ, true); });
    U.$('#quiz-restart').addEventListener('click', function () { start(LCPU.QUIZ, true); });
    dom.retryWrong.addEventListener('click', function () {
      if (state.lastWrong.length) start(state.lastWrong, false);
    });
    dom.next.addEventListener('click', next);
    dom.reviewLink.addEventListener('click', function () {
      var id = dom.reviewLink.getAttribute('data-concept');
      if (id && LCPU.Flashcards) LCPU.Flashcards.showCard(id);
    });
    document.addEventListener('keydown', onKeyDown);
    show('intro');
  }

  LCPU.Quiz = {
    get best() { return state.best; }
  };

  LCPU.register('quiz', init);
})(window.LCPU = window.LCPU || {});
