/* ==========================================================================
   The Legend of CPU — audio.js
   Efeitos sonoros sintetizados com a Web Audio API (nenhum arquivo de áudio).
   - O áudio só é criado depois da primeira interação do usuário.
   - O botão "Som" liga/desliga e a preferência é salva quando possível.
   - Não há som a cada letra digitada; todo som acompanha uma informação visual.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var PREFS_KEY = 'preferencias';
  var ctx = null;
  var master = null;
  var unsupported = false;
  var enabled = true;
  var lastPlayed = {};

  function loadPrefs() {
    var saved = LCPU.Storage.read(PREFS_KEY);
    if (saved.status === 'ok' && saved.value && typeof saved.value.sound === 'boolean') {
      enabled = saved.value.sound;
    }
  }

  function savePrefs() {
    var saved = LCPU.Storage.read(PREFS_KEY);
    var prefs = saved.status === 'ok' && saved.value && typeof saved.value === 'object' ? saved.value : {};
    prefs.sound = enabled;
    LCPU.Storage.write(PREFS_KEY, prefs);
  }

  /** Cria (ou retoma) o contexto de áudio. Só é chamado a partir de interações. */
  function ensureContext() {
    if (!enabled || unsupported) return null;
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        unsupported = true;
        updateButton();
        return null;
      }
      try {
        ctx = new AudioCtx();
        master = ctx.createGain();
        master.gain.value = 0.16; // volume geral baixo: sons discretos
        master.connect(ctx.destination);
      } catch (err) {
        unsupported = true;
        updateButton();
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () { /* o navegador pode recusar; tentamos no próximo clique */ });
    }
    return ctx;
  }

  /** Um "bip": frequência, início (s), duração (s), forma de onda, volume e deslize opcional. */
  function tone(freq, start, dur, type, vol, slideTo) {
    var t = ctx.currentTime + start;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  // Notas usadas (Hz)
  var N = { G4: 392, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };

  var SOUNDS = {
    click: function () { tone(660, 0, 0.045, 'square', 0.22); },
    select: function () { tone(N.A5, 0, 0.07, 'triangle', 0.32, 1320); },
    correct: function () {
      [N.C5, N.E5, N.G5, N.C6].forEach(function (f, i) { tone(f, i * 0.07, 0.12, 'square', 0.26); });
    },
    wrong: function () {
      tone(220, 0, 0.14, 'sawtooth', 0.18, 185);
      tone(185, 0.13, 0.2, 'sawtooth', 0.16, 150);
    },
    achievement: function () {
      [N.C6, N.E6, N.G6].forEach(function (f, i) { tone(f, i * 0.06, 0.1, 'triangle', 0.26); });
    },
    // Fanfarra original: arpejo ascendente e acorde final
    victory: function () {
      var seq = [N.G4, N.C5, N.E5, N.G5, N.E5, N.G5];
      seq.forEach(function (f, i) { tone(f, i * 0.11, 0.14, 'square', 0.24); });
      [N.C5, N.E5, N.G5, N.C6].forEach(function (f) { tone(f, 0.72, 0.65, 'triangle', 0.18); });
      tone(N.F5, 0.52, 0.12, 'square', 0.2);
      tone(N.D5, 0.6, 0.12, 'square', 0.2);
    }
  };

  /** Toca um efeito (ignora se o som estiver desligado). */
  function play(name) {
    if (!enabled || !SOUNDS[name]) return;
    var now = Date.now();
    if (lastPlayed[name] && now - lastPlayed[name] < 70) return; // evita repetição em rajada
    lastPlayed[name] = now;
    if (!ensureContext()) return;
    try {
      SOUNDS[name]();
    } catch (err) {
      /* falha de áudio nunca pode quebrar o jogo */
    }
  }

  function updateButton() {
    var btn = document.getElementById('sound-toggle');
    if (!btn) return;
    var on = enabled && !unsupported;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.classList.toggle('is-off', !on);
    // O nome acessível é fixo ("Som (efeitos sonoros)"); o estado vai no aria-pressed
    btn.title = unsupported ? 'Som indisponível neste navegador' : on ? 'Som: ligado' : 'Som: desligado';
    var state = document.getElementById('sound-state');
    if (state) state.textContent = unsupported ? 'N/D' : on ? 'ON' : 'OFF';
    var icon = btn.querySelector('.sound-icon');
    if (icon && LCPU.Pixel) {
      icon.textContent = '';
      icon.appendChild(LCPU.Pixel.icon(on ? 'soundOn' : 'soundOff'));
    }
  }

  function toggle() {
    enabled = !enabled;
    savePrefs();
    updateButton();
    LCPU.Utils.announce(enabled ? 'Som ligado.' : 'Som desligado.');
    if (enabled) play('select');
  }

  function init() {
    loadPrefs();
    updateButton();
    var btn = document.getElementById('sound-toggle');
    if (btn) btn.addEventListener('click', toggle);

    // Som de clique em botões (cada botão pode pedir outro som com data-sound, ou "none")
    document.addEventListener('click', function (event) {
      var target = event.target.closest('button, .btn, [data-sound]');
      if (!target || target.disabled) return;
      var name = target.getAttribute('data-sound') || 'click';
      if (name !== 'none') play(name);
    });
  }

  LCPU.Audio = {
    play: play,
    get enabled() { return enabled && !unsupported; }
  };

  LCPU.register('audio', init);
})(window.LCPU = window.LCPU || {});
