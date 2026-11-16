# Beslutslogg – GRO

Här dokumenteras beslut, avvikelser från Figma och fel som AI har gjort.
Nyaste överst. Format: datum · beslut/fel · varför · status.

---

## 2026-11-16 · Tillgänglighetsändringar (godkända av produktägaren)

Tre Figma-värden klarade inte WCAG 2.2 AA. Produktägaren godkände ändringarna:

| # | Var | Före | Efter | Kontrast |
|---|-----|------|-------|----------|
| 1 | Prioritetsbricka "Vore bra" (`--prio-vorebra`) | `#71826e` | `#647361` | 3,80:1 → 4,67:1 |
| 2 | Status "Klar"-cirkel (`--status-klar`) | `#8ab27c` | `#4f7a43` | 1,89:1 → 3,93:1 mot kortet, vit bock 2,4:1 → 5,0:1 |
| 3 | Årshjulets segment (`.seg-kant`) | ingen kant | mörk kant `#3f4139` | 7,5:1 mot bakgrunden |

**Att göra:** uppdatera samma värden i Figma så att design och kod stämmer överens.

## 2026-11-16 · Gros blomma
Pionbilden lades till som `assets/img/gro-blomma.png`. Originalet var en JPG där ett rutmönster
("genomskinlig bakgrund") var inbränt i bilden. Bakgrunden togs bort genom att ljusa, grå pixlar som hänger
ihop med bildkanten gjordes genomskinliga. Bilden förminskades till 400 px bredd (2× visningsstorlek).

---

## 2026-11-16 · Första versionen

### Beslut
- **Teknik:** HTML, CSS och JavaScript utan ramverk eller byggsteg. Kan publiceras direkt på GitHub Pages.
- **Lagring:** `localStorage` i webbläsaren. Inloggning och molnsynk "kan vänta" enligt briefen.
  Foton förminskas till max 1000 px och sparas som JPEG. Det räcker för ungefär 30–50 växter med foto.
  Om fler behövs bör foton flyttas till IndexedDB.
- **Integritet:** Uppladdade foton ritas om via canvas. Det tar bort all EXIF-data, inklusive GPS-position.
  Verifierat med ett testfoto som hade GPS-taggar.
- **Startsidan:** Figma visar "Skapa konto" och "Logga in". Konton ingår inte i första versionen, så knapparna
  heter i stället "Kom igång" och "Prova med exempelväxter". Layout och stil är oförändrade.
  Skärmen "Skapa konto" i Figma är inte byggd.
- **Tillagda fält som saknas i Figma men krävs eller behövs:**
  - *Påminnelse 3 dagar innan deadline* (kryssruta, förvald). Krävs av briefen.
  - *Återkommande* blev en lista: Nej / varje vecka / varannan vecka / varje månad / varje år.
    Det täcker både "ja/nej" och "intervall" i ett fält. När en återkommande uppgift bockas av som klar
    skapas nästa tillfälle automatiskt.
  - *Typ* på växter (t.ex. Buske, Träd). Behövs för filterchipsen "Buskar/Träd" som finns i designen.
- **Påminnelser:** Visas i appen på Översikt och som etikett på uppgiftskortet. Webbläsarens aviseringar kan
  slås på, men de fungerar bara när appen är öppen. Riktiga push-notiser kräver en server och service worker.
  Det skjuts upp tills inloggning och synk byggs.
- **Redigera och ta bort uppgifter:** Lagt till. Tryck på uppgiftens titel. Borttagning kräver bekräftelse.
- **Bottennavigation:** Figma-komponentens beskrivning säger "fyra flikar", men designen har tre
  (Översikt, Årshjul, Växter). Tre flikar är byggda.
- **Årshjulet:** Ritas i kod (SVG) i stället för med exporterade segment. Då kan antal och klara
  ("2 av 6") visas i varje segment, som briefen kräver. Varje månad är ett radioalternativ med piltangenter,
  Home och End, och skärmläsaren läser t.ex. "November, 6 uppgifter, 2 klara, nuvarande månad".
- **Typsnitt:** DM Sans, DM Serif Display och Fraunces laddas från Google Fonts. Det skickar besökarens
  IP-adress till Google. Överväg att lägga typsnittsfilerna i repot (`assets/fonts/`).
- **Ikoner:** Figmas ikonfiler gick inte att ladda ner från utvecklingsmiljön. Ikonerna är därför ritade om
  som SVG efter designen (Lucide-stil, ISC-licens). Byt gärna mot exporter från Figma om något skiljer.

### AI-fel (upptäckta och åtgärdade under bygget)
1. **Testkommandot:** `node --test tests/` fungerar inte i Node 22 (mappen tolkades som en fil).
   *Upptäckt:* testkörningen misslyckades trots att alla tester var gröna. *Åtgärd:* `node --test`.
2. **Tillbaka-knappen:** Första versionen räknade navigering via `popstate`. Den händelsen avfyras vid alla
   hash-byten i Chrome, så räkningen hade blivit fel och knappen kunde lämna appen.
   *Upptäckt:* vid kodgranskning. *Åtgärd:* djupet lagras i `history.state`.
3. **Årshjulet:** Etiketten "nov · nu" överlappade det utlyfta segmentet. *Upptäckt:* på skärmdump.
   *Åtgärd:* etiketten för nuvarande månad flyttades 10 px utåt.
4. **Tryckytor:** Uppgiftstitlar och påminnelselänkar var bara 20–22 px höga. *Upptäckt:* med ett automatiskt
   test som mäter alla klickbara element. *Åtgärd:* hela kortets textyta är nu klickbar, och
   påminnelseraderna är minst 44 px höga.
5. **Personnamn i exempeldata:** Figma-exemplen använder förnamn som kan vara riktiga. *Åtgärd:* exempeldatan
   använder påhittade namn (Alva, Måns).
