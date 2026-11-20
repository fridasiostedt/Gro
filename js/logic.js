/*
 * GRO – ren logik utan DOM. Används både i webbläsaren (window.GroLogic)
 * och i testerna (Node: require('./js/logic.js')).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GroLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli',
    'augusti', 'september', 'oktober', 'november', 'december'];
  var MANADER_KORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var VECKODAGAR = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];

  var PRIORITETER = [
    { id: 'maste', namn: 'Måste' },
    { id: 'vorebra', namn: 'Vore bra' },
    { id: 'bonus', namn: 'Bonus' }
  ];

  var STATUSAR = [
    { id: 'ej', namn: 'Ej påbörjad' },
    { id: 'pagaende', namn: 'Påbörjad' },
    { id: 'klar', namn: 'Klar' }
  ];

  var INTERVALL = [
    { id: 'nej', namn: 'Nej' },
    { id: 'vecka', namn: 'Ja, varje vecka' },
    { id: '2veckor', namn: 'Ja, varannan vecka' },
    { id: 'manad', namn: 'Ja, varje månad' },
    { id: 'ar', namn: 'Ja, varje år' }
  ];

  var PAMINNELSE_DAGAR = 3;

  function stor(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // ---------- Datum (alltid lokala datum, format ÅÅÅÅ-MM-DD) ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function tillDatum(str) {
    if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
    var p = str.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    // Avvisa ogiltiga datum som 2026-02-31
    if (d.getFullYear() !== p[0] || d.getMonth() !== p[1] - 1 || d.getDate() !== p[2]) return null;
    return d;
  }

  function tillStrang(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function idag(nu) { return tillStrang(nu || new Date()); }

  function dagarMellan(franStr, tillStr) {
    var a = tillDatum(franStr), b = tillDatum(tillStr);
    if (!a || !b) return null;
    // Math.round hanterar sommartid (23/25-timmarsdygn)
    return Math.round((b - a) / 86400000);
  }

  function laggTillDagar(str, n) {
    var d = tillDatum(str);
    d.setDate(d.getDate() + n);
    return tillStrang(d);
  }

  function laggTillManader(str, n) {
    var d = tillDatum(str);
    var dag = d.getDate();
    var mal = new Date(d.getFullYear(), d.getMonth() + n, 1);
    var sista = new Date(mal.getFullYear(), mal.getMonth() + 1, 0).getDate();
    mal.setDate(Math.min(dag, sista)); // 31 jan + 1 mån = 28/29 feb
    return tillStrang(mal);
  }

  function laggTillIntervall(str, intervall) {
    switch (intervall) {
      case 'vecka': return laggTillDagar(str, 7);
      case '2veckor': return laggTillDagar(str, 14);
      case 'manad': return laggTillManader(str, 1);
      case 'ar': return laggTillManader(str, 12);
      default: return null;
    }
  }

  function kortDatum(str) {
    var d = tillDatum(str);
    if (!d) return '';
    return d.getDate() + ' ' + MANADER_KORT[d.getMonth()];
  }

  function rubrikDatum(nu) {
    var d = nu || new Date();
    return (VECKODAGAR[d.getDay()] + ' ' + d.getDate() + ' ' + MANADER[d.getMonth()]).toUpperCase();
  }

  /** "idag", "imorgon", "på söndag" (inom en vecka) annars "den 12 dec". */
  function relativDag(str, idagStr) {
    var diff = dagarMellan(idagStr, str);
    if (diff === null) return '';
    if (diff === 0) return 'idag';
    if (diff === 1) return 'imorgon';
    if (diff === -1) return 'igår';
    if (diff > 1 && diff < 7) return 'på ' + VECKODAGAR[tillDatum(str).getDay()];
    return 'den ' + kortDatum(str);
  }

  function arstid(manad) { // 0–11
    if (manad === 11 || manad <= 1) return 'vinter';
    if (manad <= 4) return 'var';
    if (manad <= 7) return 'sommar';
    return 'host';
  }
  var ARSTID_NAMN = { vinter: 'Vinter', var: 'Vår', sommar: 'Sommar', host: 'Höst' };

  // ---------- Uppgifter ----------
  function arKlar(t) { return t.status === 'klar'; }

  function nastaStatus(status) {
    if (status === 'ej') return 'pagaende';
    if (status === 'pagaende') return 'klar';
    return 'ej';
  }

  function prioIndex(p) {
    for (var i = 0; i < PRIORITETER.length; i++) if (PRIORITETER[i].id === p) return i;
    return 99;
  }

  /** Sortera: ej klara först, sedan deadline, sedan prioritet. */
  function sorteraUppgifter(lista) {
    return lista.slice().sort(function (a, b) {
      if (arKlar(a) !== arKlar(b)) return arKlar(a) ? 1 : -1;
      if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
      return prioIndex(a.prioritet) - prioIndex(b.prioritet);
    });
  }

  /** En uppgift hör till den månad dess deadline ligger i. */
  function uppgifterIManad(lista, ar, manad) {
    var prefix = ar + '-' + pad(manad + 1) + '-';
    return lista.filter(function (t) { return t.deadline && t.deadline.indexOf(prefix) === 0; });
  }

  /** Årstidens månader (0–11) i ordning. Vintern är dec, jan och feb (samma år som i årshjulet). */
  var ARSTID_MANADER = { vinter: [11, 0, 1], var: [2, 3, 4], sommar: [5, 6, 7], host: [8, 9, 10] };

  /**
   * Delar kommande uppgifter i tidsgrupper så att en lång lista blir lätt att överblicka:
   * "Den här veckan" (till och med söndag), "Resten av <månad>" och sedan en grupp per månad.
   * Listan ska vara sorterad på deadline. Returnerar [{ id, rubrik, uppgifter }].
   */
  function tidsgrupper(lista, idagStr) {
    var t = tillDatum(idagStr || idag());
    var dagTillSondag = (7 - t.getDay()) % 7;
    var veckansSlut = laggTillDagar(tillStrang(t), dagTillSondag);
    var grupper = [], index = {};
    lista.forEach(function (u) {
      var id, rubrik;
      var d = tillDatum(u.deadline);
      if (u.deadline <= veckansSlut) { id = 'vecka'; rubrik = 'Den här veckan'; }
      else if (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth()) { id = 'manad'; rubrik = 'Resten av ' + MANADER[t.getMonth()]; }
      else {
        id = d.getFullYear() + '-' + d.getMonth();
        rubrik = stor(MANADER[d.getMonth()]) + (d.getFullYear() !== t.getFullYear() ? ' ' + d.getFullYear() : '');
      }
      if (!index[id]) { index[id] = { id: id, rubrik: rubrik, uppgifter: [] }; grupper.push(index[id]); }
      index[id].uppgifter.push(u);
    });
    return grupper;
  }

  /** Förvald deadline när man skapar en uppgift från en månad i årshjulet: månadens sista dag. */
  function forvaldDeadline(ar, manad, idagStr) {
    var sista = tillStrang(new Date(ar, manad + 1, 0));
    return sista < (idagStr || idag()) ? '' : sista;
  }

  /**
   * Rullande år: årshjulet visar alltid de kommande tolv månaderna, med start i innevarande månad.
   * I november 2026 är det nov 2026–okt 2027, så januari–oktober hör till 2027 och november–december till 2026.
   */
  function rullandeAr(manad, idagStr) {
    var d = tillDatum(idagStr || idag());
    return d.getFullYear() + (manad < d.getMonth() ? 1 : 0);
  }

  /** De tolv kommande månaderna som [år, månad], i ordning från innevarande månad. */
  function rullandeFonster(idagStr) {
    var d = tillDatum(idagStr || idag());
    var ut = [];
    for (var i = 0; i < 12; i++) {
      var m = (d.getMonth() + i) % 12;
      ut.push([d.getFullYear() + Math.floor((d.getMonth() + i) / 12), m]);
    }
    return ut;
  }

  /** Årstidens tre månader som [år, månad] inom det rullande året (samma år som i årshjulet). */
  function arstidPerioder(arstidId, idagStr) {
    return (ARSTID_MANADER[arstidId] || []).map(function (m) { return [rullandeAr(m, idagStr), m]; });
  }

  /** Alla uppgifter vars deadline ligger i någon av årstidens tre månader (se arstidPerioder). */
  function uppgifterIArstid(lista, arstidId, idagStr) {
    var ut = [];
    arstidPerioder(arstidId, idagStr).forEach(function (p) { ut = ut.concat(uppgifterIManad(lista, p[0], p[1])); });
    return ut;
  }

  function manadsStatistik(lista, ar, manad, idagStr) {
    var m = uppgifterIManad(lista, ar, manad);
    var perPrio = {};
    PRIORITETER.forEach(function (p) { perPrio[p.id] = { totalt: 0, kvar: 0 }; });
    var klara = 0;
    var nasta = null;
    m.forEach(function (t) {
      var pp = perPrio[t.prioritet] || (perPrio[t.prioritet] = { totalt: 0, kvar: 0 });
      pp.totalt++;
      if (arKlar(t)) klara++;
      else {
        pp.kvar++;
        if (t.deadline >= idagStr && (!nasta || t.deadline < nasta)) nasta = t.deadline;
      }
    });
    return { totalt: m.length, klara: klara, kvar: m.length - klara, perPrio: perPrio, nastaDeadline: nasta };
  }

  /** Grupperar månadens uppgifter efter prioritet (Måste överst). */
  function grupperaEfterPrioritet(lista) {
    return PRIORITETER.map(function (p) {
      return {
        prioritet: p,
        uppgifter: sorteraUppgifter(lista.filter(function (t) { return t.prioritet === p.id; }))
      };
    }).filter(function (g) { return g.uppgifter.length > 0; });
  }

  /** Påminnelse visas från tre dagar innan deadline tills uppgiften är klar. */
  function behoverPaminnelse(t, idagStr) {
    if (!t.paminnelse || arKlar(t)) return false;
    var kvar = dagarMellan(idagStr, t.deadline);
    return kvar !== null && kvar <= PAMINNELSE_DAGAR;
  }

  function arForsenad(t, idagStr) {
    return !arKlar(t) && t.deadline < idagStr;
  }

  /**
   * När en återkommande uppgift bockas av som klar skapas nästa tillfälle.
   * Returnerar den nya uppgiften (utan id) eller null.
   */
  function nastaTillfalle(t) {
    if (!t.aterkommande || t.aterkommande === 'nej') return null;
    var nyDeadline = laggTillIntervall(t.deadline, t.aterkommande);
    var nyStart = t.start ? laggTillIntervall(t.start, t.aterkommande) : null;
    var kopia = {};
    for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) kopia[k] = t[k];
    delete kopia.id;
    kopia.start = nyStart;
    kopia.deadline = nyDeadline;
    kopia.status = 'ej';
    kopia.klarDatum = null;
    kopia.foregaende = t.id;
    return kopia;
  }

  // ---------- Validering ----------
  function trimma(s) { return typeof s === 'string' ? s.trim() : ''; }

  function valideraVaxt(v) {
    var fel = {};
    if (!trimma(v.namn)) fel.namn = 'Skriv växtens namn.';
    else if (trimma(v.namn).length > 60) fel.namn = 'Namnet får vara högst 60 tecken.';
    var antal = Number(v.antal);
    if (!Number.isInteger(antal) || antal < 0 || antal > 999) fel.antal = 'Antal måste vara ett heltal mellan 0 och 999.';
    return fel;
  }

  function valideraUppgift(u, vaxtIds) {
    var fel = {};
    if (!trimma(u.titel)) fel.titel = 'Skriv vad som ska göras.';
    if (!u.vaxtId || (vaxtIds && vaxtIds.indexOf(u.vaxtId) === -1)) fel.vaxtId = 'Välj vilken växt uppgiften gäller.';
    if (u.start && !tillDatum(u.start)) fel.start = 'Ange ett giltigt startdatum.';
    if (!u.deadline) fel.deadline = 'Ange en deadline.';
    else if (!tillDatum(u.deadline)) fel.deadline = 'Ange ett giltigt datum.';
    else if (u.start && tillDatum(u.start) && u.deadline < u.start) fel.deadline = 'Deadline kan inte vara före startdatum.';
    if (prioIndex(u.prioritet) === 99) fel.prioritet = 'Välj en prioritet.';
    var giltiga = INTERVALL.map(function (i) { return i.id; });
    if (giltiga.indexOf(u.aterkommande || 'nej') === -1) fel.aterkommande = 'Välj ett giltigt alternativ.';
    return fel;
  }

  function prioNamn(id) { var i = prioIndex(id); return i === 99 ? '' : PRIORITETER[i].namn; }
  function statusNamn(id) {
    for (var i = 0; i < STATUSAR.length; i++) if (STATUSAR[i].id === id) return STATUSAR[i].namn;
    return '';
  }

  function plural(n, en, flera) { return n + ' ' + (n === 1 ? en : flera); }

  return {
    tidsgrupper: tidsgrupper, forvaldDeadline: forvaldDeadline,
    MANADER: MANADER, MANADER_KORT: MANADER_KORT, VECKODAGAR: VECKODAGAR,
    PRIORITETER: PRIORITETER, STATUSAR: STATUSAR, INTERVALL: INTERVALL,
    PAMINNELSE_DAGAR: PAMINNELSE_DAGAR, ARSTID_NAMN: ARSTID_NAMN,
    stor: stor, tillDatum: tillDatum, tillStrang: tillStrang, idag: idag,
    dagarMellan: dagarMellan, laggTillDagar: laggTillDagar, laggTillManader: laggTillManader,
    laggTillIntervall: laggTillIntervall, kortDatum: kortDatum, rubrikDatum: rubrikDatum,
    relativDag: relativDag, arstid: arstid,
    arKlar: arKlar, nastaStatus: nastaStatus, sorteraUppgifter: sorteraUppgifter,
    uppgifterIManad: uppgifterIManad, manadsStatistik: manadsStatistik,
    uppgifterIArstid: uppgifterIArstid, arstidPerioder: arstidPerioder, ARSTID_MANADER: ARSTID_MANADER,
    rullandeAr: rullandeAr, rullandeFonster: rullandeFonster,
    grupperaEfterPrioritet: grupperaEfterPrioritet, behoverPaminnelse: behoverPaminnelse,
    arForsenad: arForsenad, nastaTillfalle: nastaTillfalle,
    valideraVaxt: valideraVaxt, valideraUppgift: valideraUppgift,
    prioNamn: prioNamn, statusNamn: statusNamn, plural: plural
  };
});
