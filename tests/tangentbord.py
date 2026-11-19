"""Tangentbordstest för GRO: går igenom hela flödet med bara Tab, Enter, mellanslag, pilar och Esc.

Kräver Python 3 och Playwright (pip install playwright && playwright install chromium).
Starta appen först (python3 -m http.server 8765) och kör sedan: python3 tests/tangentbord.py
Annan adress: GRO_URL=http://localhost:8000/ python3 tests/tangentbord.py
"""
import asyncio, datetime, os
BAS = os.environ.get('GRO_URL', 'http://localhost:8765/')
from playwright.async_api import async_playwright
OK=[];FEL=[]
def check(villkor, text):
    (OK if villkor else FEL).append(text); print(("✓ " if villkor else "✗ ")+text)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        pg = await (await b.new_context(viewport={"width":560,"height":980})).new_page()
        jsfel=[]; pg.on("pageerror", lambda e: jsfel.append(str(e)))
        aktiv = lambda: pg.evaluate("(()=>{const e=document.activeElement;const l=e.labels&&e.labels.length?[...e.labels].map(x=>x.textContent).join(' '):'';return (e.getAttribute('aria-label')||l||e.innerText||e.value||e.tagName||'').trim().replace(/\\s+/g,' ').slice(0,50)})()")
        async def tabba_till(match, max_=60, shift=False):
            for i in range(max_):
                await pg.keyboard.press("Shift+Tab" if shift else "Tab"); await pg.wait_for_timeout(30)
                t=await aktiv()
                if match.lower() in t.lower(): return True
            return False
        await pg.goto(BAS+"#/start"); await pg.wait_for_timeout(300)
        await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(600)
        # 1 Hoppa-länk
        await pg.keyboard.press("Tab"); check("hoppa" in (await aktiv()).lower(), "Första Tab ger länken 'Hoppa till innehållet'")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
        check(await pg.evaluate("!!document.activeElement.closest('#huvud')") and pg.url.endswith('#/start'), "Enter på hopplänken flyttar fokus till innehållet och stannar på sidan")
        # 2 Kom igång
        check(await tabba_till("Kom igång"), "Tab når 'Kom igång'")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(500)
        check(pg.url.endswith("#/oversikt"), "Enter på 'Kom igång' öppnar Översikt")
        check(await pg.evaluate("document.activeElement.tagName==='H1'"), "Fokus flyttas till sidrubriken efter sidbyte")
        # 3 Ny växt via menyn
        check(await tabba_till("Växter"), "Tab når 'Växter' i menyn")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(500)
        check(pg.url.endswith("#/vaxter"), "Enter öppnar Mina växter")
        check(await tabba_till("växt") , "Tab når knappen för ny växt")
        t=await aktiv(); 
        if "ny" not in t.lower() and "lägg" not in t.lower(): await tabba_till("Lägg till")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(500)
        check("#/vaxt/ny" in pg.url, "Formuläret Ny växt öppnas")
        check(await tabba_till("Namn"), "Tab når fältet Namn")
        await pg.keyboard.type("Testpion"); 
        check(await tabba_till("Spara") or await tabba_till("Lägg till"), "Tab når spara-knappen")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(700)
        check("#/vaxt/" in pg.url and "ny" not in pg.url, "Växten sparas och växtens sida öppnas")
        # 4 Ny uppgift från växten
        check(await tabba_till("Skapa ny uppgift"), "Tab når 'Skapa ny uppgift'")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(600)
        check(await tabba_till("Vad ska göras"), "Tab når titelfältet")
        await pg.keyboard.type("Stötta pionen")
        check(await tabba_till("Lägg till uppgift"), "Tab når 'Lägg till uppgift'")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(500)
        info=await pg.evaluate("(()=>{const e=document.activeElement;return {id:e.id, ogiltig:e.getAttribute('aria-invalid'), beskr:(e.getAttribute('aria-describedby')||'').split(' ').map(i=>document.getElementById(i)?.textContent||'').join(' ').trim()}})()")
        check(info['ogiltig']=='true' and 'deadline' in info['beskr'].lower(), f"Utan deadline: fokus flyttas till fältet med fel och felet läses upp ({info['beskr'][:40]})")
        d=(datetime.date.today()+datetime.timedelta(days=10))
        await pg.keyboard.type(d.strftime('%m%d%Y')); await pg.wait_for_timeout(100)
        check(await tabba_till("Lägg till uppgift"), "Tab når 'Lägg till uppgift' igen")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(500)
        check(await pg.evaluate("document.activeElement.type==='radio' && document.activeElement.name==='prioritet'"), "Utan prioritet: fokus flyttas till prioritetsvalet")
        await pg.keyboard.press("ArrowDown"); await pg.wait_for_timeout(100)
        check(await pg.evaluate("document.querySelector('input[name=prioritet]:checked')?.value")=='vorebra', "Piltangent väljer prioritet (Vore bra)")
        check(await tabba_till("Lägg till uppgift"), "Tab når 'Lägg till uppgift' en tredje gång")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(700)
        n=await pg.evaluate("JSON.parse(localStorage.getItem('gro:v1')).uppgifter.filter(u=>u.titel==='Stötta pionen').length")
        check(n==1, "Uppgiften sparas")
        # 5 Status via tangentbord på Översikt
        await pg.goto(BAS+"#/oversikt"); await pg.wait_for_timeout(600); await pg.mouse.click(1,1)
        check(await tabba_till("Status för Stötta"), "Tab når statusknappen för uppgiften")
        fore=await pg.evaluate("JSON.parse(localStorage.getItem('gro:v1')).uppgifter.find(u=>u.titel==='Stötta pionen').status")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(500)
        efter=await pg.evaluate("JSON.parse(localStorage.getItem('gro:v1')).uppgifter.find(u=>u.titel==='Stötta pionen').status")
        check(fore!=efter, f"Enter byter status ({fore} → {efter})")
        check("status" in (await aktiv()).lower(), "Fokus stannar på statusknappen efter bytet")
        # 6 Årshjul
        await pg.goto(BAS+"#/arshjul"); await pg.wait_for_timeout(600); await pg.mouse.click(1,1)
        check(await tabba_till("nuvarande månad"), "Tab når den valda månaden i årshjulet")
        m0=await aktiv(); await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(400); m1=await aktiv()
        check(m0!=m1 and "December" in m1, f"Högerpil väljer nästa månad och fokus följer med ({m1[:20]})")
        await pg.keyboard.press("ArrowLeft"); await pg.wait_for_timeout(300)
        await pg.keyboard.press("Tab"); await pg.wait_for_timeout(100)
        check("Vinter" in await aktiv(), "Tab efter månaderna går till årstiderna")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(400)
        check(await pg.evaluate("document.activeElement.getAttribute('aria-pressed')")=="true", "Enter väljer årstiden (aria-pressed) och fokus stannar kvar")
        await pg.keyboard.press(" "); await pg.wait_for_timeout(400)
        check(await pg.evaluate("document.activeElement.getAttribute('aria-pressed')")=="false", "Mellanslag avmarkerar årstiden")
        # 7 Dialog: ta bort växt, Esc
        vid=await pg.evaluate("JSON.parse(localStorage.getItem('gro:v1')).vaxter.find(v=>v.namn==='Testpion').id")
        await pg.goto(BAS+"#/vaxt/"+vid); await pg.wait_for_timeout(600); await pg.mouse.click(1,1)
        check(await tabba_till("Ta bort växt"), "Tab når 'Ta bort växt'")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(400)
        check(await pg.evaluate("document.getElementById('dialog').open && document.getElementById('dialog').contains(document.activeElement)"), "Dialogen öppnas och fokus hamnar i den")
        inne=True
        for i in range(6):
            await pg.keyboard.press("Tab"); await pg.wait_for_timeout(40)
            # body = webbläsarens egna kontroller (tillåtet för modala dialoger); sidan bakom får aldrig nås
            inne = inne and await pg.evaluate("document.activeElement===document.body||document.getElementById('dialog').contains(document.activeElement)")
        check(inne, "Tab når aldrig sidan bakom dialogen")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        check(not await pg.evaluate("document.getElementById('dialog').open"), "Esc stänger dialogen")
        check("ta bort" in (await aktiv()).lower(), "Fokus återgår till 'Ta bort växt'")
        check(await pg.evaluate(f"!!JSON.parse(localStorage.getItem('gro:v1')).vaxter.find(v=>v.id==='{vid}')"), "Växten finns kvar efter Esc")
        # 8 Tillbaka
        await pg.mouse.click(1,1)
        check(await tabba_till("Tillbaka"), "Tab når Tillbaka")
        fore=pg.url; await pg.keyboard.press("Enter"); await pg.wait_for_timeout(500)
        check(pg.url!=fore, "Enter på Tillbaka går tillbaka")
        print("JS-fel:", jsfel); print(f"{len(OK)} godkända, {len(FEL)} fel")
        await b.close()
asyncio.run(main())
import sys
sys.exit(1 if FEL else 0)
