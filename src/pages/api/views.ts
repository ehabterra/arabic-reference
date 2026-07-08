import type { APIRoute } from 'astro';
import { getDB, json, type D1Database } from '../../lib/social-db';

// Per-page view counter, stored in Cloudflare D1 (binding `DB`). A single
// aggregate row per page — no visitor identity, nothing personal. The client
// (src/scripts/views.js) increments once per browser session and otherwise
// reads the cached count, so this stays cheap.
//
//   POST /api/views  { page }        → { count }   (increment, then read)
//   GET  /api/views?page=/nahw/…      → { count }   (read only, edge-cached)
//   GET  /api/views?top=6             → { top: [{ page, count }] }
export const prerender = false;

const PAGE_RE = /^\/[a-z0-9][a-z0-9/_-]{0,199}$/i;

// Bootstrap the table on the first request per isolate — IF NOT EXISTS makes
// it a no-op afterwards, sparing both dev and prod a migration step.
let ready: Promise<unknown> | null = null;
function ensureSchema(db: D1Database) {
  ready ??= db
    .prepare(
      `CREATE TABLE IF NOT EXISTS page_views (
         page       TEXT PRIMARY KEY,
         count      INTEGER NOT NULL DEFAULT 0,
         updated_at TEXT NOT NULL DEFAULT (datetime('now'))
       )`
    )
    .run()
    .catch((err) => {
      ready = null;
      throw err;
    });
  return ready;
}

async function count(db: D1Database, page: string) {
  const row = await db
    .prepare('SELECT count FROM page_views WHERE page = ?1')
    .bind(page)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export const GET: APIRoute = async ({ url, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'Views are not configured.' }, 503);

  // "most viewed" mode — cheap to expose, handy for a future popular strip.
  const top = url.searchParams.get('top');
  if (top) {
    const n = Math.min(Math.max(parseInt(top, 10) || 0, 1), 12);
    try {
      await ensureSchema(db);
      const { results } = await db
        .prepare('SELECT page, count FROM page_views ORDER BY count DESC, page ASC LIMIT ?1')
        .bind(n)
        .all<{ page: string; count: number }>();
      return new Response(JSON.stringify({ top: results }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
      });
    } catch {
      return json({ error: 'Storage unavailable.' }, 503);
    }
  }

  const page = url.searchParams.get('page') ?? '';
  if (!PAGE_RE.test(page)) return json({ error: 'Bad page.' }, 400);

  try {
    await ensureSchema(db);
    return new Response(JSON.stringify({ count: await count(db, page) }), {
      status: 200,
      // a slightly stale read is fine — let Cloudflare's edge cache absorb the load
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
    });
  } catch {
    return json({ error: 'Storage unavailable.' }, 503);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  let page = '';
  try {
    const body = await request.json();
    page = typeof body?.page === 'string' ? body.page : '';
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (!PAGE_RE.test(page)) return json({ error: 'Bad page.' }, 400);

  const db = getDB(locals);
  if (!db) return json({ error: 'Views are not configured.' }, 503);

  try {
    await ensureSchema(db);
    // RETURNING hands back the updated count in the same round-trip, so we
    // don't need a follow-up read (and there's no write/read race window).
    const row = await db
      .prepare(
        `INSERT INTO page_views (page, count) VALUES (?1, 1)
         ON CONFLICT(page) DO UPDATE SET count = count + 1, updated_at = datetime('now')
         RETURNING count`
      )
      .bind(page)
      .first<{ count: number }>();
    return json({ count: row?.count ?? 0 });
  } catch {
    return json({ error: 'Storage unavailable.' }, 503);
  }
};
