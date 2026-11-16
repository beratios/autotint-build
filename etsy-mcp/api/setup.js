import { keyOk, baseUrl, html } from "../lib/auth.js";
import { kvGet, kvSet } from "../lib/db.js";
import { pkce, SCOPES } from "../lib/etsy.js";
import crypto from "node:crypto";

export async function GET(request) {
  if (!keyOk(request)) return html("<h2>Unauthorized</h2>", 401);
  const key = new URL(request.url).searchParams.get("key");
  const app = await kvGet("app"); const t = await kvGet("tokens");
  const cb = `${baseUrl(request)}/api/oauth/callback`;
  return html(`<h2>MonarqDigital – Etsy connection</h2>
  <p>Status: ${t ? '<b class="ok">connected ✔</b>' : app ? "keys saved, not connected yet" : "not set up"}</p>
  <h3>1. Etsy callback URL</h3><p>Add this exact URL to your Etsy app (etsy.com/developers/your-apps → your app → Edit callback URLs):</p><p><code>${cb}</code></p>
  <h3>2. App keys</h3>
  <form method="post" action="/api/setup?key=${encodeURIComponent(key)}">
  <label>Keystring</label><input name="client_id" value="${app?.client_id || ""}" required autocomplete="off">
  <label>Shared Secret ${app ? "(saved – leave empty to keep)" : ""}</label><input name="client_secret" type="password" ${app ? "" : "required"} autocomplete="off">
  <button>Save &amp; connect with Etsy</button></form>`);
}

export async function POST(request) {
  if (!keyOk(request)) return html("<h2>Unauthorized</h2>", 401);
  const f = await request.formData();
  const old = await kvGet("app");
  const client_id = String(f.get("client_id") || "").trim();
  const client_secret = String(f.get("client_secret") || "").trim() || old?.client_secret;
  if (!client_id || !client_secret) return html('<p class="err">Keystring and Shared Secret are required.</p>', 400);
  await kvSet("app", { client_id, client_secret });
  const { verifier, challenge } = pkce();
  const state = crypto.randomBytes(16).toString("hex");
  await kvSet("oauth_pending", { state, verifier, at: Date.now() });
  const u = new URL("https://www.etsy.com/oauth/connect");
  u.search = new URLSearchParams({ response_type: "code", client_id, redirect_uri: `${baseUrl(request)}/api/oauth/callback`, scope: SCOPES, state, code_challenge: challenge, code_challenge_method: "S256" });
  return Response.redirect(u.toString(), 302);
}
