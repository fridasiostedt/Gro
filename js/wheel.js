/*
 * GRO – årshjulet (Figma: Komponenter › Årshjul).
 * Ritas som SVG. Varje månad är ett radioalternativ som går att nå med
 * tangentbord (piltangenter, Home/End) och läses upp av skärmläsare,
 * t.ex. "Mars, 8 uppgifter, 3 klara".
 */
(function (root) {
  'use strict';
  var L = root.GroLogic;

  var STORLEK = 358, C = 179, R_UT = 132, R_IN = 72, R_ETIKETT = 160;

  function punkt(r, grader) {
    var rad = grader * Math.PI / 180;
    return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
  }
  function f(n) { return Math.round(n * 100) / 100; }

  function segmentVag(a0, a1) {
    var o0 = punkt(R_UT, a0), o1 = punkt(R_UT, a1), i1 = punkt(R_IN, a1), i0 = punkt(R_IN, a0);
    return 'M' + f(o0[0]) + ' ' + f(o0[1]) +
      ' A' + R_UT + ' ' + R_UT + ' 0 0 1 ' + f(o1[0]) + ' ' + f(o1[1]) +
      ' L' + f(i1[0]) + ' ' + f(i1[1]) +
      ' A' + R_IN + ' ' + R_IN + ' 0 0 0 ' + f(i0[0]) + ' ' + f(i0[1]) + ' Z';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ariaText(m, st, arNuvarande) {
    var t = L.stor(L.MANADER[m]) + ', ' + L.plural(st.totalt, 'uppgift', 'uppgifter') + ', ' +
      (st.klara === 1 ? '1 klar' : st.klara + ' klara');
    if (arNuvarande) t += ', nuvarande månad';
    return t;
  }

  /**
   * opts: { ar, vald (0–11), nuManad (0–11 eller -1), statistik: [{totalt, klara}] × 12 }
   */
  function rita(opts) {
    var delar = [];
    for (var m = 0; m < 12; m++) {
      var a0 = m * 30, a1 = a0 + 30, mitt = a0 + 15;
      var st = opts.statistik[m];
      var arVald = m === opts.vald;
      var arNu = m === opts.nuManad;
      var forskjut = arVald ? punkt(8, mitt) : [C, C];
      var dx = f(forskjut[0] - C), dy = f(forskjut[1] - C);
      var et = punkt(R_ETIKETT + (arNu ? 10 : 0), mitt);
      var etikett = L.MANADER_KORT[m] + (arNu ? ' · nu' : '');
      var etikettSvg;
      if (arNu) {
        var b = etikett.length * 7.6 + 18;
        etikettSvg = '<rect class="nu-bricka" x="' + f(et[0] - b / 2) + '" y="' + f(et[1] - 13) + '" width="' + f(b) + '" height="26" rx="13"/>' +
          '<text class="manad-etikett nu" x="' + f(et[0]) + '" y="' + f(et[1]) + '">' + esc(etikett) + '</text>';
      } else {
        etikettSvg = '<text class="manad-etikett" x="' + f(et[0]) + '" y="' + f(et[1]) + '">' + esc(etikett) + '</text>';
      }
      delar.push(
        '<g class="segment' + (arVald ? ' vald' : '') + '" role="radio" data-manad="' + m + '"' +
        ' aria-checked="' + arVald + '" tabindex="' + (arVald ? 0 : -1) + '"' +
        ' aria-label="' + esc(ariaText(m, st, arNu)) + '">' +
          '<rect class="traffyta" x="' + f(et[0] - 24) + '" y="' + f(et[1] - 22) + '" width="48" height="44" fill="transparent"/>' +
          '<g transform="translate(' + dx + ' ' + dy + ')">' +
            '<path class="seg-kant" d="' + segmentVag(a0, a1) + '"/>' +
            '<path class="seg-form arstid-' + L.arstid(m) + '" d="' + segmentVag(a0, a1) + '"/>' +
          '</g>' +
          etikettSvg +
        '</g>'
      );
    }

    var v = opts.vald, vs = opts.statistik[v];
    var mittText =
      '<g class="hjul-mitt" aria-hidden="true">' +
        '<text class="mitt-arstid" x="' + C + '" y="' + (C - 30) + '">' + esc(L.ARSTID_NAMN[L.arstid(v)].toUpperCase()) + '</text>' +
        '<text class="mitt-manad" x="' + C + '" y="' + (C + 4) + '">' + esc(L.stor(L.MANADER[v])) + '</text>' +
        '<text class="mitt-antal" x="' + C + '" y="' + (C + 28) + '">' + esc(L.plural(vs.totalt, 'uppgift', 'uppgifter')) + '</text>' +
      '</g>';

    return '<div class="arshjul" role="radiogroup" aria-label="Årshjul ' + opts.ar + '. Välj månad med piltangenterna." >' +
      '<svg viewBox="0 0 ' + STORLEK + ' ' + STORLEK + '" width="' + STORLEK + '" height="' + STORLEK + '" focusable="false">' +
      delar.join('') + mittText + '</svg></div>';
  }

  /** Kopplar klick och tangentbord. onVal(manad, flyttaFokus) */
  function koppla(behallare, onVal) {
    var grupp = behallare.querySelector('.arshjul');
    if (!grupp) return;
    grupp.addEventListener('click', function (e) {
      var g = e.target.closest('.segment');
      if (g) onVal(Number(g.getAttribute('data-manad')), true);
    });
    grupp.addEventListener('keydown', function (e) {
      var g = e.target.closest('.segment');
      if (!g) return;
      var m = Number(g.getAttribute('data-manad'));
      var ny = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ny = (m + 1) % 12;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ny = (m + 11) % 12;
      else if (e.key === 'Home') ny = 0;
      else if (e.key === 'End') ny = 11;
      else if (e.key === ' ' || e.key === 'Enter') ny = m;
      if (ny !== null) { e.preventDefault(); onVal(ny, true); }
    });
  }

  root.GroHjul = { rita: rita, koppla: koppla };
})(typeof self !== 'undefined' ? self : this);
