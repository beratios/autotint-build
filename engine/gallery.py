"""Build extra listing images for a product: zoom x2, variants, mockup, fields, what-you-get.
python3 gallery.py <product_id>   (config in products/<id>.json -> "gallery")"""
import sys, json, pathlib
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from render import *

def build(pid):
    p = load_product(pid); g = p["gallery"]; st = g["style"]
    out = ROOT / "gallery" / pid; out.mkdir(parents=True, exist_ok=True)
    # variants: render 3 versions
    vimgs = []
    for i, d in enumerate(g["variants"]):
        fulfill(pid, d, out / f"v{i}")
        vimgs.append(str(sorted((out / f"v{i}").glob("*.png"))[0].resolve()))
    sample = vimgs[0]
    W, H = Image.open(sample).size
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = b.new_page(viewport={"width": 2400, "height": 1800})
        fh = 1500; fw = fh * W / H
        D = 1000
        for k, z in enumerate(g["zooms"]):
            cx, cy, frac = z["x"], z["y"], z.get("frac", 0.3)
            s = D / (frac * W)
            ctx = dict(st, img=sample, fw=fw, D=D, lx=int(min(140 + fw + 150, 2400 - D - 90)), bgw=W * s, bgh=H * s,
                       bx=-(cx * W * s - D / 2), by=-(cy * H * s - D / 2),
                       mr=frac * fw / 2, mx=140 + cx * fw - frac * fw / 2, my=150 + cy * fh - frac * fw / 2,
                       caption=z["caption"], sub=z.get("sub", "Crisp 300 DPI print quality"))
            render(pg, html_for("g_zoom.html", ctx), out / f"zoom{k+1}.png")
        render(pg, html_for("g_variants.html", dict(st, imgs=vimgs, vh=int(min(1250, 2140/(3*W/H))), title=g.get("vtitle", "Your names. Your details."),
               foot=g.get("vfoot", "Examples – every order is designed with YOUR text"))), out / "variants.png")
        render(pg, html_for("g_mockup.html", dict(st, img=vimgs[1])), out / "mockup.png")
        render(pg, html_for("g_fields.html", dict(st, img=sample, fields=g["fields"], px=int(220 + fw + 140))), out / "fields.png")
        render(pg, html_for("g_get.html", dict(st, size=g["size"])), out / "get.png")
        b.close()
    print("gallery", out)

if __name__ == "__main__":
    for pid in sys.argv[1:]: build(pid)
