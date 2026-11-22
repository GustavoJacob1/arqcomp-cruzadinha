/* ==========================================================================
   The Legend of CPU — flashcards.js
   "Inventário do Conhecimento": cards com pergunta na frente e explicação
   no verso, marcação "Já sei" / "Preciso revisar", filtro de revisão,
   embaralhar e progresso salvo quando possível.
   O conteúdo vem de LCPU.CONCEPTS (campo card), a mesma fonte da cruzadinha.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var KEY = 'flashcards';
  var GROUPS = {
    processamento: 'Processamento',
    memoria: 'Memória',
    barramentos: 'Barramentos',
    nucleos: 'Núcleos',
    sistema: 'Transferência de dados'
  };
  var FILTER_LABEL = { all: '', review: ' para revisar', unseen: ' não marcados' };

  var cards = [];   // ordem atual dos cards (muda ao embaralhar)
  var marks = {};   // id -> 'known' | 'review'
  var filter = 'all';
  var index = 0;    // posição dentro da lista filtrada
  var flipped = false;
  var dom = {};

  function shortLabel(concept) {
    return concept.label.split(' — ')[0];
  }

  /** Hifens "suaves" (­) para palavras longas quebrarem bonito nos espaços do inventário. */
  function softHyphens(text) {
    return text
      .replace('Microcontrolador', 'Micro­contro­lador')
      .replace('Registradores', 'Regis­tradores');
  }

  /* ---------- Salvamento ---------- */
  function load() {
    var saved = LCPU.Storage.read(KEY);
    if (saved.status !== 'ok' || !saved.value || typeof saved.value !== 'object') return;
    var data = saved.value;
    if (data.marks && typeof data.marks === 'object') {
      cards.forEach(function (c) {
        var m = data.marks[c.id];
        if (m === 'known' || m === 'review') marks[c.id] = m;
      });
    }
    if (data.filter === 'all' || data.filter === 'review' || data.filter === 'unseen') filter = data.filter;
  }

  function save() {
    LCPU.Storage.write(KEY, { v: 1, marks: marks, filter: filter });
  }

  /* ---------- Lista filtrada ---------- */
  function filtered() {
    return cards.filter(function (c) {
      if (filter === 'review') return marks[c.id] === 'review';
      if (filter === 'unseen') return !marks[c.id];
      return true;
    });
  }

  function counts() {
    var known = 0;
    var review = 0;
    cards.forEach(function (c) {
      if (marks[c.id] === 'known') known++;
      else if (marks[c.id] === 'review') review++;
    });
    return { known: known, review: review, unseen: cards.length - known - review, total: cards.length };
  }

  /* ---------- Desenho ---------- */
  function setFlipped(value, announce) {
    flipped = value;
    dom.card.classList.toggle('is-flipped', flipped);
    dom.front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
    dom.back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
    dom.flip.textContent = flipped ? 'Ver a pergunta' : 'Mostrar resposta';
    dom.flip.setAttribute('aria-expanded', flipped ? 'true' : 'false');
    if (announce && flipped) {
      U.announce('Resposta: ' + dom.title.textContent + '. ' + dom.answer.textContent);
    }
  }

  function render() {
    var c = counts();
    dom.countAll.textContent = String(c.total);
    dom.countReview.textContent = String(c.review);
    dom.countUnseen.textContent = String(c.unseen);
    U.$$('.seg-btn', dom.section).forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === filter ? 'true' : 'false');
    });

    dom.stats.textContent = c.known + ' de ' + c.total + ' dominados · ' + c.review + ' para revisar';
    dom.progress.style.width = (c.known / c.total) * 100 + '%';
    dom.bar.setAttribute('aria-valuenow', String(c.known));

    var items = filtered();
    var empty = items.length === 0;
    dom.cardArea.hidden = empty;
    dom.empty.hidden = !empty;
    [dom.prev, dom.next, dom.flip, dom.known, dom.review].forEach(function (b) { b.disabled = empty; });
    if (empty) {
      dom.position.textContent = 'Nenhum card neste filtro';
      dom.emptyText.textContent = filter === 'review'
        ? 'Nada para revisar por enquanto! Marque “Preciso revisar” nos conceitos em que tiver dúvida.'
        : 'Todos os cards já foram marcados. Veja o inventário completo ou limpe as marcações.';
      renderInventory(null);
      return;
    }

    index = U.clamp(index, 0, items.length - 1);
    var card = items[index];
    dom.group.textContent = GROUPS[card.group] || 'Conceito';
    dom.question.textContent = card.card.front;
    dom.title.textContent = card.label;
    dom.answer.textContent = card.card.back;
    dom.tip.textContent = card.card.tip;
    dom.position.textContent = 'Card ' + (index + 1) + ' de ' + items.length + FILTER_LABEL[filter];
    dom.card.setAttribute('data-mark', marks[card.id] || '');
    dom.status.textContent = marks[card.id] === 'known' ? '✓ Marcado como “Já sei”'
      : marks[card.id] === 'review' ? '↺ Marcado como “Preciso revisar”' : '';
    setFlipped(false, false);
    renderInventory(card.id);
  }

  function renderInventory(currentId) {
    dom.inventory.textContent = '';
    LCPU.CONCEPTS.forEach(function (concept) {
      var m = marks[concept.id];
      var label = shortLabel(concept);
      var stateText = m === 'known' ? 'já sei' : m === 'review' ? 'preciso revisar' : 'não marcado';
      var btn = U.el('button', {
        type: 'button',
        class: 'inv-slot' + (m ? ' is-' + m : '') + (concept.id === currentId ? ' is-current' : ''),
        'aria-label': label + ': ' + stateText + '. Abrir card.',
        'aria-current': concept.id === currentId ? 'true' : null,
        title: label + ' (' + stateText + ')'
      }, [U.el('span', { class: 'inv-label', text: softHyphens(label) })]);
      btn.addEventListener('click', function () { showCard(concept.id); });
      dom.inventory.appendChild(U.el('li', null, [btn]));
    });
  }

  /* ---------- Ações ---------- */
  function step(delta) {
    var items = filtered();
    if (!items.length) return;
    index = (index + delta + items.length) % items.length;
    render();
  }

  function mark(value) {
    var items = filtered();
    if (!items.length) return;
    var card = items[index];
    marks[card.id] = value;
    save();
    LCPU.Audio.play(value === 'known' ? 'correct' : 'select');
    U.announce(shortLabel(card) + ' marcado como ' + (value === 'known' ? '“Já sei”.' : '“Preciso revisar”.'));

    // Avança: se o card continua no filtro, vai para o próximo; se saiu, o próximo "escorrega" para o lugar dele
    var after = filtered();
    if (after.indexOf(card) !== -1) index += 1;
    if (index >= after.length) index = 0;
    render();
    emitProgress();

    var c = counts();
    if (c.known === c.total) LCPU.Achievements.unlock('inventario');
  }

  /** Abre um card específico (usado pelo inventário e pelo quiz). */
  function showCard(id) {
    var concept = cards.filter(function (c) { return c.id === id; })[0];
    if (!concept) return;
    if (filtered().indexOf(concept) === -1) filter = 'all';
    index = filtered().indexOf(concept);
    save();
    render();
    if (dom.flip && !dom.flip.disabled) dom.flip.focus({ preventScroll: true });
  }

  function emitProgress() {
    LCPU.emit('flashcards:progress', counts());
  }

  function init() {
    dom.section = U.$('[data-view="flashcards"]');
    if (!dom.section) return;
    dom.card = U.$('#flashcard');
    dom.cardArea = U.$('#fc-card-area');
    dom.front = U.$('#fc-front');
    dom.back = U.$('#fc-back');
    dom.group = U.$('#fc-group');
    dom.question = U.$('#fc-question');
    dom.title = U.$('#fc-title');
    dom.answer = U.$('#fc-answer');
    dom.tip = U.$('#fc-tip');
    dom.status = U.$('#fc-status');
    dom.position = U.$('#fc-position');
    dom.prev = U.$('#fc-prev');
    dom.next = U.$('#fc-next');
    dom.flip = U.$('#fc-flip');
    dom.known = U.$('#fc-known');
    dom.review = U.$('#fc-review');
    dom.empty = U.$('#fc-empty');
    dom.emptyText = U.$('#fc-empty-text');
    dom.stats = U.$('#fc-stats');
    dom.progress = U.$('#fc-progress');
    dom.bar = U.$('#fc-bar');
    dom.inventory = U.$('#fc-inventory');
    dom.countAll = U.$('#fc-count-all');
    dom.countReview = U.$('#fc-count-review');
    dom.countUnseen = U.$('#fc-count-unseen');

    cards = LCPU.CONCEPTS.slice();
    load();

    dom.card.addEventListener('click', function () { setFlipped(!flipped, true); });
    dom.flip.addEventListener('click', function () { setFlipped(!flipped, true); });
    dom.prev.addEventListener('click', function () { step(-1); });
    dom.next.addEventListener('click', function () { step(1); });
    dom.known.addEventListener('click', function () { mark('known'); });
    dom.review.addEventListener('click', function () { mark('review'); });
    U.$('#fc-show-all').addEventListener('click', function () {
      filter = 'all';
      index = 0;
      save();
      render();
    });
    U.$('#fc-shuffle').addEventListener('click', function () {
      cards = U.shuffle(cards);
      index = 0;
      render();
      U.announce('Cards embaralhados.');
    });
    U.$$('.seg-btn', dom.section).forEach(function (btn) {
      btn.addEventListener('click', function () {
        filter = btn.getAttribute('data-filter');
        index = 0;
        save();
        render();
      });
    });
    U.$('#fc-reset').addEventListener('click', function () {
      LCPU.UI.confirm({
        title: 'Limpar as marcações?',
        message: 'Todos os cards voltam a “não marcado”. As conquistas já obtidas continuam salvas.',
        confirmText: 'Limpar',
        cancelText: 'Cancelar',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        marks = {};
        index = 0;
        save();
        render();
        emitProgress();
        U.announce('Marcações apagadas.');
      });
    });

    render();
  }

  LCPU.Flashcards = {
    showCard: showCard,
    progress: counts
  };

  LCPU.register('flashcards', init);
})(window.LCPU = window.LCPU || {});
