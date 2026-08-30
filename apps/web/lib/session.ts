import 'server-only';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';

export interface Session {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
  exp: number;
}

// Decodes (does not verify) the JWT the backend already signed, purely to
// read its claims for display and to size the cookie's expiry. Signature
// verification happens server-side, on the API, on every authenticated
// request — this cookie is opaque to everything except the API.
function decodePayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export async function createSession(accessToken: string): Promise<void> {
  const payload = decodePayload(accessToken);
  const expires = payload ? new Date(payload.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSession(): Promise<Session | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const payload = decodePayload(token);
  if (!payload || payload.exp * 1000 < Date.now()) return null;

  return { id: payload.sub, email: payload.email, organizationId: payload.organizationId, role: payload.role };
}
