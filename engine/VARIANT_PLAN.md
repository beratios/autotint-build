# Holiday focus + design variants (Berat, Nov 17 2026)
Berat: "Yılbaşı yaklaşıyor, daha çok bununla ilgili içerik üret. Bir ürün tipini 1 kere yaptın diye bırakma — aynı ürünün farklı tasarım alternatiflerini ekle. Birini beğenmeyen diğerini beğenir."

## Daily mix (5 listings/day)
- 3 = NEW DESIGN VARIANTS of product families we already have (or that sell), each a clearly different concept.
- 2 = new holiday product families.
- Everything is Christmas / New Year until Dec 31. Timing: Christmas items until ~Dec 20, then NYE + 2027 items; from ~Jan 2 Valentine.
- Nov 17–22 only: 1 US Thanksgiving dinner menu variant per day is allowed (Thanksgiving Nov 26).

## PACK STANDARD (Berat, Nov 17): one listing = one BIG pack. The more we give in one product, the better.
Every pack includes several FORMATS of the same design, all personalized, e.g. for a dinner menu:
- Classic menu (5x7 or 4x9 tall) – simple course list
- Detailed menu (8.5x11) – courses with descriptions, wine/drink pairing, timeline of the evening
- Drinks / cocktail menu, Welcome sign (8x10), Place cards (sheet), Table numbers or food labels
- Instagram POST version 1080x1080 (extra_pages entry with "w_in":3.6,"h_in":3.6,"png":true)
- Instagram/WhatsApp STORY version 1080x1920 ("w_in":3.6,"h_in":6.4,"png":true) – for sending the menu/invite digitally
- Phone/text-message version where it makes sense
Apply the same idea to every family (invites: printable + story + post + RSVP card + thank-you card; Santa letter: letter + envelope + certificate + story video-style image; gift tags: several sizes + stickers; etc.).
List every format in WHAT IS INSIDE and show them in the "what's inside" photo. Price can go up a little for bigger packs but stay below comparable competitors.
render.py: extra_pages accept "w_in"/"h_in" per page (social sizes); all pages are merged into <id>-complete.pdf and PNGs are delivered for pages with "png": true.

## UPGRADE EXISTING (do these first, before new listings, one per day until done)
- [x] xmas-dinner-set-minimal (4618730967): add detailed menu page, Instagram post + story versions; update description, "what's inside" photo (rank 7 overwrite) and title if needed.
- [ ] xmas-invite-elegant (4618250503): add Instagram story + post invite, RSVP card, thank-you card.
- [ ] family-xmas-card-playful (4618256578): add Instagram post + story versions, gift tag set in same design.

## Variant rules
- Product id = <family>--<concept>, e.g. xmas-dinner-menu--luxury-gold. Record the family in PUBLISHED.md (product id prefix).
- A variant must look different at thumbnail size: different palette, typography, illustration/background scene, layout. Not just a recolor.
- Use illustrated SCENES in the art (inline SVG/CSS): wine glasses + candles on a dark table, fireplace, snowy cabin window, Christmas tree corner, marble + gold foil, kids cartoon reindeer/gingerbread, plaid, watercolor greenery, retro 70s, art deco, etc.
- Title must name the concept first so listings are not duplicates: "Luxury Black Gold Christmas Dinner Menu…", "Kids Christmas Dinner Menu and Placemat…".
- Tags: keep 6–8 family tags, change 5–7 concept tags.
- Same pack content level (or more) as the first version of the family.

## Family backlog (pick from top; mark done)
### Christmas dinner menu set (menu + welcome sign + drinks menu + place cards)
- [x] scandinavian minimal (4618730967)
- [x] luxury black + gold foil, art deco frame (4619558974)
- [x] (4619552281) wine & candlelight: dark burgundy, illustrated wine glasses/candles/table runner
- [ ] kids Christmas dinner: cute cartoon, kids menu + coloring placemat + activity page + place cards
- [x] (4619559532) rustic farmhouse: kraft, buffalo plaid, pine
- [ ] watercolor botanical: eucalyptus, berries, white
- [ ] cozy fireplace / cabin scene
- [ ] Christmas Eve dinner (navy + silver stars)
- [ ] Christmas morning brunch menu
- [ ] New Years Eve dinner menu (black gold confetti, champagne)
- [ ] Thanksgiving dinner menu (US) — Nov 17–22 only: autumn leaves / pumpkin farmhouse
### Christmas party invitation
- [x] elegant green gold (4618250503)
- [ ] luxury black tie gala, [ ] cozy pajama party, [ ] kids Christmas party, [ ] office holiday party (modern), [ ] watercolor winter wonderland
### Letter from Santa pack
- [x] watercolor (4618736968)
- [ ] vintage North Pole parchment + wax seal, [ ] cute cartoon (toddlers), [ ] elf-on-the-shelf style arrival letter (generic elf, no brand)
### Kids wish list / activity
- [x] colorful pack (4618730313)
- [ ] Christmas Eve box labels + reindeer food bags, [ ] kids Christmas placemat with name, [ ] Christmas countdown calendar with name
### Gift tags
- [x] rustic kraft (4618256616)
- [ ] luxury gold foil, [ ] cute kids characters, [ ] Scandi minimal, [ ] stocking name tags
### Family Christmas card
- [x] playful (4618256578)
- [ ] elegant photo-less typography, [ ] watercolor wreath, [ ] funny family card
### NYE party
- [x] retro bingo (4618256700)
- [ ] NYE trivia with party name, [ ] NYE "who's most likely to", [ ] NYE dinner/cocktail menu, [ ] 2027 resolution cards, [ ] NYE countdown kids pack
### Other holiday families to start
- [x] hot cocoa bar candy cane (4619552325) / [ ] mimosa bar sign set, [ ] Secret Santa wish list forms (office), [ ] Christmas place cards only (cheap entry item), [x] Christmas movie night retro cinema (4619552347), [ ] Christmas recipe card set with family name
