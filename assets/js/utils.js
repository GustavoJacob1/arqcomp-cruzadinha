/* ==========================================================================
   The Legend of CPU — utils.js
   Funções auxiliares usadas por todos os módulos, um barramento de eventos
   (para os módulos conversarem sem depender diretamente uns dos outros)
   e o registro de módulos que o app.js inicializa.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var U = {};

  /** Atalhos para buscar elementos. */
  U.$ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  U.$$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };

  /**
   * Cria um elemento com atributos e filhos.
   * Ex.: U.el('button', { class: 'btn', type: 'button', text: 'OK', on: { click: fn } })
   */
  U.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'on') {
          Object.keys(value).forEach(function (eventName) {
            node.addEventListener(eventName, value[eventName]);
          });
        } else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key === 'style') Object.assign(node.style, value);
        else node.setAttribute(key, value === true ? '' : String(value));
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  };

  /** Remove acentos e converte para maiúsculas ("ção" -> "CAO"). */
  U.normalize = function (text) {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  };

  /** Mantém somente as letras de A a Z, já normalizadas. */
  U.onlyLetters = function (text) {
    return U.normalize(text).replace(/[^A-Z]/g, '');
  };

  /** Embaralha uma cópia da lista (algoritmo de Fisher-Yates). */
  U.shuffle = function (list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  };

  /** Formata milissegundos como mm:ss (ou h:mm:ss). */
  U.formatTime = function (ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  };

  /** Tempo por extenso para leitores de tela ("3 min e 12 s"). */
  U.formatTimeLong = function (ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    if (m === 0) return s + ' s';
    return m + ' min e ' + s + ' s';
  };

  U.clamp = function (n, min, max) {
    return Math.min(max, Math.max(min, n));
  };

  U.plural = function (n, singular, plural) {
    return n + ' ' + (n === 1 ? singular : plural);
  };

  /** true quando o sistema pede menos animação. */
  U.reducedMotion = function () {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  U.debounce = function (fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  };

  /** Anuncia uma mensagem para leitores de tela (região aria-live). */
  U.announce = function (message) {
    var region = document.getElementById('sr-announcer');
    if (!region) return;
    region.textContent = '';
    window.setTimeout(function () { region.textContent = message; }, 60);
  };

  LCPU.Utils = U;

  /* ---------- Barramento de eventos ---------- */
  var bus = document.createElement('span');

  LCPU.on = function (name, handler) {
    bus.addEventListener(name, function (event) { handler(event.detail || {}); });
  };

  LCPU.emit = function (name, detail) {
    bus.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  };

  /* ---------- Registro de módulos ---------- */
  LCPU.modules = LCPU.modules || [];

  /** Cada arquivo registra sua função init; o app.js chama todas na ordem. */
  LCPU.register = function (name, init) {
    LCPU.modules.push({ name: name, init: init });
  };
})(window.LCPU = window.LCPU || {});
