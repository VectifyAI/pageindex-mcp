import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createAuthenticatedFetch } from './auth.js';
import { config_ as config } from '../config.js';

/**
 * Wrapper for MCP Client to connect to remote PageIndex MCP server
 */
export class PageIndexMcpClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | SSEClientTransport | null = null;
  private apiKey: string;
  private connected = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Connect to the remote PageIndex MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const streamableHttpUrl = new URL(`${config.apiUrl}/api/mcp/mcp`);
    streamableHttpUrl.searchParams.set('local_upload', '1');

    const sseUrl = new URL(`${config.apiUrl}/api/mcp/sse`);
    sseUrl.searchParams.set('local_upload', '1');

    this.client = new Client({
      name: 'pageindex-mcp',
      version: '0.4.0',
    });

    // Try StreamableHTTP first, fallback to SSE for compatibility
    try {
      // Use simplified authenticated fetch
      const authenticatedFetch = createAuthenticatedFetch(this.apiKey);

      this.transport = new StreamableHTTPClientTransport(streamableHttpUrl, {
        fetch: authenticatedFetch,
        requestInit: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });
      await this.client.connect(this.transport);
    } catch (error) {
      try {
        // For SSE transport, we need to pass authenticated fetch as well
        const authenticatedFetch = createAuthenticatedFetch(this.apiKey);
        this.transport = new SSEClientTransport(sseUrl, {
          fetch: authenticatedFetch,
        });
        await this.client.connect(this.transport);
      } catch (sseError) {
        throw new Error(`Failed to connect to PageIndex MCP server: ${sseError}`);
      }
    }

    this.connected = true;
  }

  /**
   * Call a tool on the remote MCP server
   */
  async callTool(name: string, params: any): Promise<CallToolResult> {
    if (!this.client || !this.connected) {
      throw new Error('Client not connected. Call connect() first.');
    }

    const result = await this.client.callTool({ name, arguments: params || {} });
    return result as CallToolResult;
  }

  /**
   * List available tools on the remote server
   */
  async listTools() {
    if (!this.client || !this.connected) {
      throw new Error('Client not connected. Call connect() first.');
    }

    const tools = await this.client.listTools();
    return tools;
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }

    if (this.client) {
      this.client = null;
    }

    this.connected = false;
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
