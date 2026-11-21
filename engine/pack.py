"""One-shot listing image builder.
python3 pack.py <product_id> <hero_style>
Renders sample (samples/<id>), gallery (zoom1/2, variants, mockup, fields, get), hero, a "what's inside"
sheet and a detail image, then writes JPGs (q87) to ../etsy/<id>-<name>.jpg and prints the upload order.
Product json extras used: main_label, extra_pages[].label, inside_sub, detail_page (extra page name), detail_title."""
import sys, json, pathlib, subprocess
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from render import *

ORDER = ["hero", "zoom1", "variants", "mockup", "zoom2", "fields", "inside", "get", None, "detail"]


def pages_for_inside(pid, p, sd):
    out = [(str((sorted(sd.glob(f"{pid}.png")) or sorted(sd.glob(f"{pid}-*.png")))[0].resolve()), p.get("main_label", "Main design"))]
    seen = set()
    for f in sorted(sd.glob(f"{pid}_p*.png")):
        name = f.stem.split("_p", 1)[1][3:]
        if name in seen:
            continue
        seen.add(name)
        ep = next((e for e in p.get("extra_pages", []) if e["name"] == name), {})
        out.append((str(f.resolve()), ep.get("label", name.replace("-", " ").title())))
    return out


def build(pid, style):
    p = load_product(pid); g = p["gallery"]; st = g["style"]
    sd = ROOT / "samples" / pid
    if not list(sd.glob("*.png")):
        fulfill(pid, {}, sd)
    subprocess.run([sys.executable, str(ROOT / "gallery.py"), pid], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, str(ROOT / "hero.py"), pid, style], check=True, stdout=subprocess.DEVNULL)
    gd = ROOT / "gallery" / pid
    pages = pages_for_inside(pid, p, sd)
    from pypdf import PdfReader
    pdf = sd / f"{pid}-complete.pdf"
    npg = len(PdfReader(str(pdf)).pages) if pdf.exists() else 1
    n = len(pages)
    tw = 330 if n <= 6 else 290 if n <= 8 else 250 if n <= 10 else 220
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = b.new_page(viewport={"width": 2400, "height": 1800})
        render(pg, html_for("g_inside.html", dict(st, title="What's Inside", sub=p.get("inside_sub", f"{npg} pages, all personalized for you"), pages=pages, tw=tw)), gd / "inside.png")
        dname = p.get("detail_page")
        dimg = next((im for im, lab in pages if dname and f"-{dname}." in im), pages[min(1, n - 1)][0])
        W, H = Image.open(dimg).size
        dw = int(min(1900, 1300 * W / H))
        render(pg, html_for("g_inside.html", dict(st, title=p.get("detail_title", "A closer look"), sub="Every page is personalized for you", pages=[(dimg, "")], tw=dw)), gd / "detail.png")
        b.close()
    edir = ROOT.parent / "etsy"
    files = []
    for k in ORDER:
        if k is None:
            files.append("how-it-works.jpg"); continue
        src = gd / (f"hero-{style}.png" if k == "hero" else f"{k}.png")
        name = f"{pid}-hero-{style}.jpg" if k == "hero" else f"{pid}-{k}.jpg"
        Image.open(src).convert("RGB").save(edir / name, quality=87, optimize=True)
        files.append(name)
    print("\n".join(files))
    return files


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
