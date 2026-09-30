"""Round-2 vibrant flat illustrations for the Pitcherest demo. Pure PIL, no external assets."""
import math, random, os
import numpy as np
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "img")
os.makedirs(OUT + "/t", exist_ok=True)
SS = 2
CH = (33, 33, 41); GOLD = (157, 131, 62); BLUE = (22, 171, 224); PINK = (217, 61, 122); TEAL = (0, 176, 163); LG = (231, 231, 231)
WHITE = (255, 255, 255)
SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"; SANSR = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"

@lru_cache(None)
def F(kind, size):
    return ImageFont.truetype({"sans": SANS, "reg": SANSR, "serif": SERIF}[kind], int(size), index=3)

def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def lighten(c, t): return mix(c, WHITE, t)
def darken(c, t): return mix(c, (0, 0, 0), t)

class C:
    def __init__(s, w, h, bg=WHITE, grad=None):
        s.w, s.h = w, h
        if grad:
            s.im = Image.new("RGB", (w * SS, h * SS)); s.d = ImageDraw.Draw(s.im); s.vgrad((0, 0, w, h), grad)
        else:
            s.im = Image.new("RGB", (w * SS, h * SS), bg)
        s.d = ImageDraw.Draw(s.im)
    def _p(s, v): return [x * SS for x in v]
    def rect(s, x0, y0, x1, y1, fill=None, r=0, outline=None, width=1):
        s.d.rounded_rectangle(s._p([x0, y0, x1, y1]), radius=r * SS, fill=fill, outline=outline, width=int(width * SS))
    def ell(s, cx, cy, rx, ry=None, fill=None, outline=None, width=1):
        ry = ry or rx; s.d.ellipse(s._p([cx - rx, cy - ry, cx + rx, cy + ry]), fill=fill, outline=outline, width=int(width * SS))
    def poly(s, pts, fill=None, outline=None, width=1):
        p = [(x * SS, y * SS) for x, y in pts]
        s.d.polygon(p, fill=fill)
        if outline: s.d.line(p + [p[0]], fill=outline, width=int(width * SS), joint="curve")
    def line(s, pts, fill=CH, width=2):
        s.d.line([(x * SS, y * SS) for x, y in pts], fill=fill, width=int(width * SS), joint="curve")
    def dashed(s, x0, y0, x1, y1, col, width=2, dash=10, gap=7):
        for (a, b, c, d_) in [(x0, y0, x1, y0), (x1, y0, x1, y1), (x1, y1, x0, y1), (x0, y1, x0, y0)]:
            L = math.hypot(c - a, d_ - b); n = int(L // (dash + gap)) + 1
            for i in range(n):
                t0 = i * (dash + gap) / L; t1 = min(1, (i * (dash + gap) + dash) / L)
                if t0 >= 1: break
                s.line([(a + (c - a) * t0, b + (d_ - b) * t0), (a + (c - a) * t1, b + (d_ - b) * t1)], col, width)
    def text(s, x, y, t, size, fill=CH, kind="sans", anchor="la"):
        s.d.text((x * SS, y * SS), t, font=F(kind, size * SS), fill=fill, anchor=anchor)
    def tw(s, t, size, kind="sans"): return s.d.textlength(t, font=F(kind, size * SS)) / SS
    def wrap(s, x, y, t, size, maxw, lh, fill=CH, kind="sans", anchor="l"):
        lines, cur = [], ""
        for ch in t:
            if s.tw(cur + ch, size, kind) > maxw and cur: lines.append(cur); cur = ch
            else: cur += ch
        lines.append(cur)
        for i, ln in enumerate(lines):
            xx = x if anchor == "l" else x - s.tw(ln, size, kind) / 2
            s.text(xx, y + i * lh, ln, size, fill, kind)
        return y + len(lines) * lh
    def grad(s, box, stops, axis="h", r=0, alpha=None):
        x0, y0, x1, y1 = [int(v * SS) for v in box]; w, h = x1 - x0, y1 - y0
        n = w if axis == "h" else h
        ts = np.linspace(0, 1, n)
        arr = np.zeros((n, 3))
        for ch in range(3):
            arr[:, ch] = np.interp(ts, [p for p, _ in stops], [c[ch] for _, c in stops])
        arr = np.tile(arr[None, :, :], (h, 1, 1)) if axis == "h" else np.tile(arr[:, None, :], (1, w, 1))
        g = Image.fromarray(arr.astype("uint8"), "RGB")
        m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=r * SS, fill=255)
        s.im.paste(g, (x0, y0), m); s.d = ImageDraw.Draw(s.im)
    def hgrad(s, box, stops, r=0): s.grad(box, stops, "h", r)
    def vgrad(s, box, stops_or_pair, r=0):
        st = stops_or_pair if isinstance(stops_or_pair[0], tuple) and isinstance(stops_or_pair[0][0], (int, float)) and len(stops_or_pair[0]) == 2 and not isinstance(stops_or_pair[0][0], tuple) else None
        if st is None or isinstance(stops_or_pair[0][0], int) and len(stops_or_pair) == 2 and len(stops_or_pair[0]) == 3:
            a, b = stops_or_pair; st = [(0, a), (1, b)]
        s.grad(box, st, "v", r)
    def shadow(s, cx, cy, rx, ry, alpha=55, blur=10):
        m = Image.new("L", s.im.size, 0); ImageDraw.Draw(m).ellipse([(cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS], fill=alpha)
        m = m.filter(ImageFilter.GaussianBlur(blur * SS)); s.im.paste((33, 33, 41), mask=m); s.d = ImageDraw.Draw(s.im)
    def bubbles(s, n, box, cols, seed=1, rmin=4, rmax=14, filled=False):
        rnd = random.Random(seed)
        for _ in range(n):
            r = rnd.uniform(rmin, rmax); x = rnd.uniform(box[0], box[2]); y = rnd.uniform(box[1], box[3]); c = rnd.choice(cols)
            s.ell(x, y, r, outline=c, width=1.6, fill=(lighten(c, .7) if filled else None))
    def save(s, name, maxw=800):
        im = s.im.resize((s.w, s.h), Image.LANCZOS)
        if im.width > maxw: im = im.resize((maxw, int(im.height * maxw / im.width)), Image.LANCZOS)
        im.save(f"{OUT}/{name}.webp", quality=80, method=6)
        t = im.copy(); t.thumbnail((240, 240)); t.save(f"{OUT}/t/{name}.webp", quality=72, method=6)

def can(c, cx, top, w, h, body, name="初萃", sub="輕氣泡無糖茶", band=None, text=WHITE, show_text=True):
    x0, x1, bot = cx - w / 2, cx + w / 2, top + h
    c.shadow(cx, bot + 2, w * .62, w * .075, 60, max(4, w * .05))
    dark, light = darken(body, .2), lighten(body, .38)
    c.hgrad((x0, top + w * .06, x1, bot), [(0, dark), (.18, light), (.45, body), (.85, body), (1, dark)], r=w * .07)
    c.ell(cx, top + w * .085, w / 2, w * .085, fill=(206, 208, 212))
    c.ell(cx, top + w * .085, w * .38, w * .055, fill=(236, 237, 240), outline=(170, 172, 178), width=1)
    c.rect(cx - w * .09, top + w * .06, cx + w * .09, top + w * .085, fill=(180, 182, 188), r=2)
    if band:
        c.hgrad((x0 + 1, top + h * .55, x1 - 1, top + h * .68), [(0, darken(band, .15)), (.2, lighten(band, .3)), (.5, band), (1, darken(band, .15))])
    if show_text:
        c.text(cx, top + h * .3, name, w * .3, text, "serif", "mm")
        c.text(cx, top + h * .3 + w * .3, sub, max(9, w * .085), lighten(text, .15) if text != WHITE else (240, 240, 240), "sans", "mm")
        c.line([(cx - w * .14, top + h * .3 + w * .18), (cx + w * .14, top + h * .3 + w * .18)], text, max(1, w * .012))

def person(c, cx, base, scale=1, skin=(240, 200, 170), shirt=PINK, hair=CH, hairstyle="short"):
    s = scale
    c.rect(cx - 48 * s, base - 130 * s, cx + 48 * s, base, fill=shirt, r=26 * s)
    c.rect(cx - 12 * s, base - 150 * s, cx + 12 * s, base - 120 * s, fill=skin, r=8 * s)
    c.ell(cx, base - 185 * s, 34 * s, 38 * s, fill=skin)
    if hairstyle == "long":
        c.ell(cx, base - 195 * s, 40 * s, 42 * s, fill=hair); c.rect(cx - 40 * s, base - 195 * s, cx + 40 * s, base - 130 * s, fill=hair, r=20 * s)
        c.ell(cx, base - 180 * s, 32 * s, 36 * s, fill=skin); c.ell(cx, base - 205 * s, 36 * s, 24 * s, fill=hair)
    elif hairstyle == "bun":
        c.ell(cx, base - 236 * s, 16 * s, fill=hair); c.ell(cx, base - 196 * s, 36 * s, 28 * s, fill=hair); c.ell(cx, base - 180 * s, 32 * s, 36 * s, fill=skin); c.ell(cx, base - 200 * s, 34 * s, 20 * s, fill=hair)
    else:
        c.ell(cx, base - 200 * s, 37 * s, 26 * s, fill=hair); c.ell(cx, base - 178 * s, 32 * s, 34 * s, fill=skin); c.ell(cx, base - 196 * s, 35 * s, 18 * s, fill=hair)
    c.ell(cx - 12 * s, base - 182 * s, 2.4 * s, fill=CH); c.ell(cx + 12 * s, base - 182 * s, 2.4 * s, fill=CH)
    c.d.arc(c._p([cx - 10 * s, base - 176 * s, cx + 10 * s, base - 164 * s]), 20, 160, fill=CH, width=int(2 * SS))

def leaf(c, x, y, L, ang, col):
    pts = []
    for i in range(0, 21):
        t = i / 20; w = math.sin(t * math.pi) * L * .26
        pts.append((t * L, -w))
    for i in range(20, -1, -1):
        t = i / 20; w = math.sin(t * math.pi) * L * .26
        pts.append((t * L, w))
    a = math.radians(ang)
    c.poly([(x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a)) for px, py in pts], fill=col)

# ----------------------------------------------------------------- images
def pk01():
    c = C(900, 675, grad=[(0, (250, 246, 236)), (1, (241, 232, 210))])
    c.rect(0, 500, 900, 675, fill=(234, 224, 198)); c.line([(0, 500), (900, 500)], (220, 208, 176), 2)
    c.ell(450, 330, 250, fill=(247, 239, 216))
    c.bubbles(16, (80, 60, 820, 470), [lighten(GOLD, .4), lighten(TEAL, .4), lighten(PINK, .5)], 3, 5, 12, filled=True)
    can(c, 260, 175, 138, 330, TEAL, band=lighten(TEAL, .15)); can(c, 640, 175, 138, 330, PINK, band=lighten(PINK, .1))
    can(c, 450, 140, 152, 365, GOLD, band=lighten(GOLD, .12))
    for x, n in [(260, "原味無糖茶"), (450, "蜜香烏龍"), (640, "白桃烏龍")]: c.text(x, 556, n, 19, CH, "sans", "mm")
    c.text(44, 40, "初萃　三款口味包裝", 26, CH, "serif"); c.line([(44, 86), (170, 86)], GOLD, 2)
    c.save("pk-01")

def pk02():
    c = C(900, 600, bg=(251, 251, 250))
    c.text(40, 30, "包裝造型研究", 24, CH, "serif"); c.line([(40, 72), (150, 72)], GOLD, 2)
    base = 470; xs = [150, 340, 540, 740]
    # slim can
    c.rect(xs[0] - 46, base - 300, xs[0] + 46, base, fill=(226, 244, 242), r=12, outline=TEAL, width=2.4); c.rect(xs[0] - 38, base - 300, xs[0] + 38, base - 286, fill=(236, 237, 240), r=6, outline=(170, 172, 178))
    c.text(xs[0], base - 190, "初萃", 26, TEAL, "serif", "mm")
    # standard can
    c.rect(xs[1] - 58, base - 240, xs[1] + 58, base, fill=(251, 240, 214), r=10, outline=GOLD, width=2.4); c.rect(xs[1] - 50, base - 240, xs[1] + 50, base - 226, fill=(236, 237, 240), r=6, outline=(170, 172, 178))
    c.text(xs[1], base - 140, "初萃", 30, GOLD, "serif", "mm")
    # bottle
    x = xs[2]
    c.poly([(x - 18, base - 330), (x + 18, base - 330), (x + 18, base - 250), (x + 54, base - 200), (x + 54, base - 14), (x + 40, base), (x - 40, base), (x - 54, base - 14), (x - 54, base - 200), (x - 18, base - 250)], fill=(252, 232, 240), outline=PINK, width=2.4)
    c.rect(x - 22, base - 346, x + 22, base - 328, fill=PINK, r=3); c.text(x, base - 110, "初萃", 26, PINK, "serif", "mm")
    # carton
    x = xs[3]
    c.poly([(x - 56, base - 200), (x - 30, base - 240), (x + 30, base - 240), (x + 56, base - 200), (x + 56, base), (x - 56, base)], fill=(227, 244, 251), outline=BLUE, width=2.4)
    c.line([(x - 30, base - 240), (x - 30, base - 200)], BLUE, 1.6); c.line([(x + 30, base - 240), (x + 30, base - 200)], BLUE, 1.6); c.line([(x - 56, base - 200), (x + 56, base - 200)], BLUE, 1.6)
    c.text(x, base - 100, "初萃", 26, BLUE, "serif", "mm")
    for x, n, s in zip(xs, ["細長罐", "標準罐", "玻璃瓶", "紙盒"], ["350 ml", "330 ml", "300 ml", "250 ml"]):
        c.text(x, base + 32, n, 20, CH, "sans", "mm"); c.text(x, base + 58, s, 16, (130, 130, 138), "reg", "mm")
    c.line([(xs[0] - 82, base - 300), (xs[0] - 82, base)], (180, 180, 186), 1.4); c.line([(xs[0] - 88, base - 300), (xs[0] - 76, base - 300)], (180, 180, 186), 1.4); c.line([(xs[0] - 88, base), (xs[0] - 76, base)], (180, 180, 186), 1.4)
    c.dashed(xs[0] - 104, base - 360, xs[0] + 104, base + 82, GOLD, 2.4)
    c.rect(xs[0] - 28, base - 388, xs[0] + 28, base - 364, fill=GOLD, r=12); c.text(xs[0], base - 376, "採用", 15, WHITE, "sans", "mm")
    c.save("pk-02")

def pal01():
    c = C(900, 600)
    blocks = [((40, 40, 400, 560), GOLD, "金", "#9D833E", WHITE), ((410, 40, 640, 300), CH, "炭黑", "#212129", WHITE), ((650, 40, 860, 170), LG, "淺灰", "#E7E7E7", CH),
              ((650, 180, 860, 300), BLUE, "天空藍", "#16ABE0", WHITE), ((410, 310, 640, 560), PINK, "莓果粉", "#D93D7A", WHITE), ((650, 310, 860, 560), TEAL, "茶湖青", "#00B0A3", WHITE)]
    for (x0, y0, x1, y1), col, n, hx, tc in blocks:
        c.rect(x0, y0, x1, y1, fill=col, r=8)
        c.text(x0 + 20, y1 - 56, n, 24 if x1 - x0 > 300 else 20, tc, "serif"); c.text(x0 + 20, y1 - 26, hx, 14, tc, "reg")
    c.text(60, 64, "初萃", 44, WHITE, "serif"); c.text(62, 120, "品牌色票", 18, lighten(GOLD, .7), "sans")
    c.bubbles(14, (60, 160, 380, 440), [lighten(GOLD, .5)], 2, 8, 22, filled=False)
    c.save("pal-01")

def bt01():
    c = C(700, 900, grad=[(0, (214, 243, 240)), (1, (236, 249, 247))])
    c.ell(350, 470, 300, fill=(187, 232, 227)); c.ell(350, 470, 235, outline=(255, 255, 255), width=2)
    for x, y, L, a, col in [(90, 700, 200, -60, (0, 140, 130)), (130, 730, 170, -20, (0, 176, 163)), (600, 690, 210, -120, (0, 140, 130)), (570, 740, 180, -160, (0, 176, 163)), (120, 330, 150, -80, lighten(TEAL, .2))]:
        leaf(c, x, y, L, a, col)
    c.shadow(350, 800, 160, 20, 70, 14)
    x0, x1 = 250, 450
    c.poly([(318, 210), (382, 210), (382, 320), (450, 372), (450, 780), (425, 805), (275, 805), (250, 780), (250, 372), (318, 320)], fill=(238, 250, 249), outline=(0, 140, 130), width=2.4)
    c.vgrad((256, 420, 444, 800), [(0, lighten(GOLD, .25)), (1, GOLD)], 0) if False else c.grad((256, 420, 444, 798), [(0, lighten(GOLD, .3)), (1, darken(GOLD, .05))], "v", r=10)
    c.rect(300, 176, 400, 214, fill=GOLD, r=6); c.line([(312, 186), (312, 204)], lighten(GOLD, .4), 2)
    c.rect(268, 500, 432, 660, fill=WHITE, r=6); c.text(350, 556, "初萃", 38, CH, "serif", "mm"); c.text(350, 604, "輕氣泡無糖茶", 16, (110, 110, 118), "sans", "mm"); c.line([(320, 580), (380, 580)], GOLD, 2)
    c.bubbles(14, (268, 440, 432, 790), [lighten(GOLD, .7)], 4, 4, 11)
    c.ell(300, 400, 6, fill=WHITE); c.rect(262, 380, 270, 520, fill=(255, 255, 255), r=4)
    c.text(350, 858, "玻璃瓶版本　300 ml", 18, (30, 110, 104), "sans", "mm")
    c.save("bt-01", 700)

def ls01():
    c = C(900, 650, grad=[(0, (226, 244, 252)), (1, (247, 251, 253))])
    c.rect(560, 70, 850, 330, fill=(186, 228, 246), r=6, outline=(255, 255, 255), width=6)
    c.ell(760, 140, 34, fill=(255, 240, 190))
    for x, h, col in [(575, 120, (150, 205, 232)), (620, 170, (130, 192, 224)), (680, 100, (150, 205, 232)), (730, 150, (120, 186, 220)), (790, 110, (150, 205, 232))]:
        c.rect(x, 325 - h, x + 40, 325, fill=col)
    c.line([(705, 70), (705, 330)], (255, 255, 255), 5); c.line([(560, 200), (850, 200)], (255, 255, 255), 5)
    c.ell(250, 160, 70, fill=WHITE, outline=CH, width=4)
    for i in range(12):
        a = i / 12 * 2 * math.pi; c.line([(250 + 58 * math.sin(a), 160 - 58 * math.cos(a)), (250 + 66 * math.sin(a), 160 - 66 * math.cos(a))], CH, 2)
    c.line([(250, 160), (250, 112)], CH, 4); c.line([(250, 160), (292, 160)], PINK, 4); c.ell(250, 160, 5, fill=CH)
    c.text(250, 255, "下午 3:00", 20, CH, "serif", "mm")
    for x, y, col in [(60, 100, (255, 226, 130)), (120, 190, (255, 190, 210)), (40, 240, (170, 230, 222))]:
        c.rect(x, y, x + 58, y + 58, fill=col, r=2); c.line([(x + 10, y + 20), (x + 46, y + 20)], (120, 100, 70), 2); c.line([(x + 10, y + 34), (x + 38, y + 34)], (120, 100, 70), 2)
    c.rect(0, 540, 900, 650, fill=(228, 218, 196)); c.rect(0, 536, 900, 546, fill=(214, 202, 176))
    person(c, 450, 500, 1.35, shirt=PINK, hairstyle="long", hair=(60, 40, 40))
    c.rect(60, 470, 840, 500, fill=(191, 156, 82), r=3); c.rect(100, 500, 118, 600, fill=(150, 120, 60)); c.rect(780, 500, 798, 600, fill=(150, 120, 60))
    c.rect(250, 400, 420, 470, fill=CH, r=6); c.rect(258, 408, 412, 462, fill=(60, 66, 84), r=3)
    for i, col in enumerate([BLUE, TEAL, PINK, GOLD]): c.rect(268, 418 + i * 11, 268 + 60 + i * 14, 423 + i * 11, fill=col)
    c.rect(225, 466, 445, 474, fill=(120, 122, 130), r=3)
    can(c, 600, 380, 52, 92, TEAL, show_text=False); c.text(600, 415, "初萃", 14, WHITE, "serif", "mm")
    c.rect(720, 430, 770, 470, fill=(200, 90, 60), r=3)
    for a, L in [(-90, 70), (-60, 60), (-120, 60), (-30, 40), (-150, 40)]: leaf(c, 745, 434, L, a, (0, 150, 120))
    c.bubbles(6, (580, 300, 640, 370), [TEAL], 2, 3, 6)
    c.save("ls-01")

def ls02():
    c = C(900, 650, grad=[(0, (208, 190, 236)), (.45, (247, 168, 190)), (1, (255, 222, 170))])
    c.ell(640, 330, 100, fill=(255, 244, 214)); c.ell(640, 330, 140, outline=(255, 255, 255), width=1.5)
    rnd = random.Random(7); x = 0
    while x < 900:
        w = rnd.randint(60, 120); h = rnd.randint(130, 300); col = mix((150, 110, 170), (200, 130, 160), rnd.random())
        c.rect(x, 520 - h, x + w, 560, fill=col)
        for wy in range(520 - h + 18, 540, 28):
            for wx in range(x + 10, x + w - 14, 22):
                if rnd.random() > .45: c.rect(wx, wy, wx + 10, wy + 14, fill=(255, 226, 150))
        x += w + rnd.randint(4, 14)
    c.rect(0, 540, 900, 650, fill=(74, 62, 98)); c.rect(0, 420, 900, 436, fill=CH)
    for xx in range(0, 900, 60): c.rect(xx, 420, xx + 6, 650, fill=CH)
    c.rect(0, 436, 900, 446, fill=(52, 50, 66))
    person(c, 300, 470, 1.6, skin=(234, 190, 160), shirt=(32, 160, 176), hair=(40, 30, 40), hairstyle="bun")
    can(c, 372, 350, 40, 70, GOLD, show_text=False)
    c.line([(340, 400), (370, 380)], (234, 190, 160), 10)
    for x, y in [(700, 640), (800, 640)]:
        c.rect(x - 40, y - 70, x + 40, y, fill=(214, 120, 70), r=4)
        for a, L in [(-90, 150), (-60, 120), (-120, 120), (-40, 90), (-140, 90)]: leaf(c, x, y - 70, L, a, rnd.choice([(0, 170, 130), (0, 130, 110)]))
    c.save("ls-02")

def sh01():
    c = C(900, 675, bg=(238, 243, 246))
    c.rect(0, 0, 900, 675, fill=(238, 243, 246)); c.rect(0, 0, 900, 14, fill=(200, 208, 214)); c.rect(0, 661, 900, 675, fill=(200, 208, 214))
    rnd = random.Random(11)
    shelves = [150, 300, 450, 600]
    generic = [(120, 140, 170), (170, 130, 100), (110, 150, 120), (190, 170, 110), (150, 120, 150), (100, 130, 160), (200, 120, 100)]
    for si, y in enumerate(shelves):
        c.rect(0, y, 900, y + 8, fill=(190, 198, 206)); c.rect(0, y + 8, 900, y + 40, fill=(248, 249, 250))
        c.text(30, y + 26, "NT$30" if si != 2 else "NT$35", 15, (120, 124, 130), "reg", "lm")
        if si == 2:
            for i, (x, col) in enumerate([(300, TEAL), (400, GOLD), (500, TEAL), (600, PINK)]):
                can(c, x, y - 120, 70, 118, col, name="初萃", sub="", show_text=True) if False else can(c, x, y - 118, 72, 118, col, show_text=False)
                c.text(x, y - 80, "初萃", 17, WHITE, "serif", "mm")
            c.dashed(270, y - 146, 640, y + 40, GOLD, 2.6); c.rect(270, y - 172, 450, y - 148, fill=GOLD, r=12); c.text(360, y - 160, "視線高度　135–160 公分", 14, WHITE, "sans", "mm")
            for x in (70, 130, 190, 680, 740, 800, 850):
                can(c, x, y - 110, 50, 108, rnd.choice(generic), show_text=False)
        else:
            for x in range(70, 880, 58):
                col = rnd.choice(generic); can(c, x, y - 108, 44, 106, col, show_text=False); c.rect(x - 22, y - 70, x + 22, y - 50, fill=lighten(col, .55))
    for i in range(6):
        x = -100 + i * 220; c.poly([(x, 0), (x + 40, 0), (x + 240, 675), (x + 200, 675)], fill=(244, 248, 250))
    c.save("sh-01")

def ad01():
    c = C(700, 900, bg=(252, 252, 251)); c.rect(10, 10, 690, 890, outline=LG, width=2)
    c.rect(40, 40, 160, 84, outline=(160, 160, 168), width=1.6); c.text(100, 62, "LOGO", 15, (150, 150, 158), "reg", "mm")
    c.rect(40, 110, 660, 640, fill=(248, 243, 228)); c.line([(40, 110), (660, 640)], (236, 226, 196), 1.4); c.line([(660, 110), (40, 640)], (236, 226, 196), 1.4)
    c.ell(450, 360, 170, fill=(242, 232, 200))
    c.save
    can(c, 470, 210, 130, 330, GOLD, band=lighten(GOLD, .15))
    c.text(70, 500, "打開，", 54, CH, "serif"); c.text(70, 566, "就是暫停。", 54, CH, "serif"); c.line([(70, 640), (210, 640)], GOLD, 3) if False else None
    c.rect(40, 660, 660, 780, fill=TEAL); c.text(70, 700, "初萃　輕氣泡無糖茶", 28, WHITE, "serif"); c.text(70, 744, "三點鐘，給自己一點喘息。", 17, (224, 246, 244), "sans")
    for i, w in enumerate([420, 300]): c.rect(40, 810 + i * 18, 40 + w, 816 + i * 18, fill=LG, r=2)
    for (x, y, t, tx, ty) in [(540, 140, "主視覺：罐身傾斜 15 度", 530, 130), (250, 515, "標題：字要大，也要留白", 250, 600)]:
        pass
    c.line([(520, 560), (600, 600)], PINK, 2); c.text(470, 608, "標題要大，也要留白", 17, PINK, "sans")
    c.line([(480, 190), (560, 140)], PINK, 2); c.text(470, 116, "罐身斜放 15 度", 17, PINK, "sans")
    c.line([(150, 690), (190, 690)], (255, 255, 255), 0)
    c.save("ad-01", 700)

def so01():
    c = C(600, 1000, grad=[(0, TEAL), (.55, lighten(TEAL, .35)), (1, (250, 226, 160))])
    for i in range(3): c.rect(30 + i * 180, 34, 30 + i * 180 + 168, 38, fill=WHITE if i == 0 else (200, 236, 232), r=2)
    c.ell(58, 88, 20, fill=WHITE); c.text(58, 88, "初", 18, TEAL, "serif", "mm"); c.text(90, 88, "chucui_official　2 小時", 15, WHITE, "reg", "lm")
    c.ell(300, 470, 170, fill=(255, 244, 214)); c.ell(300, 470, 215, outline=(255, 255, 255), width=1.5)
    c.bubbles(14, (90, 250, 520, 700), [WHITE], 5, 6, 16)
    can(c, 300, 340, 150, 340, GOLD, band=lighten(GOLD, .12))
    c.text(300, 770, "下午三點，", 46, WHITE, "serif", "mm"); c.text(300, 832, "打開一罐。", 46, WHITE, "serif", "mm")
    c.rect(190, 870, 410, 914, fill=WHITE, r=22); c.text(300, 892, "限時 30 秒影片", 18, PINK, "sans", "mm")
    c.rect(40, 940, 560, 984, outline=WHITE, r=22, width=1.6); c.text(68, 962, "傳送訊息…", 16, WHITE, "reg", "lm")
    c.save("so-01", 600)

def so02():
    c = C(800, 1000, bg=WHITE)
    c.ell(50, 48, 22, fill=GOLD); c.text(50, 48, "初", 20, WHITE, "serif", "mm"); c.text(86, 40, "chucui_official", 18, CH, "sans", "lm"); c.text(86, 62, "贊助　台北", 13, (130, 130, 138), "reg", "lm")
    for i in range(3): c.ell(740 + i * 12, 48, 2.4, fill=CH)
    c.grad((0, 90, 800, 710), [(0, (255, 232, 168)), (1, (252, 196, 168))], "v")
    c.ell(560, 260, 90, fill=(255, 247, 222)); c.ell(560, 260, 125, outline=WHITE, width=1.5)
    c.rect(0, 610, 800, 710, fill=(246, 214, 170)); can(c, 330, 250, 170, 380, TEAL, band=lighten(TEAL, .15))
    for a, L, x in [(-80, 150, 600), (-110, 130, 625), (-55, 120, 640)]: leaf(c, x, 640, L, a, (0, 150, 130))
    c.bubbles(10, (470, 200, 740, 560), [WHITE], 9, 6, 16)
    c.text(40, 752, "♡", 30, CH, "sans", "lm") if False else None
    c.d.ellipse(c._p([40, 742, 72, 770]), outline=CH, width=int(2 * SS)); c.rect(92, 742, 124, 770, outline=CH, r=10, width=2); c.poly([(150, 742), (184, 756), (150, 770)], outline=CH, width=2)
    c.text(40, 800, "1,284 個讚", 18, CH, "sans", "lm")
    c.wrap(40, 828, "三點了，離開座位五分鐘吧。打開一罐初萃，給自己一點喘息。", 19, 720, 32, CH, "reg")
    c.text(40, 912, "#初萃  #三點的小暫停  #無糖茶", 18, BLUE, "reg", "lm"); c.text(40, 950, "查看全部 86 則留言", 15, (140, 140, 148), "reg", "lm")
    c.save("so-02")

def po01():
    c = C(720, 1000, grad=[(0, TEAL), (1, darken(TEAL, .18))])
    c.ell(360, 430, 250, fill=(255, 255, 255)); c.ell(360, 430, 226, outline=TEAL, width=2)
    for i in range(12):
        a = i / 12 * 2 * math.pi; c.line([(360 + 200 * math.sin(a), 430 - 200 * math.cos(a)), (360 + 218 * math.sin(a), 430 - 218 * math.cos(a))], CH, 3 if i % 3 == 0 else 1.4)
    c.line([(360, 430), (360, 290)], CH, 8); c.line([(360, 430), (470, 430)], PINK, 8); c.ell(360, 430, 12, fill=CH)
    c.text(360, 565, "3:00", 40, TEAL, "serif", "mm")
    c.text(50, 72, "三點的", 70, WHITE, "serif"); c.text(50, 158, "小暫停", 70, WHITE, "serif"); c.line([(54, 250), (170, 250)], (240, 214, 130), 3)
    can(c, 560, 640, 120, 290, GOLD, band=lighten(GOLD, .15))
    c.text(50, 880, "打開，就是暫停。", 30, WHITE, "serif"); c.text(50, 928, "初萃　輕氣泡無糖茶　2027 年 2 月上市", 16, (206, 242, 238), "reg")
    c.bubbles(14, (40, 620, 500, 860), [WHITE], 12, 6, 18)
    c.save("po-01", 720)

def po02():
    c = C(720, 1000, grad=[(0, (252, 226, 236)), (1, (246, 170, 200))])
    for r, col in [(330, WHITE), (270, (255, 240, 246)), (210, WHITE)]: c.ell(360, 400, r, outline=col, width=2)
    c.ell(360, 400, 160, fill=PINK)
    c.text(360, 405, "啵", 230, WHITE, "serif", "mm")
    for i in range(3): c.d.arc(c._p([360 + 150 + i * 34 - 10, 400 - 40 - i * 34, 360 + 150 + i * 34 + 90, 400 + 40 + i * 34]), -50, 50, fill=(255, 255, 255), width=int(3 * SS))
    can(c, 360, 640, 130, 280, TEAL, band=lighten(TEAL, .15))
    c.text(360, 950, "聽見那一聲，就是暫停", 30, (120, 20, 60), "serif", "mm")
    c.bubbles(16, (40, 60, 680, 220), [WHITE], 13, 6, 16)
    c.save("po-02", 720)

def rc01():
    c = C(900, 700, bg=WHITE)
    g = 10
    c.rect(g, g, 300, 350, fill=(252, 226, 120), r=10)
    for i in range(8):
        a = i / 8 * math.pi; c.line([(155 - 110 * math.cos(a), 180 - 110 * math.sin(a)), (155 + 110 * math.cos(a), 180 + 110 * math.sin(a))], (255, 250, 214), 2)
    c.ell(155, 180, 110, outline=(255, 250, 214), width=8); c.ell(155, 180, 92, outline=(250, 200, 60), width=2)
    c.rect(310, g, 600, 200, fill=BLUE, r=10)
    for i in range(0, 300, 34): c.rect(310 + i, g, 310 + i + 16, 200, fill=(255, 255, 255))
    c.rect(610, g, 890, 350, fill=TEAL, r=10)
    for (x, y, a, L) in [(640, 80, -30, 140), (720, 200, -70, 140), (800, 110, -110, 120), (700, 60, 20, 100), (780, 290, -140, 130)]: leaf(c, x, y, L, a, (200, 242, 236))
    c.rect(310, 210, 600, 350, fill=(255, 214, 224), r=10)
    for x in range(330, 600, 50):
        for y in range(230, 340, 50): c.ell(x + 10, y + 10, 14, fill=PINK)
    c.grad((g, 360, 440, 690), [(0, (255, 196, 140)), (.5, (250, 140, 160)), (1, (150, 110, 200))], "v", r=10); c.ell(225, 520, 70, fill=(255, 244, 214))
    c.rect(450, 360, 690, 690, fill=(226, 244, 252), r=10)
    for (x, y) in [(480, 400), (570, 440), (500, 520), (600, 560), (530, 620), (470, 600)]: c.rect(x, y, x + 62, y + 62, fill=(246, 252, 254), r=10, outline=(190, 226, 242), width=2)
    c.rect(700, 360, 890, 690, fill=(248, 240, 222), r=10)
    c.ell(795, 470, 54, fill=GOLD); c.ell(795, 470, 34, fill=(248, 240, 222)); c.rect(740, 560, 850, 640, fill=CH, r=6); c.text(795, 600, "清爽", 28, WHITE, "serif", "mm")
    c.save("rc-01")

def rc02():
    c = C(900, 700, bg=WHITE); rnd = random.Random(21)
    tiles = [((10, 10, 300, 360), "霧面鋁", [(0, (214, 216, 220)), (.5, (240, 241, 243)), (1, (196, 198, 204))], "h"),
             ((310, 10, 590, 250), "紙張紋理", [(0, (250, 244, 228)), (1, (240, 230, 206))], "v"),
             ((600, 10, 890, 360), "金箔", [(0, (196, 168, 96)), (.45, (236, 214, 150)), (1, (157, 131, 62))], "h"),
             ((310, 260, 590, 360), "磨砂玻璃", [(0, (226, 242, 250)), (1, (196, 226, 240))], "v"),
             ((10, 370, 340, 690), "茶葉", [(0, (20, 110, 92)), (1, (8, 70, 62))], "v"),
             ((350, 370, 620, 690), "水珠", [(0, (188, 226, 242)), (1, (120, 190, 222))], "v"),
             ((630, 370, 890, 690), "棉麻布", [(0, (238, 232, 222)), (1, (220, 212, 198))], "v")]
    for (x0, y0, x1, y1), n, st, ax in tiles:
        c.grad((x0, y0, x1, y1), st, ax, r=10)
    for i in range(0, 350, 3): c.line([(10, 10 + i), (300, 10 + i)], (255, 255, 255), .5)
    for _ in range(260): x, y = rnd.uniform(320, 580), rnd.uniform(20, 240); c.ell(x, y, .9, fill=(200, 184, 150))
    for _ in range(320): x, y = rnd.uniform(640, 880), rnd.uniform(380, 680); c.line([(x, y), (x + rnd.uniform(6, 20), y)], (206, 198, 182), 1)
    for (x, y, a) in [(60, 420, 20), (180, 500, -20), (260, 420, 60), (90, 600, -50), (230, 610, 10), (150, 420, -70)]: leaf(c, x, y, 100, a, (40, 160, 120))
    for _ in range(18):
        x, y, r = rnd.uniform(370, 600), rnd.uniform(390, 670), rnd.uniform(9, 22); c.ell(x, y, r, fill=(214, 240, 252), outline=(250, 254, 255), width=1.6); c.ell(x - r * .3, y - r * .3, r * .22, fill=WHITE)
    for _ in range(140): x, y = rnd.uniform(620, 880), rnd.uniform(20, 350); c.ell(x, y, 1.2, fill=lighten(GOLD, .55))
    for (x0, y0, x1, y1), n, st, ax in tiles:
        dark = n in ("茶葉", "金箔"); c.rect(x0 + 14, y1 - 42, x0 + 14 + c.tw(n, 17) + 22, y1 - 14, fill=(255, 255, 255), r=14); c.text(x0 + 25, y1 - 28, n, 17, CH, "sans", "lm")
    c.save("rc-02")

def persona(name, fn, tint, col, age, job, traits, quote, hair, shirt, style, skin):
    c = C(720, 900, bg=WHITE)
    c.rect(0, 0, 720, 400, fill=tint); c.ell(360, 300, 200, fill=lighten(col, .78)); c.ell(360, 300, 150, fill=lighten(col, .62))
    person(c, 360, 420, 2.05, skin=skin, shirt=shirt, hair=hair, hairstyle=style)
    c.bubbles(10, (40, 40, 680, 280), [lighten(col, .3)], hash(name) % 50, 5, 14)
    c.text(50, 440, name, 48, CH, "serif"); c.text(50, 508, f"{age} 歲　{job}", 21, (110, 110, 118), "sans"); c.line([(54, 552), (130, 552)], col, 3)
    x = 50
    for t in traits:
        w = c.tw(t, 17) + 30; c.rect(x, 574, x + w, 608, outline=col, r=17, width=1.6); c.text(x + 15, 591, t, 17, darken(col, .25), "sans", "lm"); x += w + 10
    c.text(46, 640, "“", 70, col, "serif"); c.wrap(50, 694, quote, 25, 620, 42, CH, "serif")
    c.save(fn, 720)

def ca03():
    c = C(900, 600, bg=(250, 250, 249)); base = 470
    c.line([(40, base), (860, base)], LG, 2)
    specs = [(110, (126, 146, 176), "無糖茶 A", "零糖"), (236, (150, 130, 106), "無糖茶 B", "零卡"), (362, (112, 150, 126), "無糖茶 C", "健康"), (488, (90, 140, 176), "氣泡水 A", "爽快"), (614, (176, 120, 120), "氣泡水 B", "刺激")]
    for x, col, n, tag in specs:
        can(c, x, base - 250, 82, 250, col, show_text=False); c.rect(x - 41, base - 160, x + 41, base - 100, fill=lighten(col, .7)); c.text(x, base - 130, tag, 16, darken(col, .3), "sans", "mm")
        c.text(x, base + 30, n, 16, CH, "sans", "mm")
    c.dashed(700, base - 290, 850, base + 12, GOLD, 2.6)
    can(c, 775, base - 250, 82, 250, lighten(TEAL, .75), show_text=False)
    c.text(775, base - 120, "初萃", 22, TEAL, "serif", "mm"); c.text(775, base + 30, "空白位置", 16, GOLD, "sans", "mm")
    c.text(40, 38, "競品罐型與訴求一字排開", 25, CH, "serif"); c.line([(40, 82), (150, 82)], GOLD, 2)
    c.text(40, 100, "競品都在談功能，情緒導向的位置仍然是空的。", 15, (120, 120, 128), "reg")
    c.save("ca-03")

if __name__ == "__main__":
    for fn in (pk01, pk02, pal01, bt01, ls01, ls02, sh01, ad01, so01, so02, po01, po02, rc01, rc02, ca03):
        fn(); print(fn.__name__)
    persona("小雯", "pe-01", (253, 235, 242), PINK, 28, "行銷企劃", ["愛拍照", "重視質感", "講求效率"], "只要離開座位五分鐘，就可以再撐一下。", (60, 40, 40), PINK, "long", (242, 206, 178))
    persona("阿哲", "pe-02", (228, 244, 251), BLUE, 31, "軟體工程師", ["怕太甜", "講求實際", "愛氣泡感"], "不想有罪惡感，可是白開水又太沒感覺。", (40, 40, 48), BLUE, "short", (232, 190, 158))
    persona("佳穎", "pe-03", (224, 245, 243), TEAL, 26, "人資專員", ["重視儀式感", "愛分享", "喜歡好包裝"], "每天下午一定要去茶水間拿一罐。", (90, 60, 40), TEAL, "bun", (244, 210, 184))
    # convert legacy whiteboard jpgs to webp + thumbs
    for i in range(1, 7):
        im = Image.open(f"{OUT}/wb-0{i}.jpg").convert("RGB"); im.save(f"{OUT}/wb-0{i}.webp", quality=80, method=6)
        t = im.copy(); t.thumbnail((240, 240)); t.save(f"{OUT}/t/wb-0{i}.webp", quality=72, method=6)
    print("done")
