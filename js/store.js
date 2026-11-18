/*
 * GRO – datalager. All data sparas lokalt i webbläsaren (localStorage).
 * Inget skickas till någon server.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic.js'));
  else root.GroStore = factory(root.GroLogic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';

  var NYCKEL = 'gro:v1';

  function nyttId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function tomData() { return { version: 1, startsidaSedd: false, vaxter: [], uppgifter: [] }; }

  function skapaStore(lagring) {
    var data = tomData();
    var lyssnare = [];

    function las() {
      try {
        var r = lagring.getItem(NYCKEL);
        if (r) {
          var p = JSON.parse(r);
          if (p && Array.isArray(p.vaxter) && Array.isArray(p.uppgifter)) data = p;
        }
      } catch (e) { /* trasig data – börja om tomt */ data = tomData(); }
    }

    /** Sparar. Kastar ett begripligt fel om lagringen är full. */
    function spara() {
      try {
        lagring.setItem(NYCKEL, JSON.stringify(data));
      } catch (e) {
        var fel = new Error('Telefonens lagring för appen är full. Ta bort några foton eller växter och försök igen.');
        fel.kod = 'FULL';
        throw fel;
      }
      lyssnare.forEach(function (fn) { fn(data); });
    }

    function hittaVaxt(id) { return data.vaxter.filter(function (v) { return v.id === id; })[0] || null; }
    function hittaUppgift(id) { return data.uppgifter.filter(function (u) { return u.id === id; })[0] || null; }

    function rensaVaxt(v) {
      return {
        namn: String(v.namn || '').trim(),
        sort: String(v.sort || '').trim(),
        typ: String(v.typ || '').trim(),
        antal: Number(v.antal) || 0,
        plats: String(v.plats || '').trim(),
        skotsel: String(v.skotsel || '').trim(),
        foto: v.foto || null
      };
    }

    function rensaUppgift(u) {
      return {
        titel: String(u.titel || '').trim(),
        vaxtId: u.vaxtId,
        start: u.start || null,
        deadline: u.deadline,
        aterkommande: u.aterkommande || 'nej',
        paminnelse: u.paminnelse !== false,
        prioritet: u.prioritet,
        ansvarig: String(u.ansvarig || '').trim()
      };
    }

    function sparaMedAterstallning(andring) {
      var backup = JSON.stringify(data);
      andring();
      try { spara(); } catch (e) { data = JSON.parse(backup); throw e; }
    }

    var api = {
      ladda: function () { las(); return api; },
      data: function () { return data; },
      prenumerera: function (fn) { lyssnare.push(fn); },

      startsidaSedd: function () { return !!data.startsidaSedd; },
      markeraStartsidaSedd: function () { data.startsidaSedd = true; spara(); },

      vaxter: function () { return data.vaxter.slice(); },
      vaxt: hittaVaxt,
      uppgifter: function () { return data.uppgifter.slice(); },
      uppgift: hittaUppgift,
      uppgifterForVaxt: function (vaxtId) {
        return data.uppgifter.filter(function (u) { return u.vaxtId === vaxtId; });
      },

      laggTillVaxt: function (v) {
        var fel = L.valideraVaxt(v);
        if (Object.keys(fel).length) { var e = new Error('Ogiltig växt'); e.falt = fel; throw e; }
        var ny = rensaVaxt(v);
        ny.id = nyttId();
        ny.skapad = new Date().toISOString();
        sparaMedAterstallning(function () { data.vaxter.push(ny); });
        return ny;
      },

      uppdateraVaxt: function (id, v) {
        var gammal = hittaVaxt(id);
        if (!gammal) throw new Error('Växten finns inte.');
        var fel = L.valideraVaxt(v);
        if (Object.keys(fel).length) { var e = new Error('Ogiltig växt'); e.falt = fel; throw e; }
        var ny = rensaVaxt(v);
        sparaMedAterstallning(function () { Object.assign(gammal, ny); });
        return gammal;
      },

      /** Tar bort växten och alla uppgifter som hör till den. */
      taBortVaxt: function (id) {
        sparaMedAterstallning(function () {
          data.vaxter = data.vaxter.filter(function (v) { return v.id !== id; });
          data.uppgifter = data.uppgifter.filter(function (u) { return u.vaxtId !== id; });
        });
      },

      laggTillUppgift: function (u) {
        var fel = L.valideraUppgift(u, data.vaxter.map(function (v) { return v.id; }));
        if (Object.keys(fel).length) { var e = new Error('Ogiltig uppgift'); e.falt = fel; throw e; }
        var ny = rensaUppgift(u);
        ny.id = nyttId();
        ny.status = 'ej';
        ny.klarDatum = null;
        sparaMedAterstallning(function () { data.uppgifter.push(ny); });
        return ny;
      },

      uppdateraUppgift: function (id, u) {
        var gammal = hittaUppgift(id);
        if (!gammal) throw new Error('Uppgiften finns inte.');
        var fel = L.valideraUppgift(u, data.vaxter.map(function (v) { return v.id; }));
        if (Object.keys(fel).length) { var e = new Error('Ogiltig uppgift'); e.falt = fel; throw e; }
        var ny = rensaUppgift(u);
        sparaMedAterstallning(function () { Object.assign(gammal, ny); });
        return gammal;
      },

      taBortUppgift: function (id) {
        sparaMedAterstallning(function () {
          data.uppgifter = data.uppgifter.filter(function (u) { return u.id !== id; });
        });
      },

      /**
       * Sätter status. Om en återkommande uppgift blir klar skapas nästa
       * tillfälle (en gång). Returnerar { uppgift, nasta }.
       */
      sattStatus: function (id, status, idagStr) {
        var u = hittaUppgift(id);
        if (!u) throw new Error('Uppgiften finns inte.');
        var nasta = null;
        sparaMedAterstallning(function () {
          var varKlar = u.status === 'klar';
          u.status = status;
          u.klarDatum = status === 'klar' ? (idagStr || L.idag()) : null;
          if (status === 'klar' && !varKlar && !u.nastaSkapad) {
            var n = L.nastaTillfalle(u);
            if (n) {
              n.id = nyttId();
              data.uppgifter.push(n);
              u.nastaSkapad = n.id;
              nasta = n;
            }
          }
        });
        return { uppgift: u, nasta: nasta };
      },

      /** Påhittad exempeldata: påhittade namn och egna tecknade bilder (inga riktiga foton). */
      laddaExempel: function (idagStr) {
        var t = idagStr || L.idag();
        var d = function (n) { return L.laggTillDagar(t, n); };
        var bild = function (namn) { return 'assets/img/exempel/' + namn + '.svg'; };
        var v1 = { id: nyttId(), namn: 'Rosor', sort: "Rosa 'New Dawn'", typ: 'Buske', antal: 3, plats: 'Södra spaljén', skotsel: 'Vattna rikligt vid torka. Gödsla i maj och juni. Beskär döda grenar på våren.', foto: bild('rosor') };
        var v2 = { id: nyttId(), namn: 'Lavendel', sort: "Lavandula 'Hidcote'", typ: 'Perenn', antal: 6, plats: 'Rabatten vid trappan', skotsel: 'Tål torka. Klipp ner en tredjedel efter blomningen.', foto: bild('lavendel') };
        var v3 = { id: nyttId(), namn: 'Dahlior', sort: "'Café au Lait'", typ: 'Knöl', antal: 5, plats: 'Skärrabatten', skotsel: 'Ta upp knölarna efter första frosten och förvara frostfritt.', foto: bild('dahlior') };
        var v4 = { id: nyttId(), namn: 'Äppelträd', sort: "'Ingrid Marie'", typ: 'Träd', antal: 1, plats: 'Gräsmattan', skotsel: 'Vinterbeskär i februari–mars.', foto: bild('appeltrad') };
        var v5 = { id: nyttId(), namn: 'Tulpaner', sort: 'Blandade färger', typ: 'Lök', antal: 40, plats: 'Krukorna vid entrén', skotsel: 'Plantera lökarna på hösten, ca 15 cm djupt. Låt bladen vissna ner efter blomningen.', foto: bild('tulpaner') };
        var v6 = { id: nyttId(), namn: 'Tomater', sort: "'Gardeners Delight'", typ: 'Grönsak', antal: 4, plats: 'Växthuset', skotsel: 'Förodla inomhus i mars. Vattna jämnt och knip av sidoskotten.', foto: bild('tomater') };
        var u = function (titel, vaxt, start, dl, prio, ansv, status, ater) {
          return { id: nyttId(), titel: titel, vaxtId: vaxt.id, start: start, deadline: dl, aterkommande: ater || 'nej', paminnelse: true, prioritet: prio, ansvarig: ansv || '', status: status || 'ej', klarDatum: status === 'klar' ? t : null };
        };
        data.vaxter = [v1, v2, v3, v4, v5, v6];
        data.uppgifter = [
          u('Ta upp dahliaknölarna', v3, d(-5), d(2), 'maste', 'Alva'),
          u('Beskär rosorna', v1, d(-2), d(4), 'vorebra', 'Måns', 'pagaende'),
          u('Täck rosorna med granris', v1, d(0), d(9), 'maste', 'Alva'),
          u('Klipp ner lavendeln', v2, d(-20), d(-10), 'vorebra', '', 'klar'),
          u('Kalka gräsmattan runt trädet', v4, d(-14), d(-7), 'bonus', 'Måns', 'klar'),
          u('Vattna i krukorna', v2, d(-1), d(1), 'bonus', '', 'ej', 'vecka'),
          u('Vinterbeskär äppelträdet', v4, d(70), d(100), 'maste', 'Måns'),
          u('Gödsla rosorna', v1, d(160), d(175), 'vorebra', 'Alva', 'ej', 'ar'),
          u('Plantera tulpanlökar', v5, d(-3), d(6), 'maste', 'Måns'),
          u('Ställ krukorna med tulpaner i lä', v5, d(20), d(30), 'bonus', ''),
          u('Så tomatfrön inomhus', v6, d(110), d(125), 'vorebra', 'Alva'),
          u('Plantera ut tomaterna', v6, d(175), d(190), 'maste', 'Alva'),
          u('Skörda äpplen', v4, d(280), d(300), 'bonus', 'Måns', 'ej', 'ar')
        ];
        data.startsidaSedd = true;
        spara();
      },

      raderaAllt: function () { data = tomData(); data.startsidaSedd = true; spara(); },

      /** Säkerhetskopia som JSON-text. */
      exportera: function () {
        return JSON.stringify({ app: 'GRO', version: 1, exporterad: new Date().toISOString(), vaxter: data.vaxter, uppgifter: data.uppgifter }, null, 2);
      },

      /**
       * Ersätter all data med en säkerhetskopia. Kontrollerar formatet och
       * rensar varje post genom samma regler som vanliga formulär.
       * Returnerar { vaxter, uppgifter } = antal inlästa.
       */
      importera: function (text) {
        var p;
        try { p = JSON.parse(text); } catch (e) { throw new Error('Filen är ingen giltig säkerhetskopia från GRO.'); }
        if (!p || p.app !== 'GRO' || !Array.isArray(p.vaxter) || !Array.isArray(p.uppgifter)) {
          throw new Error('Filen är ingen giltig säkerhetskopia från GRO.');
        }
        var vaxter = [], uppgifter = [], ids = {};
        p.vaxter.forEach(function (v) {
          if (!v || typeof v.id !== 'string' || Object.keys(L.valideraVaxt(v)).length) return;
          var ren = rensaVaxt(v);
          if (ren.foto && !/^data:image\/(jpeg|png|webp);base64,/.test(ren.foto) && !/^assets\/img\/exempel\/[a-z]+\.svg$/.test(ren.foto)) ren.foto = null;
          ren.id = v.id; ren.skapad = v.skapad || null;
          ids[v.id] = true; vaxter.push(ren);
        });
        var vaxtIds = Object.keys(ids);
        p.uppgifter.forEach(function (u) {
          if (!u || typeof u.id !== 'string' || Object.keys(L.valideraUppgift(u, vaxtIds)).length) return;
          var ren = rensaUppgift(u);
          ren.id = u.id;
          ren.status = ['ej', 'pagaende', 'klar'].indexOf(u.status) !== -1 ? u.status : 'ej';
          ren.klarDatum = ren.status === 'klar' && L.tillDatum(u.klarDatum) ? u.klarDatum : null;
          if (typeof u.nastaSkapad === 'string') ren.nastaSkapad = u.nastaSkapad;
          uppgifter.push(ren);
        });
        sparaMedAterstallning(function () {
          data.vaxter = vaxter; data.uppgifter = uppgifter; data.startsidaSedd = true;
        });
        return { vaxter: vaxter.length, uppgifter: uppgifter.length };
      }
    };
    return api;
  }

  return { skapaStore: skapaStore, NYCKEL: NYCKEL };
});
