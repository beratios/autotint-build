import json
L=json.load(open('listings.json'))
DESC="""✨ PERSONALIZED DIGITAL FILE – WE MAKE IT FOR YOU ✨

{what}

HOW IT WORKS
1. Add your details in the personalization box at checkout (or send them by Etsy message right after ordering).
2. We design your file and send it via Etsy message within 24 hours.
3. Print at home, at a local print shop, or share digitally.

YOU RECEIVE
• High-resolution PDF (print-ready, 300 DPI)
• High-resolution PNG (for sharing / phone)
• Size: {size}

PLEASE NOTE
• This is a DIGITAL item. No physical product will be shipped.
• Colors may vary slightly depending on screen and printer.
• One free revision for typos – just message us.
• Designs are created with the help of digital/AI tools.
• For personal use only.

Questions? Send us a message – we reply fast! 🎄"""
W={"xmas-invite-elegant":("An elegant deep-green and gold invitation for your Christmas dinner or holiday party, personalized with your event title, host name, date, time, address and RSVP details.","5x7 in"),
"family-xmas-card-playful":("A bright, cheerful family Christmas card with festive trees and snowflakes, personalized with your family name, message and year.","5x7 in"),
"gift-tags-rustic":("Rustic kraft-paper style gift tags personalized with up to 12 names – perfect for gifts, stockings and Christmas morning. Cut them out and add twine!","8.5x11 in sheet (12 tags)"),
"planner-cover-2027-boho":("A warm boho arch planner cover for 2027, personalized with your name and word of the year. Perfect for binders, planners and journals.","8.5x11 in (Letter)"),
"nye-bingo-retro":("A fun retro New Year's Eve bingo game! Every guest gets their own card with their name on it and a unique mix of party moments. Personalized with your party name.","8.5x11 in, one card per guest")}
out=["# Etsy listings – batch 1 (Nov 15, 2026)\n","Type: Digital · Personalization: ON (required) · Attach instant-download/thank-you.pdf as the digital file.\n"]
for k,v in L.items():
    out+=[f"\n## {k}\n",f"**Price:** {v['price']}\n",f"**Title:** {v['title']}\n",f"**Tags:** {', '.join(v['tags'])}\n",f"**Personalization prompt:** {v['personalization']}\n",f"**Images:** listings/{k}-1.png, listings/how-it-works.png, samples/{k}/*.png\n","**Description:**\n```\n"+DESC.format(what=W[k][0],size=W[k][1])+"\n```\n"]
open('LISTINGS.md','w').write("\n".join(out))
