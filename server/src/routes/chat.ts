import { FastifyReply, FastifyRequest } from 'fastify';
import { getModel } from '../lib/config.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
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

export async function chatHandler(
  request: FastifyRequest<{ Body: ChatRequest }>,
  reply: FastifyReply
) {
  const { messages, model, reasoning } = request.body;

  const modelConfig = getModel(model);

  if (!modelConfig) {
    return reply.status(400).send({ error: 'Invalid model' });
  }

  const body: ModelRequestBody = {
    model: model,
    messages: messages.map(msg => ({
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

  try {
    const response = await fetch(`${modelConfig.INFERENCE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${modelConfig.API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return reply.status(response.status).send({ error: 'Failed to fetch from model' });
    }

    if (!response.body) {
      return reply.status(500).send({ error: 'No response body received' });
    }

    return response.body;
  } catch (error) {
    request.log.error('Stream error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}
