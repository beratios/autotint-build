import { neon } from "@neondatabase/serverless";

let _sql;
function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

let ready = false;
async function init() {
  if (ready) return;
  await sql()`CREATE TABLE IF NOT EXISTS kv (k text PRIMARY KEY, v jsonb NOT NULL, updated timestamptz NOT NULL DEFAULT now())`;
  ready = true;
}

export async function kvGet(k) {
  await init();
  const rows = await sql()`SELECT v FROM kv WHERE k = ${k}`;
  return rows[0]?.v ?? null;
}

export async function kvSet(k, v) {
  await init();
  await sql()`INSERT INTO kv (k, v, updated) VALUES (${k}, ${JSON.stringify(v)}::jsonb, now())
              ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated = now()`;
}

export async function kvDel(k) {
  await init();
  await sql()`DELETE FROM kv WHERE k = ${k}`;
}
