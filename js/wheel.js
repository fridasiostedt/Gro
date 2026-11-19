/*
 * GRO – årshjulet (Figma: Komponenter › Årshjul).
 * Ritas som SVG. Varje månad är ett radioalternativ som går att nå med
 * tangentbord (piltangenter, Home/End) och läses upp av skärmläsare,
 * t.ex. "Mars, 8 uppgifter, 3 klara".
 */
(function (root) {
  'use strict';
  var L = root.GroLogic;

  // Yttre ring: månader (R_IN–R_UT) med namnet inuti. Inre ring: årstider (R_AR_IN–R_AR_UT), tre månader per årstid.
  var STORLEK = 358, C = 179, R_UT = 174, R_IN = 128, R_AR_UT = 116, R_AR_IN = 70, R_MANADSNAMN = 151, LYFT = 5; // båda ringarna 46 px, 12 px mellan
  // Årstidernas start i grader (januari börjar rakt upp, 30° per månad) och deras månader
  var ARSTIDER = [
    { id: 'vinter', a0: 330, manader: [11, 0, 1] },
    { id: 'var', a0: 60, manader: [2, 3, 4] },
    { id: 'sommar', a0: 150, manader: [5, 6, 7] },
    { id: 'host', a0: 240, manader: [8, 9, 10] }
  ];

  function punkt(r, grader) {
    var rad = grader * Math.PI / 180;
    return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
  }
  function f(n) { return Math.round(n * 100) / 100; }

  function segmentVag(a0, a1, rUt, rIn) {
    rUt = rUt || R_UT; rIn = rIn || R_IN;
    var o0 = punkt(rUt, a0), o1 = punkt(rUt, a1), i1 = punkt(rIn, a1), i0 = punkt(rIn, a0);
    return 'M' + f(o0[0]) + ' ' + f(o0[1]) +
      ' A' + rUt + ' ' + rUt + ' 0 0 1 ' + f(o1[0]) + ' ' + f(o1[1]) +
      ' L' + f(i1[0]) + ' ' + f(i1[1]) +
      ' A' + rIn + ' ' + rIn + ' 0 0 0 ' + f(i0[0]) + ' ' + f(i0[1]) + ' Z';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function klaraText(n) { return n === 1 ? '1 klar' : n + ' klara'; }

  function ariaText(m, st, arNuvarande, ar) {
    var t = L.stor(L.MANADER[m]) + (ar ? ' ' + ar : '') + ', ' + L.plural(st.totalt, 'uppgift', 'uppgifter') + ', ' + klaraText(st.klara);
    if (arNuvarande) t += ', nuvarande månad';
    return t;
  }

  /** Summerar uppgifterna för en årstids tre månader (eller använder appens beräkning av kommande förekomst). */
  function arstidStatistik(a, statistik, given) {
    if (given && given[a.id]) return given[a.id];
    var sum = { totalt: 0, klara: 0 };
    a.manader.forEach(function (m) { sum.totalt += statistik[m].totalt; sum.klara += statistik[m].klara; });
    return sum;
  }
  function arstidPeriod(a, given) {
    if (given && given[a.id] && given[a.id].period) return given[a.id].period;
    return L.MANADER_KORT[a.manader[0]] + '–' + L.MANADER_KORT[a.manader[2]];
  }

  /** Inre ringen: en knapp per årstid. Klick visar antalet uppgifter i hjulets mitt. */
  function arstidsring(opts) {
    var rText = (R_AR_UT + R_AR_IN) / 2;
    return '<g class="arstidsring" role="group" aria-label="Årstider">' + ARSTIDER.map(function (a, i) {
      var a1 = a.a0 + 90, mitt = a.a0 + 45;
      var vand = ((mitt % 360) > 90 && (mitt % 360) < 270); // undre halvan: texten ritas åt andra hållet så den blir rättvänd
      var p0 = punkt(rText, vand ? a1 : a.a0), p1 = punkt(rText, vand ? a.a0 : a1);
      var id = 'arstid-bage-' + i;
      var vald = opts.arstid === a.id;
      var st = arstidStatistik(a, opts.statistik, opts.arstidStat);
      var namn = L.ARSTID_NAMN[a.id];
      return '<g class="arstid-knapp' + (vald ? ' vald' : '') + '" role="button" tabindex="0" data-arstid="' + a.id + '"' +
        ' aria-pressed="' + vald + '" aria-label="' + esc(namn + ' (' + arstidPeriod(a, opts.arstidStat) + '): ' + L.plural(st.totalt, 'uppgift', 'uppgifter') + ', ' + klaraText(st.klara)) + '">' +
          '<path class="arstid-kant" d="' + segmentVag(a.a0, a1, R_AR_UT, R_AR_IN) + '"/>' +
          '<path class="seg-form arstid-' + a.id + '" d="' + segmentVag(a.a0, a1, R_AR_UT, R_AR_IN) + '"/>' +
          '<path id="' + id + '" fill="none" d="M' + f(p0[0]) + ' ' + f(p0[1]) + ' A' + rText + ' ' + rText + ' 0 0 ' + (vand ? 0 : 1) + ' ' + f(p1[0]) + ' ' + f(p1[1]) + '"/>' +
          '<text class="arstid-namn" aria-hidden="true"><textPath href="#' + id + '" startOffset="50%">' + esc(namn.toUpperCase()) + '</textPath></text>' +
        '</g>';
    }).join('') + '</g>';
  }

  /**
   * opts: { ar, vald (0–11), valdAvAnvandare (bool), nuManad (0–11 eller -1), arstid (id eller null), statistik: [{totalt, klara}] × 12 }
   */
  function rita(opts) {
    var delar = [];
    for (var m = 0; m < 12; m++) {
      var a0 = m * 30, a1 = a0 + 30, mitt = a0 + 15;
      var st = opts.statistik[m];
      // Vald månad skjuts ut först när användaren själv har valt den (klick/tangentbord), inte vid start
      var arVald = m === opts.vald && !opts.arstid && !!opts.valdAvAnvandare;
      var arNu = m === opts.nuManad;
      var forskjut = arVald ? punkt(LYFT, mitt) : [C, C];
      var dx = f(forskjut[0] - C), dy = f(forskjut[1] - C);
      var et = punkt(R_MANADSNAMN, mitt);
      delar.push(
        '<g class="segment' + (arVald ? ' vald' : '') + '" role="radio" data-manad="' + m + '"' +
        ' aria-checked="' + (m === opts.vald) + '" tabindex="' + (m === opts.vald ? 0 : -1) + '"' +
        ' aria-label="' + esc(ariaText(m, st, arNu, opts.manadsAr && opts.manadsAr[m])) + '">' +
          '<g transform="translate(' + dx + ' ' + dy + ')"><g class="seg-inre">' +
            '<path class="seg-kant" d="' + segmentVag(a0, a1) + '"/>' +
            '<path class="seg-form arstid-' + L.arstid(m) + '" d="' + segmentVag(a0, a1) + '"/>' +
            '<text class="manad-etikett" aria-hidden="true" x="' + f(et[0]) + '" y="' + f(et[1]) + '">' + esc(L.MANADER_KORT[m]) + '</text>' +
          '</g></g>' +
        '</g>'
      );
    }

    var mittText;
    var valdArstid = ARSTIDER.filter(function (a) { return a.id === opts.arstid; })[0];
    if (valdArstid) {
      var as = arstidStatistik(valdArstid, opts.statistik, opts.arstidStat);
      mittText =
        '<g class="hjul-mitt" aria-hidden="true">' +
          '<text class="mitt-manad" x="' + C + '" y="' + (C - 8) + '">' + esc(L.ARSTID_NAMN[valdArstid.id]) + '</text>' +
          '<text class="mitt-antal" x="' + C + '" y="' + (C + 18) + '">' + esc(L.plural(as.totalt, 'uppgift', 'uppgifter')) + '</text>' +
          '<text class="mitt-antal" x="' + C + '" y="' + (C + 36) + '">' + esc(klaraText(as.klara)) + '</text>' +
        '</g>';
    } else {
      var v = opts.vald, vs = opts.statistik[v];
      mittText =
        '<g class="hjul-mitt" aria-hidden="true">' +
          '<text class="mitt-arstid" x="' + C + '" y="' + (C - 30) + '">' + esc(L.ARSTID_NAMN[L.arstid(v)].toUpperCase() + (opts.manadsAr ? ' ' + opts.manadsAr[v] : '')) + '</text>' +
          '<text class="mitt-manad" x="' + C + '" y="' + (C + 4) + '">' + esc(L.stor(L.MANADER[v])) + '</text>' +
          '<text class="mitt-antal" x="' + C + '" y="' + (C + 28) + '">' + esc(L.plural(vs.totalt, 'uppgift', 'uppgifter')) + '</text>' +
        '</g>';
    }

    return '<div class="arshjul">' +
      '<svg viewBox="0 0 ' + STORLEK + ' ' + STORLEK + '" width="' + STORLEK + '" height="' + STORLEK + '" focusable="false">' +
      // Månaderna först i fokusordningen (huvudvalet), sedan årstiderna. Ringarna överlappar inte.
      '<g role="radiogroup" aria-label="Årshjul ' + opts.ar + '. Välj månad med piltangenterna.">' + delar.join('') + '</g>' +
      arstidsring(opts) +
      mittText + '</svg></div>';
  }

  /** Kopplar klick och tangentbord. onVal(manad), onArstid(id) */
  function koppla(behallare, onVal, onArstid) {
    var grupp = behallare.querySelector('.arshjul');
    if (!grupp) return;
    grupp.addEventListener('click', function (e) {
      var a = e.target.closest('.arstid-knapp');
      if (a) { if (onArstid) onArstid(a.getAttribute('data-arstid')); return; }
      var g = e.target.closest('.segment');
      if (g) onVal(Number(g.getAttribute('data-manad')), true);
    });
    grupp.addEventListener('keydown', function (e) {
      var a = e.target.closest('.arstid-knapp');
      if (a) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (onArstid) onArstid(a.getAttribute('data-arstid')); }
        return;
      }
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
