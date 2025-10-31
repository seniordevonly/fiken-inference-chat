import { FastifyPluginAsync } from 'fastify';
import { signJwt, verifyJwt } from '../lib/jwt.js';

const COOKIE_NAME = 'auth';
const WEEK_SECONDS = 7 * 24 * 60 * 60;

function getCookieOptions(remember: boolean) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=%TOKEN%`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  if (remember) parts.push(`Max-Age=${WEEK_SECONDS}`);
  return parts.join('; ');
}

function clearCookieHeader() {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ];
  if (secure) parts[0] += '; Secure';
  return parts[0];
}

function parseCookies(cookieHeader?: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(';');
  for (const item of items) {
    const [k, ...rest] = item.trim().split('=');
    cookies[k] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

export const authRoute: FastifyPluginAsync = async fastify => {
  // Rate limit login
  fastify.post(
    '/api/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { email, password, rememberMe } = (request.body as any) || {};

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        fastify.log.error('JWT_SECRET is not set');
        return reply.status(500).send({ error: 'Server misconfiguration' });
      }

      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }

      if (!adminEmail || !adminPassword) {
        return reply.status(401).send({ error: 'No admin user configured' });
      }

      const ok = email === adminEmail && password === adminPassword;
      if (!ok) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const now = Math.floor(Date.now() / 1000);
      const exp = now + WEEK_SECONDS; // 7 days max validity
      const token = signJwt({ sub: email, iat: now, exp }, jwtSecret);

      const header = getCookieOptions(!!rememberMe).replace('%TOKEN%', token);
      reply.header('Set-Cookie', header);
      return reply.send({ ok: true, user: { email } });
    }
  );

  fastify.post('/api/logout', async (_request, reply) => {
    reply.header('Set-Cookie', clearCookieHeader());
    return reply.send({ ok: true });
  });

  fastify.get('/api/me', async (request, reply) => {
    const cookies = parseCookies(request.headers.cookie);
    const token = cookies[COOKIE_NAME];
    const jwtSecret = process.env.JWT_SECRET;
    if (!token || !jwtSecret) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const payload = verifyJwt(token, jwtSecret);
    if (!payload) return reply.status(401).send({ error: 'Unauthorized' });
    return reply.send({ user: { email: payload.sub } });
  });
};
