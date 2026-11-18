# Beslutslogg – GRO

Här dokumenteras beslut, avvikelser från Figma och fel som AI har gjort.
Nyaste överst. Format: datum · beslut/fel · varför · status.

---

## 2026-11-18 · GRO-blomman på Översikt
- Produktägaren önskade Gros blomma även på Översikt, i mindre format: en cirkel på 76 px till höger om
  rubriken. Den finns inte i Figma.
- Bilden är dekorativ där (`aria-hidden`, tom alt). Den beskrivs redan på startsidan, och skärmläsare ska inte
  läsa upp den på varje besök.
- Blommans placering i cirkeln är omräknad till procent (samma mått som i Figma), så att samma stil fungerar
  i båda storlekarna.

## 2026-11-18 · Tillgänglighetsfixar, iPhone 17-ram och visuellt djup

### Åtgärdade fynd från WCAG-granskningen
| Fynd | WCAG | Fil | Åtgärd |
| --- | --- | --- | --- |
| Ingen fokusmarkering i högkontrastläge | 2.4.7 | `css/styles.css` | Genomskinlig `outline` bakom fokusskuggan, plus egna regler för `forced-colors` (även årshjulet, växtkort, fotoväljare, prioritetsval). Testat med emulerat högkontrastläge. |
| Dolda felmeddelanden lästes fortfarande upp | 3.3.1, 4.1.2 | `js/app.js` (`visaFel`) | Texten töms när felet döljs. Testat: rättat fält har ingen beskrivning kvar. |
| Valt foto gav namnet "Valt foto Byt foto" | 1.1.1 | `js/app.js` | Fotot i fotoväljaren har tom alt (dekorativt i etiketten). |
| Fokus och "vald" såg nästan likadana ut i årshjulet | 2.4.7 | `css/styles.css` | Fokus ritar en extra tjock mörk ring utanför segmentet. |

Inte ändrat: att sidan heter "Kalender" men menyn "Årshjul" (designval i Figma).

### iPhone 17-ram
- Appen är högst **402 × 874 px**, samma som iPhone 17 i Figma. Toppfältet och menyn ligger fast, och bara
  innehållet scrollar. Hela sidan scrollar aldrig, inte heller på desktop.
- På desktop visas appen i en telefonram mitt på sidan. Om fönstret är lägre än 874 px krymper ramen
  till fönstrets höjd, och innehållet scrollar som vanligt.
- På mobilen fyller appen skärmen (`100dvh`) och tar hänsyn till notch och hemindikator (`safe-area`).

### Visuellt djup (önskat av produktägaren)
- Kort lyfter vid hovring och trycks ned vid klick. Knappar är upphöjda med en ljuskant upptill, och fält
  ser nedsänkta ut.
- Toppfältet får skugga när innehållet scrollar in under det. Menyn är ett halvgenomskinligt lager med oskärpa.
- Årshjulet och startsidans blomma har skugga, och den valda månaden lyfts ut med egen skugga.
- Nya vyer tonar in mjukt. All rörelse stängs av för den som valt minskad rörelse i systemet.
- Färger, typsnitt och avstånd är oförändrade från Figma. Kontrasterna påverkas inte.

### AI-fel
- **Påminnelseraderna** delades upp i två kolumner efter att tryckytan gjorts 44 px hög (`display: flex`).
  *Upptäckt:* på skärmdump. *Åtgärd:* `display: block` med utfyllnad.

## 2026-11-16 · Tillbaka till startsidan
- Länken **Till startsidan** finns längst ner på Översikt. Produktägaren önskade att kunna komma tillbaka
  till startsidan. Länken saknas i Figma och har stil som en diskret textlänk med 44 px tryckyta.
- När det redan finns data heter startsidans knapp **Fortsätt till översikten**.
- **AI-fel som upptäcktes i samband med detta:** *Prova med exempelväxter* skrev tidigare över användarens
  egna växter utan att fråga. Det märktes inte så länge startsidan bara visades första gången.
  *Upptäckt:* vid granskning av den nya länken. *Åtgärd:* appen ber nu om bekräftelse innan data ersätts.
  Testat i webbläsaren: Avbryt behåller datan.

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
