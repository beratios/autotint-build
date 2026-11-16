import { baseUrl, html } from "../../lib/auth.js";
import { kvGet, kvSet } from "../../lib/db.js";
import { exchangeCode, etsy } from "../../lib/etsy.js";

export async function GET(request) {
  const u = new URL(request.url);
  const err = u.searchParams.get("error");
  if (err) return html(`<p class="err">Etsy returned an error: ${err} ${u.searchParams.get("error_description") || ""}</p>`, 400);
  const pending = await kvGet("oauth_pending");
  if (!pending || pending.state !== u.searchParams.get("state") || Date.now() - pending.at > 15 * 60000)
    return html('<p class="err">Login expired or state mismatch. Go back to the setup page and try again.</p>', 400);
  try {
    await exchangeCode({ code: u.searchParams.get("code"), verifier: pending.verifier, redirect_uri: `${baseUrl(request)}/api/oauth/callback` });
    await kvSet("oauth_pending", {});
    const me = await etsy("GET", "/users/me");
    return html(`<h2 class="ok">Connected ✔</h2><p>Etsy user ${me.user_id}, shop ${me.shop_id}. You can close this page and tell Claude it's done.</p>`);
  } catch (e) {
    return html(`<p class="err">${String(e.message).replace(/</g, "&lt;")}</p>`, 500);
  }
}
