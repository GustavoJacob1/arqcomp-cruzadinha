/* ==========================================================================
   The Legend of CPU — game.js
   Regras da partida: conferência, contador de acertos, progresso,
   registrador de bits, pontuação, cronômetro, conquistas da cruzadinha,
   salvamento automático (com validação), reinício e tela de vitória.

   Regras de pontuação (também explicadas em "Como jogar"):
   - +100 por palavra, na primeira vez que ela é confirmada correta;
   - conferir nunca tira pontos;
   - ao concluir: +300 de bônus e bônus de tempo de até 500
     (perde 1 ponto a cada 2 segundos de partida, nunca negativo).
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var SAVE_KEY = 'partida';
  var RECORDS_KEY = 'recordes';
  var POINTS_PER_WORD = 100;
  var COMPLETION_BONUS = 300;
  var TIME_BONUS_MAX = 500;
  var FAST_FINISH_MS = 10 * 60 * 1000;
  var STATUSES = ['unchecked', 'correct', 'incorrect', 'incomplete'];

  var C = null;          // atalho para LCPU.Crossword
  var game = null;       // estado da partida atual
  var records = { bestScore: 0, bestTimeMs: null, wins: 0 };
  var dom = {};
  var signature = '';    // "assinatura" da grade: invalida saves de outra versão do tabuleiro
  var tickTimer = null;
  var saveTimer = null;
  var fullBoardNoticeShown = false;
  var storageWarned = false;
  var maxScore = 0;

  function newGame() {
    var status = {};
    C.model.words.forEach(function (w) { status[w.id] = 'unchecked'; });
    return {
      status: status,       // id -> unchecked | correct | incorrect | incomplete
      awarded: [],          // palavras que já renderam pontos
      score: 0,
      checks: 0,            // quantas conferências foram feitas
      elapsed: 0,           // tempo acumulado (ms)
      runningSince: null,   // performance.now() de quando o cronômetro voltou a contar
      started: false,
      completed: false,
      bonus: { completion: 0, time: 0 },
      finishedAt: null
    };
  }

  /* ------------------------------------------------------------------------
     Inicialização
     ------------------------------------------------------------------------ */
  function init() {
    C = LCPU.Crossword;
    if (!C || !C.ready) return; // grade inválida: o crossword.js já mostrou o erro

    dom = {
      time: U.$('#hud-time'),
      score: U.$('#hud-score'),
      correct: U.$('#hud-correct'),
      fill: U.$('#hud-fill'),
      bar: U.$('#hud-bar'),
      barFill: U.$('#hud-bar-fill'),
      bits: U.$('#bit-register-bits'),
      hex: U.$('#bit-register-hex'),
      register: U.$('#bit-register'),
      check: U.$('#btn-check'),
      restart: U.$('#btn-restart'),
      help: U.$('#btn-help'),
      result: U.$('#check-result'),
      frame: U.$('#board-frame'),
      storageWarning: U.$('#storage-warning'),
      victory: U.$('#dialog-victory')
    };

    maxScore = C.model.words.length * POINTS_PER_WORD + COMPLETION_BONUS + TIME_BONUS_MAX;
    signature = computeSignature(C.model);
    game = newGame();
    buildBits();
    loadRecords();
    restore();

    dom.check.addEventListener('click', check);
    dom.restart.addEventListener('click', function () { restart(false); });
    dom.help.addEventListener('click', function () { LCPU.UI.open(U.$('#dialog-help')); });
    dom.victory.addEventListener('close', function () {
      stopConfetti();
      if (dom.victory.returnValue === 'replay') restart(true);
    });

    LCPU.on('crossword:input', onInput);
    LCPU.on('crossword:interaction', ensureStarted);
    LCPU.on('crossword:clue-click', ensureStarted);
    LCPU.on('view:change', syncTimer);
    LCPU.on('ui:modal', syncTimer);
    LCPU.on('storage:unavailable', showStorageWarning);
    document.addEventListener('visibilitychange', function () {
      syncTimer();
      if (document.hidden) save();
    });
    window.addEventListener('pagehide', save);

    if (!LCPU.Storage.available) showStorageWarning();
    updateAll();
  }

  function computeSignature(model) {
    var text = model.words.map(function (w) {
      return w.id + ':' + w.answer + '@' + w.row + ',' + w.col + w.dir;
    }).join('|');
    var hash = 5381;
    for (var i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
    return hash.toString(36);
  }

  function showStorageWarning() {
    if (dom.storageWarning) dom.storageWarning.hidden = false;
    if (!storageWarned) {
      storageWarned = true;
      LCPU.UI.toast({ type: 'warning', title: 'Progresso não será salvo', message: 'O navegador bloqueou o armazenamento. Você pode jogar normalmente.' });
    }
  }

  /* ------------------------------------------------------------------------
     Cronômetro: conta só com a partida iniciada, a aba visível, a tela da
     cruzadinha aberta e nenhuma janela por cima.
     ------------------------------------------------------------------------ */
  function elapsedNow() {
    return game.elapsed + (game.runningSince !== null ? performance.now() - game.runningSince : 0);
  }

  function shouldRun() {
    return game.started && !game.completed && !document.hidden &&
      LCPU.App && LCPU.App.currentView === 'cruzadinha' && !LCPU.UI.modalOpen;
  }

  function syncTimer() {
    if (!game) return;
    if (shouldRun()) {
      if (game.runningSince === null) game.runningSince = performance.now();
      if (!tickTimer) tickTimer = window.setInterval(renderTime, 500);
    } else {
      if (game.runningSince !== null) {
        game.elapsed = elapsedNow();
        game.runningSince = null;
        scheduleSave();
      }
      if (tickTimer) {
        window.clearInterval(tickTimer);
        tickTimer = null;
      }
    }
    renderTime();
  }

  function ensureStarted() {
    if (!game.started && !game.completed) {
      game.started = true;
      syncTimer();
      updateAll();
    }
  }

  function renderTime() {
    dom.time.textContent = U.formatTime(elapsedNow());
  }

  /* ------------------------------------------------------------------------
     Conferência
     ------------------------------------------------------------------------ */
  function evaluateWord(word) {
    var value = C.wordValue(word.id);
    if (value.some(function (l) { return !l; })) return 'incomplete';
    return value.join('') === word.answer ? 'correct' : 'incorrect';
  }

  function check() {
    if (game.completed) {
      LCPU.UI.toast({ message: 'A cruzadinha já foi concluída! Use “Reiniciar” para jogar de novo.', icon: 'trophy' });
      return;
    }
    ensureStarted();
    var groups = { correct: [], incorrect: [], incomplete: [] };
    var newly = [];
    C.model.words.forEach(function (w) {
      var st = evaluateWord(w);
      game.status[w.id] = st;
      groups[st].push(w.id);
      if (st === 'correct' && game.awarded.indexOf(w.id) === -1) {
        game.awarded.push(w.id);
        newly.push(w.id);
      }
    });
    game.checks += 1;
    game.score += newly.length * POINTS_PER_WORD;
    C.setStatuses(game.status);

    if (newly.length) C.flashWords(newly, 'correct');
    if (groups.incorrect.length) {
      C.flashWords(groups.incorrect, 'wrong');
      groups.incorrect.forEach(function (id) {
        var item = U.$('.clue-item[data-word="' + id + '"]');
        if (!item) return;
        item.classList.remove('anim-wrong');
        void item.offsetWidth;
        item.classList.add('anim-wrong');
      });
    }

    if (groups.correct.length === C.model.words.length) {
      finish();
      return;
    }

    if (newly.length) LCPU.Audio.play('correct');
    else if (groups.incorrect.length) LCPU.Audio.play('wrong');
    else LCPU.Audio.play('click');

    showCheckResult(groups, newly.length);
    checkAchievements();
    updateAll();
    save();
  }

  function showCheckResult(groups, newlyCount) {
    var c = groups.correct.length;
    var i = groups.incorrect.length;
    var n = groups.incomplete.length;
    var tip;
    if (i > 0) tip = 'Algum bit está trocado nas palavras marcadas como incorretas. Ajuste e confira de novo — conferir não tira pontos.';
    else if (n > 0) tip = 'Nenhuma palavra completa está errada. Agora é preencher o restante!';
    else tip = '';
    dom.result.textContent = '';
    dom.result.setAttribute('data-state', i > 0 ? 'warning' : 'ok');
    dom.result.appendChild(U.el('p', { class: 'check-summary' }, [
      U.el('strong', { text: 'Conferência ' + game.checks + ': ' }),
      U.el('span', { class: 'check-pill is-correct' }, [U.el('span', { 'aria-hidden': 'true', text: '✓ ' }), U.plural(c, 'correta', 'corretas')]),
      U.el('span', { class: 'check-pill is-incorrect' }, [U.el('span', { 'aria-hidden': 'true', text: '✗ ' }), U.plural(i, 'incorreta', 'incorretas')]),
      U.el('span', { class: 'check-pill is-incomplete' }, [U.el('span', { 'aria-hidden': 'true', text: '… ' }), U.plural(n, 'incompleta', 'incompletas')]),
      newlyCount ? U.el('span', { class: 'check-points', text: '+' + newlyCount * POINTS_PER_WORD + ' pontos' }) : null
    ]));
    if (tip) dom.result.appendChild(U.el('p', { class: 'check-tip', text: tip }));
  }

  /* Edições depois de conferir: a palavra volta a "não conferida" */
  function onInput(detail) {
    ensureStarted();
    var changed = {};
    (detail.words || []).forEach(function (id) {
      if (game.status[id] && game.status[id] !== 'unchecked') {
        game.status[id] = 'unchecked';
        changed[id] = 'unchecked';
      }
    });
    if (Object.keys(changed).length) {
      C.setStatuses(changed);
      dom.result.setAttribute('data-state', 'stale');
      dom.result.textContent = '';
      dom.result.appendChild(U.el('p', { class: 'check-tip', text: 'Você editou uma palavra já conferida: ela voltou a “não conferida”. Confira de novo quando quiser.' }));
    }
    updateAll();

    // Tabuleiro cheio: se tudo estiver certo, conclui sozinho; senão, só avisa
    var letters = C.getLetters();
    if (letters.every(Boolean)) {
      var allRight = C.model.words.every(function (w) { return evaluateWord(w) === 'correct'; });
      if (allRight) {
        check();
        return;
      }
      if (!fullBoardNoticeShown) {
        fullBoardNoticeShown = true;
        LCPU.UI.toast({ icon: 'bits', title: 'Todas as casas preenchidas', message: 'Use “Conferir” para ver quais palavras estão certas.' });
      }
    } else {
      fullBoardNoticeShown = false;
    }
    scheduleSave();
  }

  /* ------------------------------------------------------------------------
     Conquistas ligadas à cruzadinha
     ------------------------------------------------------------------------ */
  function checkAchievements() {
    var A = LCPU.Achievements;
    var isOk = function (id) { return game.status[id] === 'correct'; };
    var correct = C.model.words.filter(function (w) { return isOk(w.id); }).length;
    var memory = LCPU.CONCEPTS.filter(function (c) { return c.group === 'memoria'; }).map(function (c) { return c.id; });
    if (correct >= 1) A.unlock('primeiro-bit');
    if (correct >= 8) A.unlock('um-byte');
    if (isOk('addressbus') && isOk('databus')) A.unlock('barramentos');
    if (memory.length && memory.every(isOk)) A.unlock('hierarquia');
    if (isOk('dualcore') && isOk('quadcore')) A.unlock('multinucleo');
    if (game.completed) {
      A.unlock('cruzada');
      if (game.elapsed < FAST_FINISH_MS) A.unlock('clock-turbo');
    }
  }

  /* ------------------------------------------------------------------------
     Vitória
     ------------------------------------------------------------------------ */
  function finish() {
    game.completed = true;
    syncTimer(); // para o cronômetro e consolida o tempo
    game.bonus.completion = COMPLETION_BONUS;
    game.bonus.time = Math.max(0, TIME_BONUS_MAX - Math.floor(game.elapsed / 2000));
    game.score += game.bonus.completion + game.bonus.time;
    game.finishedAt = Date.now();

    records.wins += 1;
    var newRecord = game.score > records.bestScore;
    if (newRecord) records.bestScore = game.score;
    var newBestTime = records.bestTimeMs === null || game.elapsed < records.bestTimeMs;
    if (newBestTime) records.bestTimeMs = game.elapsed;
    LCPU.Storage.write(RECORDS_KEY, records);

    C.setLocked(true);
    dom.frame.classList.add('is-complete');
    C.flashWords(C.model.words.map(function (w) { return w.id; }), 'correct');

    dom.result.textContent = '';
    dom.result.setAttribute('data-state', 'complete');
    dom.result.appendChild(U.el('p', { class: 'check-summary' }, [
      U.el('strong', { text: 'Cruzadinha concluída! ' }),
      '16 de 16 palavras corretas em ' + U.formatTimeLong(game.elapsed) + ' · ' + game.score.toLocaleString('pt-BR') + ' pontos.'
    ]));

    updateAll();
    save();
    LCPU.Audio.play('victory');
    checkAchievements();
    showVictory(newRecord, newBestTime);
    LCPU.emit('game:complete', progress());
  }

  function showVictory(newRecord, newBestTime) {
    var stats = U.$('#victory-stats');
    var words = U.$('#victory-words');
    var wordPoints = C.model.words.length * POINTS_PER_WORD;
    var rows = [
      ['Tempo', U.formatTime(game.elapsed) + (newBestTime ? ' · melhor!' : '')],
      ['Conferências', String(game.checks)],
      ['Palavras (16 × 100)', '+' + wordPoints.toLocaleString('pt-BR')],
      ['Bônus de conclusão', '+' + game.bonus.completion],
      ['Bônus de tempo', '+' + game.bonus.time],
      ['Recorde', records.bestScore.toLocaleString('pt-BR') + (newRecord ? ' · novo!' : '')],
      ['Pontuação total', game.score.toLocaleString('pt-BR') + ' pontos']
    ];
    stats.textContent = '';
    rows.forEach(function (row, i) {
      var wrap = U.el('div', { class: 'victory-stat' + (i === rows.length - 1 ? ' is-total' : '') }, [
        U.el('dt', { text: row[0] }),
        U.el('dd', { text: row[1] })
      ]);
      stats.appendChild(wrap);
    });

    words.textContent = '';
    C.model.words.forEach(function (w) {
      var concept = LCPU.CONCEPTS.filter(function (c) { return c.id === w.id; })[0];
      words.appendChild(U.el('li', { class: 'chip' }, [concept ? concept.label : w.answer]));
    });

    LCPU.UI.open(dom.victory);
    startConfetti();
  }

  /* Confete pixelado em <canvas> (desligado com "reduzir movimento") */
  var confettiFrame = null;
  function startConfetti() {
    var canvas = U.$('#confetti');
    if (!canvas || U.reducedMotion() || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var rect = dom.victory.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
    var colors = ['#ffc53d', '#38e1ff', '#ff5fcf', '#46e08a', '#a78bfa', '#ffffff'];
    var pieces = [];
    for (var i = 0; i < 90; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.6,
        s: 4 + Math.floor(Math.random() * 3) * 2,
        vy: 1.4 + Math.random() * 2.4,
        vx: -1 + Math.random() * 2,
        c: colors[i % colors.length]
      });
    }
    var start = performance.now();
    function frame(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(function (p) {
        p.y += p.vy;
        p.x += p.vx;
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      });
      if (now - start < 3200) confettiFrame = window.requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    stopConfetti();
    confettiFrame = window.requestAnimationFrame(frame);
  }

  function stopConfetti() {
    if (confettiFrame) window.cancelAnimationFrame(confettiFrame);
    confettiFrame = null;
    var canvas = U.$('#confetti');
    if (canvas && canvas.getContext) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ------------------------------------------------------------------------
     Reiniciar
     ------------------------------------------------------------------------ */
  function hasProgress() {
    return game.started || game.checks > 0 || C.getLetters().some(Boolean);
  }

  function restart(skipConfirm) {
    var ask = hasProgress() && !skipConfirm
      ? LCPU.UI.confirm({
        title: 'Reiniciar a partida?',
        message: 'As letras, o tempo e a pontuação desta partida serão apagados. Suas conquistas, o recorde e a preferência de som continuam guardados.',
        confirmText: 'Reiniciar',
        cancelText: 'Continuar jogando',
        danger: true
      })
      : Promise.resolve(true);

    ask.then(function (ok) {
      if (!ok) return;
      if (game.runningSince !== null) game.runningSince = null;
      game = newGame();
      fullBoardNoticeShown = false;
      C.setLetters([]);
      C.setStatuses(game.status);
      C.setLocked(false);
      dom.frame.classList.remove('is-complete');
      dom.result.textContent = '';
      dom.result.removeAttribute('data-state');
      syncTimer();
      updateAll();
      save();
      C.selectWord(C.model.words[0].id, { focus: false });
      LCPU.UI.toast({ icon: 'star', message: 'Nova partida iniciada. Boa cruzada!' });
      U.announce('Nova partida iniciada.');
    });
  }

  /* ------------------------------------------------------------------------
     HUD: contador, barra, preenchimento, pontos e registrador de bits
     ------------------------------------------------------------------------ */
  function buildBits() {
    dom.bits.textContent = '';
    C.model.words.forEach(function (w, i) {
      if (i === 8) dom.bits.appendChild(U.el('span', { class: 'bit-gap' }));
      dom.bits.appendChild(U.el('span', { class: 'bit', 'data-word': w.id, title: w.number + ' ' + (w.dir === 'H' ? 'horizontal' : 'vertical') }));
    });
  }

  function progress() {
    var letters = C.getLetters();
    var correct = C.model.words.filter(function (w) { return game.status[w.id] === 'correct'; }).length;
    return {
      correct: correct,
      total: C.model.words.length,
      filled: letters.filter(Boolean).length,
      cells: letters.length,
      score: game.score,
      started: game.started,
      completed: game.completed,
      checks: game.checks,
      elapsed: elapsedNow(),
      status: Object.assign({}, game.status),
      bestScore: records.bestScore
    };
  }

  function updateAll() {
    var p = progress();
    dom.correct.textContent = p.correct + ' de ' + p.total + ' palavras corretas';
    dom.fill.textContent = 'Preenchimento: ' + Math.round((p.filled / p.cells) * 100) + '%';
    dom.barFill.style.width = (p.correct / p.total) * 100 + '%';
    dom.bar.setAttribute('aria-valuenow', String(p.correct));
    dom.bar.setAttribute('aria-valuetext', p.correct + ' de ' + p.total + ' palavras corretas');
    dom.score.textContent = p.score.toLocaleString('pt-BR');

    // Registrador: cada palavra correta liga um bit (bit mais à esquerda = mais significativo)
    var value = 0;
    U.$$('.bit', dom.bits).forEach(function (bit, i) {
      var on = game.status[bit.getAttribute('data-word')] === 'correct';
      bit.classList.toggle('is-on', on);
      if (on) value |= 1 << (p.total - 1 - i);
    });
    var hex = '0x' + value.toString(16).toUpperCase().padStart(4, '0');
    dom.hex.textContent = hex;
    dom.register.setAttribute('aria-label', 'Registrador do núcleo: ' + p.correct + ' de ' + p.total + ' bits ativos (' + hex + ')');

    renderTime();
    LCPU.emit('game:progress', p);
  }

  /* ------------------------------------------------------------------------
     Salvamento e recuperação
     ------------------------------------------------------------------------ */
  function save() {
    if (!game) return;
    LCPU.Storage.write(SAVE_KEY, {
      v: 1,
      sig: signature,
      letters: C.getLetters().map(function (l) { return l || '.'; }).join(''),
      status: game.status,
      awarded: game.awarded,
      score: game.score,
      checks: game.checks,
      elapsed: Math.round(elapsedNow()),
      started: game.started,
      completed: game.completed,
      bonus: game.bonus,
      finishedAt: game.finishedAt,
      savedAt: Date.now()
    });
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(save, 400);
  }

  function isNum(value, max) {
    return typeof value === 'number' && isFinite(value) && value >= 0 && value <= max;
  }

  /** Confere cada campo salvo; qualquer inconsistência grave descarta o save. */
  function validateSave(raw) {
    if (!raw || typeof raw !== 'object' || raw.v !== 1 || raw.sig !== signature) return null;
    var cellCount = C.model.cells.length;
    if (typeof raw.letters !== 'string' || raw.letters.length !== cellCount || !/^[A-Z.]+$/.test(raw.letters)) return null;
    if (!raw.status || typeof raw.status !== 'object' || !Array.isArray(raw.awarded)) return null;
    if (!isNum(raw.score, maxScore) || !isNum(raw.checks, 1e6) || !isNum(raw.elapsed, 1e10)) return null;

    var letters = raw.letters.split('').map(function (ch) { return ch === '.' ? '' : ch; });
    var status = {};
    C.model.words.forEach(function (w) {
      var st = STATUSES.indexOf(raw.status[w.id]) === -1 ? 'unchecked' : raw.status[w.id];
      // o estado salvo precisa bater com as letras salvas; se não bater, volta a "não conferida"
      var value = w.cells.map(function (i) { return letters[i]; });
      var actual = value.some(function (l) { return !l; }) ? 'incomplete' : (value.join('') === w.answer ? 'correct' : 'incorrect');
      status[w.id] = st !== 'unchecked' && st !== actual ? 'unchecked' : st;
    });
    var awarded = raw.awarded.filter(function (id, i, arr) {
      return typeof id === 'string' && C.model.wordById[id] && arr.indexOf(id) === i;
    });
    var completed = raw.completed === true && C.model.words.every(function (w) { return status[w.id] === 'correct'; });
    var bonus = raw.bonus && typeof raw.bonus === 'object' ? raw.bonus : {};
    return {
      letters: letters,
      status: status,
      awarded: awarded,
      score: Math.floor(raw.score),
      checks: Math.floor(raw.checks),
      elapsed: raw.elapsed,
      started: raw.started === true || raw.elapsed > 0 || letters.some(Boolean),
      completed: completed,
      bonus: {
        completion: completed && isNum(bonus.completion, COMPLETION_BONUS) ? bonus.completion : 0,
        time: completed && isNum(bonus.time, TIME_BONUS_MAX) ? bonus.time : 0
      },
      finishedAt: typeof raw.finishedAt === 'number' ? raw.finishedAt : null
    };
  }

  function restore() {
    var saved = LCPU.Storage.read(SAVE_KEY);
    if (saved.status === 'missing') return;
    var data = saved.status === 'ok' ? validateSave(saved.value) : null;
    if (!data) {
      LCPU.Storage.remove(SAVE_KEY);
      LCPU.UI.toast({ type: 'warning', title: 'Progresso não recuperado', message: 'Os dados salvos estavam inválidos e foram descartados. Uma nova partida começou.' });
      return;
    }
    C.setLetters(data.letters);
    game.status = data.status;
    game.awarded = data.awarded;
    game.score = data.score;
    game.checks = data.checks;
    game.elapsed = data.elapsed;
    game.started = data.started;
    game.completed = data.completed;
    game.bonus = data.bonus;
    game.finishedAt = data.finishedAt;
    C.setStatuses(game.status);
    if (game.completed) {
      C.setLocked(true);
      dom.frame.classList.add('is-complete');
    }
    if (game.started && !game.completed) {
      var p = progress();
      LCPU.UI.toast({ icon: 'scroll', title: 'Partida recuperada', message: p.correct + ' de ' + p.total + ' palavras corretas · ' + U.formatTime(game.elapsed) + ' de jogo.' });
    }
  }

  function loadRecords() {
    var saved = LCPU.Storage.read(RECORDS_KEY);
    if (saved.status !== 'ok' || !saved.value || typeof saved.value !== 'object') return;
    var r = saved.value;
    if (isNum(r.bestScore, maxScore)) records.bestScore = Math.floor(r.bestScore);
    if (isNum(r.bestTimeMs, 1e10)) records.bestTimeMs = r.bestTimeMs;
    if (isNum(r.wins, 1e6)) records.wins = Math.floor(r.wins);
  }

  LCPU.Game = {
    progress: function () { return game ? progress() : null; },
    get records() { return Object.assign({}, records); },
    check: function () { check(); },
    restart: restart
  };

  LCPU.register('game', init);
})(window.LCPU = window.LCPU || {});
