// Kör med: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/logic.js');
const { skapaStore } = require('../js/store.js');

function minneslagring() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}

test('datum: ogiltiga datum avvisas', () => {
  assert.equal(L.tillDatum('2026-02-31'), null);
  assert.equal(L.tillDatum('hej'), null);
  assert.ok(L.tillDatum('2026-02-28'));
});

test('datum: månadsaddition klipper till sista dagen', () => {
  assert.equal(L.laggTillManader('2026-01-31', 1), '2026-02-28');
  assert.equal(L.laggTillManader('2028-01-31', 1), '2028-02-29');
  assert.equal(L.laggTillManader('2026-12-15', 1), '2027-01-15');
  assert.equal(L.laggTillIntervall('2026-03-28', 'vecka'), '2026-04-04'); // över sommartid
  assert.equal(L.laggTillIntervall('2026-11-16', 'ar'), '2027-11-16');
});

test('dagarMellan klarar sommartidsbyte', () => {
  assert.equal(L.dagarMellan('2026-03-28', '2026-03-30'), 2);
  assert.equal(L.dagarMellan('2026-10-24', '2026-10-26'), 2);
});

test('relativDag', () => {
  assert.equal(L.relativDag('2026-11-16', '2026-11-16'), 'idag');
  assert.equal(L.relativDag('2026-11-17', '2026-11-16'), 'imorgon');
  assert.equal(L.relativDag('2026-11-22', '2026-11-16'), 'på söndag');
  assert.equal(L.relativDag('2026-12-12', '2026-11-16'), 'den 12 dec');
});

test('årstider', () => {
  assert.equal(L.arstid(0), 'vinter');
  assert.equal(L.arstid(2), 'var');
  assert.equal(L.arstid(6), 'sommar');
  assert.equal(L.arstid(10), 'host');
  assert.equal(L.arstid(11), 'vinter');
});

const lista = [
  { id: 'a', deadline: '2026-11-15', prioritet: 'maste', status: 'klar' },
  { id: 'b', deadline: '2026-11-20', prioritet: 'vorebra', status: 'ej' },
  { id: 'c', deadline: '2026-11-18', prioritet: 'maste', status: 'pagaende' },
  { id: 'd', deadline: '2026-12-01', prioritet: 'bonus', status: 'ej' },
  { id: 'e', deadline: '2025-11-10', prioritet: 'bonus', status: 'ej' }
];

test('månadsstatistik räknar per månad och år', () => {
  const s = L.manadsStatistik(lista, 2026, 10, '2026-11-16');
  assert.equal(s.totalt, 3);
  assert.equal(s.klara, 1);
  assert.equal(s.kvar, 2);
  assert.deepEqual(s.perPrio.maste, { totalt: 2, kvar: 1 });
  assert.deepEqual(s.perPrio.bonus, { totalt: 0, kvar: 0 });
  assert.equal(s.nastaDeadline, '2026-11-18');
});

test('gruppering efter prioritet: Måste först, tomma grupper utelämnas', () => {
  const g = L.grupperaEfterPrioritet(L.uppgifterIManad(lista, 2026, 10));
  assert.deepEqual(g.map((x) => x.prioritet.id), ['maste', 'vorebra']);
  assert.deepEqual(g[0].uppgifter.map((u) => u.id), ['c', 'a']); // ej klar före klar
});

test('påminnelse tre dagar innan deadline', () => {
  const u = { deadline: '2026-11-19', paminnelse: true, status: 'ej' };
  assert.equal(L.behoverPaminnelse(u, '2026-11-15'), false); // 4 dagar kvar
  assert.equal(L.behoverPaminnelse(u, '2026-11-16'), true); // 3 dagar kvar
  assert.equal(L.behoverPaminnelse(u, '2026-11-25'), true); // försenad
  assert.equal(L.behoverPaminnelse({ ...u, status: 'klar' }, '2026-11-16'), false);
  assert.equal(L.behoverPaminnelse({ ...u, paminnelse: false }, '2026-11-16'), false);
});

test('statuscykel', () => {
  assert.equal(L.nastaStatus('ej'), 'pagaende');
  assert.equal(L.nastaStatus('pagaende'), 'klar');
  assert.equal(L.nastaStatus('klar'), 'ej');
});

test('validering av uppgift', () => {
  const fel = L.valideraUppgift({ titel: ' ', vaxtId: 'x', start: '2026-11-20', deadline: '2026-11-10', prioritet: 'nej' }, ['y']);
  assert.ok(fel.titel && fel.vaxtId && fel.deadline && fel.prioritet);
  const ok = L.valideraUppgift({ titel: 'Vattna', vaxtId: 'y', start: '', deadline: '2026-11-10', prioritet: 'bonus' }, ['y']);
  assert.deepEqual(ok, {});
});

test('validering av växt', () => {
  assert.ok(L.valideraVaxt({ namn: '', antal: 1 }).namn);
  assert.ok(L.valideraVaxt({ namn: 'Ros', antal: -1 }).antal);
  assert.deepEqual(L.valideraVaxt({ namn: 'Ros', antal: 0 }), {});
});

test('store: lägga till, redigera och ta bort växt (och dess uppgifter)', () => {
  const s = skapaStore(minneslagring()).ladda();
  const v = s.laggTillVaxt({ namn: 'Pion', sort: 'Paeonia', antal: 2, plats: 'Rabatt', skotsel: 'Stötta' });
  s.laggTillUppgift({ titel: 'Stötta', vaxtId: v.id, deadline: '2026-06-01', prioritet: 'maste' });
  assert.equal(s.vaxter().length, 1);
  s.uppdateraVaxt(v.id, { ...v, namn: 'Pioner' });
  assert.equal(s.vaxt(v.id).namn, 'Pioner');
  s.taBortVaxt(v.id);
  assert.equal(s.vaxter().length, 0);
  assert.equal(s.uppgifter().length, 0);
});

test('store: återkommande uppgift skapar nästa tillfälle en gång', () => {
  const s = skapaStore(minneslagring()).ladda();
  const v = s.laggTillVaxt({ namn: 'Gräs', antal: 1 });
  const u = s.laggTillUppgift({ titel: 'Klipp', vaxtId: v.id, start: '2026-05-01', deadline: '2026-05-03', prioritet: 'bonus', aterkommande: 'vecka' });
  const r = s.sattStatus(u.id, 'klar', '2026-05-02');
  assert.equal(r.nasta.deadline, '2026-05-10');
  assert.equal(r.nasta.start, '2026-05-08');
  assert.equal(r.nasta.status, 'ej');
  // Av och på igen ska inte skapa dubbletter
  s.sattStatus(u.id, 'ej');
  s.sattStatus(u.id, 'klar');
  assert.equal(s.uppgifter().length, 2);
});

test('store: data överlever omladdning', () => {
  const lag = minneslagring();
  const s1 = skapaStore(lag).ladda();
  s1.laggTillVaxt({ namn: 'Ros', antal: 1 });
  const s2 = skapaStore(lag).ladda();
  assert.equal(s2.vaxter()[0].namn, 'Ros');
});

test('store: full lagring ger begripligt fel och ingen halvsparad data', () => {
  const lag = minneslagring();
  const s = skapaStore(lag).ladda();
  lag.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => s.laggTillVaxt({ namn: 'Ros', antal: 1 }), /lagring/);
  assert.equal(s.vaxter().length, 0);
});

test('store: exempeldata använder påhittade namn och egna tecknade bilder (inga foton)', () => {
  const s = skapaStore(minneslagring()).ladda();
  s.laddaExempel('2026-11-16');
  assert.ok(s.vaxter().every((v) => /^assets\/img\/exempel\/[a-z]+\.svg$/.test(v.foto)));
  const namn = new Set(s.uppgifter().map((u) => u.ansvarig).filter(Boolean));
  assert.deepEqual([...namn].sort(), ['Alva', 'Måns']);
});

test('store: export och import av säkerhetskopia', () => {
  const s1 = skapaStore(minneslagring()).ladda();
  s1.laddaExempel('2026-11-16');
  const kopia = s1.exportera();
  const s2 = skapaStore(minneslagring()).ladda();
  const r = s2.importera(kopia);
  assert.equal(r.vaxter, 6);
  assert.deepEqual(s2.vaxter().map((v) => v.foto), s1.vaxter().map((v) => v.foto)); // exempelbilderna följer med
  assert.equal(r.uppgifter, s1.uppgifter().length);
  assert.deepEqual(s2.uppgifter().map((u) => u.status), s1.uppgifter().map((u) => u.status));
});

test('store: import avvisar felaktiga filer och skadlig data', () => {
  const s = skapaStore(minneslagring()).ladda();
  s.laggTillVaxt({ namn: 'Ros', antal: 1 });
  assert.throws(() => s.importera('inte json'), /giltig/);
  assert.throws(() => s.importera('{"vaxter":[]}'), /giltig/);
  assert.equal(s.vaxter().length, 1); // ingenting ändrat
  const r = s.importera(JSON.stringify({ app: 'GRO', vaxter: [
    { id: 'a', namn: 'Pion', antal: 1, foto: 'javascript:alert(1)' },
    { id: 'b', namn: '', antal: 1 }
  ], uppgifter: [
    { id: 'u1', titel: 'Stötta', vaxtId: 'a', deadline: '2026-06-01', prioritet: 'maste', status: 'hackad' },
    { id: 'u2', titel: 'Föräldralös', vaxtId: 'saknas', deadline: '2026-06-01', prioritet: 'maste' }
  ] }));
  assert.deepEqual(r, { vaxter: 1, uppgifter: 1 });
  assert.equal(s.vaxt('a').foto, null);
  assert.equal(s.uppgift('u1').status, 'ej');
});

test('arstidPerioder: kommande förekomst när innevarande år visas', () => {
  // 18 nov 2026: hösten pågår, vintern är dec 2026–feb 2027, våren och sommaren 2027
  assert.deepEqual(L.arstidPerioder('host', 2026, '2026-11-18'), [[2026, 8], [2026, 9], [2026, 10]]);
  assert.deepEqual(L.arstidPerioder('vinter', 2026, '2026-11-18'), [[2026, 11], [2027, 0], [2027, 1]]);
  assert.deepEqual(L.arstidPerioder('var', 2026, '2026-11-18'), [[2027, 2], [2027, 3], [2027, 4]]);
  assert.deepEqual(L.arstidPerioder('sommar', 2026, '2026-11-18'), [[2027, 5], [2027, 6], [2027, 7]]);
  // i januari pågår vintern som började i december året innan
  assert.deepEqual(L.arstidPerioder('vinter', 2027, '2027-01-10'), [[2026, 11], [2027, 0], [2027, 1]]);
  // annat år än innevarande: årstiden börjar det året
  assert.deepEqual(L.arstidPerioder('vinter', 2028, '2026-11-18'), [[2028, 11], [2029, 0], [2029, 1]]);
});

test('uppgifterIArstid: samlar årstidens tre månader, även över årsskiftet', () => {
  const lista = [
    { id: 'a', deadline: '2026-12-05' }, { id: 'b', deadline: '2027-01-20' }, { id: 'c', deadline: '2027-02-01' },
    { id: 'd', deadline: '2026-01-15' }, { id: 'e', deadline: '2026-11-30' }, { id: 'f', deadline: '2027-04-02' }
  ];
  assert.deepEqual(L.uppgifterIArstid(lista, 2026, 'vinter', '2026-11-18').map((u) => u.id), ['a', 'b', 'c']);
  assert.deepEqual(L.uppgifterIArstid(lista, 2026, 'host', '2026-11-18').map((u) => u.id), ['e']);
  assert.deepEqual(L.uppgifterIArstid(lista, 2026, 'var', '2026-11-18').map((u) => u.id), ['f']);
  assert.deepEqual(L.uppgifterIArstid(lista, 2026, 'sommar', '2026-11-18'), []);
});
