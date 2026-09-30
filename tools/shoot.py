import sys, os
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/"
OUT = "/workspace/pitcherest/screenshots"; os.makedirs(OUT, exist_ok=True)
errors = []
def wire(page, tag):
    page.on("console", lambda m: errors.append((tag, m.type, m.text)) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append((tag, "pageerror", str(e))))
    page.on("requestfailed", lambda r: errors.append((tag, "reqfailed", r.url)))

def settle(page, ms=500): page.wait_for_timeout(ms)
def wait_answer(page):
    page.wait_for_selector(".msg-a:last-of-type .sources", timeout=30000); settle(page, 500)

with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------- desktop ----------
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    page = ctx.new_page(); wire(page, "desktop"); page.goto(BASE); page.wait_for_load_state("networkidle"); page.evaluate("document.fonts.ready"); settle(page, 800)
    page.screenshot(path=f"{OUT}/desktop-01-archive-empty-view.png")
    # open one item + whiteboard + voice
    page.click('.item[data-id="wb-03"] .item-row .item-main'); page.click('.item[data-id="vo-02"] .item-row .item-main'); settle(page, 400)
    page.screenshot(path=f"{OUT}/desktop-02-archive-expanded.png")
    page.click('.item[data-id="wb-03"] .item-row .item-main'); page.click('.item[data-id="vo-02"] .item-row .item-main')
    # filters
    page.click('[data-f="dept"]'); settle(page, 300); page.screenshot(path=f"{OUT}/desktop-03-filter.png")
    page.check('[data-fv="創意"]'); settle(page, 300)
    assert page.locator(".item").count() < 22
    page.keyboard.press("Escape"); page.click("body", position={"x": 700, "y": 600}); 
    page.click('[data-act="clearf"]') if page.locator('#filters [data-act="clearf"]').count() else None
    # select items manually
    for id in ["mr-02", "ci-01", "wb-03"]: page.click(f'.item[data-id="{id}"] .cb')
    assert page.locator(".item.sel").count() == 3
    settle(page, 400); page.screenshot(path=f"{OUT}/desktop-04-selected-table.png")
    # ask
    page.click('[data-q="q1"]'); wait_answer(page)
    page.screenshot(path=f"{OUT}/desktop-05-answer-citations.png")
    # cite click -> highlight
    page.click('.msg-a .answer .cite >> nth=1'); settle(page, 700)
    assert page.locator(".item.hl").count() == 1, "no highlight"
    page.screenshot(path=f"{OUT}/desktop-06-citation-highlight.png")
    n0 = page.locator(".item.sel").count()
    page.click(".add-sel"); settle(page, 500)
    n1 = page.locator(".item.sel").count(); print("selected", n0, "->", n1); assert n1 > n0
    page.screenshot(path=f"{OUT}/desktop-07-added-to-selection.png")
    # templates
    for tid, name in [("moodboard", "08-moodboard"), ("table", "09-table"), ("summary", "10-summary"), ("timeline", "11-timeline")]:
        page.click(f'[data-tpl="{tid}"]'); settle(page, 700); page.screenshot(path=f"{OUT}/desktop-{name}.png")
    # role toggle
    page.click('[data-role="creative"]'); settle(page, 500); assert page.get_attribute('[data-tpl="moodboard"]', "aria-checked") == "true"
    page.click('[data-role="cs"]'); settle(page, 500); assert page.get_attribute('[data-tpl="summary"]', "aria-checked") == "true"
    page.click('[data-role="strategy"]'); settle(page, 500); assert page.get_attribute('[data-tpl="table"]', "aria-checked") == "true"
    # more questions + fallback
    page.click('.follow .chip >> nth=0'); wait_answer(page)
    page.fill("#askInput", "今天天氣如何"); page.press("#askInput", "Enter"); page.wait_for_selector(".fallback", timeout=10000); settle(page, 500)
    page.screenshot(path=f"{OUT}/desktop-12-fallback.png")
    page.fill("#askInput", "競爭對手在做什麼"); page.press("#askInput", "Enter"); wait_answer(page)
    # q3 list answer
    page.click('#chatReset'); page.click('[data-q="q3"]'); wait_answer(page)
    page.screenshot(path=f"{OUT}/desktop-13-answer-list.png")
    # upload
    page.click("#uploadBtn"); settle(page, 500); page.screenshot(path=f"{OUT}/desktop-14-upload-sorting.png"); settle(page, 1800)
    # empty state
    page.click("#selClear"); settle(page, 600); page.screenshot(path=f"{OUT}/desktop-15-empty-state.png")
    # presets
    page.click('#quick [data-preset="2"]'); page.click('[data-tpl="moodboard"]'); settle(page, 900); page.screenshot(path=f"{OUT}/desktop-16-moodboard-creative.png")
    page.click("#projectBtn"); settle(page, 300); page.screenshot(path=f"{OUT}/desktop-17-project-switcher.png")
    # horizontal overflow check
    ov = page.evaluate("document.documentElement.scrollWidth > innerWidth"); print("desktop overflow", ov)
    ctx.close()
    # ---------- phone ----------
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page(); wire(page, "phone"); page.goto(BASE); page.wait_for_load_state("networkidle"); page.evaluate("document.fonts.ready"); settle(page, 800)
    page.screenshot(path=f"{OUT}/phone-01-archive.png")
    page.tap('.item[data-id="wb-03"] .item-main'); settle(page, 300); page.screenshot(path=f"{OUT}/phone-02-archive-expanded.png"); page.tap('.item[data-id="wb-03"] .item-main')
    for id in ["mr-02", "ci-01", "wb-03"]: page.tap(f'.item[data-id="{id}"] .cb')
    settle(page, 300); page.screenshot(path=f"{OUT}/phone-03-selected.png")
    page.tap('[data-go="ask"]'); settle(page, 500); page.screenshot(path=f"{OUT}/phone-04-ask.png")
    page.tap('[data-q="q2"]'); wait_answer(page); page.screenshot(path=f"{OUT}/phone-05-answer-citations.png")
    page.evaluate("document.querySelector('#chatScroll').scrollTo(0,99999)"); settle(page, 500); page.screenshot(path=f"{OUT}/phone-06-answer-sources.png")
    page.tap(".add-sel"); settle(page, 500)
    page.tap('.msg-a .answer .cite >> nth=0'); settle(page, 800); assert page.evaluate("document.body.dataset.tab") == "archive"; page.screenshot(path=f"{OUT}/phone-07-citation-highlight.png")
    page.tap('[data-go="view"]'); settle(page, 600)
    page.screenshot(path=f"{OUT}/phone-08-view-table.png")
    for tid, name in [("moodboard", "09-moodboard"), ("summary", "10-summary"), ("timeline", "11-timeline")]:
        page.tap(f'[data-tpl="{tid}"]'); settle(page, 700); page.screenshot(path=f"{OUT}/phone-{name}.png")
    page.tap("#selClear") if page.locator("#selClear").is_visible() else None
    page.tap('[data-go="archive"]'); page.tap("#selClear"); page.tap('[data-go="view"]'); settle(page, 600); page.screenshot(path=f"{OUT}/phone-12-empty-state.png")
    ov = page.evaluate("document.documentElement.scrollWidth > innerWidth"); print("phone overflow", ov)
    ctx.close(); b.close()
print("ERRORS:", errors)
