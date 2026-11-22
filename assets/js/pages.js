/* ==========================================================================
   The Legend of CPU — pages.js
   Conteúdo dinâmico das telas "Início" e "Como jogar":
   progresso da jornada, bits do núcleo, dicas do mascote Byte e o
   relatório da validação interna da grade.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;

  var TIPS = [
    'Cada cruzamento é uma pista grátis: uma letra serve para duas palavras!',
    'Conferir não tira pontos. Teste suas hipóteses sem medo!',
    'Travou numa palavra? O Inventário do Conhecimento guarda explicações valiosas.',
    'Espaço alterna entre horizontal e vertical. No celular, toque de novo na casa.',
    'Cada palavra certa acende um bit do núcleo. Junte os 16 e chegue a 0xFFFF!',
    'Seu progresso fica salvo neste navegador. Pode pausar para um café.',
    'Comece pelas palavras curtas e use os cruzamentos para destravar as longas.',
    'Leia a pista inteira: os detalhes separam a RAM da ROM e a cache dos registradores.'
  ];
  var lastTip = 0;

  function rotateTip() {
    var el = U.$('#speech-text');
    if (!el) return;
    var next = lastTip;
    while (TIPS.length > 1 && next === lastTip) next = Math.floor(Math.random() * TIPS.length);
    lastTip = next;
    el.textContent = TIPS[next];
  }

  function updateHome(p) {
    if (!p) return;
    var cta = U.$('#home-cta-text');
    var text = U.$('#home-progress');
    var quest = U.$('#quest-cruzadinha');
    if (p.completed) {
      cta.textContent = 'Ver o Núcleo restaurado';
      text.textContent = 'Núcleo restaurado com ' + p.score.toLocaleString('pt-BR') + ' pontos! Que tal revisar no Inventário ou encarar o Desafio dos Circuitos?';
      quest.textContent = '✓ Concluída · ' + p.score.toLocaleString('pt-BR') + ' pontos';
    } else if (p.started) {
      cta.textContent = 'Continuar a cruzada (' + p.correct + '/' + p.total + ')';
      text.textContent = 'Jornada em andamento: ' + p.correct + ' de ' + p.total + ' fragmentos restaurados · ' +
        U.formatTime(p.elapsed) + ' de jogo.';
      quest.textContent = p.correct + ' de ' + p.total + ' palavras corretas';
    } else {
      cta.textContent = 'Começar a cruzada';
      text.textContent = 'Sua jornada ainda não começou: 0 de ' + p.total + ' fragmentos restaurados.';
      quest.textContent = p.total + ' fragmentos esperando por você';
    }
    if (p.bestScore) text.textContent += ' Recorde: ' + p.bestScore.toLocaleString('pt-BR') + ' pontos.';

    // Bits do núcleo na tela inicial acendem junto com o registrador da partida
    var words = LCPU.Crossword.model.words;
    U.$$('.core-bit').forEach(function (bit, i) {
      bit.classList.toggle('is-on', !!(words[i] && p.status[words[i].id] === 'correct'));
    });
  }

  /* Status das áreas de estudo nos cartões de missão */
  function updateFlashcardsQuest(c) {
    var el = U.$('#quest-flashcards');
    if (!el || !c) return;
    el.textContent = c.known === c.total
      ? '✓ Inventário completo: ' + c.total + ' de ' + c.total
      : c.known + ' de ' + c.total + ' dominados · ' + c.review + ' para revisar';
  }

  function updateQuizQuest(best) {
    var el = U.$('#quest-quiz');
    if (!el) return;
    el.textContent = best === null || best === undefined
      ? LCPU.QUIZ.length + ' questões esperando por você'
      : 'Melhor resultado: ' + best + '%';
  }

  function updateMatchingQuest(stats) {
    var el = U.$('#quest-associacao');
    if (!el || !stats) return;
    el.textContent = stats.rounds
      ? U.plural(stats.rounds, 'rodada concluída', 'rodadas concluídas') + ' · ' + U.plural(stats.perfect, 'perfeita', 'perfeitas')
      : 'Rodadas de 6 pares';
  }

  function renderIntegrity() {
    var list = U.$('#integrity-report');
    if (!list) return;
    list.textContent = '';
    var report = LCPU.Crossword && LCPU.Crossword.report;
    if (!report) {
      list.appendChild(U.el('li', { class: 'is-fail', text: 'A validação não pôde ser executada.' }));
      return;
    }
    var item = function (ok, text) {
      return U.el('li', { class: ok ? 'is-ok' : 'is-fail' }, [
        U.el('span', { class: 'integrity-mark', 'aria-hidden': 'true', text: ok ? '✓' : '✗' }),
        U.el('span', { text: text + (ok ? '' : ' (falhou)') })
      ]);
    };
    report.checks.forEach(function (c) { list.appendChild(item(c.ok, c.text)); });
    var clues = LCPU.CrosswordModel.checkClues(LCPU.CONCEPTS);
    var okClues = clues.filter(function (r) { return r.ok; }).length;
    list.appendChild(item(okClues === clues.length,
      'Pistas com até 15 palavras e sem entregar a resposta: ' + okClues + ' de ' + clues.length));
    var s = report.stats;
    list.appendChild(U.el('li', { class: 'integrity-stats', text:
      'Resumo: ' + s.words + ' palavras (' + s.across + ' horizontais e ' + s.down + ' verticais), ' +
      s.crossings + ' cruzamentos e ' + s.cells + ' casas em uma grade de ' + s.rows + ' × ' + s.cols + '.' }));
  }

  function init() {
    renderIntegrity();
    rotateTip();
    if (LCPU.Game && LCPU.Crossword && LCPU.Crossword.ready) {
      updateHome(LCPU.Game.progress());
      LCPU.on('game:progress', updateHome);
    }
    LCPU.on('view:change', function (detail) {
      if (detail.view === 'inicio') rotateTip();
    });

    if (LCPU.Flashcards) updateFlashcardsQuest(LCPU.Flashcards.progress());
    if (LCPU.Quiz) updateQuizQuest(LCPU.Quiz.best);
    if (LCPU.Matching) updateMatchingQuest(LCPU.Matching.stats);
    LCPU.on('flashcards:progress', updateFlashcardsQuest);
    LCPU.on('quiz:result', function (r) { updateQuizQuest(r.best); });
    LCPU.on('matching:progress', updateMatchingQuest);
  }

  LCPU.register('pages', init);
})(window.LCPU = window.LCPU || {});
