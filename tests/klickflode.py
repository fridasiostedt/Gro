"""
GRO – klicktest som går igenom hela appen med mus och formulär.
Körs mot den vanliga appen och visningsversionen:
  python3 tests/klickflode.py                         (vanliga, http://localhost:8765/)
  GRO_URL="http://localhost:8765/?visning" python3 tests/klickflode.py
  MOBIL=1 python3 tests/klickflode.py                 (telefonstorlek med pekskärm)
Kräver Playwright och Chrome. Fotot som laddas upp skapas i minnet (ingen riktig bild, ingen platsdata).
"""
import asyncio, os, sys, json, tempfile, base64
from playwright.async_api import async_playwright
BAS = os.environ.get('GRO_URL', 'http://localhost:8765/')
VISNING = '?visning' in BAS or BAS.split('?')[0].rstrip('/').split('/')[-1].startswith(('visning', 'gro-visning'))
NYCKEL = 'gro:visning' if VISNING else 'gro:v1'
OK, FEL = [], []
def check(v, t): (OK if v else FEL).append(t); print(('✓ ' if v else '✗ ') + t)
# Liten påhittad JPEG-bild (enfärgad), skapas utan att röra någon riktig fil
FOTO = base64.b64decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAQABABAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAA/AKp//9k=')

def url(h): return BAS.split('#')[0] + '#/' + h

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        if os.environ.get('MOBIL'):  # telefonstorlek med pekskärm, utan telefonram
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=3, accept_downloads=True)
        else:
            ctx = await b.new_context(viewport={'width': 560, 'height': 980}, accept_downloads=True)
        pg = await ctx.new_page()
        jsfel = []; pg.on('pageerror', lambda e: jsfel.append(str(e)))
        data = lambda: pg.evaluate(f"JSON.parse(localStorage.getItem('{NYCKEL}')||'null')")
        async def hash(): return await pg.evaluate('location.hash')
        async def vanta(ms=350): await pg.wait_for_timeout(ms)

        # ---- Start ----
        await pg.goto(BAS); await pg.evaluate('localStorage.clear()'); await pg.reload(); await vanta(700)
        check(await pg.locator('[data-atgard=exempel]').count() == 1, 'Startsidan visas med knappen Prova med exempelväxter')
        await pg.click('[data-atgard=exempel]'); await vanta(3800)
        check((await hash()) == '#/oversikt', 'Exempelknappen öppnar Översikt')
        d = await data(); nv, nu = len(d['vaxter']), len(d['uppgifter'])
        check(nv == (14 if VISNING else 6), f'Rätt antal exempelväxter ({nv})')
        if VISNING: check(await pg.evaluate("localStorage.getItem('gro:v1')") is None, 'Visningen rör inte den vanliga appens data')

        # ---- Översikt ----
        m1 = await pg.locator('.manadskort .manad-namn, .manadskort h2').first.inner_text()
        await pg.click('[data-manad-steg="1"][data-lage=ov]'); await vanta()
        m2 = await pg.locator('.manadskort .manad-namn, .manadskort h2').first.inner_text()
        await pg.click('[data-manad-steg="-1"][data-lage=ov]'); await vanta()
        check(m1 != m2 and m1 == await pg.locator('.manadskort .manad-namn, .manadskort h2').first.inner_text(), f'Månadspilarna på Översikt fungerar ({m1} → {m2} → tillbaka)')
        knapp = pg.locator('[data-status-for]').first; uid = await knapp.get_attribute('data-status-for')
        fore = next(u['status'] for u in (await data())['uppgifter'] if u['id'] == uid)
        await knapp.click(); await vanta()
        efter = next(u['status'] for u in (await data())['uppgifter'] if u['id'] == uid)
        check(fore != efter, f'Statusknappen byter status ({fore} → {efter})')
        await pg.click('a.hero-knapp[href="#/uppgifter"]'); await vanta()
        check((await hash()) == '#/uppgifter', 'Klockan öppnar uppgiftslistan')
        await pg.click('[data-uppgiftfilter=klara]'); await vanta()
        check('vald' in (await pg.get_attribute('[data-uppgiftfilter=klara]', 'class')), 'Filtret Klara går att välja')
        await pg.click('#tillbaka'); await vanta()
        check((await hash()) == '#/oversikt', 'Tillbaka-knappen går tillbaka')
        await pg.click('a.hero-knapp[href="#/installningar"]'); await vanta()
        check((await hash()) == '#/installningar', 'Kugghjulet öppnar Inställningar')
        await pg.goto(url('oversikt')); await vanta()
        await pg.click('a.raknare >> nth=0'); await vanta()
        check((await hash()).startswith('#/prioritet/maste'), 'Prioriteringsräknaren öppnar Måste-listan')
        await pg.click('a.valchip:not(.vald)'); await vanta()
        check('alla' in (await hash()).lower() or 'manad=' not in (await hash()), 'Valet Alla månader fungerar')

        # ---- Ny uppgift ----
        await pg.goto(url('oversikt')); await vanta()
        await pg.click('a[href="#/uppgift/ny"]'); await vanta()
        await pg.click('button[type=submit]'); await vanta()
        check(await pg.locator('[aria-invalid=true]').count() >= 1, 'Tomt formulär för Ny uppgift visar felmeddelanden')
        await pg.fill('#f-titel', 'Testuppgift klick')
        await pg.select_option('#f-vaxtId', index=2)
        await pg.fill('#f-start', '2026-12-01'); await pg.fill('#f-deadline', '2027-06-20')
        await pg.check('input[name=paminnelse]') if await pg.locator('input[name=paminnelse]').count() else None
        await pg.select_option('#f-aterkommande', index=1)
        await pg.click('label:has(input[name=prioritet][value=maste])')
        await pg.fill('#f-ansvarig', 'Alva')
        await pg.click('button[type=submit]'); await vanta(600)
        ny = [u for u in (await data())['uppgifter'] if u['titel'] == 'Testuppgift klick']
        check(len(ny) == 1 and ny[0]['deadline'] == '2027-06-20' and ny[0]['prioritet'] == 'maste' and ny[0]['ansvarig'] == 'Alva' and ny[0]['aterkommande'] != 'nej',
              'Ny uppgift sparas med alla fält (titel, växt, datum, återkommande, prioritet, ansvarig)')
        # Redigera och ta bort
        await pg.goto(url('uppgift/' + ny[0]['id'])); await vanta()
        await pg.fill('#f-titel', 'Testuppgift ändrad'); await pg.click('button[type=submit]'); await vanta(500)
        check(any(u['titel'] == 'Testuppgift ändrad' for u in (await data())['uppgifter']), 'Redigera uppgift sparar ändringen')
        await pg.goto(url('uppgift/' + ny[0]['id'])); await vanta()
        await pg.click('[data-atgard=ta-bort-uppgift]'); await vanta(200)
        await pg.click('#dialog-avbryt'); await vanta(200)
        check(any(u['id'] == ny[0]['id'] for u in (await data())['uppgifter']), 'Avbryt i dialogen tar inte bort uppgiften')
        await pg.click('[data-atgard=ta-bort-uppgift]'); await vanta(200); await pg.click('#dialog-ok'); await vanta(500)
        check(not any(u['id'] == ny[0]['id'] for u in (await data())['uppgifter']), 'Ta bort uppgift fungerar efter bekräftelse')

        # ---- Växter ----
        await pg.click('a[data-flik=vaxter]'); await vanta()
        check((await hash()) == '#/vaxter', 'Menyn Växter fungerar')
        await pg.click('[data-filter=Buske]'); await vanta()
        n_buske = await pg.locator('.vaxtkort').count()
        await pg.click('[data-filter=alla]'); await vanta()
        check(0 < n_buske < await pg.locator('.vaxtkort').count(), f'Typfiltret fungerar ({n_buske} buskar)')
        await pg.click('.vaxtkort >> nth=0'); await vanta()
        check((await hash()).startswith('#/vaxt/'), 'Växtkortet öppnar växtens sida')
        await pg.click('a:has-text("Skapa ny uppgift")'); await vanta()
        check(await pg.evaluate("document.getElementById('f-vaxtId').value") != '', 'Skapa ny uppgift från en växt väljer växten automatiskt')
        await pg.go_back(); await vanta()
        await pg.click('a:has-text("Redigera växt")'); await vanta()
        a0 = int(await pg.input_value('#f-antal'))
        await pg.click('[data-steg="1"]'); await pg.click('[data-steg="1"]'); await pg.click('[data-steg="-1"]')
        check(int(await pg.input_value('#f-antal')) == a0 + 1, 'Plus- och minusknapparna för antal fungerar')
        await pg.fill('#f-plats', 'Testplats'); await pg.click('button[type=submit]'); await vanta(500)
        check(any(v['plats'] == 'Testplats' for v in (await data())['vaxter']), 'Redigera växt sparar')

        # Ny växt med foto
        await pg.goto(url('vaxt/ny')); await vanta()
        await pg.click('button[type=submit]'); await vanta()
        check(await pg.locator('[aria-invalid=true]').count() >= 1, 'Tom Ny växt visar felmeddelande')
        await pg.set_input_files('#f-foto', files=[{'name': 'test.jpg', 'mimeType': 'image/jpeg', 'buffer': FOTO}]); await vanta(900)
        check(await pg.locator('.fotovaljare-bild').count() == 1, 'Fotot visas efter uppladdning')
        await pg.click('[data-atgard=ta-bort-foto]'); await vanta()
        check(await pg.locator('.fotovaljare-bild').count() == 0, 'Ta bort foto fungerar')
        await pg.set_input_files('#f-foto', files=[{'name': 'test.jpg', 'mimeType': 'image/jpeg', 'buffer': FOTO}]); await vanta(900)
        await pg.fill('#f-namn', 'Testväxt'); await pg.fill('#f-typ', 'Ört'); await pg.fill('#f-plats', 'Balkongen'); await pg.fill('#f-skotsel', 'Vattna ofta.')
        await pg.click('button[type=submit]'); await vanta(700)
        tv = [v for v in (await data())['vaxter'] if v['namn'] == 'Testväxt']
        check(len(tv) == 1 and tv[0]['foto'] and tv[0]['foto'].startswith('data:image/') and tv[0]['typ'] == 'Ört' and tv[0]['skotsel'] == 'Vattna ofta.', 'Ny växt sparas med foto och alla fält')
        await pg.goto(url('vaxt/' + tv[0]['id'])); await vanta()
        await pg.click('[data-atgard=ta-bort-vaxt]'); await vanta(200); await pg.click('#dialog-ok'); await vanta(500)
        check(not any(v['id'] == tv[0]['id'] for v in (await data())['vaxter']), 'Ta bort växt fungerar')

        # ---- Årshjul ----
        await pg.click('a[data-flik=arshjul]'); await vanta()
        await pg.click("[data-manad='5'] .seg-form"); await vanta()
        check('juni' in (await pg.locator('.manad-namn').inner_text()).lower(), 'Klick på juni i hjulet väljer juni')
        await pg.click('[data-manad-steg="1"][data-lage=kal]'); await vanta()
        check('juli' in (await pg.locator('.manad-namn').inner_text()).lower(), 'Pilen i månadskortet går till nästa månad')
        await pg.click("[data-arstid='vinter'] .seg-form"); await vanta()
        check('vintern' in (await pg.locator('#manadens').inner_text()).lower(), 'Klick på Vinter visar vinterns uppgifter')
        await pg.click("[data-arstid='vinter'] .seg-form"); await vanta()
        check('vintern' not in (await pg.locator('#manadens').inner_text()).lower(), 'Nytt klick på Vinter avmarkerar årstiden')

        # ---- Inställningar ----
        await pg.goto(url('installningar')); await vanta()
        async with pg.expect_download() as dl: await pg.click('[data-atgard=exportera]')
        fil = await (await dl.value).path(); kopia = open(fil).read()
        check(json.loads(kopia)['app'] == 'GRO', 'Spara säkerhetskopia laddar ner en fil')
        await pg.set_input_files('#f-import', files=[{'name': 'k.json', 'mimeType': 'application/json', 'buffer': kopia.encode()}]); await vanta(300)
        if await pg.locator('dialog[open]').count(): await pg.click('#dialog-ok'); await vanta(500)
        check(len((await data())['vaxter']) == len(json.loads(kopia)['vaxter']), 'Läs in säkerhetskopia fungerar')
        await pg.click('a[href="#/start"]'); await vanta()
        check(await pg.locator('[data-atgard=kom-igang]').count() == 1, 'Visa startsidan fungerar')
        await pg.click('[data-atgard=kom-igang]'); await vanta(3800)
        check((await hash()) == '#/oversikt', 'Fortsätt till översikten fungerar')
        await pg.goto(url('installningar')); await vanta()
        await pg.click('[data-atgard=radera-allt]'); await vanta(200); await pg.click('#dialog-ok'); await vanta(600)
        check(len((await data())['vaxter']) == 0, 'Radera all data fungerar')

        check(not jsfel, 'Inga JavaScript-fel' + ('' if not jsfel else ': ' + '; '.join(jsfel[:3])))
        await b.close()
    print(f'\n{len(OK)} godkända, {len(FEL)} fel')
    sys.exit(1 if FEL else 0)
asyncio.run(main())
