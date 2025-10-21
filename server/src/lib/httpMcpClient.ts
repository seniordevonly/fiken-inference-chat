/**
 * Simple HTTP-based MCP client for communicating with fiken-mcp server
 * This assumes your fiken-mcp server exposes HTTP endpoints
 */

interface MCPToolCall {
  method: string;
  params: {
    name: string;
    arguments: any;
  };
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export class HttpMcpClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, data: any): Promise<MCPResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`MCP request failed:`, error);
      throw error;
    }
  }

  async listTools(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/tools/list', {
        method: 'tools/list',
        params: {},
      });

      if (response.error) {
        throw new Error(`MCP Error: ${response.error.message}`);
      }

      return response.result?.tools || [];
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      return [];
    }
  }

  async callTool(toolName: string, args: any): Promise<any> {
    try {
      const response = await this.makeRequest('/tools/call', {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      });

      if (response.error) {
        throw new Error(`MCP Tool Error: ${response.error.message}`);
      }

      return response.result;
    } catch (error) {
      console.error(`Failed to call MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('MCP server ping failed:', error);
      return false;
    }
  }
}

// Factory function to create MCP clients
export function createMcpClient(url: string, apiKey?: string): HttpMcpClient {
  return new HttpMcpClient(url, apiKey);
}
