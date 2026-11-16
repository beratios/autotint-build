import { z } from "zod";
import { etsy, etsyForm, fetchAsBlob, shopId, getApp } from "./etsy.js";
import { kvGet } from "./db.js";

const ok = (data) => ({ content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 1) }] });
const fail = (e) => ({ isError: true, content: [{ type: "text", text: String(e?.message || e) }] });
const wrap = (fn) => async (args) => { try { return ok(await fn(args || {})); } catch (e) { return fail(e); } };

const shop = z.number().int().optional().describe("Shop ID (defaults to the connected shop, MonarqDigital 53640589).");
const listing = z.number().int().describe("Listing ID.");
const trimListing = (l) => l && ({
  listing_id: l.listing_id, title: l.title, state: l.state, url: l.url, price: l.price && l.price.amount / l.price.divisor,
  currency: l.price?.currency_code, quantity: l.quantity, views: l.views, num_favorers: l.num_favorers, tags: l.tags,
  taxonomy_id: l.taxonomy_id, listing_type: l.listing_type, is_personalizable: l.is_personalizable, created: l.created_timestamp,
});

export function registerTools(server) {
  const tool = (name, description, schema, fn, readOnly = true) =>
    server.registerTool(name, { title: name, description, inputSchema: z.object(schema), annotations: { readOnlyHint: readOnly } }, wrap(fn));

  tool("etsy_status", "Check the Etsy connection: app keys set, token valid, connected user and shop.", {}, async () => {
    const app = await kvGet("app"); const t = await kvGet("tokens");
    if (!app) return "Not set up: open the setup page.";
    if (!t) return "App keys saved but not authorized: open the setup page and click Connect with Etsy.";
    const me = await etsy("GET", "/users/me");
    return { ok: true, user_id: me.user_id, shop_id: me.shop_id, token_expires_at: new Date(t.expires_at).toISOString() };
  });

  tool("etsy_get_shop", "Shop details (name, currency, counts, announcement, sale messages).", { shop_id: shop },
    async ({ shop_id }) => etsy("GET", `/shops/${shopId(shop_id)}`));

  tool("etsy_get_listings_by_shop", "Your shop's listings by state (active, inactive, draft, expired, sold_out), with views and favorites.",
    { shop_id: shop, state: z.enum(["active", "inactive", "draft", "expired", "sold_out"]).optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().optional(), full: z.boolean().optional().describe("Return full Etsy objects instead of a compact summary.") },
    async ({ shop_id, state = "active", limit = 100, offset = 0, full }) => {
      const r = await etsy("GET", `/shops/${shopId(shop_id)}/listings`, { query: { state, limit, offset } });
      return full ? r : { count: r.count, results: r.results.map(trimListing) };
    });

  tool("etsy_get_listing", "One listing with full details. includes: comma list of Images, Inventory, Shipping, Shop, User, Translations, Videos.",
    { listing_id: listing, includes: z.string().optional() },
    async ({ listing_id, includes }) => etsy("GET", `/listings/${listing_id}`, { query: { includes } }));

  const listingFields = {
    title: z.string().max(140).optional(),
    description: z.string().optional(),
    tags: z.array(z.string().max(20)).max(13).optional().describe("Up to 13 tags, each ≤20 chars."),
    taxonomy_id: z.number().int().optional(),
    who_made: z.enum(["i_did", "someone_else", "collective"]).optional(),
    when_made: z.string().optional().describe("e.g. made_to_order, 2020_2026"),
    is_supply: z.boolean().optional(),
    should_auto_renew: z.boolean().optional(),
    is_personalizable: z.boolean().optional(),
    personalization_is_required: z.boolean().optional(),
    personalization_char_count_max: z.number().int().optional(),
    personalization_instructions: z.string().max(256).optional(),
    shop_section_id: z.number().int().optional(),
    materials: z.array(z.string()).optional(),
  };

  tool("etsy_create_listing_draft",
    "Create a DIGITAL (type=download) or physical listing as a draft. Then add images (etsy_add_listing_image), a download file (etsy_upload_listing_file) and publish with etsy_edit_listing state=active.",
    { shop_id: shop, price: z.number(), quantity: z.number().int().default(999), type: z.enum(["download", "physical", "both"]).default("download"), ...listingFields,
      title: z.string().max(140), description: z.string(), taxonomy_id: z.number().int(), who_made: z.enum(["i_did", "someone_else", "collective"]).default("i_did"),
      when_made: z.string().default("made_to_order"), is_supply: z.boolean().default(false) },
    async ({ shop_id, ...f }) => trimListing(await etsyForm("POST", `/shops/${shopId(shop_id)}/listings`, f)), false);

  tool("etsy_edit_listing",
    "Change a listing: title, description, tags, category, personalization settings, or state (active publishes, inactive hides). Price/quantity: use etsy_set_price.",
    { shop_id: shop, listing_id: listing, state: z.enum(["active", "inactive"]).optional(), ...listingFields },
    async ({ shop_id, listing_id, ...f }) => trimListing(await etsyForm("PATCH", `/shops/${shopId(shop_id)}/listings/${listing_id}`, f)), false);

  tool("etsy_read_listing_inventory", "Products, prices and quantities of a listing.", { listing_id: listing },
    async ({ listing_id }) => etsy("GET", `/listings/${listing_id}/inventory`));

  tool("etsy_set_price", "Set price (and optionally quantity) of a listing WITHOUT variations.",
    { listing_id: listing, price: z.number(), quantity: z.number().int().optional() },
    async ({ listing_id, price, quantity }) => {
      const inv = await etsy("GET", `/listings/${listing_id}/inventory`);
      if (inv.products.length !== 1) throw new Error("Listing has variations; use etsy_set_listing_inventory.");
      const p = inv.products[0], o = p.offerings[0];
      const body = { products: [{ sku: p.sku, property_values: p.property_values, offerings: [{ price, quantity: quantity ?? o.quantity, is_enabled: o.is_enabled, readiness_state_id: o.readiness_state_id ?? null }] }],
        price_on_property: inv.price_on_property, quantity_on_property: inv.quantity_on_property, sku_on_property: inv.sku_on_property };
      const r = await etsy("PUT", `/listings/${listing_id}/inventory`, { body });
      return { listing_id, price: r.products[0].offerings[0].price };
    }, false);

  tool("etsy_set_listing_inventory", "Replace the whole inventory (advanced; for variations). Body as Etsy updateListingInventory expects.",
    { listing_id: listing, inventory: z.record(z.string(), z.any()) },
    async ({ listing_id, inventory }) => etsy("PUT", `/listings/${listing_id}/inventory`, { body: inventory }), false);

  tool("etsy_list_listing_images", "Photos of a listing in order.", { listing_id: listing },
    async ({ listing_id }) => {
      const r = await etsy("GET", `/listings/${listing_id}/images`);
      return { count: r.count, results: r.results.map((i) => ({ listing_image_id: i.listing_image_id, rank: i.rank, url: i.url_570xN, alt_text: i.alt_text })) };
    });

  tool("etsy_add_listing_image", "Add a photo from a public image URL (JPG/PNG/GIF ≤ 20 MB). rank 1 = main photo; overwrite replaces the image at that rank. Max 20 photos.",
    { shop_id: shop, listing_id: listing, image_url: z.string().url(), rank: z.number().int().min(1).max(20).optional(), overwrite: z.boolean().optional(), alt_text: z.string().max(500).optional() },
    async ({ shop_id, listing_id, image_url, rank, overwrite, alt_text }) => {
      const { blob, name } = await fetchAsBlob(image_url);
      const fd = new FormData();
      fd.append("image", blob, name);
      if (rank) fd.append("rank", String(rank));
      if (overwrite) fd.append("overwrite", "true");
      if (alt_text) fd.append("alt_text", alt_text);
      const r = await etsy("POST", `/shops/${shopId(shop_id)}/listings/${listing_id}/images`, { body: fd });
      return { listing_image_id: r.listing_image_id, rank: r.rank, url: r.url_570xN };
    }, false);

  tool("etsy_delete_listing_image", "Delete one photo from a listing.", { shop_id: shop, listing_id: listing, listing_image_id: z.number().int() },
    async ({ shop_id, listing_id, listing_image_id }) => { await etsy("DELETE", `/shops/${shopId(shop_id)}/listings/${listing_id}/images/${listing_image_id}`); return "deleted"; }, false);

  tool("etsy_list_listing_files", "Download files of a digital listing.", { shop_id: shop, listing_id: listing },
    async ({ shop_id, listing_id }) => etsy("GET", `/shops/${shopId(shop_id)}/listings/${listing_id}/files`));

  tool("etsy_upload_listing_file", "Attach a file buyers download after purchase (digital listing), from a public URL. Max 5 files.",
    { shop_id: shop, listing_id: listing, file_url: z.string().url(), name: z.string().describe("File name buyers see, e.g. guide.pdf"), rank: z.number().int().optional() },
    async ({ shop_id, listing_id, file_url, name, rank }) => {
      const { blob } = await fetchAsBlob(file_url);
      const fd = new FormData();
      fd.append("file", blob, name);
      fd.append("name", name);
      if (rank) fd.append("rank", String(rank));
      return etsy("POST", `/shops/${shopId(shop_id)}/listings/${listing_id}/files`, { body: fd });
    }, false);

  tool("etsy_get_shop_receipts", "Orders (receipts). Filter by min_created (unix seconds), was_paid, was_shipped. Includes transactions with personalization/variations.",
    { shop_id: shop, min_created: z.number().int().optional(), was_paid: z.boolean().optional(), was_shipped: z.boolean().optional(), limit: z.number().int().max(100).optional(), offset: z.number().int().optional() },
    async ({ shop_id, ...q }) => etsy("GET", `/shops/${shopId(shop_id)}/receipts`, { query: { limit: 25, ...q } }));

  tool("etsy_get_shop_receipt", "One order with buyer info, transactions (personalization in variations), messages from buyer.", { shop_id: shop, receipt_id: z.number().int() },
    async ({ shop_id, receipt_id }) => etsy("GET", `/shops/${shopId(shop_id)}/receipts/${receipt_id}`));

  tool("etsy_search_active_listings", "Search all active Etsy listings (competitor research, find taxonomy_id/prices).",
    { keywords: z.string(), limit: z.number().int().max(100).optional(), taxonomy_id: z.number().int().optional(), sort_on: z.enum(["created", "price", "updated", "score"]).optional() },
    async (q) => {
      const r = await etsy("GET", "/listings/active", { query: { limit: 10, ...q } });
      return { count: r.count, results: r.results.map(trimListing) };
    });

  tool("etsy_list_seller_taxonomy_search", "Find seller category ids whose name contains the query (e.g. 'invitation').", { query: z.string() },
    async ({ query }) => {
      const r = await etsy("GET", "/seller-taxonomy/nodes");
      const out = []; const q = query.toLowerCase();
      const walk = (n, path) => { const p = [...path, n.name]; if (n.name.toLowerCase().includes(q)) out.push({ id: n.id, path: p.join(" > ") }); (n.children || []).forEach((c) => walk(c, p)); };
      r.results.forEach((n) => walk(n, []));
      return out.slice(0, 40);
    });

  tool("etsy_api_request", "Escape hatch: call any Etsy Open API v3 path (e.g. GET /shops/{id}/sections). Body is sent as JSON.",
    { method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]), path: z.string().describe("Path after /v3/application, e.g. /users/me"), query: z.record(z.string(), z.any()).optional(), body: z.record(z.string(), z.any()).optional() },
    async ({ method, path, query, body }) => etsy(method, path, { query, body }), false);
}
