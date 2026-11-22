/* ==========================================================================
   The Legend of CPU — storage.js
   Salvamento seguro no localStorage.
   Se o navegador bloquear o armazenamento (modo privado, cota cheia,
   política do navegador...), o jogo continua funcionando com uma cópia
   apenas em memória — o progresso só não sobrevive ao fechar a página.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var PREFIX = 'legend-of-cpu:v1:';
  var memory = {};          // cópia em memória (sempre atualizada)
  var available = detect(); // o localStorage funciona neste navegador?
  var warned = false;

  function detect() {
    try {
      var probe = PREFIX + '__teste__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (err) {
      return false;
    }
  }

  function markUnavailable(reason) {
    available = false;
    if (!warned) {
      warned = true;
      LCPU.emit('storage:unavailable', { reason: reason });
    }
  }

  /**
   * Lê um valor salvo.
   * Retorna { status: 'ok' | 'missing' | 'corrupted', value }.
   * "corrupted" indica um texto salvo que não é JSON válido.
   */
  function read(key) {
    var raw = null;
    if (available) {
      try {
        raw = window.localStorage.getItem(PREFIX + key);
      } catch (err) {
        markUnavailable('leitura bloqueada');
      }
    }
    if (raw === null && Object.prototype.hasOwnProperty.call(memory, key)) {
      raw = memory[key];
    }
    if (raw === null || raw === undefined) return { status: 'missing', value: null };
    try {
      return { status: 'ok', value: JSON.parse(raw) };
    } catch (err) {
      return { status: 'corrupted', value: null };
    }
  }

  /** Salva um valor (como JSON). Retorna true se foi gravado no navegador. */
  function write(key, value) {
    var raw;
    try {
      raw = JSON.stringify(value);
    } catch (err) {
      return false;
    }
    memory[key] = raw;
    if (!available) return false;
    try {
      window.localStorage.setItem(PREFIX + key, raw);
      return true;
    } catch (err) {
      markUnavailable(err && err.name === 'QuotaExceededError' ? 'cota cheia' : 'escrita bloqueada');
      return false;
    }
  }

  function remove(key) {
    delete memory[key];
    if (!available) return;
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch (err) {
      markUnavailable('remoção bloqueada');
    }
  }

  LCPU.Storage = {
    read: read,
    write: write,
    remove: remove,
    get available() { return available; }
  };
})(window.LCPU = window.LCPU || {});
