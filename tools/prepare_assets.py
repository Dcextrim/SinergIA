"""Genera los recursos de public/ a partir de los SVG de la campana (Canva).

Cada SVG trae la foto (RGB) y su mascara (L) incrustadas en base64; aqui se
combinan en WebP transparente y se normaliza el tamano de cabeza para que la
fila de siluetas quede pareja.

Uso: python -X utf8 tools/prepare_assets.py ../Imagenes public
"""
import base64, io, re, sys, pathlib, zipfile
from PIL import Image, ImageDraw, ImageFilter

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])
PAT = re.compile(rb"data:image/(?:png|jpe?g);base64,([A-Za-z0-9+/=\s]+)")

# svg -> (id, altura de la cabeza como fraccion de la altura del recorte, medida a ojo)
MEMBERS = {
    2: ("cindy", 0.20), 4: ("sarah", 0.26), 6: ("raul", 0.25), 7: ("javier", 0.23),
    8: ("sebastian", 0.24), 9: ("nathalia-escobar", 0.19), 10: ("nathalia-caceres", 0.21),
    11: ("fabian", 0.23), 12: ("daniel", 0.23), 13: ("natalia-roches", 0.20),
}
HEAD = 0.22  # fraccion de cabeza en la salida: muestra de la cabeza a la cintura
SIZES = {"lg": 1400, "sm": 640}  # alto en px


def embedded(n):
    data = n if isinstance(n, bytes) else (SRC / f"{n}.svg").read_bytes()
    return [Image.open(io.BytesIO(base64.b64decode(re.sub(rb"\s", b"", m.group(1)))))
            for m in PAT.finditer(data)]


def black_mouth(r):
    """Byte: pinta de negro el interior de la boca del disfraz (se veia la cara de quien lo lleva) y deja los
    dientes. Coordenadas medidas en la foto de 2.svg (1200x1600); dentro de la elipse se oscurece lo oscuro
    o color piel, y se rellenan los reflejos horizontales del plastico."""
    TEETH = 585  # arriba de esta fila estan los dientes superiores: ahi solo cuentan los huecos oscuros
    region = Image.new("L", r.size, 0)
    ImageDraw.Draw(region).ellipse((503, 574, 610, 625), fill=255)
    px, rp = r.load(), region.load()
    mouth = Image.new("L", r.size, 0)
    mp = mouth.load()
    for y in range(570, 630):
        for x in range(495, 615):
            if rp[x, y]:
                R, G, B = px[x, y]
                lum = 0.299 * R + 0.587 * G + 0.114 * B
                if (lum < 110) if y < TEETH else (lum < 150 or R - B > 45):
                    mp[x, y] = 255
    mouth = mouth.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    col = mouth.load()
    for x in range(495, 615):
        ys = [y for y in range(TEETH, 630) if col[x, y]]
        for a, b in zip(ys, ys[1:]):
            if 1 < b - a <= 12:
                for y in range(a, b):
                    col[x, y] = 255
    mouth = Image.composite(mouth, Image.new("L", r.size, 0), region)
    r.paste((20, 14, 26), mask=mouth)


def cutout(n, pick=0, edit=None):
    """pick-esimo par foto+mascara del SVG (n = numero en SRC o el SVG en bytes; 19.svg trae el logo y luego a Byte).
    `edit` retoca la foto en su tamano original, antes de recortar."""
    ims = embedded(n)
    masks = [i for i in ims if i.mode == "L"]
    found = []
    for m in masks:
        for r in ims:
            if r.mode == "RGB" and r.size == m.size and min(r.size) > 800:
                if edit:
                    edit(r)
                rgba = r.convert("RGBA")
                rgba.putalpha(m)
                found.append(rgba.crop(m.point(lambda v: 255 if v > 20 else 0).getbbox()))
                break
    if len(found) <= pick:
        raise SystemExit(f"{n}.svg: no encontre foto+mascara #{pick}")
    return found[pick]


def save(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=82, method=6)


def cut_side(alpha, x):
    """True si la persona toca ese borde (foto cortada en brazos u hombros): la app lo desvanece."""
    col = [alpha.getpixel((x, y)) > 128 for y in range(0, alpha.height, 2)]
    return sum(col) / len(col) > 0.05


# Byte con el disfraz (aletas abajo): viene en un zip de Canva junto a SRC. "Cabeza" = 0.135 deja
# del hocico a la cintura, como los recortes de los miembros.
with zipfile.ZipFile(SRC.parent / "Diseño sin título.zip") as z:
    BYTE_SVG = z.read("2.svg")
MEMBERS[BYTE_SVG] = ("byte", 0.135)

meta = {}
for n, (mid, head) in MEMBERS.items():
    im = cutout(n, edit=black_mouth if mid == "byte" else None)
    h = round(im.height * head / HEAD)  # alto normalizado para que la cabeza ocupe HEAD
    body = im.crop((0, 0, im.width, min(h, im.height)))
    a = body.getchannel("A")
    meta[mid] = {
        # si el recorte es mas corto que el alto normalizado, la escena lo dibuja a esta fraccion de la fila
        "h": round(body.height / h, 4),
        "cutL": cut_side(a, 0),
        "cutR": cut_side(a, body.width - 1),
    }
    for tag, H in SIZES.items():
        out = body.resize((round(body.width * H / body.height), H), Image.LANCZOS)
        assert out.mode == "RGBA" and out.getchannel("A").getextrema()[0] == 0, mid
        save(out, OUT / "members" / f"{mid}-{tag}.webp")
    print(mid, body.size, meta[mid])

import json
(pathlib.Path(__file__).parent.parent / "src" / "data" / "member-meta.json").write_text(json.dumps(meta, indent=2))

# logo sticker, borde blanco
logo = cutout(1)
logo.thumbnail((640, 640))
save(logo, OUT / "brand" / "logo.webp")
logo.thumbnail((64, 64))
logo.save(OUT / "favicon.png")

# Byte en pixel art (sticker de la pieza de Vision), para la intro
byte = cutout(19, pick=1)
byte.thumbnail((480, 480), Image.NEAREST)  # NEAREST: conserva los pixeles duros
save(byte, OUT / "brand" / "byte.webp")
print("listo")
