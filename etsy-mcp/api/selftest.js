import { keyOk } from "../lib/auth.js";
import { etsy, shopId } from "../lib/etsy.js";
import { kvGet } from "../lib/db.js";

export async function GET(request) {
  if (!keyOk(request)) return new Response("Unauthorized", { status: 401 });
  const out = {};
  const step = async (name, fn) => { try { out[name] = await fn(); } catch (e) { out[name] = { error: String(e.message || e) }; } };
  await step("me", () => etsy("GET", "/users/me"));
  await step("shop", async () => { const s = await etsy("GET", `/shops/${shopId()}`); return { shop_name: s.shop_name, listing_active_count: s.listing_active_count, currency: s.currency_code }; });
  await step("listings", async () => { const r = await etsy("GET", `/shops/${shopId()}/listings`, { query: { state: "active", limit: 10 } }); return r.results.map((l) => ({ id: l.listing_id, title: l.title.slice(0, 40), views: l.views, price: l.price.amount / l.price.divisor })); });
  await step("receipts", async () => { const r = await etsy("GET", `/shops/${shopId()}/receipts`, { query: { limit: 5 } }); return { count: r.count }; });
  await step("inventory", async () => { const r = await etsy("GET", `/listings/4618250729/inventory`); return r.products[0].offerings[0].price; });
  await step("images", async () => { const r = await etsy("GET", `/listings/4618250729/images`); return r.count; });
  await step("token", async () => { const t = await kvGet("tokens"); return { expires_at: new Date(t.expires_at).toISOString() }; });
  return new Response(JSON.stringify(out, null, 1), { headers: { "content-type": "application/json" } });
}
