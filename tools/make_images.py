"""Generate illustrated whiteboard / collage images for the Pitcherest demo (no external assets)."""
import random, math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img")
os.makedirs(OUT, exist_ok=True)
SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
SANSR = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
SS = 2  # supersample

INK = (38, 44, 58); GREEN = (52, 110, 92); ORANGE = (214, 122, 54); BLUE = (52, 92, 150); GREY = (120, 124, 130)

def font(size, bold=True):
    return ImageFont.truetype(SANS if bold else SANSR, int(size * SS), index=2)  # index 2 = TC in the ttc

def wob(pts, amp=1.4, seg=12):
    out = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        d = math.hypot(x1 - x0, y1 - y0); n = max(2, int(d / seg))
        for i in range(n):
            t = i / n
            out.append((x0 + (x1 - x0) * t + random.uniform(-amp, amp), y0 + (y1 - y0) * t + random.uniform(-amp, amp)))
    out.append(pts[-1]); return out

class Board:
    def __init__(self, w, h, bg=(243, 241, 236)):
        self.w, self.h = w, h
        self.img = Image.new("RGB", (w * SS, h * SS), bg)
        # soft light gradient + reflection band
        g = Image.new("L", (w * SS, h * SS), 0); gd = ImageDraw.Draw(g)
        for y in range(h * SS):
            gd.line([(0, y), (w * SS, y)], fill=int(26 * (y / (h * SS))))
        self.img = ImageChops.subtract(self.img, Image.merge("RGB", (g, g, g)))
        refl = Image.new("L", (w * SS, h * SS), 0); rd = ImageDraw.Draw(refl)
        rd.polygon([(w * .55 * SS, 0), (w * .75 * SS, 0), (w * .35 * SS, h * SS), (w * .15 * SS, h * SS)], fill=22)
        refl = refl.filter(ImageFilter.GaussianBlur(40 * SS))
        self.img = ImageChops.add(self.img, Image.merge("RGB", (refl, refl, refl)))
        self.d = ImageDraw.Draw(self.img)
        # board frame edge
        self.d.rectangle([0, 0, w * SS - 1, h * SS - 1], outline=(200, 198, 192), width=6 * SS)
        # faint ghost marks (erased writing)
        for _ in range(14):
            x, y = random.randint(40, w - 40), random.randint(40, h - 40)
            self.line([(x, y), (x + random.randint(40, 120), y + random.randint(-14, 14))], (226, 224, 219), 6)

    def line(self, pts, col=INK, width=3, amp=1.3):
        p = [(x * SS, y * SS) for x, y in wob(pts, amp)]
        self.d.line(p, fill=col, width=int(width * SS), joint="curve")
        r = width * SS / 2
        for x, y in (p[0], p[-1]):
            self.d.ellipse([x - r, y - r, x + r, y + r], fill=col)

    def ellipse(self, cx, cy, rx, ry, col=INK, width=3, fill=None):
        pts = []
        for i in range(0, 380, 10):
            a = math.radians(i + random.uniform(-2, 2)); k = 1 + random.uniform(-.015, .015)
            pts.append((cx + rx * k * math.cos(a), cy + ry * k * math.sin(a)))
        if fill:
            self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)
        self.line(pts, col, width, .6)

    def rect(self, x, y, w, h, col=INK, width=3, fill=None):
        if fill: self.d.rectangle([x * SS, y * SS, (x + w) * SS, (y + h) * SS], fill=fill)
        self.line([(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x - 2, y - 1)], col, width)

    def text(self, x, y, s, size=26, col=INK, bold=True, anchor="l", rot=0, jitter=True):
        f = font(size, bold)
        tw = sum(self.d.textlength(c, font=f) for c in s) / SS
        if anchor == "c": x -= tw / 2
        layer = Image.new("RGBA", (int((tw + size * 2) * SS), int(size * 2.4 * SS)), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        cx = size * SS * .6
        for c in s:
            ch = Image.new("RGBA", (int(size * 2 * SS), int(size * 2 * SS)), (0, 0, 0, 0))
            ImageDraw.Draw(ch).text((size * .4 * SS, size * .3 * SS), c, font=f, fill=col + (235,))
            if jitter: ch = ch.rotate(random.uniform(-3, 3), resample=Image.BICUBIC)
            layer.alpha_composite(ch, (int(cx - size * .4 * SS), int(size * .3 * SS + (random.uniform(-1.4, 1.4) * SS if jitter else 0))))
            cx += ld.textlength(c, font=f) * 1.02
        if rot: layer = layer.rotate(rot, expand=True, resample=Image.BICUBIC)
        self.img.paste(layer, (int(x * SS - size * .6 * SS), int(y * SS - size * .3 * SS)), layer)
        self.d = ImageDraw.Draw(self.img)

    def arrow(self, a, b, col=INK, width=3):
        self.line([a, b], col, width)
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        for s in (-.45, .45):
            self.line([b, (b[0] - 16 * math.cos(ang + s), b[1] - 16 * math.sin(ang + s))], col, width)

    def cross(self, cx, cy, r, col=ORANGE, width=4):
        self.line([(cx - r, cy - r * .8), (cx + r, cy + r * .8)], col, width)
        self.line([(cx + r * .9, cy - r * .8), (cx - r * .9, cy + r * .7)], col, width)

    def star(self, cx, cy, r, col=ORANGE, fill=None):
        pts = []
        for i in range(11):
            rr = r if i % 2 == 0 else r * .45; a = -math.pi / 2 + i * math.pi / 5
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        if fill: self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)
        self.line(pts, col, 3)

    def sticky(self, x, y, w, h, color, lines, size=22, rot=-2, tcol=INK):
        pad = 14
        layer = Image.new("RGBA", ((w + 40) * SS, (h + 40) * SS), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        sh = Image.new("RGBA", layer.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle([24 * SS, 26 * SS, (w + 18) * SS, (h + 20) * SS], fill=(0, 0, 0, 55))
        sh = sh.filter(ImageFilter.GaussianBlur(6 * SS)); layer.alpha_composite(sh)
        ld.rectangle([20 * SS, 20 * SS, (w + 20) * SS, (h + 20) * SS], fill=color)
        ld.rectangle([20 * SS, (h + 8) * SS, (w + 20) * SS, (h + 20) * SS], fill=tuple(max(0, c - 10) for c in color))
        f = font(size)
        for i, s in enumerate(lines):
            ld.text(((20 + pad) * SS, (20 + pad + i * size * 1.45) * SS), s, font=f, fill=tcol + (225,))
        layer = layer.rotate(rot, expand=True, resample=Image.BICUBIC)
        self.img.paste(layer, (int((x - 20) * SS), int((y - 20) * SS)), layer)
        self.d = ImageDraw.Draw(self.img)

    def tape(self, x, y, w=70, rot=-8):
        layer = Image.new("RGBA", (w * SS, 26 * SS), (232, 222, 190, 170)); layer = layer.rotate(rot, expand=True)
        self.img.paste(layer, (int(x * SS), int(y * SS)), layer); self.d = ImageDraw.Draw(self.img)

    def save(self, name):
        im = self.img.resize((self.w, self.h), Image.LANCZOS)
        # sensor noise
        noise = Image.effect_noise((self.w, self.h), 9).convert("RGB")
        im = Image.blend(im, ImageChops.multiply(im, noise.point(lambda v: 235 + v // 16)), .35)
        im = im.filter(ImageFilter.GaussianBlur(.4))
        im.save(os.path.join(OUT, name), quality=82, optimize=True, progressive=True)

def wb01():
    random.seed(1); b = Board(900, 675)
    b.text(40, 34, "洞察聚焦：下午三點", 30, INK)
    b.line([(40, 78), (330, 80)], GREEN, 3)
    cx, cy = 450, 360
    b.ellipse(cx, cy, 110, 62, GREEN, 4, fill=(232, 241, 236)); b.text(cx, cy - 20, "下午三點", 32, GREEN, anchor="c")
    nodes = [(170, 190, "想離開座位"), (720, 180, "不想有負擔"), (130, 470, "無糖茶很無聊"), (740, 470, "需要一個儀式"), (450, 590, "開罐的那一聲")]
    for x, y, t in nodes:
        b.line([(cx + (x - cx) * .28, cy + (y - cy) * .28 * 1.15), (x + (cx - x) * .18, y + (cy - y) * .22)], GREY, 2.5)
        b.ellipse(x, y, 98, 34, INK, 2.6); b.text(x, y - 14, t, 22, INK, anchor="c")
    b.sticky(630, 52, 230, 92, (250, 226, 120), ["我們賣的", "是一段暫停"], 25, 3)
    b.sticky(60, 560, 190, 78, (196, 226, 214), ["25–34 歲", "都會上班族"], 21, -3)
    b.star(810, 600, 22, ORANGE)
    b.save("wb-01.jpg")

def wb02():
    random.seed(2); b = Board(900, 675)
    b.text(40, 30, "競品定位地圖", 30, INK)
    b.arrow((80, 360), (850, 360), INK, 3); b.arrow((465, 620), (465, 90), INK, 3)
    b.text(90, 388, "功能導向", 20, GREY); b.text(850, 388, "情緒導向", 20, GREY, anchor="c")
    b.text(480, 92, "新奇風味", 20, GREY); b.text(480, 600, "傳統風味", 20, GREY)
    for x, y, t in [(190, 450, "無糖茶 A"), (250, 520, "無糖茶 B"), (150, 560, "無糖茶 C"), (270, 250, "氣泡水 A"), (200, 180, "氣泡水 B")]:
        b.ellipse(x, y, 13, 13, BLUE, 3, fill=(214, 226, 243)); b.text(x + 22, y - 12, t, 19, BLUE)
    b.ellipse(650, 200, 120, 90, ORANGE, 2.6); b.line([(575, 150), (720, 255)], (236, 196, 160), 1.5)
    b.star(650, 210, 34, ORANGE, fill=(250, 228, 196)); b.text(650, 262, "初萃", 26, ORANGE, anchor="c")
    b.sticky(620, 420, 230, 100, (250, 226, 120), ["這一區", "目前沒有人"], 25, 3)
    b.arrow((700, 425), (670, 315), ORANGE, 3)
    b.text(60, 630, "大家都擠在功能那一側", 20, INK, bold=False)
    b.save("wb-02.jpg")

def wb03():
    random.seed(3); b = Board(900, 675)
    b.text(40, 30, "創意發想：三個方向", 30, INK)
    cols = [(60, "A", "三點的小暫停", GREEN, (196, 226, 214)), (335, "B", "復古台式茶室", BLUE, (206, 221, 242)), (610, "C", "插畫家聯名", ORANGE, (250, 219, 190))]
    for x, k, t, col, bg in cols:
        b.line([(x, 110), (x + 235, 112)], col, 3); b.text(x, 80, f"方向 {k}", 22, col)
        b.text(x, 128, t, 26, INK)
    b.sticky(60, 200, 220, 96, (250, 226, 120), ["打開", "就是暫停"], 26, -2)
    b.sticky(70, 330, 200, 84, (196, 226, 214), ["開罐聲「啵」", "當作記憶點"], 21, 2)
    b.sticky(80, 450, 210, 84, (250, 226, 120), ["30 秒影片系列", "三點鐘的三十秒"], 20, -1)
    b.star(270, 185, 22, ORANGE, fill=(250, 228, 196))
    b.sticky(340, 210, 210, 84, (206, 221, 242), ["老茶行的", "現代版本"], 22, 2)
    b.sticky(350, 340, 200, 84, (236, 236, 232), ["場景重建", "預算很高？"], 21, -2)
    b.sticky(625, 215, 210, 84, (250, 219, 190), ["每季換一位", "插畫家"], 22, -2)
    b.sticky(640, 345, 200, 84, (236, 236, 232), ["量產時程", "來得及嗎？"], 21, 2)
    b.arrow((180, 580), (180, 545), GREEN, 3); b.text(60, 600, "團隊傾向 A，B、C 再評估", 21, INK, bold=False)
    b.save("wb-03.jpg")

def wb04():
    random.seed(4); b = Board(900, 675)
    b.text(40, 30, "被淘汰的方向", 30, INK); b.line([(40, 76), (300, 78)], ORANGE, 3)
    rows = [("零負擔運動風", "跟競品太像"), ("復古台式茶室", "偏長輩、製作費高"), ("插畫家聯名包裝", "趕不上量產時程"), ("氣泡擬人化角色", "偏兒童、不符定位")]
    for i, (t, why) in enumerate(rows):
        y = 150 + i * 120
        b.rect(60, y - 10, 34, 34, INK, 2.6); b.cross(77, y + 7, 18, ORANGE, 4)
        b.text(120, y - 12, t, 30, GREY); b.line([(115, y + 6), (115 + len(t) * 34, y + 8)], ORANGE, 3)
        b.arrow((120 + len(t) * 34 + 26, y + 6), (120 + len(t) * 34 + 80, y + 6), GREY, 2.5) if False else None
        b.text(130, y + 34, why, 22, INK, bold=False)
    b.sticky(650, 420, 210, 100, (250, 226, 120), ["都留著備查", "別丟掉！"], 25, 3)
    b.tape(700, 404, 70, -6)
    b.save("wb-04.jpg")

def wb05():
    random.seed(5); W, H = 750, 940
    b = Board(W, H, bg=(238, 234, 226))
    sw = [((176, 203, 186), "茶霧綠"), ((232, 222, 196), "米白"), ((226, 177, 104), "琥珀"), ((96, 132, 118), "深茶"), ((244, 240, 232), "氣泡白")]
    for i, (c, n) in enumerate(sw):
        x = 50 + i * 130
        b.rect(x, 50, 112, 160, (200, 196, 188), 1.5, fill=c); b.text(x + 56, 222, n, 17, GREY, anchor="c", jitter=False)
    # bubbles collage
    lay = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    ld.rectangle([50 * SS, 290 * SS, 380 * SS, 620 * SS], fill=(176, 203, 186, 255))
    for _ in range(46):
        r = random.randint(5, 26); x, y = random.randint(60, 370), random.randint(300, 610)
        ld.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], outline=(250, 250, 246, 230), width=3 * SS, fill=(255, 255, 255, 50))
    ld.polygon([(410 * SS, 290 * SS), (700 * SS, 290 * SS), (700 * SS, 470 * SS), (520 * SS, 470 * SS)], fill=(226, 177, 104, 255))
    ld.ellipse([560 * SS, 330 * SS, 660 * SS, 430 * SS], fill=(248, 232, 196, 255))
    ld.rectangle([410 * SS, 490 * SS, 700 * SS, 620 * SS], fill=(96, 132, 118, 255))
    for i in range(7):
        ld.line([(430 + i * 38) * SS, 500 * SS, (430 + i * 38 + 20) * SS, 610 * SS], fill=(150, 184, 168, 255), width=4 * SS)
    b.img.paste(lay, (0, 0), lay); b.d = ImageDraw.Draw(b.img)
    b.tape(40, 280, 80, -10); b.tape(640, 280, 70, 12)
    b.text(60, 640, "清晨茶霧", 26, INK); b.text(430, 640, "午後光線", 26, INK)
    b.line([(60, 690), (330, 694)], GREY, 2)
    b.sticky(60, 730, 300, 120, (250, 226, 120), ["關鍵字：", "安靜、透明、微微的氣泡"], 22, -2)
    b.sticky(420, 740, 260, 120, (206, 221, 242), ["避開高彩度", "與冰塊水珠"], 23, 2)
    b.star(690, 900, 20, ORANGE)
    b.save("wb-05.jpg")

def wb06():
    random.seed(6); W, H = 800, 800; b = Board(W, H)
    b.text(40, 30, "包裝草圖", 30, INK); b.line([(40, 76), (190, 78)], GREEN, 3)
    # can silhouette
    cx = 330
    outline = [(cx - 100, 190), (cx - 100, 640), (cx - 88, 672), (cx + 88, 672), (cx + 100, 640), (cx + 100, 190), (cx + 84, 168), (cx - 84, 168), (cx - 100, 190)]
    b.d.polygon([(x * SS, y * SS) for x, y in outline], fill=(214, 228, 220)); b.line(outline, INK, 3.4)
    b.ellipse(cx, 160, 86, 16, INK, 3, fill=(236, 240, 238)); b.ellipse(cx, 160, 26, 6, GREY, 2)
    for yy in (200, 640): b.line([(cx - 98, yy), (cx + 98, yy)], GREY, 1.6)
    b.text(cx, 330, "初萃", 56, GREEN, anchor="c"); b.line([(cx - 50, 410), (cx + 50, 412)], GREEN, 2.5)
    b.text(cx, 430, "輕氣泡無糖茶", 22, INK, anchor="c"); b.text(cx, 600, "350 ml", 18, GREY, anchor="c")
    for i in range(7):
        x, y = cx - 50 + i * 17, 500 + random.randint(-12, 12); b.ellipse(x, y, 6 + i % 3 * 2, 6 + i % 3 * 2, (120, 160, 144), 2)
    b.arrow((560, 230), (440, 185), INK, 2.6); b.text(570, 195, "開罐聲「啵」", 22, INK)
    b.arrow((590, 370), (440, 360), INK, 2.6); b.text(600, 338, "霧面鋁罐", 22, INK); b.text(600, 372, "摸起來很安靜", 18, GREY, bold=False)
    b.arrow((590, 560), (440, 520), INK, 2.6); b.text(600, 540, "細細的氣泡圖樣", 22, INK)
    for i, c in enumerate([(176, 203, 186), (232, 222, 196), (226, 177, 104)]):
        b.rect(560 + i * 62, 650, 50, 50, (170, 168, 160), 1.5, fill=c)
    b.text(560, 715, "主色：茶霧綠", 18, GREY, bold=False)
    b.sticky(40, 640, 190, 92, (250, 226, 120), ["字體要細", "要有留白"], 23, -3)
    b.save("wb-06.jpg")

if __name__ == "__main__":
    for fn in (wb01, wb02, wb03, wb04, wb05, wb06): fn(); print(fn.__name__)
