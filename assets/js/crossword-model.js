/* ==========================================================================
   The Legend of CPU — crossword-model.js
   Lógica pura da cruzadinha (sem DOM):
   1) monta o modelo (células, palavras, numeração) a partir de LCPU.CONCEPTS;
   2) valida a integridade da grade (cruzamentos, sequências, conexão...);
   3) confere as regras das pistas (tamanho e "vazamento" da resposta).
   Funciona no navegador e também no Node.js (usado nos testes do projeto).
   ========================================================================== */
(function (root) {
  'use strict';

  var LCPU = root.LCPU = root.LCPU || {};

  // Direções possíveis: H = horizontal (anda nas colunas), V = vertical (anda nas linhas)
  var DIRS = {
    H: { dr: 0, dc: 1, label: 'Horizontal', short: 'H', arrow: '→' },
    V: { dr: 1, dc: 0, label: 'Vertical', short: 'V', arrow: '↓' }
  };

  var MAX_CLUE_WORDS = 15;

  function normalize(text) {
    return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  /** Conta palavras de uma pista (tokens que têm ao menos uma letra ou número). */
  function countWords(text) {
    return String(text).trim().split(/\s+/).filter(function (token) {
      return /[A-Za-z0-9À-ÿ]/.test(token);
    }).length;
  }

  /**
   * Monta o modelo da grade.
   * Não lança erro: problemas estruturais vão para model.problems
   * e são reportados pela validação.
   */
  function build(concepts) {
    var problems = [];
    var words = concepts.filter(function (c) { return c.grid; }).map(function (c) {
      return {
        id: c.id,
        answer: c.answer,
        clue: c.clue,
        label: c.label,
        dir: c.grid.dir,
        row: c.grid.row,
        col: c.grid.col,
        length: c.answer.length,
        number: 0,
        cells: []
      };
    });

    // Tamanho da grade = menor retângulo que contém todas as palavras
    var rows = 0;
    var cols = 0;
    words.forEach(function (w) {
      var d = DIRS[w.dir];
      if (!d) {
        problems.push('Direção inválida em "' + w.id + '": use "H" ou "V".');
        return;
      }
      rows = Math.max(rows, w.row + (w.dir === 'V' ? w.length : 1));
      cols = Math.max(cols, w.col + (w.dir === 'H' ? w.length : 1));
      if (w.row < 0 || w.col < 0) problems.push('Posição negativa em "' + w.id + '".');
    });

    // 1ª passada: escreve cada letra na grade e detecta conflitos/sobreposições
    var slots = {}; // "linha,coluna" -> { solution, H, V, posH, posV }
    words.forEach(function (w) {
      var d = DIRS[w.dir];
      if (!d) return;
      for (var i = 0; i < w.length; i++) {
        var r = w.row + i * d.dr;
        var c = w.col + i * d.dc;
        var key = r + ',' + c;
        var letter = w.answer[i];
        var slot = slots[key];
        if (!slot) {
          slot = slots[key] = { row: r, col: c, solution: letter, H: null, V: null, posH: null, posV: null };
        } else if (slot.solution !== letter) {
          problems.push('Cruzamento inválido na linha ' + (r + 1) + ', coluna ' + (c + 1) + ': "' +
            slot.solution + '" ≠ "' + letter + '" (' + w.id + ').');
        }
        if (slot[w.dir]) {
          problems.push('Sobreposição na mesma direção na linha ' + (r + 1) + ', coluna ' + (c + 1) +
            ' entre "' + slot[w.dir] + '" e "' + w.id + '".');
        } else {
          slot[w.dir] = w.id;
          slot['pos' + w.dir] = i;
        }
      }
    });

    // 2ª passada: cria as células em ordem de leitura (esquerda→direita, cima→baixo)
    var grid = new Array(rows * cols);
    for (var g = 0; g < grid.length; g++) grid[g] = -1;
    var cells = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var s = slots[r + ',' + c];
        if (!s) continue;
        var cell = {
          index: cells.length,
          row: r,
          col: c,
          solution: s.solution,
          H: s.H,
          V: s.V,
          posH: s.posH,
          posV: s.posV,
          number: null
        };
        grid[r * cols + c] = cell.index;
        cells.push(cell);
      }
    }

    var wordById = {};
    words.forEach(function (w) {
      wordById[w.id] = w;
      var d = DIRS[w.dir];
      if (!d) return;
      for (var i = 0; i < w.length; i++) {
        w.cells.push(grid[(w.row + i * d.dr) * cols + (w.col + i * d.dc)]);
      }
    });

    // Numeração: percorre a grade em ordem de leitura; cada casa inicial recebe
    // o próximo número. Horizontal e vertical que começam na mesma casa compartilham o número.
    var number = 0;
    cells.forEach(function (cell) {
      var starting = words.filter(function (w) { return w.row === cell.row && w.col === cell.col; });
      if (starting.length) {
        number += 1;
        cell.number = number;
        starting.forEach(function (w) { w.number = number; });
      }
    });

    var byNumber = function (a, b) { return a.number - b.number; };
    var across = words.filter(function (w) { return w.dir === 'H'; }).sort(byNumber);
    var down = words.filter(function (w) { return w.dir === 'V'; }).sort(byNumber);

    return {
      rows: rows,
      cols: cols,
      grid: grid,
      cells: cells,
      across: across,
      down: down,
      words: across.concat(down), // ordem das pistas: horizontais e depois verticais
      wordById: wordById,
      problems: problems,
      cellAt: function (row, col) {
        if (row < 0 || col < 0 || row >= rows || col >= cols) return null;
        var idx = grid[row * cols + col];
        return idx === -1 ? null : cells[idx];
      }
    };
  }

  /**
   * Validação interna da grade.
   * Retorna { ok, errors, checks: [{ ok, text }], stats }.
   */
  function validate(model) {
    var errors = model.problems.slice();
    var checks = [];

    function check(ok, text, errorText) {
      checks.push({ ok: ok, text: text });
      if (!ok) errors.push(errorText || text);
    }

    // Respostas só com letras A-Z, sem espaços/acentos e com 2+ letras
    var badAnswers = model.words.filter(function (w) { return !/^[A-Z]{2,}$/.test(w.answer); });
    check(badAnswers.length === 0, 'Respostas em maiúsculas, sem espaços e sem acentos',
      'Respostas inválidas: ' + badAnswers.map(function (w) { return w.id; }).join(', '));

    // Identificadores únicos
    var ids = {};
    var dupIds = [];
    model.words.forEach(function (w) {
      if (ids[w.id]) dupIds.push(w.id);
      ids[w.id] = true;
    });
    check(dupIds.length === 0, 'Identificadores únicos', 'Identificadores repetidos: ' + dupIds.join(', '));

    // Cruzamentos: a mesma casa nas duas direções precisa ter a mesma letra nas duas respostas
    var crossings = 0;
    var crossingErrors = [];
    model.cells.forEach(function (cell) {
      if (cell.H && cell.V) {
        crossings += 1;
        var a = model.wordById[cell.H].answer[cell.posH];
        var b = model.wordById[cell.V].answer[cell.posV];
        if (a !== b || a !== cell.solution) crossingErrors.push((cell.row + 1) + ',' + (cell.col + 1));
      }
    });
    check(crossingErrors.length === 0 && model.problems.length === 0,
      'Letras iguais em todos os ' + crossings + ' cruzamentos',
      'Cruzamentos com letras diferentes: ' + crossingErrors.join('; '));

    // Toda sequência de 2+ casas seguidas precisa ser exatamente uma resposta com pista
    // (isso garante casas bloqueadas antes/depois de cada palavra e nenhuma palavra "acidental")
    var extraRuns = [];
    ['H', 'V'].forEach(function (dir) {
      var outer = dir === 'H' ? model.rows : model.cols;
      var inner = dir === 'H' ? model.cols : model.rows;
      for (var a = 0; a < outer; a++) {
        var b = 0;
        while (b < inner) {
          var at = function (x) { return dir === 'H' ? model.cellAt(a, x) : model.cellAt(x, a); };
          if (!at(b)) { b++; continue; }
          var e = b;
          while (e + 1 < inner && at(e + 1)) e++;
          var len = e - b + 1;
          if (len >= 2) {
            var sr = dir === 'H' ? a : b;
            var sc = dir === 'H' ? b : a;
            var match = model.words.some(function (w) {
              return w.dir === dir && w.row === sr && w.col === sc && w.length === len;
            });
            if (!match) extraRuns.push(DIRS[dir].label + ' em ' + (sr + 1) + ',' + (sc + 1) + ' (' + len + ' casas)');
          }
          b = e + 1;
        }
      }
    });
    check(extraRuns.length === 0, 'Nenhuma sequência de letras sem pista e casas bloqueadas antes e depois de cada palavra',
      'Sequências sem pista: ' + extraRuns.join('; '));

    // Toda casa preenchível pertence a pelo menos uma resposta
    var orphan = model.cells.filter(function (cell) { return !cell.H && !cell.V; });
    check(orphan.length === 0, 'Todas as casas pertencem a alguma resposta', 'Casas sem resposta: ' + orphan.length);

    // Cada palavra cruza ao menos uma outra
    var lonely = model.words.filter(function (w) {
      return !w.cells.some(function (idx) { var cell = model.cells[idx]; return cell && cell.H && cell.V; });
    });
    check(lonely.length === 0, 'Cada palavra cruza pelo menos uma outra',
      'Palavras sem cruzamento: ' + lonely.map(function (w) { return w.id; }).join(', '));

    // Conexão: todas as palavras formam um único bloco (busca em largura pelos cruzamentos)
    var connected = false;
    if (model.words.length) {
      var seen = {};
      var queue = [model.words[0].id];
      seen[queue[0]] = true;
      while (queue.length) {
        var current = model.wordById[queue.shift()];
        current.cells.forEach(function (idx) {
          var cell = model.cells[idx];
          if (!cell) return;
          [cell.H, cell.V].forEach(function (other) {
            if (other && !seen[other]) {
              seen[other] = true;
              queue.push(other);
            }
          });
        });
      }
      connected = Object.keys(seen).length === model.words.length;
    }
    check(connected, 'Todas as palavras formam um único conjunto conectado', 'A grade está desconectada.');

    // Numeração em ordem de leitura, compartilhada quando H e V começam na mesma casa
    var numberingOk = true;
    var expected = 0;
    model.cells.forEach(function (cell) {
      var starts = model.words.filter(function (w) { return w.row === cell.row && w.col === cell.col; });
      if (starts.length) {
        expected += 1;
        if (cell.number !== expected) numberingOk = false;
        starts.forEach(function (w) { if (w.number !== expected) numberingOk = false; });
      } else if (cell.number !== null) {
        numberingOk = false;
      }
    });
    check(numberingOk, 'Numeração da esquerda para a direita, de cima para baixo', 'Numeração inconsistente.');

    // Duas palavras na mesma direção não podem começar na mesma casa
    var startKeys = {};
    var dupStarts = [];
    model.words.forEach(function (w) {
      var key = w.dir + w.row + ',' + w.col;
      if (startKeys[key]) dupStarts.push(w.id);
      startKeys[key] = true;
    });
    check(dupStarts.length === 0, 'Posições iniciais únicas por direção', 'Inícios repetidos: ' + dupStarts.join(', '));

    return {
      ok: errors.length === 0,
      errors: errors,
      checks: checks,
      stats: {
        words: model.words.length,
        across: model.across.length,
        down: model.down.length,
        cells: model.cells.length,
        crossings: crossings,
        rows: model.rows,
        cols: model.cols,
        connected: connected
      }
    };
  }

  /**
   * Confere as regras das pistas:
   * - no máximo 15 palavras;
   * - não conter a resposta nem fragmentos que a entreguem (lista "avoid" de cada conceito);
   * - avisar se a pista cita outra resposta da cruzadinha.
   * A comparação é feita por palavra inteira (ou início de palavra para os fragmentos),
   * para não confundir coincidências como "progRAMas" com vazamento de "RAM".
   */
  function checkClues(concepts) {
    var answers = concepts.filter(function (c) { return c.grid; }).map(function (c) { return c.answer; });
    return concepts.filter(function (c) { return c.grid; }).map(function (c) {
      var issues = [];
      var warnings = [];
      var words = countWords(c.clue);
      if (words > MAX_CLUE_WORDS) issues.push('tem ' + words + ' palavras (máximo ' + MAX_CLUE_WORDS + ')');

      var tokens = normalize(c.clue).split(/[^A-Z0-9]+/).filter(Boolean);
      var avoid = (c.avoid || []).map(normalize);
      tokens.forEach(function (token) {
        if (token === c.answer || (c.answer.length >= 4 && token.indexOf(c.answer) !== -1)) {
          issues.push('contém a resposta ("' + token + '")');
        }
        avoid.forEach(function (fragment) {
          if (token.indexOf(fragment) === 0) issues.push('entrega parte da resposta ("' + token + '")');
        });
        answers.forEach(function (other) {
          if (other !== c.answer && token === other) warnings.push('cita outra resposta ("' + token + '")');
        });
      });

      return { id: c.id, answer: c.answer, words: words, ok: issues.length === 0, issues: issues, warnings: warnings };
    });
  }

  LCPU.CrosswordModel = {
    DIRS: DIRS,
    MAX_CLUE_WORDS: MAX_CLUE_WORDS,
    build: build,
    validate: validate,
    checkClues: checkClues,
    countWords: countWords,
    normalize: normalize
  };
})(typeof window !== 'undefined' ? window : globalThis);
