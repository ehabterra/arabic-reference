import type { APIRoute } from 'astro';
import { getDB, json, type D1Database } from '../../lib/social-db';

// Per-page comments, stored in Cloudflare D1 (binding `DB`). Unlike the
// anonymous likes endpoint, posting REQUIRES a Google sign-in: the browser
// sends the Google ID token (a JWT), which we verify server-side against
// Google before trusting any identity. We never store the raw token — only
// the stable Google `sub`, plus the display name/picture from the token.
//
//   GET    /api/comments?slug=/nahw/al-fail/         → { comments: [...] }
//   POST   /api/comments  { slug, credential, body } → { comment }
//   DELETE /api/comments  { id, credential }          → { ok } (author-only)
export const prerender = false;

const SLUG_RE = /^\/[a-z0-9][a-z0-9/_-]{0,199}\/?$/i;
const MAX_BODY = 2000;

// The OAuth client id is public; it's used here only to check the token's
// audience. Configure it as PUBLIC_GOOGLE_CLIENT_ID (see .env.example).
const CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || '';

let ready: Promise<unknown> | null = null;
function ensureSchema(db: D1Database) {
  ready ??= db
    .prepare(
      `CREATE TABLE IF NOT EXISTS comments (
         id         INTEGER PRIMARY KEY AUTOINCREMENT,
         slug       TEXT NOT NULL,
         user_sub   TEXT NOT NULL,
         name       TEXT NOT NULL,
         picture    TEXT,
         body       TEXT NOT NULL,
         hidden     INTEGER NOT NULL DEFAULT 0,
         created_at TEXT NOT NULL DEFAULT (datetime('now'))
       )`
    )
    .run()
    .then(() =>
      db
        .prepare('CREATE INDEX IF NOT EXISTS comments_slug ON comments (slug, hidden, created_at)')
        .run()
    )
    .catch((err) => {
      ready = null;
      throw err;
    });
  return ready;
}

interface GoogleClaims {
  sub: string;
  name: string;
  picture?: string;
  email?: string;
}

// Verify a Google ID token by asking Google's tokeninfo endpoint, which checks
// the signature and expiry for us. We then confirm the audience is OUR client.
async function verifyGoogle(credential: string): Promise<GoogleClaims | null> {
  if (!credential || !CLIENT_ID) return null;
  try {
    const r = await fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential)
    );
    if (!r.ok) return null;
    const p: any = await r.json();
    if (p.aud !== CLIENT_ID) return null;
    if (p.iss !== 'accounts.google.com' && p.iss !== 'https://accounts.google.com') return null;
    if (!p.sub) return null;
    return {
      sub: String(p.sub),
      name: String(p.name || p.email || 'مستخدم'),
      picture: p.picture ? String(p.picture) : undefined,
      email: p.email ? String(p.email) : undefined,
    };
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ url, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ error: 'Comments are not configured.' }, 503);
  const slug = url.searchParams.get('slug') ?? '';
  if (!SLUG_RE.test(slug)) return json({ error: 'Bad slug.' }, 400);
  try {
    await ensureSchema(db);
    const { results } = await db
      .prepare(
        `SELECT id, name, picture, body, created_at, user_sub
           FROM comments WHERE slug = ?1 AND hidden = 0
           ORDER BY created_at DESC, id DESC LIMIT 200`
      )
      .bind(slug)
      .all();
    return json({ comments: results });
  } catch {
    return json({ error: 'Storage unavailable.' }, 503);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!CLIENT_ID) return json({ error: 'التعليقات غير مُفعَّلة (لم يُضبط معرّف Google).' }, 503);
  let slug = '';
  let credential = '';
  let body = '';
  try {
    const b = await request.json();
    slug = typeof b?.slug === 'string' ? b.slug : '';
    credential = typeof b?.credential === 'string' ? b.credential : '';
    body = typeof b?.body === 'string' ? b.body.trim() : '';
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (!SLUG_RE.test(slug)) return json({ error: 'صفحة غير صالحة.' }, 400);
  if (!body) return json({ error: 'التعليق فارغ.' }, 400);
  if (body.length > MAX_BODY) return json({ error: 'التعليق طويل جدًّا.' }, 400);

  const claims = await verifyGoogle(credential);
  if (!claims) return json({ error: 'تعذّر التحقّق من تسجيل الدخول. أعد المحاولة.' }, 401);

  const db = getDB(locals);
  if (!db) return json({ error: 'Comments are not configured.' }, 503);
  try {
    await ensureSchema(db);
    const row = await db
      .prepare(
        `INSERT INTO comments (slug, user_sub, name, picture, body)
           VALUES (?1, ?2, ?3, ?4, ?5)
           RETURNING id, name, picture, body, created_at`
      )
      .bind(slug, claims.sub, claims.name, claims.picture ?? null, body)
      .first();
    return json({ comment: row });
  } catch {
    return json({ error: 'Storage unavailable.' }, 503);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  let id = 0;
  let credential = '';
  try {
    const b = await request.json();
    id = Number(b?.id) || 0;
    credential = typeof b?.credential === 'string' ? b.credential : '';
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (!id) return json({ error: 'Bad id.' }, 400);
  const claims = await verifyGoogle(credential);
  if (!claims) return json({ error: 'تسجيل الدخول مطلوب.' }, 401);

  const db = getDB(locals);
  if (!db) return json({ error: 'Comments are not configured.' }, 503);
  try {
    await ensureSchema(db);
    // Author-only delete: the token's sub must own the row.
    await db
      .prepare('DELETE FROM comments WHERE id = ?1 AND user_sub = ?2')
      .bind(id, claims.sub)
      .run();
    return json({ ok: true });
  } catch {
    return json({ error: 'Storage unavailable.' }, 503);
  }
};
