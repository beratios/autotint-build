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
- [x] xmas-invite-elegant (4618250503): done 11-20 – theme th_emerald + pi_* (RSVP, schedule, welcome, place cards, thank-you, post, story); inside photo rank 7, detail rank 10; title/desc/tags updated, price 14.99 -> 12.99.
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
- [x] kids Christmas dinner: gingerbread kids menu + coloring placemat + word search + place cards (4621675068)
- [x] (4619559532) rustic farmhouse: kraft, buffalo plaid, pine
- [x] watercolor botanical: eucalyptus, berries, white (4621661003)
- [x] cozy fireplace / cabin scene (4620388082)
- [x] Christmas Eve dinner (navy + silver stars) (4620388102)
- [x] Christmas morning brunch menu (4622614713, th_brunch)
- [x] New Years Eve dinner menu, plum + gold midnight clock, champagne (4621668518)
- [x] Thanksgiving dinner menu autumn harvest (4621675058)
### Christmas party invitation
- [x] elegant green gold (4618250503)
- [x] luxury black tie gala (4620388124), [x] cozy pajama party (4621661325), [x] NYE midnight party (4621675086), [x] kids Christmas party north pole (4622623242), [ ] office holiday party (modern), [x] watercolor winter wonderland (4622614727)
### Letter from Santa pack
- [x] watercolor (4618736968)
- [ ] vintage North Pole parchment + wax seal, [ ] cute cartoon (toddlers), [ ] elf-on-the-shelf style arrival letter (generic elf, no brand)
### Kids wish list / activity
- [x] colorful pack (4618730313)
- [x] Christmas Eve box kit north pole (4621668530) – own family xmas-eve-box, [ ] kids Christmas placemat with name, [x] Christmas countdown kit with name (4622623262, own family advent-countdown)
### Gift tags
- [x] rustic kraft (4618256616)
- [ ] luxury gold foil, [ ] cute kids characters, [ ] Scandi minimal, [ ] stocking name tags
### Family Christmas card
- [x] playful (4618256578)
- [ ] elegant photo-less typography, [ ] watercolor wreath, [ ] funny family card
### NYE party
- [x] retro bingo (4618256700)
- [ ] NYE trivia with party name, [x] NYE "who's most likely to" disco (4621667939, family nye-games), [ ] NYE dinner/cocktail menu, [x] 2027 family time capsule incl. resolution cards (4621668536, family nye-time-capsule), [ ] NYE countdown kids pack
### Other holiday families to start
- [x] hot cocoa bar candy cane (4619552325) / [ ] mimosa bar sign set, [x] Secret Santa kit modern red (4620381113), [ ] Christmas place cards only (cheap entry item), [x] Christmas movie night retro cinema (4619552347), [x] Christmas recipe book kit cozy kitchen (4621675110, family christmas-recipes)

### Christmas game night (new family, 11-18)
- [x] frosty gingerbread game night (4620381127)
- [ ] plaid cabin game night, [ ] NYE game night version, [ ] kids Christmas party games
### Notes for next runs
- 11-20: new themes th_botanical (watercolor greenery), th_pajama (cute cozy), th_nye (plum midnight clock + champagne), th_northpole (kids cartoon). pi_* now use topicon(theme) macro (mugs for th_pajama, coupes otherwise). Cheap next variants: NYE party invite = pi_* + th_nye; Christmas Eve box 2nd concept = xe_* + new kid theme; watercolor invite = pi_* + th_botanical; time capsule kids-only bright version.
- Upgrade backlog: only family-xmas-card-playful left (add Instagram post + story, gift tag set).
- New themes 11-20 catch-up: th_emerald (matches elegant_invite), th_harvest, th_kidsmenu (+kd_placemat, kd_activity), th_disco (ml_* most likely to), th_kitchen (rc_* recipes). th_disco can host other NYE games (trivia, bingo variant).
- Invitation engine pi_* works with ANY th_* theme -> cheap invite variants: th_fireplace (cozy party), th_navy (Christmas Eve), th_wine, th_rustic.
- Secret Santa ss_* can take a second theme (e.g. kraft/minimal office).

### Christmas bingo with names (new family, 11-21)
- [x] cozy red plaid gingerbread (4622614751) – xb_* standalone; [ ] watercolor/elegant adult version, [ ] kids picture bingo (icons instead of words), [ ] NYE version of xb_* engine
### Advent countdown kit (new family, 11-21)
- [x] gingerbread village night (4622623262) – ad_*; [ ] pastel/pink girly version, [ ] woodland animals version
- 11-21 notes: new th_brunch (sunrise, star garland, pancake table) also fits a mimosa bar set. timeline_label var added to mp_detailed/pi_details. pack.py now handles pages_from products. Views are still ~0 across the shop (6 days) – no family signal yet.
