# Beslutslogg – GRO

Här dokumenteras beslut, avvikelser från Figma och fel som AI har gjort.
Nyaste överst. Format: datum · beslut/fel · varför · status.

---

## 2026-11-18 · Hero överst på Översikt och inställningar
- Produktägaren skickade en referensbild: en illustration på en mjuk form, ett band med en rund avatar och
  ikonknappar. Den är nu byggd överst på Översikt, med Gros blomma i stället för illustrationen. Resten av
  Översikt är oförändrad. Den lilla blomman i sidhuvudet togs bort eftersom heron visar blomman.
- Kvistarna och kronbladen runt blomman är en egen enkel SVG-illustration i appens gröna färg. Inget är
  kopierat från referensbilden.
- **Ikonerna fungerar på riktigt.** Knappar utan funktion är förvirrande och sämre för tillgängligheten.
  - *Dela* använder telefonens delningsmeny, och på datorn kopieras länken i stället.
  - *Påminnelser* visar antalet som en siffra, inte bara en färgprick, och leder till uppgiftslistan.
  - *Inställningar* leder till en ny sida.
- **Avataren** är dekorativ (en trädgårdsmästare), eftersom appen inte har konton än. Den kan bli en
  profilbild när inloggning byggs.
- **Toppfältet** visas inte på Översikt, så heron börjar högst upp. Menyn nedtill räcker för att navigera.
- **Ny sida Inställningar:** spara och läs in säkerhetskopia (JSON), visa startsidan och radera all data.
  Säkerhetskopian behövs eftersom data bara finns i en webbläsare. Inläsningen kontrollerar filen och
  rensar varje post med samma regler som formulären. Foton som inte är riktiga bilddata tas bort, så att
  en manipulerad fil inte kan köra kod. Det finns två nya enhetstester för detta.

## 2026-11-18 · "Kalender" heter nu "Årshjul"
- Produktägaren bestämde att sidans rubrik ska vara "Årshjul" i stället för "Kalender", som i Figma. Nu heter
  rubriken, menyn och sidtiteln samma sak (WCAG 3.2.4 Konsekvent identifiering).
- **Att göra:** byt rubriken i Figma (skärmen *iPhone 17 - 8*).

## 2026-11-18 · Klickbara prioriteringar
- Produktägaren önskade att kunna klicka på varje prioritering. Rutorna under *Mina prioriteringar* är nu länkar
  (hela rutan, 113 × 118 px) till en ny vy, `#/prioritet/<id>`.
- Vyn visar uppgifterna uppdelade i *Försenade*, *Att göra* och *Klara*. Två filterchips växlar mellan den valda
  månaden (samma som på Översikt) och alla månader.
- *Ny uppgift* från vyn har prioriteringen förvald.
- Skärmläsare hör t.ex. "Måste 2 av 2 kvar i november. Visa uppgifterna."
- **AI-fel:** siffran och texten lästes först ihop ("Måste2av 2 kvar"). *Upptäckt:* i testet av länkarnas
  tillgängliga namn. *Åtgärd:* mellanslag mellan delarna.

## 2026-11-18 · GRO-blomman på Översikt
- Produktägaren önskade Gros blomma även på Översikt, i mindre format: en cirkel på 76 px till höger om
  rubriken. Den finns inte i Figma.
- Bilden är dekorativ där (`aria-hidden`, tom alt). Den beskrivs redan på startsidan, och skärmläsare ska inte
  läsa upp den på varje besök.
- Blommans placering i cirkeln är omräknad till procent (samma mått som i Figma), så att samma stil fungerar
  i båda storlekarna.

## 2026-11-18 · Översikt och startsida enligt Figma, tecknad panel
- **Översikt** följer nu skärmen *02 Översikt* i Figma: datumraden och påminnelserutan är borttagna,
  och rubriken "Översikt" kommer direkt under den övre panelen.
- **Övre panelen:** först en tecknad SVG-pion. Efter granskning ville produktägaren ha tillbaka originalet
  av Gros blomma (`gro-blomma.png`, spegelvänd, uppe till vänster som i Figma). Den mjuka gröna
  bakgrunden från illustrationen finns kvar (`assets/img/oversikt-panel.svg`). Allt är dekorativt (`alt=""`).
- **Avvikelse från Figma (funktionalitet):** Figma-skärmen har inga knappar för påminnelser och inställningar.
  Utan dem går det inte att nå säkerhetskopia, radering eller listan över påminnelser. Två runda knappar
  (klocka med antal, kugghjul; 44 × 44 px) ligger därför uppe till höger i panelen. Knappen för att slå på
  aviseringar flyttades från påminnelserutan till Inställningar. Påminnelser syns också som taggar
  ("Deadline imorgon") på uppgiftskorten.
- **Startsidan:** ordmärket GRO har fått skuggan från Figma (0 4px 4px, 25 % svart).
- **Linje under panelen** provades och togs bort igen på produktägarens begäran.
- **Fältet "Sort eller information" är borttaget** ur formuläret för växter (produktägarens begäran). Ett tidigare
  sparat värde finns kvar och visas, men det går inte längre att fylla i.
- **Liten Gro-blomma på varje sida** provades och togs bort igen på produktägarens begäran.
- **Årshjulet visar inte längre streck eller antal** ("–", "2 av 6") i segmenten. Skärmläsare får fortfarande
  antalet via segmentets namn ("November, 6 uppgifter, 2 klara"), och mitten av hjulet och månadskortet
  visar siffrorna för vald månad. Kravet i briefen om att visa t.ex. "3 av 8" uppfylls därför fortfarande.
- **Mina prioriteringar ligger i en egen ruta** på Översikt, med samma stil som månadskortet
  (tertiär bakgrund, primärfärgad kant, rundade hörn 24 px).
- **Årshjulets kanter:** den vita och den svarta kanten runt månaderna ersattes av en mörkgrön kant
  (primärfärg #535d45, 2 px; vald månad 3 px). Senare: tunnare i viloläge (1,25 px), 3–3,5 px vid hovring och val. Den mörkgröna har mer än 3:1 i kontrast mot sidans bakgrund, så
  kravet på gränssnittsdelar uppfylls fortfarande. Fokusmarkeringen är en bred mörkgrön ring (10 px).
- **Den svarta lappen "nov · nu" är borttagen** ur årshjulet. Nuvarande månad har samma etikett som de andra.
  När appen öppnas är den vald, och skärmläsare läser upp den som "nuvarande månad".
- **Inre ring med årstider i årshjulet:** innanför månaderna finns en ring med fyra delar (Vinter, Vår, Sommar,
  Höst), där varje del täcker tre månader. Den har samma färger och mörkgröna kanter som månaderna, och
  årstidens namn står längs bågen.
- **Klickbara årstider:** varje årstid är en knapp (`role="button"`, `aria-pressed`, Tab + Enter/mellanslag). Ett klick
  visar årstidens antal uppgifter och antal klara i hjulets mitt, och ett nytt klick går tillbaka till månaden.
  Skärmläsare läser t.ex. "Höst (sep–nov): 6 uppgifter, 2 klara".
- **Större hjul med månadsnamnen inuti:** månadsnamnen står inne i segmenten i stället för utanför. Därför kunde
  hjulet bli större. Båda ringarna är 46 px breda (månader 128–174 px i radie, årstider 70–116 px) med
  12 px mellanrum.
- **Tydligare hovring i årshjulet:** en månad eller årstid som pekas på växer ut från hjulets mitt och får tjockare
  kant och en skugga. Färgen ändras inte, så textkontrasten är densamma som utan hovring. Vid "minska rörelse" sker
  ändringen utan animation.
- **Kontrastgranskning (WCAG 2.2 AA), 18 nov:** all HTML-text på samtliga 13 vyer mättes automatiskt mot sin
  bakgrund, och ingen låg under 4,5:1 (3:1 för stor text). SVG-text och gränssnittsdelar räknades för hand:
  månads- och årstidsnamn mot segmentfärgerna 4,8–10,9:1, prio- och statusfärger 3,9–13,4:1, fältkanter 6,7:1.
  **Fynd:** de mörkgröna linjerna mellan månaderna (#535d45) hade bara 2,0–2,1:1 mot vinter- och höstfärgerna.
  **Åtgärd:** årshjulet använder en mörkare grön, `--hjul-kant: #323b28`, med 3,4–6,0:1 mot alla årstider och
  8,5:1 mot sidans bakgrund. Den används också för fokusringen i hjulet.
- **Ingen utskjuten månad vid start:** när årshjulet öppnas är nuvarande månad vald men ligger kvar i ringen.
  Den skjuts ut först när du själv väljer en månad (klick, piltangenter eller månadspilarna) eller hovrar.
- **Centrerade pilar:** först flyttades pilarna "<" och ">" 1 px för optisk balans. Produktägaren ville ha dem
  exakt centrerade, men de såg ändå inte centrerade ut. Produktägaren jämförde fyra varianter och valde att flytta
  pilen 1 px mot spetsen (< åt vänster, > åt höger). Det jämnar ut att den öppna sidan ser tyngre ut.
  Samma justering är gjord i Figma. AI-fel: den första optiska justeringen gick åt fel håll (mot den öppna sidan).
- **Månadsnamn i årshjulet** provades med versaler, men produktägaren valde gemener (jan, feb …), 16 px halvfet.
- **Rullistor i GRO:s stil:** den öppna listan har fältfärg, mörkgrön kant, rundade hörn och beige markering i
  stället för systemets blå. Det görs med `appearance: base-select`, som fungerar i nyare Chrome och Edge. Andra
  webbläsare och telefoner visar sin vanliga väljare, och iPhone visar ett rullhjul. Rullistan är fortfarande
  ett vanligt `<select>`, så tangentbord och skärmläsare fungerar som förut.
- **Årstiden i hjulets mitt** ("HÖST", "VINTER" …) är större: 16 px halvfet i stället för 12 px.
- **Ingen understrykning vid hovring eller klick:** uppgiftstitlar och månadsnamnen i årshjulet stryks inte längre
  under. Hovring syns ändå genom att kortet får ljusare bakgrund, och fokus syns genom fokusringen.
- **Statusfält som på en iPhone:** överst i telefonramen visas klockslag (aktuell tid), Dynamic Island och ikoner
  för signal, wifi och batteri. Statusfältet visas bara på datorer (mus/styrplatta), eftersom en riktig telefon
  visar sitt eget. Det är dekorativt och dolt för skärmläsare (`aria-hidden`).
- **Ifyllnadsfält i #FEFAFA:** alla fält hade redan färgen (`--bg-falt`). Antalsväljaren (− 1 +) var ljusbeige och
  har nu samma färg.
- **Välkomnande Översikt:** rubriken är en hälsning som följer tiden på dygnet: God morgon, Hej och välkommen,
  God eftermiddag, God kväll eller God natt. Under den står "Välkommen tillbaka." (eller "Välkommen till GRO." för en
  ny användare) och en mjuk, inspirerande rad för månaden, en för var och en av årets tolv månader. Ordet "Översikt"
  står som liten överrad, så att sidan fortfarande heter likadant som i menyn. Hälsningen innehåller inget namn,
  eftersom appen inte sparar personuppgifter.
- **Böljande panel på Översikt:** den raka kanten mellan bilden och texten är ersatt av en mjuk vågform. Under vågen
  finns en suddig skugga, bakom den en mörkare kulle och längs ovankanten en svag ljuskant, vilket ger djup.
- **Översiktens panel enligt Figma (ram 111:2):** den vita böljande linjen längs vågens ovankant är nu helt vit
  (#FDFBF8, 2 px) och inte halvgenomskinlig. Hela ytan ovanför vågen, även statusfältet och telefonens säkra
  yta, har färgen tertiär #E2DFCF. GRO-loggan har 5,2:1 i kontrast mot den nya färgen.
- **Tecknad header på Översikt, version 3 (pressade blommor, efter ny referensbild):** headern är nu en bukett
  pressade blommor som är knuten nertill. Den har tunna olivfärgade stjälkar, platta och lite genomskinliga kronblad
  utan konturlinjer, en pressad pion i rosa, smörblommor i höstorange, nävor i vinterblått med ådror,
  slöjblomster, knoppar, fröholkar och flikiga blad. Allt är en egen illustration (ingen kopia av bilden).
  Senare ändrat: blommorna står var för sig i stället för att vara knutna i en bukett. Gräsmattan provades i flera
  färger (#535D45 och #E2DFCF) och mot flera bakgrunder (#B7BEC4, #F5E0D5, #F0D8BF), men togs till sist bort.
  Nu är bakgrunden tertiär #E2DFCF och stjälkarna är kortare (headern är 208 px hög, med luft ovanför blommorna så att de inte trängs med klockan och kugghjulet). Stjälkarna går ända ner, och headerns mjukt böljande nederkant fungerar som
  avskiljare mot innehållet under. Antalet blommor är minskat (en smörblomma, en näva och en slöjblomstertuva
  borttagna) för ett luftigare intryck, och några stjälkar har ett enstaka litet blad.
  Pionen ritades sedan om från sidan efter ännu en referensbild: en sluten, skålformad blomma med
  kronbladslinjer och breda blad med ådror, i samma färger som Gros blomma på startsidan (ljusrosa kronblad,
  mjukt rosa linjer, salviagröna blad). Pionens tre nedersta blad är borttagna, och två smörblommor, två nävor och en
  fröholk har fått små blad längs stjälken. Den tidigare versionen sågs ovanifrån: ljusrosa krusiga kronblad med rosa strimmor,
  en guldgul ståndarkrans, gröna pistiller med magentaspetsar och treflikiga salviagröna blad på rödaktiga skaft.
- **GRO-loggan på Översikt är borttagen igen** (produktägarens begäran). Blommornas stjälkar ritas nu som
  avsmalnande, svajande former med små klängrankor, så att de ser mer levande ut.
- **Tecknad header på Översikt, version 2 (närmare referensbilden):** luftigare, med tunna linjer (1,1 px), ljusa
  nästan enfärgade fyllningar, en mjuk kulle bakom blommorna och svävande småblad. Den vita linjen och de
  bakre kullarna är borttagna, och ytan ovanför är fortfarande tertiär #E2DFCF.
- **Tecknad header på Översikt, version 1 (efter referensbild från produktägaren):** fotot av pionen är ersatt av en egen
  illustration i tunn linjestil. Den visar pion med knopp, prästkrage, tulpan, maskrosbollar, en kvist med
  parvisa blad, gräs, en fjäril och svävande kronblad i GRO:s färger (linjer i primärfärg, pion i rosa toner,
  gul mitt). Blommorna växer i vågen och skärs av vid dess nederkant. Fotot av Gros blomma finns kvar på startsidan.
- **Telefonramen syns från 480 px** (tidigare 700 px), så att appen visas som en iPhone även i smala sidopaneler.
  Riktiga telefoner är smalare än 480 px och visar appen utan ram.
- **Mer visuellt djup:** kort och rutor har fått ett svagt ljus uppifrån (vit gradient) och skuggor i tre lager.
  Den nedre menyn har en mjukare skugga. Kontrastgranskningen kördes igen efteråt, och all text klarar fortfarande
  WCAG AA, eftersom ljuset bara gör bakgrunden ljusare.
- **Förklarande text** under rubriken, kortad på produktägarens begäran: Årshjul – "Se vad som väntar kommande månader.
  Tryck på en månad eller årstid." Texten på Mina växter togs bort igen.
- **GRO-logga på Översikt:** "GRO" med den lilla växtsymbolen står uppe till vänster i panelen (DM Serif Display,
  primärfärg, 5:1 mot bakgrunden). Blomman flyttades ner lite för att ge plats.
- **Exempeldata med bilder:** exempelväxterna har egna tecknade illustrationer (`assets/img/exempel/*.svg`) i
  stället för foton, så inga riktiga foton eller platsdata ingår. Två nya exempelväxter (Tulpaner, Tomater) och
  fem nya uppgifter har lagts till, spridda över året så att årshjulet och prioriteringarna får innehåll.
  Inläsning av säkerhetskopior godkänner, utöver `data:image`, bara exakt sökvägen till de här exempelbilderna.
  Allt annat (t.ex. `javascript:`) rensas fortfarande bort, och testerna kontrollerar det.
- **Ifyllnadsfälten är helt släta:** den inre skuggan som gjorde #FEFAFA gråare är borttagen. Mätning i webbläsaren
  visar att alla fält på alla sidor har bakgrunden #FEFAFA.
- **Rubrikyta på Årshjul:** rubriken och introtexten ligger på en egen yta med mjukt böljande nederkant. Ytan
  provades först i mörkgrönt #535D45 och har nu tertiär #E2DFCF, liksom statusfältet och tillbaka-raden.
  Rubriken är #535D45 och introtexten #3F4139.
- **Rubriker i #535D45:** sidrubriker (h1), sektionsrubriker (h2) och månadsnamnet i månadskortet har nu primärfärgen.
  Kontrasten är minst 5:1 mot alla bakgrunder, och den automatiska kontrastgranskningen av alla vyer godkände
  ändringen. Namnen på uppgifter och växter i korten är kvar i mörk textfärg. Rubriken på den gröna ytan på
  Årshjul är fortfarande ljus.
- **32 px mellan delelement** (först provat med 16 px): alla block har 32 px mellanrum: sektioner, kort i listor, växtkort, formulärfält,
  knappar och dialogknappar, samt avståndet från headerns böljande nederkant (lägsta punkten) till innehållet
  under på Översikt och Årshjul. Detta är uppmätt i webbläsaren. Introtexten under en rubrik hör till rubriken
  (8 px). Små avstånd inne i komponenter (ikon–text, etikett–fält, taggar) är oförändrade.
  Undantag på produktägarens begäran: rubrik → uppgiftskort och mellan uppgiftskort 12 px (även i grupperna på
  Årshjul och Prioritering). Knappen "Ny uppgift" och grupperna har kvar 32 px.
- **Rullningslisten är dold** (`scrollbar-width: none`). Innehållet scrollar fortfarande med mus, pekskärm
  och tangentbord.

## 2026-11-18 · Tillgänglighetsfixar, iPhone 17-ram och visuellt djup

### Åtgärdade fynd från WCAG-granskningen
| Fynd | WCAG | Fil | Åtgärd |
| --- | --- | --- | --- |
| Ingen fokusmarkering i högkontrastläge | 2.4.7 | `css/styles.css` | Genomskinlig `outline` bakom fokusskuggan, plus egna regler för `forced-colors` (även årshjulet, växtkort, fotoväljare, prioritetsval). Testat med emulerat högkontrastläge. |
| Dolda felmeddelanden lästes fortfarande upp | 3.3.1, 4.1.2 | `js/app.js` (`visaFel`) | Texten töms när felet döljs. Testat: rättat fält har ingen beskrivning kvar. |
| Valt foto gav namnet "Valt foto Byt foto" | 1.1.1 | `js/app.js` | Fotot i fotoväljaren har tom alt (dekorativt i etiketten). |
| Fokus och "vald" såg nästan likadana ut i årshjulet | 2.4.7 | `css/styles.css` | Fokus ritar en extra tjock mörk ring utanför segmentet. |

Sidan som hette "Kalender" heter nu "Årshjul", samma som menyn och sidtiteln (se nedan).

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
0. **Element trycktes ihop (18 nov):** innehållsytan är en flexkolumn. När sidan blev längre än skärmen krympte
   elementen i stället för att scrolla, och filterknapparna på Mina växter klipptes av. *Upptäckt:* på skärmdump
   efter att introtexten lagts till. *Åtgärd:* `.huvud > * { flex-shrink: 0 }`.
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
