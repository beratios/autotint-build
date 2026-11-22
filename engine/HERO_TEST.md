# First-photo (hero) A/B test
Goal (Berat): find which first-photo style performs best. 6 styles, each used on several listings.
Styles (templates/hero_<style>.html, build with `python3 hero.py <id> <style>`):
- colorful – bright gradient, confetti, script headline
- calm – linen, soft serif, minimal text
- detailed – info-dense: 2 zoom circles + 5 feature icons
- minimal – white, design only, one small caption
- bold – dark modern, glow, heavy uppercase headline
- doodle – hand-drawn/cartoon: dotted paper, tape, scribbles, speech bubble
Rules:
- Every new listing gets the style that is currently LEAST used in PUBLISHED.md (ties: the order above). Record it in the "hero style" column.
- Do not change a listing's hero once assigned (keeps the test clean), except when a style is declared loser.
- Every 7 days: compute per style: listings, total views, favorites, sales, views/listing, favorites/100 views, sales/100 views. Report a table to Berat.
- After ~14 days AND ≥ 5 listings per style: drop the worst 2 styles, reassign their listings to the best style, keep testing the top 4.

## Report 2026-11-22 (day 7, 35 listings live before today; 0 sales)
| style | listings | views | favs | sales | views/listing | fav/100 views |
|---|---|---|---|---|---|---|
| colorful | 6 | 0 | 0 | 0 | 0.0 | – |
| calm | 6 | 2 | 0 | 0 | 0.3 | 0 |
| detailed | 6 | 0 | 0 | 0 | 0.0 | – |
| minimal | 6 | 0 | 0 | 0 | 0.0 | – |
| bold | 6 | 0 | 0 | 0 | 0.0 | – |
| doodle | 5 | 0 | 0 | 0 | 0.0 | – |
Families: only xmas-dinner-set-minimal has views (2). No signal yet; drop rule not applied (needs ~14 days). Note: 2 non-engine listings in the shop (ABC flashcards 31 views, shapes poster 8 views, created 11-21/22) get views while ours get ~0.
