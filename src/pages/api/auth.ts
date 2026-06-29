import type { APIRoute } from 'astro';
import { getDB, json } from '../../lib/social-db';
import {
  verifyGoogle,
  ensureSessions,
  newSessionId,
  getSessionUser,
  COOKIE,
  SESSION_DAYS,
} from '../../lib/auth';

// First-party session for the comments login. Google verifies you ONCE
// (POST with the ID token); we then issue an httpOnly session cookie so
// refreshes don't re-prompt Google — and it works where third-party cookies
// are blocked.
//   GET    /api/auth                 → { user } | { user: null }
//   POST   /api/auth { credential }   → { user }   (+ Set-Cookie)
//   DELETE /api/auth                 → { ok }     (clears the cookie)
export const prerender = false;

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = getDB(locals);
  if (!db) return json({ user: null });
  const user = await getSessionUser(db, cookies.get(COOKIE)?.value);
  return json({ user });
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  let credential = '';
  try {
    const b = await request.json();
    credential = typeof b?.credential === 'string' ? b.credential : '';
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const claims = await verifyGoogle(credential);
  if (!claims) return json({ error: 'تعذّر التحقّق من تسجيل الدخول.' }, 401);

  const db = getDB(locals);
  if (!db) return json({ error: 'Sessions are not configured.' }, 503);
  try {
    await ensureSessions(db);
    const id = newSessionId();
    await db
      .prepare(
        `INSERT INTO sessions (id, user_sub, name, picture, expires_at)
           VALUES (?1, ?2, ?3, ?4, datetime('now', '+${SESSION_DAYS} days'))`
      )
      .bind(id, claims.sub, claims.name, claims.picture ?? null)
      .run();
    cookies.set(COOKIE, id, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * SESSION_DAYS,
    });
    return json({ user: claims });
  } catch {
    return json({ error: 'Storage unavailable.' }, 503);
  }
};

export const DELETE: APIRoute = async ({ cookies, locals }) => {
  const db = getDB(locals);
  const sid = cookies.get(COOKIE)?.value;
  if (db && sid) {
    try {
      await ensureSessions(db);
      await db.prepare('DELETE FROM sessions WHERE id = ?1').bind(sid).run();
    } catch {
      /* ignore */
    }
  }
  cookies.delete(COOKIE, { path: '/' });
  return json({ ok: true });
};
