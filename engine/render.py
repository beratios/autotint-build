"""Etsy personalized-product engine.

Usage (fulfillment):
  python3 render.py <product_id> --data '{"name": "..."}' --out orders/<order_id>
Produces print-ready PDF + PNG for the customer.

Preview/listing images:
  python3 render.py <product_id> --preview
"""
import argparse, json, pathlib, sys
from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
FONTS = ROOT / "fonts/node_modules/@fontsource"
FONT_SPECS = {
    "Great Vibes": ("great-vibes", [400]),
    "Playfair Display": ("playfair-display", [400, 700]),
    "Cormorant Garamond": ("cormorant-garamond", [400, 600]),
    "Fredoka": ("fredoka", [400, 600, 700]),
    "Amatic SC": ("amatic-sc", [400, 700]),
    "Bungee": ("bungee", [400]),
    "Pacifico": ("pacifico", [400]),
    "DM Serif Display": ("dm-serif-display", [400]),
    "Caveat": ("caveat", [400, 700]),
    "Inter": ("inter", [400, 500, 600, 700, 800, 900]),
}


def font_css():
    out = []
    for fam, (slug, weights) in FONT_SPECS.items():
        for w in weights:
            f = FONTS / slug / "files" / f"{slug}-latin-{w}-normal.woff2"
            if f.exists():
                out.append(f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{f}') format('woff2');}}")
    return "\n".join(out)


env = Environment(loader=FileSystemLoader(str(ROOT / "templates")), autoescape=True)
import math as _m
env.globals.update(cos=lambda a: round(_m.cos(_m.radians(a)), 3), sin=lambda a: round(_m.sin(_m.radians(a)), 3))


def load_product(pid):
    return json.loads((ROOT / "products" / f"{pid}.json").read_text())


def html_for(template, data, extra=None):
    ctx = dict(data)
    ctx.update(extra or {})
    ctx["FONT_CSS"] = font_css()
    return env.get_template(template).render(**ctx)


def render(page, html, path_png=None, path_pdf=None, w_in=None, h_in=None, scale=1):
    import os
    tmp = ROOT / f"_tmp{os.getpid()}.html"
    tmp.write_text(html)
    if w_in:
        page.set_viewport_size({"width": int(w_in * 96), "height": int(h_in * 96)})
    page.goto(f"file://{tmp}")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(150)
    if path_pdf:
        page.pdf(path=str(path_pdf), width=f"{w_in}in", height=f"{h_in}in",
                 print_background=True, margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
    if path_png:
        page.screenshot(path=str(path_png), full_page=False)


def calendar_ctx(year):
    import calendar
    c = calendar.Calendar(firstweekday=6)
    names = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    return [{"name": names[m-1], "num": m, "year": year, "weeks": c.monthdayscalendar(year, m)} for m in range(1, 13)]


def fulfill(pid, data, outdir):
    """Render a product. Main template (one page per item of pages_from, if set),
    then optional extra_pages; everything merged into <pid>-complete.pdf when >1 page."""
    p = load_product(pid)
    merged = dict(p["defaults"]); merged.update(data)
    if p.get("calendar_year"):
        merged["months"] = calendar_ctx(p["calendar_year"])
    outdir = pathlib.Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    pdfs = []
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/usr/bin/google-chrome")
        ctx = b.new_context(device_scale_factor=300 / 96)
        page = ctx.new_page()
        pages = p.get("pages_from")
        items = list(merged.get(pages)) if pages else [None]
        if pages and p.get("blank_cards"):
            items += [""] * p["blank_cards"]
        for i, item in enumerate(items):
            extra = {"item": item, "index": i, "W_IN": p["w_in"], "H_IN": p["h_in"]}
            if p.get("shuffle_field"):
                import random
                extra["cells"] = random.Random(f"{item}-{i}").sample(merged[p["shuffle_field"]], 24)
            html = html_for(p["template"], merged, extra)
            stem = f"{pid}" + (f"-{i+1:02d}" if pages else "")
            if pages and not item:
                stem = f"{pid}-blank-{i+1:02d}"
            render(page, html, outdir / f"{stem}.png", outdir / f"{stem}.pdf", p["w_in"], p["h_in"])
            pdfs.append(outdir / f"{stem}.pdf")
        n = 0
        for ep in p.get("extra_pages", []):
            reps = merged[ep["repeat"]] if ep.get("repeat") else [None]
            for rep in reps:
                n += 1
                html = html_for(ep["template"], merged, dict(ep.get("vars", {}), rep=rep, W_IN=ep.get("w_in", p["w_in"]), H_IN=ep.get("h_in", p["h_in"])))
                stem = f"{pid}_p{n:02d}-{ep['name']}"
                render(page, html, outdir / f"{stem}.png" if ep.get("png") else None, outdir / f"{stem}.pdf", ep.get("w_in", p["w_in"]), ep.get("h_in", p["h_in"]))
                pdfs.append(outdir / f"{stem}.pdf")
        b.close()
    if len(pdfs) > 1:
        from pypdf import PdfWriter
        w = PdfWriter()
        for f in pdfs: w.append(str(f))
        w.write(str(outdir / f"{pid}-complete.pdf"))
        for f in pdfs: f.unlink()
    print("done", outdir)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("pid")
    ap.add_argument("--data", default="{}")
    ap.add_argument("--out")
    a = ap.parse_args()
    fulfill(a.pid, json.loads(a.data), a.out or f"orders/{a.pid}-sample")
