import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import pRetry, { AbortError } from 'p-retry';
import { CONFIG as config } from '../config.js';
import { createAuthenticatedFetch } from './auth.js';

/**
 * Wrapper for MCP Client to connect to remote PageIndex MCP server
 */
export class PageIndexMcpClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | SSEClientTransport | null =
    null;
  private apiKey: string;
  private connected = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get client identification headers
   */
  private getClientHeaders(): Record<string, string> {
    return {
      'X-Client-Type': __CLIENT_TYPE__,
      'X-Client-Version': __VERSION__,
    };
  }

  /**
   * Connect to the remote PageIndex MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await pRetry(
      async () => {
        const streamableHttpUrl = new URL(`${config.apiUrl}/api/mcp`);
        streamableHttpUrl.searchParams.set('local_upload', '1');

        const sseUrl = new URL(`${config.apiUrl}/api/mcp/sse`);
        sseUrl.searchParams.set('local_upload', '1');

        this.client = new Client({
          name: 'pageindex-mcp',
          version: __VERSION__,
        });

        // Try StreamableHTTP first, fallback to SSE for compatibility
        try {
          // Use simplified authenticated fetch with client headers
          const clientHeaders = this.getClientHeaders();
          const authenticatedFetch = createAuthenticatedFetch(
            this.apiKey,
            clientHeaders,
          );

          this.transport = new StreamableHTTPClientTransport(
            streamableHttpUrl,
            {
              fetch: authenticatedFetch,
              requestInit: {
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            },
          );
          await this.client.connect(this.transport);
        } catch (_error) {
          try {
            // For SSE transport, we need to pass authenticated fetch as well
            const clientHeaders = this.getClientHeaders();
            const authenticatedFetch = createAuthenticatedFetch(
              this.apiKey,
              clientHeaders,
            );
            this.transport = new SSEClientTransport(sseUrl, {
              fetch: authenticatedFetch,
            });
            await this.client.connect(this.transport);
          } catch (sseError) {
            throw new AbortError(
              `Failed to connect to PageIndex MCP server: ${sseError}`,
            );
          }
        }

        this.connected = true;
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 8000,
        onFailedAttempt: (error) => {
          console.warn(
            `Connection attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
          );
        },
      },
    );
  }

  /**
   * Call a tool on the remote MCP server
   */
  async callTool(name: string, params: any): Promise<CallToolResult> {
    if (!this.client || !this.connected) {
      throw new Error('Client not connected. Call connect() first.');
    }

    return pRetry(
      async () => {
        if (!this.client) {
          throw new Error('Client not available');
        }
        const result = await this.client.callTool({
          name,
          arguments: params || {},
        });
        return result as CallToolResult;
      },
      {
        retries: 2,
        factor: 1.5,
        minTimeout: 500,
        maxTimeout: 3000,
        onFailedAttempt: (error) => {
          console.warn(
            `Tool call "${name}" attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
          );
        },
      },
    );
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
