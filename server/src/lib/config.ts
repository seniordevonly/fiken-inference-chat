import { ModelConfig } from '../types/shared.js';
import { createMcpClient, HttpMcpClient } from './httpMcpClient.js';

interface Config {
  system_prompt: string;
  models: {
    [key: string]: ModelConfig;
  };
  tools: {
    [key: string]: {
      type: string;
      name: string;
      runtime_params?: {
        target_app_name?: string;
        max_retries?: number;
        mcp_server_url?: string;
      };
    };
  };
}

export const config: Config = {
  system_prompt:
    process.env.SYSTEM_PROMPT ||
    'You are a helpful assistant that can answer questions and help with tasks.',
  models: {
    'claude-3-5-sonnet-latest': {
      INFERENCE_URL: process.env.INFERENCE_3_5_URL || 'https://us.inference.heroku.com',
      API_KEY: process.env.INFERENCE_3_5_KEY || 'inf-1234567890',
    },
    'claude-3-7-sonnet': {
      INFERENCE_URL: process.env.INFERENCE_3_7_URL || 'https://us.inference.heroku.com',
      API_KEY: process.env.INFERENCE_3_7_KEY || 'inf-1234567890',
    },
    'claude-4-5-haiku': {
      INFERENCE_URL: process.env.INFERENCE_4_5_HAIKU_URL || 'https://us.inference.heroku.com',
      API_KEY: process.env.INFERENCE_4_5_HAIKU_KEY || 'inf-1234567890',
    },
    'stable-image-ultra': {
      DIFFUSION_URL: process.env.DIFFUSION_URL || 'https://us.inference.heroku.com',
      API_KEY: process.env.DIFFUSION_KEY || 'inf-1234567890',
    },
  },
  tools: {
    html_to_markdown: {
      type: 'heroku_tool',
      name: 'html_to_markdown',
    },
    pdf_to_markdown: {
      type: 'heroku_tool',
      name: 'pdf_to_markdown',
    },
    code_exec_python: {
      type: 'heroku_tool',
      name: 'code_exec_python',
    },
    code_exec_ruby: {
      type: 'heroku_tool',
      name: 'code_exec_ruby',
    },
    code_exec_node: {
      type: 'heroku_tool',
      name: 'code_exec_node',
    },
    code_exec_go: {
      type: 'heroku_tool',
      name: 'code_exec_go',
    },
    // Fiken MCP tools (managed by Heroku)
    fiken_get_purchases: {
      type: 'mcp',
      name: 'fiken_get_purchases',
    },
    fiken_get_purchase_draft: {
      type: 'mcp',
      name: 'fiken_get_purchase_draft',
    },
    fiken_get_invoices: {
      type: 'mcp',
      name: 'fiken_get_invoices',
    },
    // Add more fiken-mcp tools as needed
  },
};

export const getModels = () => {
  return Object.keys(config.models);
};

export const getTool = (tool: string) => {
  return config.tools[tool];
};

export const getModel = (model: string) => {
  return config.models[model];
};

// MCP client instance for fiken-mcp server
let fikenMcpClient: HttpMcpClient | null = null;

export const getFikenMcpClient = (): HttpMcpClient | null => {
  if (!fikenMcpClient && process.env.FIKEN_MCP_URL) {
    fikenMcpClient = createMcpClient(
      process.env.FIKEN_MCP_URL,
      process.env.FIKEN_MCP_KEY
    );
  }
  return fikenMcpClient;
};
