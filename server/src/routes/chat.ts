import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { config, getModel, getTool, getFikenMcpClient } from '../lib/config.js';
import { RateLimitOptions, errorResponseBuilderContext } from '@fastify/rate-limit';
import { ChatRequest, ChatRequestBody, ErrorResponse } from '../types/chat.js';

export const chatRoute: FastifyPluginAsync = async fastify => {
  fastify.post<{ Body: ChatRequest }>(
    '/api/chat',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
          errorResponseBuilder: (
            req: FastifyRequest,
            context: errorResponseBuilderContext
          ): ErrorResponse => ({
            code: 429,
            error: 'Too Many Requests',
            expiresIn: context.ttl,
            message: `Rate limit exceeded, retry in ${context.after}`,
          }),
        } as RateLimitOptions,
      },
    },
    async (request, reply) => {
      const { messages, model, agents, reasoning } = request.body;

      const modelConfig = getModel(model);

      if (!modelConfig) {
        return reply.status(400).send({ error: 'Invalid model' });
      }

      const inferenceUrl = `${modelConfig.INFERENCE_URL}/v1/chat/completions`;
      const agentsUrl = `${modelConfig.INFERENCE_URL}/v1/agents/heroku`;
      const systemPrompt = config.system_prompt;
      const hasAgents = agents && agents.length > 0;

      const body: ChatRequestBody = {
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
      };

      if (hasAgents) {
        const mcpTools: string[] = [];
        const herokuTools: { type: string; name: string }[] = [];

        for (const agent of agents) {
          const tool = getTool(agent);
          if (tool?.type === 'mcp_tool') {
            mcpTools.push(agent);
            // For MCP tools, we'll handle them separately
            fastify.log.info(`MCP tool detected: ${agent}`);
          } else if (tool) {
            herokuTools.push(tool);
          }
        }

        // If we have MCP tools, we need to handle the request differently
        if (mcpTools.length > 0) {
          fastify.log.info(`Processing ${mcpTools.length} MCP tools: ${mcpTools.join(', ')}`);
          
          const mcpClient = getFikenMcpClient();
          if (mcpClient) {
            try {
              // Test connection to MCP server
              const isAlive = await mcpClient.ping();
              if (isAlive) {
                fastify.log.info('Fiken MCP server is accessible');
                // List available tools
                const availableTools = await mcpClient.listTools();
                fastify.log.info(`Available MCP tools: ${availableTools.map(t => t.name).join(', ')}`);
              } else {
                fastify.log.warn('Fiken MCP server is not accessible');
              }
            } catch (error) {
              fastify.log.error('Failed to communicate with Fiken MCP server:', error);
            }
          } else {
            fastify.log.warn('Fiken MCP client not configured (missing FIKEN_MCP_URL)');
          }
        }

        body.tools = herokuTools;
      } else {
        body.stream = true;
        if (model === 'claude-3-7-sonnet' && reasoning) {
          body.extended_thinking = {
            enabled: true,
            budget_tokens: 2000,
            include_reasoning: true,
          };
        }
      }

      try {
        const response = await fetch(hasAgents ? agentsUrl : inferenceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${modelConfig.API_KEY}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          fastify.log.error(errorData, 'Error from model');
          return reply.status(response.status).send({
            error: 'Failed to fetch from model',
            details: errorData.error.message,
          });
        }

        if (!response.body) {
          return reply.status(500).send({ error: 'No response body received' });
        }

        return response.body;
      } catch (error) {
        request.log.error(error, 'Stream error');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return reply.status(500).send({ error: 'Internal server error', details: errorMessage });
      }
    }
  );
};
