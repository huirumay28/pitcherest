import sys, os, re
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/"
OUT = "/workspace/pitcherest/screenshots/v2"; os.makedirs(OUT, exist_ok=True)
TF = "/workspace/pitcherest/tools/testfiles/"
errors = []
def wire(page, tag):
    page.on("console", lambda m: errors.append((tag, m.type, m.text)) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append((tag, "pageerror", str(e))))
    page.on("requestfailed", lambda r: errors.append((tag, "reqfailed", r.url)))
def settle(p, ms=500): p.wait_for_timeout(ms)
def shot(p, name, full=False): p.screenshot(path=f"{OUT}/{name}.png", full_page=full)
def wait_answer(p): p.wait_for_selector(".msg-a:last-of-type .sources", timeout=30000); settle(p, 500)

def upload_flow(page, prefix, tap):
    page.goto(BASE + "upload.html"); page.wait_for_load_state("networkidle"); page.evaluate("document.fonts.ready"); settle(page, 600)
    shot(page, f"{prefix}-10-upload-step1-empty")
    page.set_input_files("#fileIn", [TF + f for f in ["客戶溝通錄音.wav", "品牌調查報告.pdf", "客戶會議紀錄.docx", "提案簡報.pptx", "店頭陳列照片.jpg", "銷售資料.xlsx"]])
    page.fill("#urlIn", "https://www.example-beverage-news.com/sparkling-tea"); page.click("#urlAdd")
    settle(page, 900); shot(page, f"{prefix}-11-upload-processing")
    page.wait_for_function("document.querySelectorAll('.fcard .result').length===7", timeout=20000); settle(page, 500)
    shot(page, f"{prefix}-12-upload-results", full=False)
    page.evaluate("document.getElementById('upMain').scrollTo(0,400)"); settle(page, 300); shot(page, f"{prefix}-12b-upload-results-scrolled")
    page.click("#next1"); settle(page, 500)
    page.fill("#note", "這是客戶在週五會議中提到的新需求，希望在下週前確認預算與時程，請策略同事先看品牌調查報告。"); settle(page, 200)
    shot(page, f"{prefix}-13-upload-step2-notes")
    page.click('[data-next="3"]'); settle(page, 600)
    shot(page, f"{prefix}-14-upload-step3-flag")
    assert page.locator('.dpill[aria-pressed="true"]').count() >= 1, "AI suggestion empty"
    page.click('[data-pri="重要"]'); page.fill("#reason", "客戶調整了預算，需要大家先知道。"); page.keyboard.press("Tab"); settle(page, 300)
    page.evaluate("document.getElementById('upMain').scrollTo(0,9999)"); settle(page, 300); shot(page, f"{prefix}-15-upload-step3-notification")
    page.click("#commit"); settle(page, 700); shot(page, f"{prefix}-16-upload-done")

with sync_playwright() as p:
    b = p.chromium.launch()
    # ================= desktop =================
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); page = ctx.new_page(); wire(page, "desktop")
    page.goto(BASE); page.wait_for_load_state("networkidle"); page.evaluate("document.fonts.ready"); settle(page, 800)
    shot(page, "d-01-home-empty")
    assert page.locator(".item").count() >= 40
    txt = page.inner_text("body"); assert "客戶服務" not in txt and "媒體" not in re.sub(r"媒體規劃草案|媒體預算|媒體分配|媒體企劃|媒體規劃|錄音：媒體預算討論", "", txt) , "old dept wording"
    assert "預設" not in txt and "檢視" not in txt, "預設/檢視 wording"
    # manual select + visual moodboard
    for id in ["vs-01", "vs-02", "vs-03", "vs-05", "vs-11", "vs-12", "vs-13", "vs-14", "ci-01", "ci-02", "wb-03", "mr-02", "ls" ]:
        if page.locator(f'.item[data-id="{id}"]').count(): page.click(f'.item[data-id="{id}"] .cb')
    settle(page, 500); shot(page, "d-02-home-selected-moodboard")
    page.evaluate("document.getElementById('viewScroll').scrollTo(0,0)")
    # templates
    for tid in ["moodboard", "table", "summary", "timeline", "wall", "dash", "base", "quotes", "gallery"]:
        page.click(f'[data-tpl="{tid}"]'); settle(page, 600)
        page.evaluate("document.getElementById('viewScroll').scrollTo(0,0)"); shot(page, f"d-tpl-{tid}")
        page.evaluate("document.getElementById('viewScroll').scrollTo(0,330)"); settle(page, 250); shot(page, f"d-tpl-{tid}-content")
    # role only marks recommendation
    page.click('[data-tpl="table"]')
    page.click('[data-role="creative"]'); settle(page, 300)
    assert page.get_attribute('[data-tpl="table"]', "aria-checked") == "true", "role must not switch template"
    assert page.locator('[data-tpl="wall"] .rec').count() == 1
    page.click('[data-apply]'); settle(page, 400); assert page.get_attribute('[data-tpl="wall"]', "aria-checked") == "true"
    page.click('[data-role="sales"]'); settle(page, 300); assert page.locator('[data-tpl="base"] .rec').count() == 1
    page.click('[data-role="strategy"]'); settle(page, 300)
    page.click('[data-tpl="moodboard"]')
    # ask
    page.click('[data-q="q1"]'); wait_answer(page); shot(page, "d-20-answer-citations")
    page.click('.msg-a .answer .cite >> nth=1'); settle(page, 800); assert page.locator(".item.hl").count() == 1
    n0 = page.locator(".item.sel").count(); page.click(".add-sel"); settle(page, 500); n1 = page.locator(".item.sel").count(); print("sel", n0, n1); assert n1 >= n0
    shot(page, "d-21-citation-highlight")
    page.click('[data-q="q7"]') if page.locator('.suggest [data-q="q7"]').count() else None
    page.fill("#askInput", "視覺和包裝的方向是什麼"); page.press("#askInput", "Enter"); wait_answer(page); shot(page, "d-22-answer-visual")
    page.fill("#askInput", "今天午餐吃什麼"); page.press("#askInput", "Enter"); page.wait_for_selector(".fallback", timeout=10000); settle(page, 400)
    # upload flow
    page.click('.topnav a[href="upload.html"]'); page.wait_for_url("**/upload.html"); settle(page, 600)
    upload_flow(page, "d", None)
    page.click("#goHome"); page.wait_for_url("**/index.html*"); page.wait_for_load_state("networkidle"); settle(page, 1800)
    assert page.locator(".item .tag.new").count() == 7, page.locator(".item .tag.new").count()
    assert page.locator(".item.hl .note-line").count() == 1 or page.locator(".note-line").count() >= 7
    shot(page, "d-30-home-after-upload")
    # flags visible; role filter
    page.click('[data-mine]'); settle(page, 500); shot(page, "d-31-mine-filter-strategy")
    page.click('[data-role="creative"]'); settle(page, 500); shot(page, "d-32-mine-filter-creative")
    n_mine = page.locator(".item").count(); print("mine creative", n_mine); assert 0 < n_mine < 50
    page.click('[data-mine]'); settle(page, 300)
    # ask about the upload
    page.fill("#askInput", "我剛上傳的資料是什麼"); page.press("#askInput", "Enter"); wait_answer(page); shot(page, "d-33-answer-about-upload")
    assert "備註" in page.inner_text(".msg-a:last-of-type .answer")
    # persistence after reload
    page.reload(); page.wait_for_load_state("networkidle"); settle(page, 600); assert page.locator(".item .tag.new").count() == 7
    # select new items into views
    page.click('.item .tag.new >> nth=0'); 
    for i in range(7): page.click(f'.item:has(.tag.new) >> nth={i} >> .cb')
    page.click('[data-tpl="table"]'); settle(page, 500); page.evaluate("document.getElementById('viewScroll').scrollTo(0,330)"); shot(page, "d-34-table-with-uploads")
    # reset
    page.click("#resetUploads"); settle(page, 400); assert page.locator(".item .tag.new").count() == 0
    # project switcher
    page.click("#projectBtn"); settle(page, 300); shot(page, "d-40-project-switcher")
    print("desktop overflow", page.evaluate("document.documentElement.scrollWidth > innerWidth"))
    ctx.close()

    # ================= phone =================
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True); page = ctx.new_page(); wire(page, "phone")
    page.goto(BASE); page.wait_for_load_state("networkidle"); page.evaluate("document.fonts.ready"); settle(page, 800)
    shot(page, "m-01-home")
    page.tap('.item[data-id="vs-11"] .item-main'); settle(page, 400); shot(page, "m-02-item-expanded"); page.tap('.item[data-id="vs-11"] .item-main')
    for id in ["vs-01", "vs-03", "vs-05", "vs-11", "ci-01", "wb-03"]: page.tap(f'.item[data-id="{id}"] .cb')
    settle(page, 300); shot(page, "m-03-selected")
    page.tap('[data-go="ask"]'); settle(page, 400); page.tap('[data-q="q2"]'); wait_answer(page); shot(page, "m-04-answer")
    page.evaluate("document.querySelector('#chatScroll').scrollTo(0,99999)"); settle(page, 400); shot(page, "m-05-answer-sources")
    page.tap(".add-sel"); settle(page, 300)
    page.tap('[data-go="view"]'); settle(page, 500); shot(page, "m-06-view-picker")
    page.evaluate("document.getElementById('viewScroll').scrollTo(0,420)"); settle(page, 300); shot(page, "m-07-view-moodboard")
    for tid in ["table", "summary", "timeline", "wall", "dash"]:
        page.evaluate("document.getElementById('viewScroll').scrollTo(0,0)"); page.tap(f'[data-tpl="{tid}"]'); settle(page, 500); page.evaluate("document.getElementById('viewScroll').scrollTo(0,420)"); shot(page, f"m-tpl-{tid}")
    page.tap('[data-go="archive"]'); page.tap("#selClear"); page.tap('[data-go="view"]'); settle(page, 500); page.evaluate("document.getElementById('viewScroll').scrollTo(0,300)"); shot(page, "m-08-empty-state")
    # upload on phone
    page.goto(BASE + "upload.html"); page.wait_for_load_state("networkidle"); settle(page, 500)
    page.set_input_files("#fileIn", [TF + "店頭陳列照片.jpg", TF + "客戶溝通錄音.wav"]); page.tap('[data-sample="ppt"]'); page.tap('[data-sample="url"]')
    page.wait_for_function("document.querySelectorAll('.fcard .result').length===4", timeout=20000); settle(page, 400); shot(page, "m-10-upload-step1", full=False)
    page.evaluate("document.getElementById('upMain').scrollTo(0,420)"); settle(page, 300); shot(page, "m-11-upload-results")
    page.tap("#next1"); settle(page, 400); page.fill("#note", "這是店頭拍攝的照片與客戶錄音，請創意同事參考陳列方式。"); shot(page, "m-12-upload-notes")
    page.tap('[data-next="3"]'); settle(page, 500); shot(page, "m-13-upload-flag"); page.evaluate("document.getElementById('upMain').scrollTo(0,9999)"); settle(page, 300); shot(page, "m-14-upload-flag-bottom")
    page.tap("#commit"); settle(page, 600); shot(page, "m-15-upload-done")
    page.tap("#goHome"); page.wait_for_url("**/index.html*"); settle(page, 1800); shot(page, "m-16-home-after-upload")
    print("phone overflow", page.evaluate("document.documentElement.scrollWidth > innerWidth"))
    ctx.close(); b.close()
print("ERRORS:", errors)
