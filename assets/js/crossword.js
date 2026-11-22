/* ==========================================================================
   The Legend of CPU — crossword.js
   Tabuleiro interativo: desenha as casas e as pistas a partir do modelo,
   controla a seleção (pista <-> casa), a digitação, a navegação pelo
   teclado e o toque no celular.

   Este módulo NÃO decide se a resposta está certa: ele só guarda as letras
   e mostra os estados que o game.js informa (correta, incorreta, incompleta).

   Eventos emitidos (LCPU.on):
   - crossword:ready      { model, report }
   - crossword:input      { index, letter, previous, words }   (o jogador mudou uma letra)
   - crossword:selection  { wordId, cellIndex, dir }
   - crossword:clue-click { wordId }
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var M = LCPU.CrosswordModel;
  var DIRS = M.DIRS;

  var STATUS_TEXT = { unchecked: '', correct: 'Correta', incorrect: 'Incorreta', incomplete: 'Incompleta' };
  var STATUS_SR = { unchecked: 'não conferida', correct: 'correta', incorrect: 'incorreta', incomplete: 'incompleta' };
  var ARROWS = {
    ArrowLeft: [0, -1, 'H'],
    ArrowRight: [0, 1, 'H'],
    ArrowUp: [-1, 0, 'V'],
    ArrowDown: [1, 0, 'V']
  };

  // Estado do tabuleiro
  var state = {
    model: null,      // modelo montado pelo crossword-model.js
    report: null,     // resultado da validação interna
    letters: [],      // uma letra por casa ('' = vazia), na ordem de model.cells
    activeWord: null, // id da palavra selecionada
    activeCell: null, // índice da casa ativa
    dir: 'H',         // direção ativa
    locked: false,    // true quando a cruzadinha foi concluída
    status: {}        // id -> 'unchecked' | 'correct' | 'incorrect' | 'incomplete'
  };

  var dom = { cells: [], clues: {} };
  var highlighted = [];
  var lastKeyAt = 0;
  var lastNoticeAt = 0;
  var pointer = { index: null, wasActive: false };

  /* ------------------------------------------------------------------------
     Inicialização
     ------------------------------------------------------------------------ */
  function init() {
    dom.section = U.$('#crossword');
    if (!dom.section) return;
    dom.board = U.$('#board');
    dom.scroll = U.$('#board-scroll');
    dom.cluesPanel = U.$('#clues');
    dom.lists = { H: U.$('#clues-H'), V: U.$('#clues-V') };
    dom.bar = {
      root: U.$('#active-clue'),
      number: U.$('#ac-number'),
      dir: U.$('#ac-dir'),
      meta: U.$('#ac-meta'),
      text: U.$('#ac-text'),
      prev: U.$('#ac-prev'),
      next: U.$('#ac-next'),
      toggle: U.$('#ac-toggle')
    };

    state.model = M.build(LCPU.CONCEPTS);
    state.report = M.validate(state.model);

    // Validação interna: se a grade tiver qualquer problema, o tabuleiro não é montado
    if (!state.report.ok) {
      showGridError(state.report.errors);
      return;
    }
    var s = state.report.stats;
    console.info('[Legend of CPU] Grade validada: ' + s.words + ' palavras, ' + s.crossings +
      ' cruzamentos, ' + s.cells + ' casas, ' + s.rows + 'x' + s.cols + ', conectada.');

    var clueProblems = M.checkClues(LCPU.CONCEPTS).filter(function (r) { return !r.ok; });
    if (clueProblems.length) console.warn('[Legend of CPU] Pistas fora das regras:', clueProblems);

    state.letters = state.model.cells.map(function () { return ''; });
    state.model.words.forEach(function (w) { state.status[w.id] = 'unchecked'; });

    renderBoard();
    renderClues();
    bindBar();

    // Seleciona a primeira pista horizontal, sem levar o foco (não abre o teclado do celular)
    var first = state.model.words[0];
    setActive(first.id, first.cells[0], first.dir, { focus: false, announce: false });

    // Ajusta o tamanho das casas ao espaço disponível
    fitBoard();
    window.addEventListener('resize', U.debounce(fitBoard, 120));
    if (window.ResizeObserver) new ResizeObserver(U.debounce(fitBoard, 60)).observe(dom.scroll);
    LCPU.on('view:change', function (detail) {
      if (detail.view !== 'cruzadinha') return;
      fitBoard(); // já com a tela visível: evita o "pulo" de tamanho
      window.requestAnimationFrame(fitBoard);
    });

    LCPU.emit('crossword:ready', { model: state.model, report: state.report });
  }

  function showGridError(errors) {
    console.error('[Legend of CPU] A validação interna da grade falhou:', errors);
    var box = U.el('div', { class: 'grid-error', role: 'alert' }, [
      U.el('strong', { text: 'Não foi possível montar o tabuleiro.' }),
      U.el('p', { text: 'A validação interna encontrou problemas na grade:' }),
      U.el('ul', null, errors.map(function (e) { return U.el('li', { text: e }); }))
    ]);
    dom.board.replaceWith(box);
  }

  /* ------------------------------------------------------------------------
     Desenho do tabuleiro e das pistas
     ------------------------------------------------------------------------ */
  function cellLabel(cell) {
    var parts = ['Linha ' + (cell.row + 1) + ', coluna ' + (cell.col + 1)];
    ['H', 'V'].forEach(function (dir) {
      if (!cell[dir]) return;
      var word = state.model.wordById[cell[dir]];
      parts.push(word.number + ' ' + DIRS[dir].label.toLowerCase() + ', letra ' +
        (cell['pos' + dir] + 1) + ' de ' + word.length);
    });
    return parts.join('. ') + '.';
  }

  function renderBoard() {
    var model = state.model;
    dom.board.style.setProperty('--rows', model.rows);
    dom.board.style.setProperty('--cols', model.cols);
    dom.board.setAttribute('aria-label', 'Tabuleiro da cruzadinha, ' + model.rows + ' linhas por ' +
      model.cols + ' colunas. Use as setas para navegar e digite as letras.');

    var frag = document.createDocumentFragment();
    model.cells.forEach(function (cell) {
      var wrap = U.el('div', { class: 'cell', 'data-index': cell.index });
      wrap.style.gridRow = String(cell.row + 1);
      wrap.style.gridColumn = String(cell.col + 1);
      if (cell.H && cell.V) wrap.classList.add('is-crossing');
      if (cell.number) {
        wrap.appendChild(U.el('span', { class: 'cell-num', 'aria-hidden': 'true', text: String(cell.number) }));
      }
      var input = U.el('input', {
        class: 'cell-input',
        type: 'text',
        inputmode: 'text',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'characters',
        spellcheck: 'false',
        enterkeyhint: 'next',
        tabindex: '-1',
        'aria-label': cellLabel(cell),
        'data-index': cell.index
      });
      wrap.appendChild(input);
      wrap.appendChild(U.el('span', { class: 'cell-arrow', 'aria-hidden': 'true' }));
      frag.appendChild(wrap);
      dom.cells[cell.index] = { wrap: wrap, input: input };
      bindCell(cell, input);
    });
    dom.board.appendChild(frag);
  }

  function renderClues() {
    ['H', 'V'].forEach(function (dir) {
      var list = dom.lists[dir];
      list.textContent = '';
      state.model[dir === 'H' ? 'across' : 'down'].forEach(function (word) {
        var concept = LCPU.CONCEPTS.filter(function (c) { return c.id === word.id; })[0];
        var statusText = U.el('span', { class: 'clue-status-text' });
        var status = U.el('span', { class: 'clue-status', 'data-status': 'unchecked', 'aria-hidden': 'true' }, [
          U.el('span', { class: 'clue-status-icon' }),
          statusText
        ]);
        var answerLabel = U.el('span', { class: 'clue-answer', hidden: true, text: concept ? concept.label : '' });
        var button = U.el('button', { type: 'button', class: 'clue-btn', 'data-word': word.id, 'data-sound': 'select' }, [
          U.el('span', { class: 'clue-num', 'aria-hidden': 'true', text: String(word.number) }),
          U.el('span', { class: 'clue-body' }, [
            U.el('span', { class: 'clue-text', text: word.clue }),
            U.el('span', { class: 'clue-meta' }, [
              U.el('span', { class: 'clue-len', text: word.length + ' letras' }),
              answerLabel
            ])
          ]),
          status
        ]);
        button.addEventListener('click', function () {
          LCPU.emit('crossword:clue-click', { wordId: word.id });
          selectWord(word.id, { focus: true, smooth: true });
        });
        var item = U.el('li', { class: 'clue-item', 'data-word': word.id }, [button]);
        list.appendChild(item);
        dom.clues[word.id] = { item: item, button: button, status: status, statusText: statusText, answer: answerLabel };
        updateClueLabel(word.id);
      });
    });
  }

  function updateClueLabel(id) {
    var word = state.model.wordById[id];
    var clue = dom.clues[id];
    var st = state.status[id] || 'unchecked';
    var label = word.number + ' ' + DIRS[word.dir].label.toLowerCase() + ', ' + word.length + ' letras: ' +
      word.clue + ' Situação: ' + STATUS_SR[st] + '.';
    if (st === 'correct') label += ' Resposta: ' + clue.answer.textContent + '.';
    clue.button.setAttribute('aria-label', label);
  }

  /* ------------------------------------------------------------------------
     Tamanho das casas: ocupa o espaço disponível sem ficar pequeno demais
     ------------------------------------------------------------------------ */
  function fitBoard() {
    if (!state.model || !dom.scroll || !dom.scroll.offsetParent) return; // tela escondida
    var model = state.model;
    var styles = window.getComputedStyle(dom.scroll);
    var gap = parseFloat(window.getComputedStyle(dom.board).columnGap) || 0;
    var availW = dom.scroll.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    var narrow = window.matchMedia('(max-width: 860px)').matches;
    var size = Math.floor((availW - gap * (model.cols - 1)) / model.cols);
    if (!narrow) {
      // no computador, o tabuleiro inteiro cabe na altura da janela
      // (descontando cabeçalho fixo, pista ativa e moldura)
      var availH = window.innerHeight - 210;
      size = Math.min(size, Math.floor((availH - gap * (model.rows - 1)) / model.rows));
    }
    // mínimo de 28px (30px no computador) para continuar fácil de tocar;
    // se não couber, o tabuleiro rola por dentro da moldura, nunca a página inteira
    size = U.clamp(size, narrow ? 28 : 30, 46);
    dom.board.style.setProperty('--cell', size + 'px');
    // Avisa quando o tabuleiro é maior que a tela e precisa ser arrastado
    var overflowing = dom.scroll.scrollWidth > dom.scroll.clientWidth + 1;
    dom.scroll.classList.toggle('is-overflowing', overflowing);
    var hint = U.$('#board-scroll-hint');
    if (hint) hint.hidden = !overflowing;
  }

  /* ------------------------------------------------------------------------
     Seleção
     ------------------------------------------------------------------------ */
  function selectCell(index, opts) {
    var cell = state.model.cells[index];
    var dir = (opts && opts.dir) || state.dir;
    if (!cell[dir]) dir = dir === 'H' ? 'V' : 'H';
    setActive(cell[dir], index, dir, opts);
  }

  /** Seleciona uma palavra pela pista: vai para a 1ª casa vazia (ou a 1ª casa, se completa). */
  function selectWord(id, opts) {
    var word = state.model.wordById[id];
    if (!word) return;
    var target = word.cells[0];
    for (var i = 0; i < word.cells.length; i++) {
      if (!state.letters[word.cells[i]]) { target = word.cells[i]; break; }
    }
    setActive(id, target, word.dir, opts || {});
  }

  function setActive(wordId, cellIndex, dir, opts) {
    opts = opts || {};
    var model = state.model;
    var word = model.wordById[wordId];
    var prevWord = state.activeWord;
    var prevCell = state.activeCell;

    state.activeWord = wordId;
    state.activeCell = cellIndex;
    state.dir = dir;

    // Remove os destaques anteriores
    highlighted.forEach(function (idx) {
      dom.cells[idx].wrap.classList.remove('in-word', 'is-start', 'is-end');
    });
    if (prevCell !== null && dom.cells[prevCell]) {
      dom.cells[prevCell].wrap.classList.remove('is-active');
      dom.cells[prevCell].input.tabIndex = -1;
    }

    // Destaca todas as casas da palavra e a casa ativa
    highlighted = word.cells.slice();
    word.cells.forEach(function (idx, i) {
      var wrap = dom.cells[idx].wrap;
      wrap.classList.add('in-word');
      if (i === 0) wrap.classList.add('is-start');
      if (i === word.cells.length - 1) wrap.classList.add('is-end');
    });
    var active = dom.cells[cellIndex];
    active.wrap.classList.add('is-active');
    active.input.tabIndex = 0; // "roving tabindex": só a casa ativa entra na ordem do Tab
    dom.board.setAttribute('data-dir', dir);

    updateClueHighlight();
    updateBar();

    if (opts.focus !== false) focusCell(cellIndex, opts.smooth);
    if (wordId !== prevWord) {
      if (opts.announce !== false) {
        U.announce(word.number + ' ' + DIRS[dir].label + ', ' + word.length + ' letras: ' + word.clue);
      }
      scrollClueIntoView(wordId);
    }
    LCPU.emit('crossword:selection', { wordId: wordId, cellIndex: cellIndex, dir: dir });
  }

  function focusCell(index, smooth) {
    var input = dom.cells[index].input;
    if (document.activeElement !== input) {
      try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
    }
    // Rola o tabuleiro (e a página, se preciso) só o suficiente para mostrar a casa
    dom.cells[index].wrap.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: smooth && !U.reducedMotion() ? 'smooth' : 'auto'
    });
  }

  function updateClueHighlight() {
    var cell = state.model.cells[state.activeCell];
    var crossDir = state.dir === 'H' ? 'V' : 'H';
    Object.keys(dom.clues).forEach(function (id) {
      var c = dom.clues[id];
      var isActive = id === state.activeWord;
      c.item.classList.toggle('is-active', isActive);
      c.item.classList.toggle('is-cross', id === cell[crossDir]);
      if (isActive) c.button.setAttribute('aria-current', 'true');
      else c.button.removeAttribute('aria-current');
    });
  }

  /** Mantém a pista ativa visível dentro do painel (só quando o painel rola sozinho). */
  function scrollClueIntoView(id) {
    var panel = dom.cluesPanel;
    var clue = dom.clues[id];
    if (!panel || !clue) return;
    var overflow = window.getComputedStyle(panel).overflowY;
    if ((overflow !== 'auto' && overflow !== 'scroll') || panel.scrollHeight <= panel.clientHeight + 2) return;
    var pr = panel.getBoundingClientRect();
    var ir = clue.item.getBoundingClientRect();
    if (ir.top < pr.top + 8) panel.scrollTop -= pr.top + 8 - ir.top;
    else if (ir.bottom > pr.bottom - 8) panel.scrollTop += ir.bottom - pr.bottom + 8;
  }

  function updateBar() {
    var word = state.model.wordById[state.activeWord];
    if (!word) return;
    var filled = word.cells.filter(function (idx) { return state.letters[idx]; }).length;
    var st = state.status[word.id] || 'unchecked';
    dom.bar.number.textContent = String(word.number);
    dom.bar.dir.textContent = DIRS[word.dir].label + ' ' + DIRS[word.dir].arrow;
    dom.bar.text.textContent = word.clue;
    dom.bar.meta.textContent = word.length + ' letras · ' + U.plural(filled, 'preenchida', 'preenchidas') +
      (st !== 'unchecked' ? ' · ' + STATUS_TEXT[st] : '');
    dom.bar.root.setAttribute('data-dir', word.dir);
    dom.bar.root.setAttribute('data-status', st);

    var cell = state.model.cells[state.activeCell];
    var canToggle = !!(cell.H && cell.V);
    dom.bar.toggle.setAttribute('aria-disabled', canToggle ? 'false' : 'true');
    dom.bar.toggle.title = canToggle
      ? 'Alternar para ' + (state.dir === 'H' ? 'vertical' : 'horizontal') + ' (Espaço)'
      : 'Esta casa pertence a uma só palavra';
  }

  function bindBar() {
    dom.bar.prev.addEventListener('click', function () { stepWord(-1); });
    dom.bar.next.addEventListener('click', function () { stepWord(1); });
    dom.bar.toggle.addEventListener('click', function () {
      if (dom.bar.toggle.getAttribute('aria-disabled') === 'true') {
        notice('Esta casa pertence a uma só palavra: não há outra direção.');
        return;
      }
      toggleDirection(true);
    });
  }

  /* ------------------------------------------------------------------------
     Movimentos
     ------------------------------------------------------------------------ */
  function toggleDirection(fromButton) {
    var cell = state.model.cells[state.activeCell];
    var other = state.dir === 'H' ? 'V' : 'H';
    if (!cell[other]) {
      notice('Esta casa pertence a uma só palavra: não há outra direção.');
      return;
    }
    setActive(cell[other], cell.index, other, { focus: true });
    if (fromButton) U.announce(DIRS[other].label + ' selecionada.');
  }

  function stepWord(delta) {
    var words = state.model.words;
    var i = 0;
    for (var k = 0; k < words.length; k++) if (words[k].id === state.activeWord) i = k;
    var next = words[(i + delta + words.length) % words.length];
    selectWord(next.id, { focus: true, smooth: true });
  }

  function moveArrow(key) {
    var a = ARROWS[key];
    var axis = a[2];
    var cell = state.model.cells[state.activeCell];
    // 1º toque numa seta perpendicular: só troca a direção (se a casa tiver palavra nesse eixo)
    if (axis !== state.dir && cell[axis]) {
      setActive(cell[axis], cell.index, axis, { focus: true });
      return;
    }
    // Senão, anda até a próxima casa preenchível nesse sentido (pulando as bloqueadas)
    var r = cell.row + a[0];
    var c = cell.col + a[1];
    while (r >= 0 && c >= 0 && r < state.model.rows && c < state.model.cols) {
      var target = state.model.cellAt(r, c);
      if (target) {
        var dir = target[axis] ? axis : (axis === 'H' ? 'V' : 'H');
        setActive(target[dir], target.index, dir, { focus: true });
        return;
      }
      r += a[0];
      c += a[1];
    }
  }

  function goToWordEdge(toEnd) {
    var word = state.model.wordById[state.activeWord];
    setActive(word.id, toEnd ? word.cells[word.cells.length - 1] : word.cells[0], word.dir, { focus: true });
  }

  function advance() {
    var word = state.model.wordById[state.activeWord];
    var pos = word.cells.indexOf(state.activeCell);
    if (pos < word.cells.length - 1) {
      setActive(word.id, word.cells[pos + 1], word.dir, { focus: true, announce: false });
    }
  }

  /* ------------------------------------------------------------------------
     Letras
     ------------------------------------------------------------------------ */
  function renderCell(index) {
    var c = dom.cells[index];
    var letter = state.letters[index] || '';
    if (c.input.value !== letter) c.input.value = letter;
    c.wrap.classList.toggle('is-filled', !!letter);
  }

  /** Grava uma letra. Uma casa de cruzamento é a mesma nas duas palavras. */
  function setLetter(index, letter, fromUser) {
    var previous = state.letters[index] || '';
    if (previous === letter) {
      renderCell(index);
      return false;
    }
    state.letters[index] = letter;
    renderCell(index);
    updateBar();
    if (fromUser) {
      var cell = state.model.cells[index];
      LCPU.emit('crossword:input', {
        index: index,
        letter: letter,
        previous: previous,
        words: [cell.H, cell.V].filter(Boolean)
      });
    }
    return true;
  }

  function typeLetter(letter) {
    if (state.locked) { lockedNotice(); return; }
    setLetter(state.activeCell, letter, true);
    advance();
  }

  /** Backspace: apaga a letra; se a casa já estiver vazia, volta uma casa e apaga. */
  function backspace() {
    if (state.locked) { lockedNotice(); return; }
    var idx = state.activeCell;
    if (state.letters[idx]) {
      setLetter(idx, '', true);
      return;
    }
    var word = state.model.wordById[state.activeWord];
    var pos = word.cells.indexOf(idx);
    if (pos > 0) {
      var prev = word.cells[pos - 1];
      setActive(word.id, prev, word.dir, { focus: true, announce: false });
      setLetter(prev, '', true);
    }
  }

  function notice(message) {
    var now = Date.now();
    if (now - lastNoticeAt < 1500) return; // não repete o aviso a cada tecla
    lastNoticeAt = now;
    U.announce(message);
    LCPU.emit('crossword:notice', { message: message });
  }

  function lockedNotice() {
    notice('A cruzadinha já foi concluída. Use "Jogar novamente" para recomeçar.');
  }

  function rejectInvalid() {
    var wrap = dom.cells[state.activeCell].wrap;
    wrap.classList.remove('is-invalid');
    void wrap.offsetWidth; // reinicia a animação
    wrap.classList.add('is-invalid');
    window.setTimeout(function () { wrap.classList.remove('is-invalid'); }, 400);
    notice('Use apenas letras de A a Z. Acentos são removidos automaticamente.');
  }

  /* ------------------------------------------------------------------------
     Eventos das casas: mouse, toque, teclado físico e teclado virtual
     ------------------------------------------------------------------------ */
  function bindCell(cell, input) {
    input.addEventListener('pointerdown', function () {
      pointer.index = cell.index;
      pointer.wasActive = state.activeCell === cell.index && document.activeElement === input;
    });

    input.addEventListener('focus', function () {
      if (state.activeCell !== cell.index) selectCell(cell.index, { focus: false });
      try { input.setSelectionRange(0, input.value.length); } catch (err) { /* campo sem seleção */ }
      dom.board.classList.add('has-focus');
      LCPU.emit('crossword:interaction', { index: cell.index }); // inicia o cronômetro na 1ª interação
    });

    input.addEventListener('blur', function () {
      dom.board.classList.remove('has-focus');
    });

    // Novo clique na casa ativa de um cruzamento alterna a direção
    input.addEventListener('click', function () {
      if (pointer.index === cell.index && pointer.wasActive && cell.H && cell.V) toggleDirection();
      pointer.index = null;
      pointer.wasActive = false;
    });

    input.addEventListener('keydown', onKeyDown);
    input.addEventListener('input', function (event) { onInput(event, cell.index); });
    input.addEventListener('paste', onPaste);
  }

  function onKeyDown(event) {
    // Teclados virtuais e composição de acentos chegam pelo evento "input"
    if (event.isComposing || event.keyCode === 229) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return; // atalhos do navegador
    var key = event.key;
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        moveArrow(key);
        return;
      case 'Backspace':
        event.preventDefault();
        backspace();
        return;
      case 'Delete':
        event.preventDefault();
        if (state.locked) lockedNotice();
        else setLetter(state.activeCell, '', true);
        return;
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        toggleDirection();
        return;
      case 'Enter':
        event.preventDefault();
        stepWord(event.shiftKey ? -1 : 1);
        return;
      case 'Home':
        event.preventDefault();
        goToWordEdge(false);
        return;
      case 'End':
        event.preventDefault();
        goToWordEdge(true);
        return;
      case 'Tab':
        return; // Tab sai do tabuleiro normalmente: o foco nunca fica preso
      default:
        break;
    }
    if (key && key.length === 1) {
      event.preventDefault();
      var letter = U.onlyLetters(key);
      if (letter.length === 1) {
        lastKeyAt = Date.now();
        typeLetter(letter);
      } else {
        rejectInvalid();
      }
    }
  }

  /** Caminho do celular e da composição de acentos: lê o valor do campo e normaliza. */
  function onInput(event, index) {
    var input = dom.cells[index].input;
    var raw = input.value;
    var type = event.inputType || '';
    if (state.locked) {
      renderCell(index);
      return;
    }
    if (type.indexOf('delete') === 0) {
      if (state.letters[index]) setLetter(index, '', true);
      else if (index === state.activeCell) backspace();
      renderCell(index);
      return;
    }
    var letters = U.onlyLetters(raw);
    var inserted = U.onlyLetters(event.data || '');
    if (!letters && !inserted) {
      renderCell(index);
      if (raw.trim()) rejectInvalid();
      return;
    }
    // Várias letras de uma vez (sugestão do teclado do celular, ditado...):
    // distribui pela palavra a partir desta casa, como no "colar"
    if (inserted.length > 1 && type !== 'insertCompositionText') {
      renderCell(index);
      if (index !== state.activeCell) selectCell(index, { focus: false });
      fillFromActive(inserted);
      return;
    }
    // Se o campo já tinha uma letra, a nova é a "outra" letra digitada
    var previous = state.letters[index] || '';
    var pool = letters;
    if (previous && letters.length > 1) {
      var at = letters.indexOf(previous);
      if (at !== -1) pool = letters.slice(0, at) + letters.slice(at + 1);
    }
    var letter = pool.charAt(pool.length - 1) || letters.charAt(letters.length - 1);
    // Evita processar duas vezes a mesma tecla (teclado físico + evento de input)
    if (Date.now() - lastKeyAt < 60 && previous === letter) {
      renderCell(index);
      return;
    }
    if (index !== state.activeCell) {
      setLetter(index, letter, true);
      return;
    }
    typeLetter(letter);
  }

  /** Colar: preenche a palavra a partir da casa ativa. */
  function onPaste(event) {
    event.preventDefault();
    if (state.locked) { lockedNotice(); return; }
    var data = event.clipboardData || window.clipboardData;
    var letters = U.onlyLetters(data ? data.getData('text') : '');
    if (!letters) { rejectInvalid(); return; }
    fillFromActive(letters);
  }

  /** Escreve várias letras seguidas na palavra ativa, a partir da casa ativa. */
  function fillFromActive(letters) {
    var word = state.model.wordById[state.activeWord];
    var pos = word.cells.indexOf(state.activeCell);
    for (var i = 0; i < letters.length && pos + i < word.cells.length; i++) {
      setLetter(word.cells[pos + i], letters.charAt(i), true);
    }
    var last = Math.min(word.cells.length - 1, pos + letters.length);
    setActive(word.id, word.cells[last], word.dir, { focus: true, announce: false });
  }

  /* ------------------------------------------------------------------------
     Estados vindos da conferência (game.js)
     ------------------------------------------------------------------------ */
  function setStatuses(map) {
    Object.keys(map).forEach(function (id) {
      if (!dom.clues[id]) return;
      var st = map[id] || 'unchecked';
      state.status[id] = st;
      var clue = dom.clues[id];
      clue.status.setAttribute('data-status', st);
      clue.statusText.textContent = STATUS_TEXT[st];
      clue.item.setAttribute('data-status', st);
      clue.answer.hidden = st !== 'correct';
      updateClueLabel(id);
    });
    renderMarks();
    updateBar();
  }

  /**
   * Marcas nas casas, sem conflito nos cruzamentos:
   * - casa de alguma palavra correta = letra confirmada (verde);
   * - casa só de palavras incorretas = sublinhado de alerta;
   * - o resultado definitivo fica, por palavra, no painel de pistas.
   */
  function renderMarks() {
    state.model.cells.forEach(function (cell) {
      var ids = [cell.H, cell.V].filter(Boolean);
      var correct = ids.some(function (id) { return state.status[id] === 'correct'; });
      var incorrect = !correct && ids.some(function (id) { return state.status[id] === 'incorrect'; });
      var wrap = dom.cells[cell.index].wrap;
      wrap.classList.toggle('is-correct', correct);
      wrap.classList.toggle('is-incorrect', incorrect);
    });
  }

  /** Animação nas casas de algumas palavras ('correct' ou 'wrong'). */
  function flashWords(ids, kind) {
    var cls = kind === 'correct' ? 'anim-correct' : 'anim-wrong';
    ids.forEach(function (id) {
      var word = state.model.wordById[id];
      if (!word) return;
      word.cells.forEach(function (idx, i) {
        var wrap = dom.cells[idx].wrap;
        wrap.classList.remove(cls);
        void wrap.offsetWidth;
        wrap.style.setProperty('--i', String(i));
        wrap.classList.add(cls);
        window.setTimeout(function () { wrap.classList.remove(cls); }, 900 + i * 60);
      });
    });
  }

  function setLocked(locked) {
    state.locked = !!locked;
    dom.board.classList.toggle('is-locked', state.locked);
    dom.cells.forEach(function (c) { c.input.readOnly = state.locked; });
  }

  function setLetters(list) {
    state.letters = state.model.cells.map(function (cell, i) {
      var letter = list && typeof list[i] === 'string' ? list[i] : '';
      return /^[A-Z]$/.test(letter) ? letter : '';
    });
    state.model.cells.forEach(function (cell) { renderCell(cell.index); });
    updateBar();
  }

  function wordValue(id) {
    var word = state.model.wordById[id];
    return word.cells.map(function (idx) { return state.letters[idx] || ''; });
  }

  LCPU.Crossword = {
    get model() { return state.model; },
    get report() { return state.report; },
    get ready() { return !!(state.model && state.report && state.report.ok); },
    get selection() { return { wordId: state.activeWord, cellIndex: state.activeCell, dir: state.dir }; },
    getLetters: function () { return state.letters.slice(); },
    setLetters: setLetters,
    wordValue: wordValue,
    setStatuses: setStatuses,
    getStatus: function (id) { return state.status[id] || 'unchecked'; },
    setLocked: setLocked,
    selectWord: selectWord,
    focusActive: function () { if (state.activeCell !== null) focusCell(state.activeCell, true); },
    flashWords: flashWords,
    fit: fitBoard
  };

  LCPU.register('crossword', init);
})(window.LCPU = window.LCPU || {});
