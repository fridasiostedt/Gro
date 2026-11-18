# AGENTS.md – instruktioner för AI-assistenter i GRO

Den här filen gäller för alla AI-verktyg (Claude, Copilot, Cursor m.fl.) som arbetar i repot.

## Projektet
GRO är en webbapp för trädgårdsägare: växtbibliotek, uppgifter kopplade till växter och ett årshjul.
Ren HTML, CSS och JavaScript utan byggsteg. Data sparas lokalt i webbläsaren (`localStorage`).

- `index.html` – skal, navigering, dialog
- `css/styles.css` – alla stilar; designvariabler överst (från Figma)
- `js/logic.js` – ren logik utan DOM (datum, statistik, validering, återkommande uppgifter)
- `js/store.js` – datalager mot `localStorage`
- `js/wheel.js` – årshjulet (SVG, tangentbord, skärmläsare)
- `js/app.js` – vyer och router
- `tests/` – enhetstester, körs med `npm test` (Node 18+, inga beroenden)
- Säkerhetskopior (`gro-sakerhetskopia-*.json`) innehåller användarens foton och får aldrig läggas i repot

## Design
Färger, typografi, komponenter, ikoner och avstånd kommer från Figma-filen **Trädgårdsplaneraren**.
Ändra **inte** designval på eget initiativ. Om något bryter mot tillgänglighetskraven: fråga
produktägaren först och dokumentera beslutet i `BESLUTSLOGG.md`.

## Tillgänglighet (måste alltid uppfyllas – WCAG 2.2 AA)
- Kontrast minst 4,5:1 för text, 3:1 för stor text och gränssnittsdelar.
- Prioritet och status visas med text eller ikon – aldrig bara färg.
- Synliga etiketter, synlig fokusmarkering, tryckytor minst 44 × 44 px.
- Årshjulet ska fungera med tangentbord och skärmläsare ("Mars, 8 uppgifter, 3 klara").
- Testa med tangentbord (Tab, pilar, Enter, Esc) efter varje ändring i gränssnittet.

## Säkerhet och integritet
- Inga API-nycklar, lösenord, tokens eller personuppgifter i koden eller i git-historiken.
- Dela aldrig hemligheter, riktiga namn eller egna foton med platsdata (EXIF/GPS) med en AI.
- Testdata och exempeldata använder **påhittade namn** (t.ex. Alva, Måns).
- Foton som användaren laddar upp sparas om via canvas så att EXIF/GPS tas bort – ändra inte det.
- Rendera aldrig användartext utan `esc()` (skydd mot XSS).

## Arbetssätt
1. All AI-genererad kod granskas av en människa och testas innan den används.
2. Kör `npm test` och testa i webbläsaren innan commit.
3. Fel som en AI gjort dokumenteras i `BESLUTSLOGG.md` (vad, hur det upptäcktes, åtgärd).
4. Skriv kod, kommentarer och texter i gränssnittet på svenska.
