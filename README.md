# GRO – Grönska. Rutin. Omtanke.

GRO hjälper trädgårdsägare att hålla koll på sina växter, vad som ska göras och när.
Målet är mindre att komma ihåg och mer tid att njuta av trädgården.

## Funktioner
- **Växtbibliotek.** Lägg till, redigera och ta bort växter med foto, namn, sort/info, typ, antal,
  plats i trädgården och skötselanteckning. Växterna går att filtrera på typ.
- **Uppgifter kopplade till växter.** Varje uppgift har vad som ska göras, växt, startdatum, deadline,
  påminnelse tre dagar innan, återkommande (nej / vecka / varannan vecka / månad / år), prioritet
  (Måste / Vore bra / Bonus) och ansvarig. Statusen bockas av som *påbörjad* och sedan *klar*.
- **Årshjul.** Årets tolv månader med antal uppgifter och hur många som är klara ("2 av 6").
  Välj en månad för att se dess uppgifter grupperade efter prioritet.
- **Översikt.** Påminnelser, månadens förlopp, de närmaste uppgifterna och fördelningen per prioritet.

All data sparas **lokalt i webbläsaren**. Ingenting skickas till någon server.

## Skärmstorlek
Appen är byggd för iPhone 17 och är högst **402 × 874 px**. Toppfältet och menyn ligger fast, och
innehållet scrollar inuti appen. På en dator visas appen i en telefonram mitt på skärmen.

## Tillgänglighet
Målet är WCAG 2.2 AA. Prioritet och status visas med ikon och text, inte bara färg. Alla fält har synliga
etiketter, fokus syns alltid och tryckytorna är minst 44 × 44 px. Årshjulet fungerar med piltangenter och
skärmläsare. Tre Figma-färger har justerats för kontrast, se `BESLUTSLOGG.md`.

## Starta appen

### På webben (enklast)
Om appen är publicerad med GitHub Pages (se nedan) öppnar du bara adressen, t.ex.
`https://<ditt-användarnamn>.github.io/gro/`, i mobilens webbläsare.
Lägg den gärna på hemskärmen, så öppnas den som en vanlig app:
- **iPhone (Safari):** tryck på dela-ikonen och välj **Lägg till på hemskärmen**.
- **Android (Chrome):** tryck på menyn **⋮** och välj **Lägg till på startskärmen**.

### På din egen dator
Appen behöver inget byggsteg, men den måste köras via en enkel webbserver. Det fungerar inte att
dubbelklicka på `index.html`.

1. Ladda ner koden: klicka på **Code → Download ZIP** på GitHub och packa upp filen,
   eller kör `git clone https://github.com/<ditt-användarnamn>/gro.git`.
2. Öppna en terminal i mappen och starta en server. Välj ett av alternativen:
   ```bash
   python3 -m http.server 8000      # Python (finns förinstallerat på Mac)
   npx serve .                      # eller Node.js
   ```
3. Öppna **http://localhost:8000** i webbläsaren.

Du kan också använda tillägget *Live Server* i VS Code: högerklicka på `index.html` och välj **Open with Live Server**.

## Så använder du GRO

### 1. Kom igång
Första gången visas startsidan med Gros blomma. Där kan du välja mellan två knappar:
- **Kom igång.** Du börjar med en tom trädgård.
- **Prova med exempelväxter.** Appen fylls med påhittade växter och uppgifter, så att du kan se hur den
  fungerar. Exempeldatan kan tas bort växt för växt.

Längst ner finns menyn med tre flikar: **Översikt**, **Årshjul** och **Växter**.

För att komma tillbaka till startsidan trycker du på **Till startsidan** längst ner på Översikt.
Där står det då **Fortsätt till översikten**. Om du trycker på *Prova med exempelväxter* när du redan har
egna växter frågar appen först, eftersom dina växter då ersätts.

### 2. Lägg till en växt
1. Gå till **Växter** och tryck på **Lägg till växt +**.
2. Tryck på fotorutan för att ta ett foto eller välja en bild. Platsinformation (GPS) tas bort automatiskt.
3. Fyll i **Namn**. Det är det enda obligatoriska fältet. Fyll gärna också i:
   - **Sort eller information**
   - **Typ** (t.ex. Buske eller Träd)
   - **Antal**
   - **Plats i trädgården**
   - **Skötselanteckning**
4. Tryck på **Spara växt**.

Under Växter visas alla växter som kort. Filterknapparna (Alla, Buskar, Träd …) visar en typ i taget.
Tryck på ett kort för att se växten, dess skötselanteckning och dess uppgifter. Där finns också
**Redigera växt** och **Ta bort växt**. Tar du bort en växt försvinner även dess uppgifter.
Appen frågar alltid först.

### 3. Lägg till en uppgift
1. Öppna en växt och tryck på **Skapa ny uppgift +**, eller tryck på **Ny uppgift +** på Översikt.
2. Fyll i:
   - **Vad ska göras?** (t.ex. "Beskär rosorna")
   - **Växt**
   - **Startdatum** och **Deadline**
   - **Påminn mig 3 dagar innan deadline** (förvald)
   - **Återkommande?** Välj Nej eller hur ofta uppgiften upprepas: varje vecka, varannan vecka,
     varje månad eller varje år.
   - **Prioritet:** Måste, Vore bra eller Bonus. "Måste" visas överst.
   - **Ansvarig** (valfritt)
3. Tryck på **Lägg till uppgift**.

### 4. Bocka av uppgifter
Tryck på cirkeln till vänster på ett uppgiftskort för att ändra status:

| Tryck | Status | Visas som |
|-------|--------|-----------|
| 1 | Påbörjad | Cirkel med klocka |
| 2 | Klar | Grön cirkel med bock, överstruken titel |
| 3 | Ej påbörjad | Tom cirkel (om du ångrar dig) |

När en **återkommande** uppgift blir klar skapas nästa tillfälle automatiskt.
Tryck på uppgiftens titel för att redigera eller ta bort den.

### 5. Översikt
- **Påminnelse.** En gul ruta visar uppgifter som har deadline inom tre dagar eller som är försenade.
  Uppgiftskorten får också en etikett, t.ex. "Deadline imorgon".
  Tryck på **Få aviseringar på telefonen** för att även få notiser medan appen är öppen.
- **Månadskortet** visar hur många uppgifter som är kvar och klara den här månaden. Med pilarna
  bläddrar du mellan månaderna.
- **Mina uppgifter** visar de närmaste uppgifterna. Tryck på **Visa alla** för hela listan, med
  försenade, kommande och klara uppgifter.
- **Mina prioriteringar** visar hur många uppgifter som är kvar per prioritet under den valda månaden.
  Tryck på en ruta (Måste, Vore bra eller Bonus) för att se alla uppgifter i den prioriteringen, uppdelade
  i försenade, att göra och klara. Du kan välja mellan den valda månaden och alla månader.

### 6. Årshjulet
Årshjulet visar årets tolv månader i säsongsfärger: vinter, vår, sommar och höst.
- Varje månad visar antal klara av totalt, t.ex. **2 av 6**. Nuvarande månad är märkt **nu**.
- Tryck på en månad, eller använd pilarna på månadskortet, för att se månadens uppgifter.
  De visas grupperade efter prioritet: Måste, Vore bra, Bonus.
- **Med tangentbord:** gå till hjulet med Tab och byt månad med piltangenterna. **Home** går till
  januari och **End** till december.
- **Med skärmläsare** läses varje månad upp, t.ex. "Mars, 8 uppgifter, 3 klara".

### Var sparas mina uppgifter?
Allt sparas **bara i webbläsaren på enheten** du använder. Det finns inget konto och ingen molnsynk än.
Det innebär att:
- data inte följer med mellan telefon och dator
- data försvinner om du rensar webbläsarens webbplatsdata för sidan.

## Tester
Kräver Node 18 eller senare. Inga beroenden.

```bash
npm test
```

## Publicera på GitHub Pages
1. Skapa ett nytt repo på GitHub, t.ex. `gro`. Lägg inte till README eller .gitignore, de finns redan.
2. Kör i projektmappen:
   ```bash
   git init
   git add .
   git commit -m "GRO: första versionen"
   git branch -M main
   git remote add origin https://github.com/<ditt-användarnamn>/gro.git
   git push -u origin main
   ```
3. På GitHub: gå till **Settings → Pages**. Under *Build and deployment* väljer du
   **Deploy from a branch**, branch **main** och mapp **/ (root)**. Spara.
4. Efter någon minut finns appen på `https://<ditt-användarnamn>.github.io/gro/`.

Innan första push: kör `git status` för att se att inga privata filer följer med.

## Säkerhet
- Repot innehåller inga nycklar, lösenord eller personuppgifter. `.gitignore` stoppar vanliga hemlighetsfiler.
- Exempeldatan använder påhittade namn.
- Foton som läggs till i appen förminskas och sparas om. Då försvinner EXIF-data som GPS-position.
- Regler för AI-assistenter finns i `AGENTS.md`. Beslut och AI-fel loggas i `BESLUTSLOGG.md`.

## Struktur
```
index.html          skal, navigering och dialog
css/styles.css      stilar och designvariabler från Figma
js/logic.js         ren logik (datum, statistik, validering, återkommande)
js/store.js         datalager (localStorage)
js/wheel.js         årshjulet
js/icons.js         ikoner
js/app.js           vyer och router
tests/              enhetstester
assets/             favicon och bilder
```

## Design
Designen kommer från Figma-filen *Trädgårdsplaneraren*. Ikonerna bygger delvis på
[Lucide](https://lucide.dev) (ISC-licens).
