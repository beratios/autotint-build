import crypto from "node:crypto";
import { kvGet, kvSet } from "./db.js";

export const API = "https://api.etsy.com/v3/application";
export const SCOPES = "email_r shops_r shops_w listings_r listings_w listings_d transactions_r transactions_w";

export async function getApp() {
  const app = await kvGet("app");
  if (!app?.client_id || !app?.client_secret) throw new Error("Etsy app keys not set. Open the setup page first.");
  return app;
}

export function pkce() {
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function tokenRequest(params) {
  const r = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Etsy token error ${r.status}: ${JSON.stringify(j)}`);
  return j;
}

export async function exchangeCode({ code, verifier, redirect_uri }) {
  const app = await getApp();
  const j = await tokenRequest({ grant_type: "authorization_code", client_id: app.client_id, redirect_uri, code, code_verifier: verifier });
  await saveTokens(j);
  return j;
}

async function saveTokens(j) {
  await kvSet("tokens", {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + (j.expires_in || 3600) * 1000,
    user_id: String(j.access_token || "").split(".")[0],
  });
}

async function accessToken(force = false) {
  const t = await kvGet("tokens");
  if (!t) throw new Error("Not authorized with Etsy yet. Open the setup page and click Connect.");
  if (!force && t.expires_at > Date.now() + 120000) return t.access_token;
  const app = await getApp();
  try {
    const j = await tokenRequest({ grant_type: "refresh_token", client_id: app.client_id, refresh_token: t.refresh_token });
    await saveTokens(j);
    return j.access_token;
  } catch (e) {
    // another request may have refreshed concurrently: re-read once
    const t2 = await kvGet("tokens");
    if (t2 && t2.refresh_token !== t.refresh_token && t2.expires_at > Date.now() + 60000) return t2.access_token;
    throw new Error(`${e.message} — if the refresh token expired, open the setup page and reconnect.`);
  }
}

/** Call Etsy. body: object -> JSON; FormData -> multipart. */
export async function etsy(method, path, { query, body, retry = true } = {}) {
  const app = await getApp();
  const url = new URL(path.startsWith("http") ? path : API + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const headers = { "x-api-key": `${app.client_id}:${app.client_secret}`, Authorization: `Bearer ${await accessToken()}` };
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const r = await fetch(url, { method, headers, body: payload });
  if (r.status === 401 && retry) {
    await accessToken(true);
    return etsy(method, path, { query, body, retry: false });
  }
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(`Etsy ${method} ${url.pathname} → ${r.status}: ${typeof data === "object" ? JSON.stringify(data) : text}`);
  return data;
}

/** Same as etsy() but form-encoded body (some Etsy endpoints only accept it). Arrays become comma lists. */
export async function etsyForm(method, path, fields) {
  const app = await getApp();
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    body.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const doReq = async (tok) => fetch(API + path, {
    method,
    headers: { "x-api-key": `${app.client_id}:${app.client_secret}`, Authorization: `Bearer ${tok}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  let r = await doReq(await accessToken());
  if (r.status === 401) r = await doReq(await accessToken(true));
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(`Etsy ${method} ${path} → ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function fetchAsBlob(url, maxBytes = 20 * 1024 * 1024) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not download ${url}: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > maxBytes) throw new Error(`File too large (${buf.length} bytes)`);
  const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");
  const ext = name.split(".").pop().toLowerCase();
  const type = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", pdf: "application/pdf", zip: "application/zip" }[ext] || r.headers.get("content-type") || "application/octet-stream";
  return { blob: new Blob([buf], { type }), name, size: buf.length };
}

export function shopId(v) {
  return Number(v || process.env.ETSY_SHOP_ID || 53640589);
}
