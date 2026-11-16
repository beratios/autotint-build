import crypto from "node:crypto";
export function keyOk(request) {
  const want = process.env.MCP_KEY || "";
  if (want.length < 20) return false;
  const u = new URL(request.url);
  const got = u.searchParams.get("key") || request.headers.get("x-mcp-key") || (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got || ""), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function baseUrl(request) {
  const u = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || u.host;
  const proto = request.headers.get("x-forwarded-proto") || u.protocol.replace(":", "");
  return `${proto}://${host}`;
}
export const html = (body, status = 200) => new Response(`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>MonarqDigital Etsy</title><style>body{font:16px system-ui;max-width:560px;margin:40px auto;padding:0 16px;color:#222}input{width:100%;padding:10px;margin:6px 0 14px;font-size:16px;box-sizing:border-box}button,a.b{background:#f1641e;color:#fff;border:0;padding:12px 18px;border-radius:24px;font-size:16px;text-decoration:none;display:inline-block}code{background:#f3f3f3;padding:2px 6px;border-radius:4px;word-break:break-all}.ok{color:#137333}.err{color:#c5221f}</style>${body}`, { status, headers: { "content-type": "text/html; charset=utf-8" } });
