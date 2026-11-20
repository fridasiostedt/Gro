/*
 * GRO – gränssnittet. Enkel hash-router som ritar om <main> per vy.
 * Vyer: start, översikt, årshjul, växter, växt, växtformulär,
 * uppgiftsformulär och alla uppgifter.
 */
(function () {
  'use strict';
  var L = window.GroLogic;
  var ikon = window.GroIkon;
  var Hjul = window.GroHjul;
  // Visningsversion (visning.html eller ?visning): egen lagring, fylld med vanliga trädgårdsväxter.
  var VISNING = !!window.GRO_VISNING || /[?&]visning\b/.test(location.search);
  var NYCKEL = VISNING ? 'gro:visning' : undefined;
  var store;
  try {
    store = window.GroStore.skapaStore(window.localStorage, NYCKEL).ladda();
  } catch (e) {
    // localStorage avstängt (t.ex. privat läge i vissa webbläsare): kör i minnet
    var minne = {};
    store = window.GroStore.skapaStore({
      getItem: function (k) { return k in minne ? minne[k] : null; },
      setItem: function (k, v) { minne[k] = String(v); }
    }, NYCKEL).ladda();
  }
  if (VISNING && !store.vaxter().length && !store.uppgifter().length) store.laddaExempel(L.idag(), true);

  var huvud = document.getElementById('huvud');
  var toppfalt = document.getElementById('toppfalt');
  var tillbakaKnapp = document.getElementById('tillbaka');
  var bottennav = document.getElementById('bottennav');
  var toastEl = document.getElementById('toast');

  var nu = new Date();
  var ui = {
    kalender: { ar: nu.getFullYear(), manad: nu.getMonth() },
    oversikt: { ar: nu.getFullYear(), manad: nu.getMonth() },
    vaxtFilter: 'alla',
    uppgiftFilter: 'kvar',
    interntAntalSteg: 0,
    forraRutt: null
  };

  // ---------- Hjälpare ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function idag() { return L.idag(); }
  function $(sel, rot) { return (rot || document).querySelector(sel); }
  function $$(sel, rot) { return Array.prototype.slice.call((rot || document).querySelectorAll(sel)); }

  var toastTimer;
  function meddela(text) {
    toastEl.textContent = '';
    clearTimeout(toastTimer);
    // Kort fördröjning så att skärmläsare uppfattar ändringen
    setTimeout(function () { toastEl.textContent = text; toastEl.classList.add('synlig'); }, 50);
    toastTimer = setTimeout(function () { toastEl.classList.remove('synlig'); }, 4000);
  }

  function bekrafta(rubrik, text, okText) {
    var d = document.getElementById('dialog');
    $('#dialog-rubrik').textContent = rubrik;
    $('#dialog-text').textContent = text;
    $('#dialog-ok').textContent = okText || 'Ta bort';
    return new Promise(function (resolve) {
      function klar(svar) {
        $('#dialog-ok').removeEventListener('click', ok);
        $('#dialog-avbryt').removeEventListener('click', avbryt);
        d.removeEventListener('cancel', avbryt);
        d.close();
        resolve(svar);
      }
      function ok() { klar(true); }
      function avbryt(e) { if (e) e.preventDefault(); klar(false); }
      $('#dialog-ok').addEventListener('click', ok);
      $('#dialog-avbryt').addEventListener('click', avbryt);
      d.addEventListener('cancel', avbryt);
      d.showModal();
      $('#dialog-avbryt').focus();
    });
  }

  /** Byter vy utan att skapa en ny historikpost. */
  function ersatt(hash) {
    if (location.hash === hash) { rita({ ruttbyte: true }); return; }
    ui.ersatt = true;
    location.replace(hash);
  }

  // ---------- Komponenter ----------
  var PRIO_IKON = { maste: 'varning', vorebra: 'tumme', bonus: 'stjarna' };

  function prioBricka(prio) {
    return '<span class="prio prio-' + prio + '">' + ikon(PRIO_IKON[prio], 16) +
      '<span>' + esc(L.prioNamn(prio)) + '</span></span>';
  }

  function statusIndikator(status) {
    if (status === 'pagaende') return '<span class="indikator ind-pagaende">' + ikon('klocka', 14) + '</span>';
    if (status === 'klar') return '<span class="indikator ind-klar">' + ikon('bock', 16) + '</span>';
    return '<span class="indikator ind-ej"></span>';
  }

  function uppgiftskort(u, opts) {
    opts = opts || {};
    var v = store.vaxt(u.vaxtId);
    var t = idag();
    var nasta = L.nastaStatus(u.status);
    var aria = 'Status för ' + u.titel + ': ' + L.statusNamn(u.status) +
      '. Ändra till ' + L.statusNamn(nasta) + '.';
    var pamin = '';
    if (L.arForsenad(u, t)) {
      pamin = '<span class="tagg tagg-varning">' + ikon('notis', 16) + '<span>Försenad</span></span>';
    } else if (L.behoverPaminnelse(u, t)) {
      pamin = '<span class="tagg tagg-varning">' + ikon('notis', 16) + '<span>Deadline ' + esc(L.relativDag(u.deadline, t)) + '</span></span>';
    }
    var ater = u.aterkommande && u.aterkommande !== 'nej'
      ? '<span class="tagg">' + esc(L.INTERVALL.filter(function (i) { return i.id === u.aterkommande; })[0].namn.replace('Ja, ', '')) + '</span>'
      : '';
    var rubrikNiva = opts.niva || 3;
    return '<article class="uppgiftskort status-' + u.status + '">' +
      '<button type="button" class="statusknapp" data-status-for="' + esc(u.id) + '" aria-label="' + esc(aria) + '">' +
        statusIndikator(u.status) + '</button>' +
      '<div class="kort-innehall">' +
        '<h' + rubrikNiva + ' class="kort-titel"><a href="#/uppgift/' + encodeURIComponent(u.id) + '">' + esc(u.titel) +
          '<span class="visuellt-dold">, ' + esc(L.statusNamn(u.status)) + '. Redigera</span></a></h' + rubrikNiva + '>' +
        '<p class="meta">' +
          (v ? ikon('vaxt', 21) + '<span>' + esc(v.namn) + '</span><span class="prick" aria-hidden="true">·</span>' : '') +
          ikon('kalender', 16) + '<span>Senast ' + esc(L.kortDatum(u.deadline)) + '</span>' +
        '</p>' +
        '<div class="taggar">' + prioBricka(u.prioritet) +
          (u.ansvarig ? '<span class="ansvarig">' + ikon('person', 16) + '<span class="visuellt-dold">Ansvarig: </span><span>' + esc(u.ansvarig) + '</span></span>' : '') +
          pamin + ater +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function uppgiftslista(lista, opts) {
    if (!lista.length) return '';
    return '<ul class="kortlista" role="list">' + lista.map(function (u) {
      return '<li>' + uppgiftskort(u, opts) + '</li>';
    }).join('') + '</ul>';
  }

  function manadskort(lage, prefix) {
    var st = L.manadsStatistik(store.uppgifter(), lage.ar, lage.manad, idag());
    var namn = L.stor(L.MANADER[lage.manad]) + (lage.ar !== nu.getFullYear() ? ' ' + lage.ar : '');
    var andel = st.totalt ? Math.round(st.klara / st.totalt * 100) : 0;
    var nastaText = st.nastaDeadline ? ' · nästa deadline ' + L.relativDag(st.nastaDeadline, idag()) : '';
    return '<section class="manadskort" aria-labelledby="' + prefix + '-manad">' +
      '<div class="manadsvaljare">' +
        '<button type="button" class="ikonknapp" data-manad-steg="-1" data-lage="' + prefix + '" aria-label="Föregående månad">' + ikon('pil-vanster') + '</button>' +
        '<h2 class="manad-namn" id="' + prefix + '-manad" aria-live="polite">' + esc(namn) + '</h2>' +
        '<button type="button" class="ikonknapp" data-manad-steg="1" data-lage="' + prefix + '" aria-label="Nästa månad">' + ikon('pil-hoger') + '</button>' +
      '</div>' +
      '<p class="mindre-rubrik">' + esc(L.plural(st.kvar, 'uppgift', 'uppgifter')) + ' kvar</p>' +
      '<div class="forlopp" role="progressbar" aria-label="Avklarade uppgifter i ' + esc(namn) + '" aria-valuemin="0" aria-valuemax="' + st.totalt + '" aria-valuenow="' + st.klara + '" aria-valuetext="' + st.klara + ' av ' + st.totalt + ' klara">' +
        '<span style="width:' + andel + '%"></span></div>' +
      '<p>' + st.klara + ' av ' + st.totalt + ' klara' + esc(nastaText) + '</p>' +
    '</section>';
  }

  function sidhuvud(rubrik, overrad, underrad) {
    return '<div class="sidhuvud">' +
      (overrad ? '<p class="overrad">' + esc(overrad) + '</p>' : '') +
      '<h1 tabindex="-1">' + esc(rubrik) + '</h1>' +
      (underrad ? '<p class="underrad">' + esc(underrad) + '</p>' : '') +
    '</div>';
  }

  function fotoHtml(v, klass, alt) {
    if (v.foto) return '<img class="' + klass + '" src="' + esc(v.foto) + '" alt="' + esc(alt) + '">';
    return '<div class="' + klass + ' foto-saknas" aria-hidden="true">' + ikon('vaxt', 48) + '</div>';
  }

  // ---------- Vyer ----------
  function vyStart() {
    var harData = store.vaxter().length > 0 || store.uppgifter().length > 0;
    return {
      titel: 'GRO – Grönska. Rutin. Omtanke.',
      utanRam: true,
      html:
        '<section class="start">' +
          '<div class="start-topp">' +
            '<div class="start-rubriker">' +
              '<h1 class="ordmarke" tabindex="-1">GRO</h1>' +
              '<p class="tagline">GRÖNSKA · RUTIN · OMTANKE</p>' +
            '</div>' +
            '<div class="blomma">' +
              '<img class="blomma-bild" src="assets/img/gro-blomma.png" alt="Gros blomma – en rosa pion med gröna blad" width="185" height="239">' +
              '<span class="blomma-reserv" aria-hidden="true">' + ikon('vaxt', 96) + '</span>' +
            '</div>' +
          '</div>' +
          '<p class="start-text">Håll koll på allt trädgården behöver – och när. Mindre att komma ihåg, mer tid att njuta.</p>' +
          '<div class="atgarder">' +
            '<button type="button" class="knapp knapp-primar" data-atgard="kom-igang">' + (harData ? 'Fortsätt till översikten' : 'Kom igång') + '</button>' +
            '<button type="button" class="knapp knapp-sekundar" data-atgard="exempel">Prova med exempelväxter</button>' +
          '</div>' +
          '<p class="liten-text">Dina växter och uppgifter sparas på din telefon.</p>' +
        '</section>',
      efter: function () {
        var img = $('.blomma-bild');
        function saknas() { img.closest('.blomma').classList.add('saknas'); }
        if (img.complete && !img.naturalWidth) saknas();
        img.addEventListener('error', saknas);
      }
    };
  }

  /** Mjuk hälsning överst på Översikt: tid på dygnet + en kort välkomstrad. */
  function valkomnande() {
    var d = new Date(), h = d.getHours();
    var halsning = h < 5 ? 'God natt' : h < 10 ? 'God morgon' : h < 13 ? 'Hej och välkommen' : h < 18 ? 'God eftermiddag' : 'God kväll';
    return '<div class="sidhuvud valkomnande">' +
      '<p class="overrad">Översikt</p>' +
      '<h1 tabindex="-1">' + esc(halsning) + '</h1>' +
      '<p class="valkomst-text">Välkommen till GRO. Dags för lite planering?</p>' +
    '</div>';
  }

  /** Övre panelen på Översikt: tecknad header med pion och andra blommor (dekorativ),
   *  plus knappar för påminnelser och inställningar så att de går att nå. */
  function hero() {
    var t = idag();
    var antalPamin = store.uppgifter().filter(function (u) { return L.behoverPaminnelse(u, t); }).length;
    var paminText = antalPamin
      ? 'Påminnelser: ' + L.plural(antalPamin, 'uppgift', 'uppgifter') + ' med nära deadline'
      : 'Påminnelser: inga just nu';
    return '<div class="hero">' +
      '<img class="hero-bild" src="assets/img/oversikt-panel.svg" alt="" width="402" height="208">' +
      '<div class="hero-knappar">' +
        '<a class="hero-knapp" href="#/uppgifter" aria-label="' + esc(paminText) + '">' + ikon('notis', 22) +
          (antalPamin ? '<span class="hero-bricka" aria-hidden="true">' + antalPamin + '</span>' : '') + '</a>' +
        '<a class="hero-knapp" href="#/installningar" aria-label="Inställningar">' + ikon('installningar', 22) + '</a>' +
      '</div>' +
    '</div>';
  }

  function vyInstallningar() {
    var antalV = store.vaxter().length, antalU = store.uppgifter().length;
    return {
      titel: 'Inställningar – GRO', flik: 'oversikt',
      html:
        sidhuvud('Inställningar') +
        '<section class="sektion installningskort" aria-labelledby="inst-kopia">' +
          '<h2 class="sektion-h2" id="inst-kopia">Säkerhetskopia</h2>' +
          '<p>Dina ' + esc(L.plural(antalV, 'växt', 'växter')) + ' och ' + esc(L.plural(antalU, 'uppgift', 'uppgifter')) +
            ' finns bara på den här enheten. Spara en kopia ibland, eller flytta den till en annan telefon.</p>' +
          '<button type="button" class="knapp knapp-primar" data-atgard="exportera">' + ikon('nedladdning', 20) + 'Spara säkerhetskopia</button>' +
          '<label class="knapp knapp-sekundar" for="f-import">' + ikon('uppladdning', 20) + 'Läs in säkerhetskopia</label>' +
          '<input type="file" id="f-import" accept="application/json,.json" class="visuellt-dold" aria-describedby="import-info">' +
          '<p class="hjalptext" id="import-info">Inläsning ersätter allt som finns i appen nu. Filen innehåller dina foton – dela den inte med andra.</p>' +
        '</section>' +
        ('Notification' in window ? '<section class="sektion installningskort" aria-labelledby="inst-pamin">' +
          '<h2 class="sektion-h2" id="inst-pamin">Påminnelser</h2>' +
          '<p>GRO påminner 3 dagar före deadline. ' + (Notification.permission === 'granted'
            ? 'Aviseringar på telefonen är påslagna.</p>'
            : Notification.permission === 'denied'
              ? 'Aviseringar är blockerade i webbläsarens inställningar.</p>'
              : 'Du kan även få dem som aviseringar på telefonen.</p>' +
                '<button type="button" class="knapp knapp-sekundar" data-atgard="aviseringar">' + ikon('notis', 20) + 'Slå på aviseringar</button>') +
        '</section>' : '') +
        '<section class="sektion installningskort" aria-labelledby="inst-om">' +
          '<h2 class="sektion-h2" id="inst-om">Om GRO</h2>' +
          '<p>Grönska. Rutin. Omtanke. Allt sparas lokalt i webbläsaren – inget skickas till någon server.</p>' +
          '<a class="knapp knapp-sekundar" href="#/start">' + ikon('vaxt', 20) + 'Visa startsidan</a>' +
        '</section>' +
        '<section class="sektion installningskort" aria-labelledby="inst-radera">' +
          '<h2 class="sektion-h2" id="inst-radera">Radera all data</h2>' +
          '<p>Tar bort alla växter, foton och uppgifter från den här enheten.</p>' +
          '<button type="button" class="knapp knapp-fara" data-atgard="radera-allt">' + ikon('papperskorg', 20) + 'Radera all data</button>' +
        '</section>',
      efter: function () {
        var inp = $('#f-import');
        inp.addEventListener('change', function () {
          var fil = inp.files && inp.files[0];
          if (!fil) return;
          bekrafta('Läsa in säkerhetskopian?', 'Allt som finns i appen nu ersätts med innehållet i ”' + fil.name + '”.', 'Läs in').then(function (ok) {
            if (!ok) { inp.value = ''; $('label[for="f-import"]').focus(); return; }
            fil.text().then(function (text) {
              try {
                var r = store.importera(text);
                meddela('Inläst: ' + L.plural(r.vaxter, 'växt', 'växter') + ' och ' + L.plural(r.uppgifter, 'uppgift', 'uppgifter') + '.');
                rita({ fokus: 'label[for="f-import"]' });
              } catch (e) { meddela(e.message); inp.value = ''; }
            });
          });
        });
      }
    };
  }

  function vyOversikt() {
    var t = idag();
    var kvar = L.sorteraUppgifter(store.uppgifter().filter(function (u) { return !L.arKlar(u); }));
    var lage = ui.oversikt;
    var st = L.manadsStatistik(store.uppgifter(), lage.ar, lage.manad, t);
    var harVaxter = store.vaxter().length > 0;
    var tomt = harVaxter
      ? '<p class="tom-text">Inga uppgifter kvar. Dags att njuta av trädgården!</p>'
      : '<p class="tom-text">Börja med att lägga till en växt. Sedan kan du lägga till uppgifter för den.</p>';

    var raknare = L.PRIORITETER.map(function (p) {
      var pp = st.perPrio[p.id];
      // Hela rutan är en länk till listan med uppgifter i den prioriteringen
      return '<li><a class="raknare" href="#/prioritet/' + p.id + '?ar=' + lage.ar + '&manad=' + lage.manad + '">' +
        prioBricka(p.id) + ' ' +
        '<span class="raknare-tal">' + pp.kvar + '</span> ' +
        '<span>av ' + pp.totalt + ' kvar</span>' +
        '<span class="visuellt-dold"> i ' + esc(L.MANADER[lage.manad]) + '. Visa uppgifterna.</span></a></li>';
    }).join('');

    return {
      titel: 'Översikt – GRO', flik: 'oversikt', hero: true,
      html:
        hero() +
        valkomnande() +
        manadskort(lage, 'ov') +
        '<section class="sektion" aria-labelledby="mina-uppg">' +
          '<div class="sektionsrubrik"><h2 id="mina-uppg">Mina uppgifter</h2>' +
            (kvar.length ? '<a class="visa-alla" href="#/uppgifter">Visa alla<span class="visuellt-dold"> uppgifter</span></a>' : '') + '</div>' +
          (kvar.length ? uppgiftslista(kvar.slice(0, 3)) : tomt) +
          (harVaxter
            ? '<a class="knapp knapp-sekundar" href="#/uppgift/ny">Ny uppgift' + ikon('plus', 20) + '</a>'
            : '<a class="knapp knapp-primar" href="#/vaxt/ny">Lägg till växt' + ikon('plus', 20) + '</a>') +
        '</section>' +
        '<section class="sektion prio-sektion" aria-labelledby="mina-prio">' +
          '<div class="sektionsrubrik"><h2 id="mina-prio">Mina prioriteringar</h2></div>' +
          '<p class="visuellt-dold">Gäller ' + esc(L.MANADER[lage.manad]) + '.</p>' +
          '<ul class="fordelning" role="list">' + raknare + '</ul>' +
        '</section>' +
        '<a class="lank-startsida" href="#/start">' + ikon('vaxt', 20) + 'Till startsidan</a>'
    };
  }

  function tillDatumManad(t) { return Number(t.slice(5, 7)) - 1; }

  function vyArshjul() {
    var lage = ui.kalender;
    var t = idag();
    var alla = store.uppgifter();
    // Rullande år: hjulet visar de kommande tolv månaderna (t.ex. nov 2026–okt 2027)
    var manadsAr = [];
    for (var mm = 0; mm < 12; mm++) manadsAr.push(L.rullandeAr(mm, t));
    lage.ar = manadsAr[lage.manad];
    var fonster = L.rullandeFonster(t);
    var fonsterText = L.MANADER_KORT[fonster[0][1]] + ' ' + fonster[0][0] + '–' + L.MANADER_KORT[fonster[11][1]] + ' ' + fonster[11][0];
    var statistik = [];
    for (var m = 0; m < 12; m++) statistik.push(L.manadsStatistik(alla, manadsAr[m], m, t));
    // Vald årstid: sammanställning av årstidens tre månader. Annars: vald månad.
    var arstid = lage.arstid || null;
    var BESTAMD = { vinter: 'vintern', var: 'våren', sommar: 'sommaren', host: 'hösten' };
    var iManad = arstid ? L.uppgifterIArstid(alla, arstid, t) : L.uppgifterIManad(alla, lage.ar, lage.manad);
    var grupper = L.grupperaEfterPrioritet(iManad);
    var manadNamn = L.MANADER[lage.manad];
    // Antal per årstid (kommande förekomst) till hjulets mitt och knapparnas namn
    var arstidStat = {};
    ['vinter', 'var', 'sommar', 'host'].forEach(function (id) {
      var u = L.uppgifterIArstid(alla, id, t);
      var p = L.arstidPerioder(id, t);
      arstidStat[id] = {
        totalt: u.length,
        klara: u.filter(function (x) { return x.status === 'klar'; }).length,
        period: p.slice().sort(function (a, b) { return (a[0] * 12 + a[1]) - (b[0] * 12 + b[1]); }).map(function (x) { return L.MANADER_KORT[x[1]] + ' ' + x[0]; }).join(', ')
      };
    });
    var rubrikText = arstid
      ? 'Uppgifter under ' + BESTAMD[arstid]
      : 'Uppgifter i ' + manadNamn + (lage.ar !== Number(t.slice(0, 4)) ? ' ' + lage.ar : '');
    var tomText = arstid ? 'Inga uppgifter under ' + BESTAMD[arstid] + '.' : 'Inga uppgifter i ' + manadNamn + (lage.ar !== Number(t.slice(0, 4)) ? ' ' + lage.ar : '') + '.';
    var lista = grupper.length
      ? grupper.map(function (g) {
        return '<section class="prio-grupp prio-grupp-' + g.prioritet.id + '" aria-labelledby="grupp-' + g.prioritet.id + '">' +
          '<h3 class="grupp-rubrik" id="grupp-' + g.prioritet.id + '">' +
            '<span class="prio-ikon prio-ikon-' + g.prioritet.id + '">' + ikon(PRIO_IKON[g.prioritet.id], 16) + '</span>' +
            '<span class="prio-text">' + esc(L.prioNamn(g.prioritet.id)) + '</span>' +
            '<span class="grupp-antal">' + esc(L.plural(g.uppgifter.length, 'uppgift', 'uppgifter')) + '</span></h3>' +
          uppgiftslista(g.uppgifter, { niva: 4 }) + '</section>';
      }).join('')
      : '<p class="tom-text">' + esc(tomText) + '</p>';

    return {
      titel: 'Årshjul – GRO', flik: 'arshjul', gronRubrik: true,
      html:
        '<div class="gron-rubrik">' +
          sidhuvud('Årshjul') +
          '<p class="intro-text">Se vad som väntar kommande månader. Tryck på en månad eller årstid.</p>' +
        '</div>' +
        Hjul.rita({ ar: fonsterText, manadsAr: manadsAr, vald: lage.manad, valdAvAnvandare: !!lage.klickad, arstid: lage.arstid || null, arstidStat: arstidStat, nuManad: tillDatumManad(t), statistik: statistik }) +
        (arstid ? '' : manadskort(lage, 'kal')) +
        '<section class="sektion" aria-labelledby="manadens">' +
          '<div class="sektionsrubrik"><h2 id="manadens">' + esc(rubrikText) + '</h2></div>' +
          lista +
          (store.vaxter().length ? '<a class="knapp knapp-sekundar" href="#/uppgift/ny">Ny uppgift' + ikon('plus', 20) + '</a>' : '') +
        '</section>',
      efter: function () {
        Hjul.koppla(huvud, function (m) {
          ui.kalender.manad = m;
          ui.kalender.arstid = null;
          ui.kalender.klickad = true;
          rita({ fokus: '.segment[data-manad="' + m + '"]' });
        }, function (id) {
          // Klick på en årstid visar dess antal i mitten och alla årstidens uppgifter nedanför; klick igen går tillbaka till månaden
          ui.kalender.arstid = ui.kalender.arstid === id ? null : id;
          rita({ fokus: '.arstid-knapp[data-arstid="' + id + '"]' });
        });
      }
    };
  }

  var TYP_PLURAL = { buske: 'Buskar', 'träd': 'Träd', perenn: 'Perenner', 'ettårig': 'Ettåriga', 'klätterväxt': 'Klätterväxter', 'grönsak': 'Grönsaker', 'knöl': 'Knölar', 'lök': 'Lökar', ört: 'Örter', 'krukväxt': 'Krukväxter' };
  function typPlural(typ) { return TYP_PLURAL[typ.toLowerCase()] || L.stor(typ); }

  function vyVaxter() {
    var alla = store.vaxter().sort(function (a, b) { return a.namn.localeCompare(b.namn, 'sv'); });
    var typer = [];
    alla.forEach(function (v) { if (v.typ && typer.indexOf(v.typ) === -1) typer.push(v.typ); });
    typer.sort(function (a, b) { return a.localeCompare(b, 'sv'); });
    if (ui.vaxtFilter !== 'alla' && typer.indexOf(ui.vaxtFilter) === -1) ui.vaxtFilter = 'alla';
    var visade = ui.vaxtFilter === 'alla' ? alla : alla.filter(function (v) { return v.typ === ui.vaxtFilter; });

    function chip(varde, text) {
      var vald = ui.vaxtFilter === varde;
      return '<button type="button" class="valchip' + (vald ? ' vald' : '') + '" data-filter="' + esc(varde) + '" aria-pressed="' + vald + '">' +
        (vald ? ikon('bock', 18) : '') + '<span>' + esc(text) + '</span></button>';
    }

    var kort = visade.map(function (v) {
      var n = store.uppgifterForVaxt(v.id).filter(function (u) { return !L.arKlar(u); }).length;
      return '<li><article class="vaxtkort">' + fotoHtml(v, 'vaxtkort-foto', '') +
        '<div class="vaxtkort-text">' +
          '<h2 class="kort-titel"><a href="#/vaxt/' + encodeURIComponent(v.id) + '">' + esc(v.namn) + '</a></h2>' +
          (v.sort ? '<p class="liten-text">' + esc(v.sort) + '</p>' : '') +
          '<p class="fakta"><span class="faktabricka">' + esc(L.plural(n, 'uppgift', 'uppgifter')) + '</span></p>' +
        '</div></article></li>';
    }).join('');

    return {
      titel: 'Mina växter – GRO', flik: 'vaxter',
      html:
        sidhuvud('Mina växter', null, L.plural(alla.length, 'växt', 'växter')) +
        (typer.length ? '<div class="filter" role="group" aria-label="Visa växttyp">' + chip('alla', 'Alla') +
          typer.map(function (t) { return chip(t, typPlural(t)); }).join('') + '</div>' : '') +
        (alla.length
          ? '<ul class="vaxtrutnat" role="list">' + kort + '</ul>'
          : '<p class="tom-text">Här samlas dina växter. Lägg till den första!</p>') +
        '<a class="knapp knapp-sekundar" href="#/vaxt/ny">Lägg till växt' + ikon('plus', 20) + '</a>'
    };
  }

  function vyVaxt(id) {
    var v = store.vaxt(id);
    if (!v) return vyHittadesInte('Växten finns inte längre.');
    var uppg = L.sorteraUppgifter(store.uppgifterForVaxt(id));
    var underrad = [v.typ, v.plats].filter(Boolean).join(' · ');
    return {
      titel: v.namn + ' – GRO', flik: 'vaxter',
      html:
        fotoHtml(v, 'detalj-foto', 'Foto av ' + v.namn) +
        '<section class="detalj-innehall">' +
          '<div class="detalj-rubrik">' +
            '<h1 tabindex="-1">' + esc(v.namn) + '</h1>' +
            (underrad ? '<p class="etikett-text">' + esc(underrad) + '</p>' : '') +
            (v.sort ? '<p>' + esc(v.sort) + '</p>' : '') +
            '<p class="antal-bricka">' + esc(v.antal) + ' st</p>' +
          '</div>' +
          '<div>' +
            '<h2 class="h2-kort">Skötsel</h2>' +
            '<p class="skotseltext">' + (v.skotsel ? esc(v.skotsel) : '<span class="dampad">Ingen skötselanteckning ännu.</span>') + '</p>' +
          '</div>' +
        '</section>' +
        '<section class="sektion" aria-labelledby="vaxt-uppg">' +
          '<h2 id="vaxt-uppg" class="sektion-h2">Uppgifter</h2>' +
          (uppg.length ? uppgiftslista(uppg) : '<p class="tom-text">Inga uppgifter för ' + esc(v.namn) + ' ännu.</p>') +
          '<a class="knapp knapp-sekundar" href="#/uppgift/ny?vaxt=' + encodeURIComponent(v.id) + '">Skapa ny uppgift' + ikon('plus', 20) + '</a>' +
        '</section>' +
        '<div class="hantera">' +
          '<a class="knapp knapp-sekundar" href="#/vaxt/' + encodeURIComponent(v.id) + '/redigera">' + ikon('penna', 20) + 'Redigera växt</a>' +
          '<button type="button" class="knapp knapp-text-fara" data-atgard="ta-bort-vaxt" data-id="' + esc(v.id) + '">' + ikon('papperskorg', 20) + 'Ta bort växt</button>' +
        '</div>'
    };
  }

  // ---------- Formulär ----------
  function falt(id, etikett, inmatning, hjalp) {
    return '<div class="falt-grupp" data-falt="' + id + '">' +
      '<label class="etikett" for="f-' + id + '">' + esc(etikett) + '</label>' +
      inmatning +
      (hjalp ? '<p class="hjalptext" id="f-' + id + '-hjalp">' + esc(hjalp) + '</p>' : '') +
      '<p class="felmeddelande" id="f-' + id + '-fel" hidden></p>' +
    '</div>';
  }
  function beskrivning(id, hjalp) {
    return ' aria-describedby="' + (hjalp ? 'f-' + id + '-hjalp ' : '') + 'f-' + id + '-fel"';
  }

  function visaFel(form, fel) {
    $$('.falt-grupp, .val-grupp', form).forEach(function (g) {
      var namn = g.getAttribute('data-falt');
      var p = $('#f-' + namn + '-fel', form);
      var inp = $$('input, select, textarea', g);
      if (fel[namn]) {
        p.innerHTML = ikon('varning', 16) + '<span>' + esc(fel[namn]) + '</span>';
        p.hidden = false;
        inp.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); });
      } else if (p) {
        p.hidden = true;
        p.textContent = ''; // annars läser skärmläsare upp det gamla felet via aria-describedby
        inp.forEach(function (i) { i.removeAttribute('aria-invalid'); });
      }
    });
    var forsta = Object.keys(fel)[0];
    if (forsta) {
      var mal = $('#f-' + forsta, form) || $('[name="' + forsta + '"]', form);
      if (mal) mal.focus();
    }
  }

  /** Läser in en bild och sparar om den som JPEG via canvas – det tar bort all EXIF-data inklusive GPS-position. */
  function forbeeredFoto(fil) {
    return new Promise(function (resolve, reject) {
      if (!fil || !/^image\//.test(fil.type)) { reject(new Error('Välj en bildfil.')); return; }
      var url = URL.createObjectURL(fil);
      var img = new Image();
      img.onload = function () {
        var max = 1000;
        var skala = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * skala);
        c.height = Math.round(img.naturalHeight * skala);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Bilden kunde inte läsas.')); };
      img.src = url;
    });
  }

  function vyVaxtForm(id) {
    var v = id ? store.vaxt(id) : null;
    if (id && !v) return vyHittadesInte('Växten finns inte längre.');
    var d = v || { namn: '', sort: '', typ: '', antal: 1, plats: '', skotsel: '', foto: null };
    var foto = d.foto;

    function fotovaljare() {
      return foto
        ? '<img class="fotovaljare-bild" src="' + esc(foto) + '" alt=""><span class="fotovaljare-text">Byt foto</span>'
        : '<span class="fotovaljare-cirkel">' + ikon('kamera', 28) + '</span>' +
          '<span class="fotovaljare-text">Ta ett foto av växten</span>' +
          '<span class="liten-text dampad2">eller välj en bild från telefonen</span>';
    }

    return {
      titel: (v ? 'Redigera ' + v.namn : 'Ny växt') + ' – GRO', flik: 'vaxter',
      html:
        '<form class="formular formular-tat" novalidate>' +
          sidhuvud(v ? 'Redigera växt' : 'Ny växt') +
          '<label class="fotovaljare" for="f-foto">' + fotovaljare() + '</label>' +
          '<input type="file" id="f-foto" accept="image/*" class="visuellt-dold" aria-describedby="foto-info">' +
          '<p class="hjalptext" id="foto-info">Platsinformation (GPS) tas bort från fotot innan det sparas.</p>' +
          (foto ? '<button type="button" class="textknapp" data-atgard="ta-bort-foto">Ta bort foto</button>' : '') +
          falt('namn', 'Namn', '<input class="falt" id="f-namn" name="namn" required maxlength="60" autocomplete="off" value="' + esc(d.namn) + '"' + beskrivning('namn') + '>') +
          falt('typ', 'Typ (valfritt)', '<input class="falt" id="f-typ" name="typ" list="typlista" autocomplete="off" value="' + esc(d.typ) + '"' + beskrivning('typ', true) + '>' +
            '<datalist id="typlista"><option value="Buske"><option value="Träd"><option value="Perenn"><option value="Ettårig"><option value="Klätterväxt"><option value="Grönsak"><option value="Knöl"><option value="Lök"><option value="Ört"></datalist>',
            'Används för att filtrera, t.ex. Buske eller Träd.') +
          '<div class="falt-grupp" data-falt="antal">' +
            '<label class="etikett" for="f-antal">Antal</label>' +
            '<div class="stegvaljare">' +
              '<button type="button" class="ikonknapp" data-steg="-1" aria-label="Minska antal">' + ikon('minus') + '</button>' +
              '<input class="steg-varde" id="f-antal" name="antal" type="number" inputmode="numeric" min="0" max="999" value="' + esc(d.antal) + '"' + beskrivning('antal') + '>' +
              '<button type="button" class="ikonknapp" data-steg="1" aria-label="Öka antal">' + ikon('plus') + '</button>' +
            '</div>' +
            '<p class="felmeddelande" id="f-antal-fel" hidden></p>' +
          '</div>' +
          falt('plats', 'Plats i trädgården', '<input class="falt" id="f-plats" name="plats" autocomplete="off" value="' + esc(d.plats) + '"' + beskrivning('plats') + '>') +
          falt('skotsel', 'Skötselanteckning', '<textarea class="falt" id="f-skotsel" name="skotsel" rows="3"' + beskrivning('skotsel') + '>' + esc(d.skotsel) + '</textarea>') +
          '<button type="submit" class="knapp knapp-primar">' + (v ? 'Spara ändringar' : 'Spara växt') + '</button>' +
        '</form>',
      efter: function () {
        var form = $('.formular');
        var filInput = $('#f-foto');
        filInput.addEventListener('change', function () {
          var fil = filInput.files && filInput.files[0];
          if (!fil) return;
          forbeeredFoto(fil).then(function (data) {
            foto = data;
            $('.fotovaljare').innerHTML = fotovaljare();
            // Knappen Ta bort foto ska finnas direkt efter att ett foto valts, inte först när växten sparats
            if (!$('[data-atgard="ta-bort-foto"]')) {
              $('#foto-info').insertAdjacentHTML('afterend', '<button type="button" class="textknapp" data-atgard="ta-bort-foto">Ta bort foto</button>');
            }
            meddela('Fotot är valt.');
          }).catch(function (e) { meddela(e.message); });
        });
        form.addEventListener('click', function (e) {
          var s = e.target.closest('[data-steg]');
          if (s) {
            var inp = $('#f-antal');
            var n = Math.max(0, Math.min(999, (parseInt(inp.value, 10) || 0) + Number(s.getAttribute('data-steg'))));
            inp.value = n;
            meddela('Antal: ' + n);
          }
          if (e.target.closest('[data-atgard="ta-bort-foto"]')) {
            foto = null;
            $('.fotovaljare').innerHTML = fotovaljare();
            e.target.closest('button').remove();
            filInput.value = '';
            meddela('Fotot är borttaget.');
            $('.fotovaljare').focus();
          }
        });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var fd = new FormData(form);
          var ny = {
            namn: fd.get('namn'), sort: d.sort || '', /* fältet är borttaget – behåll ev. tidigare värde */ typ: fd.get('typ'),
            antal: parseInt(fd.get('antal'), 10), plats: fd.get('plats'), skotsel: fd.get('skotsel'), foto: foto
          };
          var fel = L.valideraVaxt(ny);
          visaFel(form, fel);
          if (Object.keys(fel).length) return;
          try {
            var sparad = v ? store.uppdateraVaxt(v.id, ny) : store.laggTillVaxt(ny);
            meddela(v ? 'Ändringarna är sparade.' : sparad.namn + ' är tillagd.');
            if (v) history.back(); else ersatt('#/vaxt/' + encodeURIComponent(sparad.id));
          } catch (err) {
            if (err.falt) visaFel(form, err.falt); else meddela(err.message);
          }
        });
      }
    };
  }

  function vyUppgiftForm(id, params) {
    var u = id ? store.uppgift(id) : null;
    if (id && !u) return vyHittadesInte('Uppgiften finns inte längre.');
    var vaxter = store.vaxter().sort(function (a, b) { return a.namn.localeCompare(b.namn, 'sv'); });
    if (!vaxter.length) {
      return {
        titel: 'Ny uppgift – GRO',
        html: sidhuvud('Ny uppgift') +
          '<p class="tom-text">En uppgift hör alltid till en växt. Lägg till en växt först.</p>' +
          '<a class="knapp knapp-primar" href="#/vaxt/ny">Lägg till växt' + ikon('plus', 20) + '</a>'
      };
    }
    var d = u || { titel: '', vaxtId: params.vaxt || (vaxter.length === 1 ? vaxter[0].id : ''), start: idag(), deadline: '', aterkommande: 'nej', paminnelse: true, prioritet: L.prioNamn(params.prioritet) ? params.prioritet : '', ansvarig: '' };

    var vaxtVal = '<select class="falt" id="f-vaxtId" name="vaxtId" required' + beskrivning('vaxtId') + '>' +
      '<option value="">Välj växt</option>' +
      vaxter.map(function (v) { return '<option value="' + esc(v.id) + '"' + (v.id === d.vaxtId ? ' selected' : '') + '>' + esc(v.namn) + '</option>'; }).join('') +
      '</select>';
    var aterVal = '<select class="falt" id="f-aterkommande" name="aterkommande"' + beskrivning('aterkommande', true) + '>' +
      L.INTERVALL.map(function (i) { return '<option value="' + i.id + '"' + (i.id === d.aterkommande ? ' selected' : '') + '>' + esc(i.namn) + '</option>'; }).join('') +
      '</select>';
    var prioVal = '<fieldset class="val-grupp" data-falt="prioritet" aria-describedby="f-prioritet-hjalp f-prioritet-fel">' +
      '<legend class="etikett">Prioritet</legend>' +
      '<div class="prio-alternativ">' + L.PRIORITETER.map(function (p, i) {
        return '<label class="prio-val">' +
          '<input type="radio" name="prioritet" value="' + p.id + '"' + (i === 0 ? ' id="f-prioritet"' : '') + (d.prioritet === p.id ? ' checked' : '') + '>' +
          prioBricka(p.id) + '</label>';
      }).join('') + '</div>' +
      '<p class="hjalptext" id="f-prioritet-hjalp">”Måste” visas överst i månadsvyn.</p>' +
      '<p class="felmeddelande" id="f-prioritet-fel" hidden></p>' +
    '</fieldset>';

    return {
      titel: (u ? 'Redigera uppgift' : 'Ny uppgift') + ' – GRO', flik: null,
      html:
        '<form class="formular formular-tat" novalidate>' +
          sidhuvud(u ? 'Redigera uppgift' : 'Ny uppgift') +
          falt('titel', 'Vad ska göras?', '<input class="falt" id="f-titel" name="titel" required maxlength="80" autocomplete="off" value="' + esc(d.titel) + '"' + beskrivning('titel') + '>') +
          falt('vaxtId', 'Växt', vaxtVal) +
          '<div class="datumrad">' +
            falt('start', 'Startdatum', '<input class="falt" type="date" id="f-start" name="start" value="' + esc(d.start || '') + '"' + beskrivning('start') + '>') +
            falt('deadline', 'Deadline', '<input class="falt" type="date" id="f-deadline" name="deadline" required value="' + esc(d.deadline) + '"' + beskrivning('deadline') + '>') +
          '</div>' +
          '<label class="kryssrad"><input type="checkbox" name="paminnelse"' + (d.paminnelse ? ' checked' : '') + '><span>Påminn mig 3 dagar innan deadline</span></label>' +
          falt('aterkommande', 'Återkommande?', aterVal, 'När uppgiften bockas av som klar skapas nästa tillfälle automatiskt.') +
          prioVal +
          falt('ansvarig', 'Ansvarig (valfritt)', '<input class="falt" id="f-ansvarig" name="ansvarig" maxlength="30" autocomplete="off" value="' + esc(d.ansvarig) + '"' + beskrivning('ansvarig') + '>') +
          '<button type="submit" class="knapp knapp-primar">' + (u ? 'Spara ändringar' : 'Lägg till uppgift') + '</button>' +
          (u ? '<button type="button" class="knapp knapp-text-fara" data-atgard="ta-bort-uppgift" data-id="' + esc(u.id) + '">' + ikon('papperskorg', 20) + 'Ta bort uppgift</button>' : '') +
        '</form>',
      efter: function () {
        var form = $('.formular');
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var fd = new FormData(form);
          var ny = {
            titel: fd.get('titel'), vaxtId: fd.get('vaxtId'), start: fd.get('start') || null,
            deadline: fd.get('deadline'), aterkommande: fd.get('aterkommande'),
            paminnelse: fd.get('paminnelse') === 'on', prioritet: fd.get('prioritet') || '', ansvarig: fd.get('ansvarig')
          };
          var fel = L.valideraUppgift(ny, vaxter.map(function (v) { return v.id; }));
          visaFel(form, fel);
          if (Object.keys(fel).length) return;
          try {
            if (u) store.uppdateraUppgift(u.id, ny); else store.laggTillUppgift(ny);
            meddela(u ? 'Uppgiften är sparad.' : 'Uppgiften är tillagd.');
            if (ui.interntAntalSteg > 0) history.back(); else ersatt('#/oversikt');
          } catch (err) {
            if (err.falt) visaFel(form, err.falt); else meddela(err.message);
          }
        });
      }
    };
  }

  /** Uppgifterna i en prioritering, för vald månad eller alla månader. */
  function vyPrioritet(prio, params) {
    if (L.prioNamn(prio) === '') return vyHittadesInte('Prioriteringen finns inte.');
    var ar = parseInt(params.ar, 10), manad = parseInt(params.manad, 10);
    if (isNaN(ar) || isNaN(manad) || manad < 0 || manad > 11) { ar = nu.getFullYear(); manad = nu.getMonth(); }
    var allaManader = params.alla === '1';
    var t = idag();
    var bas = store.uppgifter().filter(function (u) { return u.prioritet === prio; });
    var urval = allaManader ? bas : L.uppgifterIManad(bas, ar, manad);
    var lista = L.sorteraUppgifter(urval);
    var kvar = lista.filter(function (u) { return !L.arKlar(u); });
    var klara = lista.filter(L.arKlar);
    var manadNamn = L.MANADER[manad] + (ar !== nu.getFullYear() ? ' ' + ar : '');
    var namn = L.prioNamn(prio);
    var basUrl = '#/prioritet/' + prio + '?ar=' + ar + '&manad=' + manad;

    function chip(href, text, vald) {
      return '<a class="valchip' + (vald ? ' vald' : '') + '" href="' + href + '"' + (vald ? ' aria-current="true"' : '') + '>' +
        (vald ? ikon('bock', 18) : '') + '<span>' + esc(text) + '</span></a>';
    }
    function avsnitt(id, rubrik, uppg) {
      return '<section class="sektion" aria-labelledby="' + id + '"><h2 class="sektion-h2" id="' + id + '">' + esc(rubrik) +
        ' <span class="grupp-antal">(' + uppg.length + ')</span></h2>' + uppgiftslista(uppg) + '</section>';
    }
    var forsenade = kvar.filter(function (u) { return L.arForsenad(u, t); });
    var kommande = kvar.filter(function (u) { return !L.arForsenad(u, t); });

    return {
      titel: namn + ' – GRO', flik: 'oversikt',
      html:
        '<div class="sidhuvud">' +
          '<p class="overrad">Prioritering</p>' +
          '<h1 tabindex="-1" class="prio-rubrik">' + esc(L.prioNamn(prio)) + '</h1>' +
          '<p class="underrad">' + (allaManader ? 'Alla månader' : esc(L.stor(manadNamn))) + ' · ' +
            kvar.length + ' av ' + lista.length + ' kvar</p>' +
        '</div>' +
        '<nav class="filter" aria-label="Visa period">' +
          chip(basUrl, L.stor(manadNamn), !allaManader) +
          chip(basUrl + '&alla=1', 'Alla månader', allaManader) +
        '</nav>' +
        (lista.length
          ? (forsenade.length ? avsnitt('p-forsenade', 'Försenade', forsenade) : '') +
            (kommande.length ? avsnitt('p-kvar', 'Att göra', kommande) : '') +
            (klara.length ? avsnitt('p-klara', 'Klara', klara) : '')
          : '<p class="tom-text">Inga uppgifter med prioriteringen ' + esc(namn) + (allaManader ? '' : ' i ' + esc(manadNamn)) + '.</p>') +
        (store.vaxter().length ? '<a class="knapp knapp-sekundar" href="#/uppgift/ny?prioritet=' + prio + '">Ny uppgift' + ikon('plus', 20) + '</a>' : '')
    };
  }

  function vyUppgifter() {
    var t = idag();
    var alla = L.sorteraUppgifter(store.uppgifter());
    var kvar = alla.filter(function (u) { return !L.arKlar(u); });
    var klara = alla.filter(L.arKlar).reverse();
    var visaKlara = ui.uppgiftFilter === 'klara';
    function chip(varde, text, n) {
      var vald = ui.uppgiftFilter === varde;
      return '<button type="button" class="valchip' + (vald ? ' vald' : '') + '" data-uppgiftfilter="' + varde + '" aria-pressed="' + vald + '">' +
        (vald ? ikon('bock', 18) : '') + '<span>' + text + ' (' + n + ')</span></button>';
    }
    var innehall;
    if (visaKlara) {
      innehall = klara.length ? uppgiftslista(klara, { niva: 2 }) : '<p class="tom-text">Inga avklarade uppgifter ännu.</p>';
    } else {
      var forsenade = kvar.filter(function (u) { return L.arForsenad(u, t); });
      var kommande = kvar.filter(function (u) { return !L.arForsenad(u, t); });
      innehall = (forsenade.length ? '<section class="sektion" aria-labelledby="forsenade"><h2 class="sektion-h2" id="forsenade">Försenade</h2>' + uppgiftslista(forsenade) + '</section>' : '') +
        (kommande.length ? '<section class="sektion" aria-labelledby="kommande"><h2 class="sektion-h2" id="kommande">Kommande</h2>' + uppgiftslista(kommande) + '</section>' : '') +
        (!kvar.length ? '<p class="tom-text">Inga uppgifter kvar.</p>' : '');
    }
    return {
      titel: 'Alla uppgifter – GRO', flik: 'oversikt',
      html: sidhuvud('Alla uppgifter') +
        '<div class="filter" role="group" aria-label="Visa">' + chip('kvar', 'Att göra', kvar.length) + chip('klara', 'Klara', klara.length) + '</div>' +
        innehall +
        (store.vaxter().length ? '<a class="knapp knapp-sekundar" href="#/uppgift/ny">Ny uppgift' + ikon('plus', 20) + '</a>' : '')
    };
  }

  function vyHittadesInte(text) {
    return {
      titel: 'Hittades inte – GRO',
      html: sidhuvud('Hittades inte') + '<p class="tom-text">' + esc(text || 'Sidan finns inte.') + '</p>' +
        '<a class="knapp knapp-primar" href="#/oversikt">Till översikten</a>'
    };
  }

  // ---------- Router ----------
  function tolka() {
    var h = location.hash.replace(/^#\/?/, '');
    var delar = h.split('?');
    var vag = delar[0].split('/').filter(Boolean).map(decodeURIComponent);
    var params = {};
    (delar[1] || '').split('&').forEach(function (p) {
      if (!p) return;
      var kv = p.split('=');
      params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
    return { vag: vag, params: params };
  }

  function valjVy(r) {
    var v = r.vag;
    if (!v.length) return store.startsidaSedd() ? vyOversikt() : vyStart();
    switch (v[0]) {
      case 'start': return vyStart();
      case 'oversikt': return vyOversikt();
      case 'arshjul': return vyArshjul();
      case 'uppgifter': return vyUppgifter();
      case 'installningar': return vyInstallningar();
      case 'prioritet': return vyPrioritet(v[1], r.params);
      case 'vaxter': return vyVaxter();
      case 'vaxt':
        if (v[1] === 'ny') return vyVaxtForm(null);
        if (v[2] === 'redigera') return vyVaxtForm(v[1]);
        return vyVaxt(v[1]);
      case 'uppgift':
        if (v[1] === 'ny') return vyUppgiftForm(null, r.params);
        return vyUppgiftForm(v[1], r.params);
      default: return vyHittadesInte();
    }
  }

  var HUVUDFLIKAR = ['oversikt', 'arshjul', 'vaxter'];

  function rita(opts) {
    opts = opts || {};
    var r = tolka();
    var vy = valjVy(r);
    var scroll = huvud.scrollTop; // innehållet scrollar i <main>, inte i fönstret
    huvud.innerHTML = vy.html;
    document.title = vy.titel;
    document.body.classList.toggle('utan-ram', !!vy.utanRam);

    toppfalt.hidden = !!vy.utanRam;
    bottennav.hidden = !!vy.utanRam;
    var arHuvudflik = HUVUDFLIKAR.indexOf(r.vag[0] || 'oversikt') !== -1 && r.vag.length <= 1;
    tillbakaKnapp.hidden = arHuvudflik && ui.interntAntalSteg === 0;
    // Översikt börjar med heron högst upp – där behövs inget toppfält (menyn finns nedtill)
    if (vy.hero) toppfalt.hidden = true;
    document.body.classList.toggle('med-hero', !!vy.hero);
    document.body.classList.toggle('gron-sida', !!vy.gronRubrik);

    $$('a', bottennav).forEach(function (a) {
      if (a.getAttribute('data-flik') === vy.flik) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (vy.efter) vy.efter();

    // Mjuk övergång bara vid byte av vy, inte när samma vy ritas om
    huvud.classList.remove('vy-in');
    if (opts.ruttbyte || opts.forsta) { void huvud.offsetWidth; huvud.classList.add('vy-in'); }

    if (opts.fokus) {
      huvud.scrollTop = scroll;
      var el = $(opts.fokus, huvud);
      if (el) el.focus({ preventScroll: false });
    } else if (opts.ruttbyte) {
      huvud.scrollTop = 0;
      var h1 = $('h1', huvud);
      if (h1) h1.focus({ preventScroll: true });
    } else {
      huvud.scrollTop = scroll;
    }
    uppdateraToppskugga();
  }

  /** Skugga under toppfältet när innehållet har scrollats in under det. */
  function uppdateraToppskugga() {
    toppfalt.classList.toggle('skuggad', huvud.scrollTop > 4);
  }
  huvud.addEventListener('scroll', uppdateraToppskugga, { passive: true });

  // När ett kort får tangentbordsfokus visas hela kortet, inte bara länken (WCAG 2.4.11)
  huvud.addEventListener('focusin', function (e) {
    // Bara vid tangentbordsfokus: vid klick/tryck skulle scrollen flytta knappen mellan nedtryck och
    // släpp, och då kommer klicket aldrig fram (t.ex. statusknappen på ett kort längst ned).
    var tangentbord = true;
    try { tangentbord = e.target.matches(':focus-visible'); } catch (fel) { /* äldre webbläsare */ }
    if (!tangentbord) return;
    var kort = e.target.closest && e.target.closest('.uppgiftskort, .vaxtkort, .raknare');
    if (kort && kort.scrollIntoView) kort.scrollIntoView({ block: 'nearest' });
  });

  // Klockslaget i statusfältet (bara synligt i datorns telefonram)
  var statusTid = document.getElementById('status-tid');
  function uppdateraKlocka() {
    var d = new Date();
    if (statusTid) statusTid.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  uppdateraKlocka();
  setInterval(uppdateraKlocka, 15000);

  // ---------- Händelser ----------
  huvud.addEventListener('click', function (e) {
    var t = e.target;

    var status = t.closest('[data-status-for]');
    if (status) {
      var id = status.getAttribute('data-status-for');
      var u = store.uppgift(id);
      if (!u) return;
      try {
        var res = store.sattStatus(id, L.nastaStatus(u.status), idag());
        var text = u.titel + ': ' + L.statusNamn(res.uppgift.status) + '.';
        if (res.nasta) text += ' Nästa tillfälle är skapat, deadline ' + L.kortDatum(res.nasta.deadline) + '.';
        rita({ fokus: '[data-status-for="' + CSS.escape(id) + '"]' });
        meddela(text);
      } catch (err) { meddela(err.message); }
      return;
    }

    var steg = t.closest('[data-manad-steg]');
    if (steg) {
      var lage = steg.getAttribute('data-lage') === 'kal' ? ui.kalender : ui.oversikt;
      var m = lage.manad + Number(steg.getAttribute('data-manad-steg'));
      lage.ar += Math.floor(m / 12);
      lage.manad = ((m % 12) + 12) % 12;
      if (lage === ui.kalender) lage.ar = L.rullandeAr(lage.manad, idag()); // Årshjul: alltid inom de kommande tolv månaderna
      if (lage === ui.kalender) { lage.klickad = true; lage.arstid = null; }
      rita({ fokus: '[data-manad-steg="' + steg.getAttribute('data-manad-steg') + '"][data-lage="' + steg.getAttribute('data-lage') + '"]' });
      return;
    }

    var filter = t.closest('[data-filter]');
    if (filter) {
      ui.vaxtFilter = filter.getAttribute('data-filter');
      rita({ fokus: '[data-filter="' + CSS.escape(ui.vaxtFilter) + '"]' });
      return;
    }

    var uf = t.closest('[data-uppgiftfilter]');
    if (uf) {
      ui.uppgiftFilter = uf.getAttribute('data-uppgiftfilter');
      rita({ fokus: '[data-uppgiftfilter="' + ui.uppgiftFilter + '"]' });
      return;
    }

    var atg = t.closest('[data-atgard]');
    if (!atg) return;
    var namn = atg.getAttribute('data-atgard');
    if (namn === 'kom-igang') {
      store.markeraStartsidaSedd();
      ersatt('#/oversikt');
    } else if (namn === 'exempel') {
      var laddaExempel = function () {
        store.laddaExempel(idag(), VISNING);
        if (VISNING) store.markeraStartsidaSedd();
        meddela('Exempelväxter och uppgifter är tillagda.');
        ersatt('#/oversikt');
      };
      // Skydda användarens egna växter från att skrivas över
      if (!VISNING && (store.vaxter().length || store.uppgifter().length)) {
        bekrafta('Ersätta dina växter?', 'Dina växter och uppgifter ersätts med exempelväxter. Det går inte att ångra.', 'Ersätt med exempel')
          .then(function (ok) { if (ok) laddaExempel(); else atg.focus(); });
      } else {
        laddaExempel();
      }
    } else if (namn === 'dela') {
      var url = location.origin + location.pathname + location.search; // visningsversionen delas som visningsversion
      if (navigator.share) {
        navigator.share({ title: 'GRO – Grönska. Rutin. Omtanke.', text: 'Håll koll på allt trädgården behöver – och när.', url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { meddela('Länken till appen är kopierad.'); },
          function () { meddela('Länken kunde inte kopieras: ' + url); });
      } else {
        meddela('Dela länken: ' + url);
      }
    } else if (namn === 'exportera') {
      var blob = new Blob([store.exportera()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gro-sakerhetskopia-' + idag() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      meddela('Säkerhetskopian är sparad i dina hämtade filer.');
    } else if (namn === 'radera-allt') {
      bekrafta('Radera all data?', 'Alla växter, foton och uppgifter tas bort från den här enheten. Det går inte att ångra.', 'Radera allt').then(function (ok) {
        if (!ok) { atg.focus(); return; }
        store.raderaAllt();
        meddela('All data är raderad.');
        ersatt('#/oversikt');
      });
    } else if (namn === 'aviseringar') {
      Notification.requestPermission().then(function () { avisera(); rita(); });
    } else if (namn === 'ta-bort-vaxt') {
      var vid = atg.getAttribute('data-id');
      var vx = store.vaxt(vid);
      var n = store.uppgifterForVaxt(vid).length;
      bekrafta('Ta bort ' + vx.namn + '?', n
        ? 'Växten och dess ' + L.plural(n, 'uppgift', 'uppgifter') + ' tas bort. Det går inte att ångra.'
        : 'Växten tas bort. Det går inte att ångra.', 'Ta bort växt').then(function (ok) {
        if (!ok) { atg.focus(); return; }
        store.taBortVaxt(vid);
        meddela(vx.namn + ' är borttagen.');
        ersatt('#/vaxter');
      });
    } else if (namn === 'ta-bort-uppgift') {
      var uid = atg.getAttribute('data-id');
      var up = store.uppgift(uid);
      bekrafta('Ta bort uppgiften?', '”' + up.titel + '” tas bort. Det går inte att ångra.', 'Ta bort uppgift').then(function (ok) {
        if (!ok) { atg.focus(); return; }
        store.taBortUppgift(uid);
        meddela('Uppgiften är borttagen.');
        if (ui.interntAntalSteg > 0) history.back(); else ersatt('#/oversikt');
      });
    }
  });

  tillbakaKnapp.innerHTML = ikon('pil-vanster');
  tillbakaKnapp.addEventListener('click', function () {
    if (ui.interntAntalSteg > 0) history.back();
    else location.hash = '#/oversikt';
  });

  $$('[data-ikon]', bottennav).forEach(function (s) {
    s.innerHTML = ikon(s.getAttribute('data-ikon'), s.getAttribute('data-ikon') === 'vaxt' ? 31 : 24);
  });

  // Hopplänken: flytta fokus till innehållet utan att ändra adressen (#huvud är ingen sida i appen)
  var hoppa = document.querySelector('.hoppa-lank');
  if (hoppa) hoppa.addEventListener('click', function (e) {
    e.preventDefault();
    var mal = huvud.querySelector('h1') || huvud;
    if (!mal.hasAttribute('tabindex')) mal.setAttribute('tabindex', '-1');
    mal.focus();
  });

  // Håll reda på hur djupt in i appen vi är (via history.state) så att
  // tillbaka-knappen aldrig lämnar appen.
  history.replaceState({ djup: 0 }, '');
  window.addEventListener('hashchange', function () {
    if (history.state && typeof history.state.djup === 'number') {
      ui.interntAntalSteg = history.state.djup; // tillbaka/framåt till känd post
    } else {
      if (!ui.ersatt) ui.interntAntalSteg++;
      ui.ersatt = false;
      history.replaceState({ djup: ui.interntAntalSteg }, '');
    }
    rita({ ruttbyte: true });
  });

  // ---------- Aviseringar (fungerar medan appen är öppen) ----------
  function avisera() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var t = idag();
    var nyckel = 'gro:aviserat';
    var gjort = {};
    try { gjort = JSON.parse(localStorage.getItem(nyckel)) || {}; } catch (e) { gjort = {}; }
    store.uppgifter().forEach(function (u) {
      if (L.behoverPaminnelse(u, t) && gjort[u.id] !== t) {
        try {
          new Notification('GRO – påminnelse', { body: u.titel + ': deadline ' + L.relativDag(u.deadline, t) + '.', tag: 'gro-' + u.id });
        } catch (e) { /* vissa mobilwebbläsare kräver service worker */ }
        gjort[u.id] = t;
      }
    });
    try { localStorage.setItem(nyckel, JSON.stringify(gjort)); } catch (e) { /* ignorera */ }
  }

  // ---------- Telefonramen behåller iPhonens proportioner ----------
  // Från 480 px visas appen i en iPhone-ram (402 × 874). Är fönstret för litet skalas hela ramen ned
  // proportionerligt, med 24 px luft runt om.
  function skalaRam() {
    var rot = document.documentElement;
    if (window.innerWidth < 480) { rot.style.removeProperty('--ram-skala'); return; }
    var luft = 48;
    var skala = Math.min(1, (window.innerHeight - luft) / 874, (window.innerWidth - luft) / 402);
    rot.style.setProperty('--ram-skala', Math.max(0.3, skala).toFixed(4));
  }
  window.addEventListener('resize', skalaRam);
  skalaRam();

  rita({ forsta: true });
  avisera();
})();
