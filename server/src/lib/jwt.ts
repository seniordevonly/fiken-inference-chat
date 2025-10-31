import crypto from 'node:crypto';

// Minimal HS256 JWT utilities (no clock skew handling beyond Date.now())

function base64url(input: Buffer | string): string {
  const str = (typeof input === 'string' ? Buffer.from(input) : input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return str;
}

function base64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad === 4 ? 0 : pad);
  return Buffer.from(normalized, 'base64');
}

export interface JwtPayload {
  sub: string; // subject (e.g., email)
  iat: number; // issued at (seconds)
  exp: number; // expiry (seconds)
  [key: string]: unknown;
}

export function signJwt(payload: JwtPayload, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  const sigB64 = base64url(signature);
  return `${data}.${sigB64}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sig] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expected = base64url(crypto.createHmac('sha256', secret).update(data).digest());
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payloadJson = base64urlDecode(payloadB64).toString('utf8');
    const payload = JSON.parse(payloadJson) as JwtPayload;
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || nowSec >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
