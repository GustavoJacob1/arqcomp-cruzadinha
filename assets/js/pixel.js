/* ==========================================================================
   The Legend of CPU — pixel.js
   Pixel art feita em código (nenhuma imagem externa):
   - fonte pixelada 5x7 própria para o logotipo e títulos;
   - sprites (como o mascote Byte) descritos por linhas de caracteres;
   - ícones pixelados que usam a cor do texto (currentColor).
   Elementos com data-pixel-text, data-sprite ou data-icon são preenchidos
   automaticamente na inicialização.
   ========================================================================== */
(function (LCPU) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* Fonte 5x7: '1' = pixel aceso. Desenhada para este projeto. */
  var FONT = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
    J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
    '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
    '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
    ':': ['00000', '00100', '00000', '00000', '00000', '00100', '00000']
  };

  /* Mascote Byte: um chip companheiro (paleta abaixo). Desenho original. */
  var SPRITES = {
    byte: {
      rows: [
        '................',
        '.......gg.......',
        '.......kk.......',
        '...kkkkkkkkkk...',
        '...kbbbbbbbbk...',
        '.ggkcccccccckgg.',
        '...kcweccweck...',
        '.ggkceecceeckgg.',
        '...kcccccccck...',
        '.ggkcmccccmckgg.',
        '...kccmmmmcck...',
        '.ggkcccccccckgg.',
        '...kkkkkkkkkk...',
        '.....gg..gg.....'
      ],
      palette: { k: '#0b1020', b: '#3a5bb0', c: '#22346b', w: '#ffffff', e: '#38e1ff', m: '#ff5fcf', g: '#ffc53d' }
    }
  };

  /* Ícones 9x9 em uma cor (currentColor). */
  var ICONS = {
    clock: [
      '..#####..',
      '.#.....#.',
      '#...#...#',
      '#...#...#',
      '#...###.#',
      '#.......#',
      '#.......#',
      '.#.....#.',
      '..#####..'
    ],
    gem: [
      '.........',
      '..#####..',
      '.#.#.#.#.',
      '#########',
      '.#.....#.',
      '..#...#..',
      '...#.#...',
      '....#....',
      '.........'
    ],
    trophy: [
      '#########',
      '#.#####.#',
      '#.#####.#',
      '.#######.',
      '..#####..',
      '...###...',
      '....#....',
      '...###...',
      '..#####..'
    ],
    bits: [
      '.........',
      '###...#..',
      '#.#..##..',
      '#.#...#..',
      '###..###.',
      '.........',
      '..#..###.',
      '.##..#.#.',
      '..#..###.'
    ],
    soundOn: [
      '...#.....',
      '..##...#.',
      '.###.#..#',
      '####..#.#',
      '####..#.#',
      '####..#.#',
      '.###.#..#',
      '..##...#.',
      '...#.....'
    ],
    soundOff: [
      '...#.....',
      '..##.....',
      '.###.#..#',
      '####..##.',
      '####..##.',
      '####.#..#',
      '.###.....',
      '..##.....',
      '...#.....'
    ],
    grid: [
      '###.###..',
      '#.#.#.#..',
      '###.###..',
      '.........',
      '###.###.#',
      '#.#.#.#.#',
      '###.###.#',
      '........#',
      '......###'
    ],
    cards: [
      '..######.',
      '..#....#.',
      '#####..#.',
      '#...#..#.',
      '#...#..#.',
      '#...####.',
      '#...#....',
      '#####....',
      '.........'
    ],
    bolt: [
      '.....##..',
      '....##...',
      '...##....',
      '..#####..',
      '....##...',
      '...##....',
      '..##.....',
      '.##......',
      '.........'
    ],
    link: [
      '.........',
      '.###.....',
      '#...#....',
      '#...#.#..',
      '.###.#.#.',
      '..#.#...#',
      '....#...#',
      '.....###.',
      '.........'
    ],
    scroll: [
      '.#######.',
      '#.......#',
      '.#.###.#.',
      '.#.....#.',
      '.#.###.#.',
      '.#.....#.',
      '.#.##..#.',
      '#.......#',
      '.#######.'
    ],
    lock: [
      '...###...',
      '..#...#..',
      '..#...#..',
      '.#######.',
      '.###.###.',
      '.##...##.',
      '.###.###.',
      '.#######.',
      '.........'
    ],
    star: [
      '....#....',
      '....#....',
      '...###...',
      '#########',
      '.#######.',
      '..#####..',
      '..##.##..',
      '.##...##.',
      '.#.....#.'
    ]
  };

  function svgEl(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  /** Converte um bitmap em um caminho SVG (um retângulo por sequência de pixels acesos). */
  function bitmapPath(rows, on, ox, oy) {
    var d = '';
    rows.forEach(function (row, y) {
      var x = 0;
      while (x < row.length) {
        if (on.indexOf(row.charAt(x)) === -1) { x++; continue; }
        var start = x;
        while (x < row.length && on.indexOf(row.charAt(x)) !== -1) x++;
        d += 'M' + (ox + start) + ' ' + (oy + y) + 'h' + (x - start) + 'v1h' + (start - x) + 'z';
      }
    });
    return d;
  }

  function normalizeText(text) {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  /** Texto na fonte pixelada. Retorna um <svg> com sombra pixelada. */
  function text(str, opts) {
    opts = opts || {};
    var spacing = opts.spacing === undefined ? 1 : opts.spacing;
    var x = 0;
    var d = '';
    normalizeText(str).split('').forEach(function (ch, i, all) {
      if (ch === ' ') { x += 3; return; }
      var glyph = FONT[ch];
      if (!glyph) return;
      d += bitmapPath(glyph, '1', x, 0);
      x += glyph[0].length + (i < all.length - 1 ? spacing : 0);
    });
    var shadow = opts.shadow === undefined ? 1 : opts.shadow;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + (x + shadow) + ' ' + (7 + shadow),
      'shape-rendering': 'crispEdges',
      'aria-hidden': 'true',
      focusable: 'false',
      class: 'pixel-text'
    });
    if (shadow) svg.appendChild(svgEl('path', { d: d, transform: 'translate(' + shadow + ' ' + shadow + ')', class: 'pixel-text-shadow' }));
    svg.appendChild(svgEl('path', { d: d, class: 'pixel-text-fill' }));
    return svg;
  }

  /** Sprite colorido a partir das linhas e da paleta. */
  function sprite(name) {
    var def = SPRITES[name];
    if (!def) return null;
    var w = def.rows[0].length;
    var h = def.rows.length;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      'shape-rendering': 'crispEdges',
      'aria-hidden': 'true',
      focusable: 'false',
      class: 'pixel-sprite'
    });
    Object.keys(def.palette).forEach(function (key) {
      var d = bitmapPath(def.rows, key, 0, 0);
      if (d) svg.appendChild(svgEl('path', { d: d, fill: def.palette[key], class: 'px-' + key }));
    });
    return svg;
  }

  /** Ícone pixelado de uma cor. */
  function icon(name) {
    var rows = ICONS[name];
    if (!rows) return null;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + rows[0].length + ' ' + rows.length,
      'shape-rendering': 'crispEdges',
      'aria-hidden': 'true',
      focusable: 'false',
      class: 'pixel-icon'
    });
    svg.appendChild(svgEl('path', { d: bitmapPath(rows, '#', 0, 0), fill: 'currentColor' }));
    return svg;
  }

  /** Preenche os elementos marcados no HTML. */
  function hydrate(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-pixel-text]'), function (el) {
      if (el.dataset.pixelDone) return;
      var label = el.textContent.trim();
      el.textContent = '';
      el.appendChild(text(el.getAttribute('data-pixel-text'), { shadow: Number(el.dataset.shadow || 1) }));
      if (label) el.appendChild(LCPU.Utils.el('span', { class: 'sr-only', text: label }));
      el.dataset.pixelDone = '1';
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-sprite]'), function (el) {
      if (el.dataset.pixelDone) return;
      var svg = sprite(el.getAttribute('data-sprite'));
      if (svg) el.appendChild(svg);
      el.dataset.pixelDone = '1';
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-icon]'), function (el) {
      if (el.dataset.pixelDone) return;
      var svg = icon(el.getAttribute('data-icon'));
      if (svg) el.insertBefore(svg, el.firstChild);
      el.dataset.pixelDone = '1';
    });
  }

  LCPU.Pixel = { text: text, sprite: sprite, icon: icon, hydrate: hydrate };
  LCPU.register('pixel', function () { hydrate(document); });
})(window.LCPU = window.LCPU || {});
