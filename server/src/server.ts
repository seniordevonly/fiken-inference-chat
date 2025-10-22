import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { chatRoute } from './routes/chat.js';
import { imagesRoute } from './routes/images.js';
import { debugRoute } from './routes/debug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../..');

const fastify = Fastify({
  logger: true,
});

// Register CORS
fastify.register(fastifyCors, {
  origin: true, // Reflect the request origin, or set to your specific domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

// Register rate limiter for specific routes
fastify.register(fastifyRateLimit);

// Serve static files from the React app build directory
fastify.register(fastifyStatic, {
  root: join(rootDir, 'client/dist'),
  prefix: '/',
});

// Register chat route with rate limiting
fastify.register(chatRoute);

// Register images route with rate limiting
fastify.register(imagesRoute);

// Register debug route
fastify.register(debugRoute);

// Run the server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start().catch(err => {
  fastify.log.error('Failed to start server:', err);
  process.exit(1);
});
