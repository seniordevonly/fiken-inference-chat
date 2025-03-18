import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pipeline, Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { getModel } from "./lib/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "../..");

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

// Serve static files from the React app build directory
fastify.register(fastifyStatic, {
  root: join(rootDir, "client/dist"),
  prefix: "/",
});

// Chat completion endpoint
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  reasoning?: boolean;
  stream?: boolean;
}

interface ModelRequestBody {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  extended_thinking?: {
    enabled: boolean;
    budget_tokens: number;
    include_reasoning: boolean;
  };
}

fastify.post(
  "/api/chat",
  async (
    request: FastifyRequest<{ Body: ChatRequest }>,
    reply: FastifyReply
  ) => {
    const { messages, model, reasoning } = request.body;

    const modelConfig = getModel(model);

    if (!modelConfig) {
      return reply.status(400).send({ error: "Invalid model" });
    }

    const body: ModelRequestBody = {
      model: model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
    };

    if (reasoning) {
      body.extended_thinking = {
        enabled: true,
        budget_tokens: 2000,
        include_reasoning: true,
      };
    }

    const response = await fetch(
      modelConfig.INFERENCE_URL + "/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${modelConfig.API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return reply.status(500).send({ error: "Failed to fetch from model" });
    }

    if (!response.body) {
      reply.raw.end();
      return;
    }

    // Set proper headers for SSE
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Content-Encoding', 'none');
    
    const reader = response.body.getReader();
    let isDestroyed = false;

    // Handle client disconnection
    request.raw.on('close', () => {
      isDestroyed = true;
      reader.cancel();
    });
    
    try {
      const textDecoder = new TextDecoder();
      while (!isDestroyed) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Check if stream is still valid before writing
        if (!isDestroyed && !reply.raw.destroyed) {
          try {
            const text = textDecoder.decode(value);
            await new Promise<void>((resolve, reject) => {
              reply.raw.write(text, (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } catch (writeError) {
            fastify.log.error('Write error:', writeError);
            break;
          }
        } else {
          break;
        }
      }
    } catch (error) {
      fastify.log.error('Stream error:', error);
    } finally {
      reader.releaseLock();
      if (!reply.raw.destroyed) {
        reply.raw.end();
      }
    }
  }
);

// Run the server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
