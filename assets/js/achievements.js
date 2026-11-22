/* ==========================================================================
   The Legend of CPU — achievements.js
   Conquistas: definição, desbloqueio, salvamento e exibição (galerias com
   o atributo data-achievements). Conquistas não somem ao reiniciar a partida.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = LCPU.Utils;
  var KEY = 'conquistas';

  var LIST = [
    { id: 'primeiro-bit', title: 'Primeiro Bit', desc: 'Confirme sua primeira palavra correta.', icon: 'bits' },
    { id: 'um-byte', title: 'Um Byte Inteiro', desc: 'Tenha 8 palavras corretas ao mesmo tempo.', icon: 'grid' },
    { id: 'barramentos', title: 'Mestre dos Barramentos', desc: 'Acerte os barramentos de endereço e de dados.', icon: 'link' },
    { id: 'hierarquia', title: 'Guardião da Hierarquia', desc: 'Acerte as 7 palavras sobre memória.', icon: 'scroll' },
    { id: 'multinucleo', title: 'Multinúcleo', desc: 'Acerte dual core e quad core.', icon: 'bolt' },
    { id: 'cruzada', title: 'Cruzada Concluída', desc: 'Restaure os 16 fragmentos da cruzadinha.', icon: 'trophy' },
    { id: 'clock-turbo', title: 'Clock Turbo', desc: 'Conclua a cruzadinha em menos de 10 minutos.', icon: 'clock' },
    { id: 'inventario', title: 'Inventário Completo', desc: 'Marque os 16 flashcards como “Já sei”.', icon: 'cards' },
    { id: 'circuito-perfeito', title: 'Circuito Perfeito', desc: 'Acerte todas as questões do quiz em uma rodada completa.', icon: 'star' },
    { id: 'conexao-perfeita', title: 'Conexão Perfeita', desc: 'Complete uma rodada de associação sem nenhum erro.', icon: 'gem' }
  ];

  var unlocked = {};

  function load() {
    var saved = LCPU.Storage.read(KEY);
    if (saved.status !== 'ok' || !saved.value || typeof saved.value !== 'object') return;
    LIST.forEach(function (a) {
      var when = saved.value[a.id];
      if (typeof when === 'number' && isFinite(when)) unlocked[a.id] = when;
    });
  }

  function count() {
    return Object.keys(unlocked).length;
  }

  function render() {
    U.$$('[data-achievements]').forEach(function (list) {
      list.textContent = '';
      LIST.forEach(function (a) {
        var done = !!unlocked[a.id];
        var icon = U.el('span', { class: 'achievement-icon', 'aria-hidden': 'true' });
        icon.appendChild(LCPU.Pixel.icon(done ? a.icon : 'lock'));
        list.appendChild(U.el('li', { class: 'achievement' + (done ? ' is-unlocked' : '') }, [
          icon,
          U.el('span', { class: 'achievement-text' }, [
            U.el('strong', { text: a.title }),
            U.el('span', { text: a.desc }),
            U.el('span', { class: 'sr-only', text: done ? 'Desbloqueada.' : 'Bloqueada.' })
          ])
        ]));
      });
    });
    U.$$('#achievements-count-home, #achievements-count-guide').forEach(function (el) {
      el.textContent = count() + '/' + LIST.length;
    });
  }

  /** Desbloqueia uma conquista (uma única vez). Retorna true se for nova. */
  function unlock(id) {
    var def = LIST.filter(function (a) { return a.id === id; })[0];
    if (!def || unlocked[id]) return false;
    unlocked[id] = Date.now();
    LCPU.Storage.write(KEY, unlocked);
    render();
    LCPU.UI.toast({ type: 'achievement', icon: def.icon, title: 'Conquista desbloqueada!', message: def.title + ' — ' + def.desc });
    if (LCPU.Audio) LCPU.Audio.play('achievement');
    LCPU.emit('achievements:change', { id: id, count: count() });
    return true;
  }

  function init() {
    load();
    render();
  }

  LCPU.Achievements = {
    list: LIST,
    unlock: unlock,
    has: function (id) { return !!unlocked[id]; },
    count: count
  };

  LCPU.register('achievements', init);
})(window.LCPU = window.LCPU || {});
