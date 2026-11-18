# MonarqDigital Etsy engine
- `cd engine && mkdir -p fonts && cp fonts-package.json fonts/package.json && (cd fonts && npm i)` to install fonts
- New product = templates/<name>.html (Jinja, extends base.html) + products/<id>.json (template, w_in, h_in, fields, defaults)
- `python3 render.py <id> --data '{...}' --out out/<id>` → print-ready PDF + 300dpi PNG
- Listing image template: templates/listing.html; how-it-works image: ../etsy/how-it-works.jpg
- Assets served from https://raw.githubusercontent.com/beratios/autotint-build/etsy-assets/etsy/<file>
- PUBLISHED.md = log of live listings (id, product id, date)
- Multi-page products: "extra_pages" in product json (template, optional "repeat" over a list field, "png"), "calendar_year" adds dated months, "blank_cards" adds blank pages; fulfill() merges all into <id>-complete.pdf. Give customers MORE than competitors (full packs, not single pages).
- `python3 pack.py <id> <hero_style>` = renders sample + gallery + hero + what's-inside + detail and writes all listing JPGs to ../etsy/ (prints upload order). Uses product json keys main_label, extra_pages[].label, inside_sub, detail_page, detail_title.
- Themed systems (layout `{% extends theme %}` + theme `th_*.html`): menus mp_*, invitations pi_* (any theme, e.g. th_luxgold), Secret Santa ss_* (th_jolly), game night gn_* (th_frost). New variant = new th_*.html + product json with "theme".
