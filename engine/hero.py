"""Hero (first listing photo) A/B styles.
python3 hero.py <product_id> <style> [out.png]
styles: colorful, calm, detailed, minimal, bold, doodle
Product json needs "hero": {"headline": "...", "short": "...", "bullets": [3 items]}; uses gallery.zooms for 'detailed'."""
import sys, json, pathlib
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from render import *

STYLES = ["colorful", "calm", "detailed", "minimal", "bold", "doodle"]

def sample_png(pid):
    d = ROOT / "samples" / pid
    if not d.exists() or not list(d.glob("*.png")):
        fulfill(pid, {}, d)
    return str(sorted(d.glob("*.png"))[0].resolve())

def build(pid, style, out=None):
    p = load_product(pid); h = p["hero"]; g = p.get("gallery", {})
    img = sample_png(pid)
    W, H = Image.open(img).size
    words = h["headline"].split()
    cut = max(1, len(words) // 2)
    ctx = dict(img=img, headline=h["headline"], short=h.get("short", h["headline"]), bullets=h["bullets"],
               headline_first=" ".join(words[:cut]), headline_rest=" ".join(words[cut:]),
               accent=g.get("style", {}).get("accent", "#e63946"))
    if style == "detailed":
        fh = 1440; fw = fh * W / H; D = 500
        ctx.update(fw=fw, zx=int(90 + fw + 60))
        zs = []
        for z in g.get("zooms", [])[:2]:
            s = D / (z.get("frac", .3) * W)
            zs.append(dict(bgw=W * s, bgh=H * s, bx=-(z["x"] * W * s - D / 2), by=-(z["y"] * H * s - D / 2), caption=z["caption"]))
        ctx["zooms"] = zs
    if style == "doodle":
        ctx["fw"] = 1380 * W / H
    out = out or str(ROOT / "gallery" / pid / f"hero-{style}.png")
    pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = b.new_page(viewport={"width": 2400, "height": 1800})
        render(pg, html_for(f"hero_{style}.html", ctx), out)
        b.close()
    return out

if __name__ == "__main__":
    print(build(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None))
