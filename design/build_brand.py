import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = sys.argv[1]
FONT = "/tmp/claude-0/fonts/node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff"
f = TTFont(FONT)
gs = f.getGlyphSet()
cmap = f.getBestCmap()
upm = f["head"].unitsPerEm
hmtx = f["hmtx"]

NIGHT, PLUM, VIOLET, LILAC, IVORY = "#130F18", "#38213F", "#8F50B5", "#D6A6F5", "#F8F2FF"

def text_path(s, size, x, y, tracking=0):
    """Outlined text; returns (path d, advance width). y is baseline."""
    scale = size / upm
    pen = SVGPathPen(gs)
    cx = 0
    for ch in s:
        name = cmap[ord(ch)]
        tp = TransformPen(pen, (scale, 0, 0, -scale, x + cx, y))
        gs[name].draw(tp)
        cx += hmtx[name][0] * scale + tracking
    return pen.getCommands(), cx - tracking

# ---- Symbol: "Emerge" E built from sound bars (viewBox 0 0 72 64) ----
def symbol(c_spine, c_top, c_mid, c_bot, ox=0, oy=0, s=1.0):
    def r(x, y, w, h):
        return (f'<rect x="{ox + x*s:.2f}" y="{oy + y*s:.2f}" width="{w*s:.2f}" height="{h*s:.2f}" rx="{5*s:.2f}"')
    return (r(4, 6, 10, 52) + f' fill="{c_spine}"/>'
            + r(20, 6, 32, 10) + f' fill="{c_top}"/>'
            + r(20, 27, 22, 10) + f' fill="{c_mid}"/>'
            + r(20, 48, 48, 10) + f' fill="{c_bot}"/>')

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')

def write(name, content):
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(content)

# ---------- Symbol variants ----------
write("symbol.svg", svg(72, 64, symbol(IVORY, LILAC, VIOLET, LILAC), "Emerg Music symbol"))
write("symbol-mono-night.svg", svg(72, 64, symbol(NIGHT, NIGHT, NIGHT, NIGHT), "Emerg Music symbol, one color"))
write("symbol-mono-ivory.svg", svg(72, 64, symbol(IVORY, IVORY, IVORY, IVORY), "Emerg Music symbol, one color"))

# ---------- Wordmark ----------
SZ = 52
d_emerg, w_emerg = text_path("Emerg", SZ, 0, 0, tracking=-1)
d_music, w_music = text_path("Music", SZ * 0.62, 0, 0, tracking=4)

def horizontal(sym_cols, c_main, c_sub, name, title, bg=None):
    # symbol scaled to cap-height block, wordmark to the right
    sx = 1.0
    wm_x = 72 + 24
    body = ""
    if bg:
        body += f'<rect width="100%" height="100%" fill="{bg}"/>'
    body += symbol(*sym_cols, ox=0, oy=0, s=sx)
    body += f'<path transform="translate({wm_x},50)" fill="{c_main}" d="{d_emerg}"/>'
    body += f'<path transform="translate({wm_x + w_emerg + 12},50)" fill="{c_sub}" d="{d_music}"/>'
    W = int(wm_x + w_emerg + 14 + w_music + 4)
    write(name, svg(W, 64, body, title))

horizontal((IVORY, LILAC, VIOLET, LILAC), IVORY, LILAC, "logo-horizontal.svg", "Emerg Music")
horizontal((NIGHT,) * 4, NIGHT, NIGHT, "logo-horizontal-mono-night.svg", "Emerg Music")
horizontal((IVORY,) * 4, IVORY, IVORY, "logo-horizontal-mono-ivory.svg", "Emerg Music")
horizontal((NIGHT, VIOLET, PLUM, VIOLET), NIGHT, VIOLET, "logo-horizontal-on-light.svg", "Emerg Music")

# ---------- Primary (stacked) ----------
d_e2, w_e2 = text_path("Emerg", 84, 0, 0, tracking=-1.5)
d_m2, w_m2 = text_path("Music", 84 * 0.5, 0, 0, tracking=14)
W = 420
body = f'<rect width="{W}" height="300" fill="{NIGHT}"/>'
body += symbol(IVORY, LILAC, VIOLET, LILAC, ox=(W - 72*1.5)/2, oy=28, s=1.5)
body += f'<path transform="translate({(W - w_e2)/2},192)" fill="{IVORY}" d="{d_e2}"/>'
body += f'<path transform="translate({(W - w_m2)/2},240)" fill="{LILAC}" d="{d_m2}"/>'
write("logo-primary.svg", svg(W, 300, body, "Emerg Music"))

# ---------- App icon (1024 master, full-bleed square; OS masks corners) ----------
def app_icon(size, rounded):
    k = size / 1024
    rx = 224 * k if rounded else 0
    s = 7.4 * k
    ox = (size - 72 * s) / 2
    oy = (size - 64 * s) / 2
    body = f'<rect width="{size}" height="{size}" rx="{rx:.1f}" fill="{NIGHT}"/>'
    body += symbol(IVORY, LILAC, VIOLET, LILAC, ox=ox, oy=oy, s=s)
    return svg(size, size, body, "Emerg Music app icon")
write("app-icon.svg", app_icon(1024, True))
write("app-icon-maskable.svg", app_icon(1024, False))

# ---------- Favicon (simplified: bolder bars, 3 bars read at 16px) ----------
fav = (f'<rect width="64" height="64" rx="14" fill="{NIGHT}"/>'
       f'<rect x="12" y="12" width="10" height="40" rx="4" fill="{IVORY}"/>'
       f'<rect x="26" y="12" width="26" height="9" rx="4" fill="{LILAC}"/>'
       f'<rect x="26" y="27.5" width="18" height="9" rx="4" fill="{VIOLET}"/>'
       f'<rect x="26" y="43" width="26" height="9" rx="4" fill="{LILAC}"/>')
write("favicon.svg", svg(64, 64, fav, "Emerg Music"))

# ---------- Concept comparison sheet ----------
def concept_a():
    return symbol(IVORY, LILAC, VIOLET, LILAC, ox=4, oy=4, s=1.4)

def concept_b():
    hs = [22, 36, 52, 40, 28]
    out = ""
    for i, h in enumerate(hs):
        x = 6 + i * 16
        out += f'<rect x="{x}" y="{70 - h/2 - 10:.1f}" width="9" height="{h}" rx="4.5" fill="{LILAC if i != 2 else IVORY}"/>'
    out += f'<circle cx="92" cy="60" r="5" fill="{VIOLET}"/>'
    return out

def concept_c():
    return (f'<circle cx="52" cy="60" r="44" fill="none" stroke="{VIOLET}" stroke-width="8"/>'
            f'<rect x="34" y="40" width="10" height="40" rx="4" fill="{IVORY}"/>'
            f'<rect x="48" y="40" width="22" height="9" rx="4" fill="{LILAC}"/>'
            f'<rect x="48" y="55.5" width="16" height="9" rx="4" fill="{LILAC}"/>'
            f'<rect x="48" y="71" width="22" height="9" rx="4" fill="{LILAC}"/>')

def tile(x, label, art):
    return (f'<g transform="translate({x},0)"><rect width="260" height="200" rx="16" fill="{PLUM}" fill-opacity="0.45"/>'
            f'<g transform="translate(60,16)">{art}</g>'
            f'<text x="130" y="176" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" fill="{IVORY}">{label}</text></g>')

sheet = f'<rect width="820" height="200" fill="{NIGHT}"/>'
sheet += tile(0, "A  Sound-bar E", concept_a())
sheet += tile(280, "B  Rising waveform", concept_b())
sheet += tile(560, "C  Ring and E", concept_c())
write("concepts-comparison.svg", svg(820, 200, sheet, "Three Emerg Music logo concepts"))
print("ok", os.listdir(OUT))
