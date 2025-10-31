import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyJwt } from './jwt.js';

export const AUTH_COOKIE = 'auth';

export function parseCookies(cookieHeader?: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(';');
  for (const item of items) {
    const [k, ...rest] = item.trim().split('=');
    cookies[k] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

export function requireAuth(req: FastifyRequest, reply: FastifyReply): { email: string } | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    reply.status(500).send({ error: 'Server misconfiguration' });
    return null;
  }
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[AUTH_COOKIE];
  if (!token) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  const payload = verifyJwt(token, jwtSecret);
  if (!payload) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return { email: String(payload.sub) };
}
