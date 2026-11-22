/* ==========================================================================
   The Legend of CPU — app.js
   Inicialização geral e navegação entre as telas.
   A navegação usa o #hash da URL (#inicio, #cruzadinha...), o que funciona
   no GitHub Pages sem configuração de servidor e mantém o botão "voltar".
   Este arquivo deve ser o último script carregado.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var BASE_TITLE = 'The Legend of CPU — A Cruzada dos Bits';
  var VIEWS = {
    'inicio': 'Início',
    'cruzadinha': 'Cruzadinha',
    'flashcards': 'Flashcards',
    'quiz': 'Quiz',
    'associacao': 'Associação',
    'como-jogar': 'Como jogar'
  };
  var current = null;

  function viewFromHash() {
    var name = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    return Object.prototype.hasOwnProperty.call(VIEWS, name) ? name : null;
  }

  /** Mostra uma tela e esconde as demais. */
  function showView(name, options) {
    var opts = options || {};
    if (!Object.prototype.hasOwnProperty.call(VIEWS, name)) name = 'inicio';
    var previous = current;
    current = name;

    U.$$('.view').forEach(function (view) {
      view.hidden = view.dataset.view !== name;
    });
    U.$$('[data-nav]').forEach(function (link) {
      if (link.dataset.nav === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = name === 'inicio' ? BASE_TITLE : VIEWS[name] + ' · ' + BASE_TITLE;

    if (opts.focus) {
      // Leva o foco ao título da tela: quem usa leitor de tela sabe onde está
      var heading = U.$('[data-view="' + name + '"] h1, [data-view="' + name + '"] h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      window.scrollTo(0, 0);
    }

    if (previous !== name) LCPU.emit('view:change', { view: name, previous: previous });
  }

  /** Navega para uma tela (atualiza o #hash). */
  function go(name) {
    if (viewFromHash() === name) showView(name, { focus: true });
    else window.location.hash = name;
  }

  LCPU.App = {
    showView: showView,
    go: go,
    get currentView() { return current; }
  };

  function init() {
    // "Pular para o conteúdo" sem bagunçar o #hash usado pela navegação
    var skip = U.$('.skip-link');
    if (skip) {
      skip.addEventListener('click', function (event) {
        event.preventDefault();
        var main = document.getElementById('conteudo');
        main.focus();
        main.scrollIntoView();
      });
    }

    // Inicializa cada módulo na ordem em que os scripts foram carregados
    LCPU.modules.forEach(function (mod) {
      try {
        mod.init();
      } catch (err) {
        console.error('[Legend of CPU] Falha ao iniciar o módulo "' + mod.name + '":', err);
      }
    });

    window.addEventListener('hashchange', function () {
      var name = viewFromHash();
      if (name) showView(name, { focus: true });
    });

    showView(viewFromHash() || 'inicio', { focus: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.LCPU = window.LCPU || {});
