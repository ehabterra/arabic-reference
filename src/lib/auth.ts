// Shared auth helpers: verify a Google ID token, and manage first-party
// sessions in D1 so users stay signed in across refreshes (Google only does the
// initial sign-in; our own httpOnly cookie keeps the session — which also works
// where third-party cookies are blocked, e.g. Safari).
import type { D1Database } from './social-db';

const CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || '';

export const COOKIE = 'dp_sess';
export const SESSION_DAYS = 30;

export interface SessionUser {
  sub: string;
  name: string;
  picture?: string;
}

// Verify a Google ID token via Google's tokeninfo endpoint (checks signature +
// expiry); we then confirm the audience is our client.
export async function verifyGoogle(credential: string): Promise<SessionUser | null> {
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
    };
  } catch {
    return null;
  }
}

let sessReady: Promise<unknown> | null = null;
export function ensureSessions(db: D1Database) {
  sessReady ??= db
    .prepare(
      `CREATE TABLE IF NOT EXISTS sessions (
         id         TEXT PRIMARY KEY,
         user_sub   TEXT NOT NULL,
         name       TEXT NOT NULL,
         picture    TEXT,
         created_at TEXT NOT NULL DEFAULT (datetime('now')),
         expires_at TEXT NOT NULL
       )`
    )
    .run()
    .catch((e) => {
      sessReady = null;
      throw e;
    });
  return sessReady;
}

export function newSessionId(): string {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getSessionUser(
  db: D1Database,
  sid: string | undefined
): Promise<SessionUser | null> {
  if (!sid) return null;
  try {
    await ensureSessions(db);
    const row = await db
      .prepare(
        `SELECT user_sub, name, picture FROM sessions
           WHERE id = ?1 AND expires_at > datetime('now')`
      )
      .bind(sid)
      .first<{ user_sub: string; name: string; picture?: string }>();
    return row ? { sub: row.user_sub, name: row.name, picture: row.picture } : null;
  } catch {
    return null;
  }
}
