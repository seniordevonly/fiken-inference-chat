import { FastifyPluginAsync } from 'fastify';
import { getModel } from '../lib/config.js';

export const debugRoute: FastifyPluginAsync = async fastify => {
  // Debug route to test MCP tool discovery
  fastify.get('/api/debug/mcp-tools', async (request, reply) => {
    try {
      const modelConfig = getModel('claude-3-7-sonnet');
      if (!modelConfig) {
        return reply.status(400).send({ error: 'Model not configured' });
      }

      const agentsUrl = `${modelConfig.INFERENCE_URL}/v1/agents/heroku`;
      
      // Test different possible tool names
      const possibleToolNames = [
        'fiken_get_purchases',
        'get_purchases',
        'fiken_purchases',
        'purchases',
        'list_purchases',
        'fiken_get_purchase',
        'fiken_list_purchases'
      ];

      const results = [];

      for (const toolName of possibleToolNames) {
        try {
          const response = await fetch(agentsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${modelConfig.API_KEY}`,
            },
            body: JSON.stringify({
              model: 'claude-3-7-sonnet',
              messages: [
                {
                  role: 'user',
                  content: 'Test tool availability',
                },
              ],
              tools: [
                {
                  type: 'heroku_tool',
                  name: toolName,
                  runtime_params: {
                    target_app_name: process.env.FIKEN_MCP_APP_NAME || 'fiken-mcp',
                  },
                },
              ],
            }),
          });

          const responseData = await response.json();
          results.push({
            toolName,
            status: response.status,
            success: response.ok,
            response: responseData,
          });
        } catch (error) {
          results.push({
            toolName,
            status: 'error',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return reply.send({
        success: true,
        testResults: results,
        environment: {
          FIKEN_MCP_APP_NAME: process.env.FIKEN_MCP_APP_NAME,
          agentsUrl,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Debug MCP tools error');
      return reply.status(500).send({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Debug route to list available tools from Heroku
  fastify.get('/api/debug/tools', async (request, reply) => {
    try {
      const modelConfig = getModel('claude-3-7-sonnet');
      if (!modelConfig) {
        return reply.status(400).send({ error: 'Model not configured' });
      }

      const agentsUrl = `${modelConfig.INFERENCE_URL}/v1/agents/heroku`;
      
      // Try to get available tools by making a request with no tools
      const response = await fetch(agentsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${modelConfig.API_KEY}`,
        },
        body: JSON.stringify({
          model: 'claude-3-7-sonnet',
          messages: [
            {
              role: 'system',
              content: 'List available tools',
            },
            {
              role: 'user',
              content: 'What tools are available?',
            },
          ],
          tools: [], // Empty tools array to see what's available
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        fastify.log.error(errorData, 'Error from Heroku agents endpoint');
        return reply.status(response.status).send({
          error: 'Failed to fetch from Heroku',
          details: errorData,
        });
      }

      // Return the response to see what Heroku says about available tools
      const responseData = await response.json();
      return reply.send({
        success: true,
        herokuResponse: responseData,
      });
    } catch (error) {
      fastify.log.error(error, 'Debug tools error');
      return reply.status(500).send({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
