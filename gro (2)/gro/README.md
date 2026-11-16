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

## Tillgänglighet
Målet är WCAG 2.2 AA. Prioritet och status visas med ikon och text, inte bara färg. Alla fält har synliga
etiketter, fokus syns alltid och tryckytorna är minst 44 × 44 px. Årshjulet fungerar med piltangenter och
skärmläsare. Tre Figma-färger har justerats för kontrast, se `BESLUTSLOGG.md`.

## Kör lokalt
Appen behöver inget byggsteg, men måste köras via en webbserver:

```bash
python3 -m http.server 8000
# öppna http://localhost:8000
```

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
