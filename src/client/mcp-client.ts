import {
  type OAuthClientProvider,
  UnauthorizedError,
} from '@modelcontextprotocol/sdk/client/auth.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type {
  CallToolResult,
  ListResourcesResult,
  ListResourceTemplatesResult,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import pRetry from 'p-retry';
import { CONFIG } from '../config.js';
import { PageIndexOAuthProvider } from './oauth-provider.js';

/**
 * Wrapper for MCP Client to connect to remote PageIndex MCP server with OAuth authentication
 */
export class PageIndexMcpClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | SSEClientTransport | null =
    null;
  private oauthProvider: OAuthClientProvider;

  constructor(oauthProvider?: OAuthClientProvider) {
    if (oauthProvider) {
      this.oauthProvider = oauthProvider;
    } else {
      // Create default OAuth provider with built-in configuration
      this.oauthProvider = new PageIndexOAuthProvider(
        'http://localhost:8090/callback',
        {
          client_name: __CLIENT_NAME__,
          redirect_uris: ['http://localhost:8090/callback'],
          token_endpoint_auth_method: 'none', // Public client by default
          grant_types: ['authorization_code'],
          response_types: ['code'],
          scope: 'mcp:access',
        },
      );
    }
  }

  /**
   * Create a PageIndexMcpClient that prioritizes stored client information
   */
  static async createWithStoredClientInfo(): Promise<PageIndexMcpClient> {
    const storedClientInfo = await PageIndexOAuthProvider.getStoredClientInfo();
    if (storedClientInfo) {
      const oauthProvider = new PageIndexOAuthProvider(
        'http://localhost:8090/callback',
        storedClientInfo,
      );
      // Load stored tokens and client info to sync internal state
      await oauthProvider.loadFromStorage();
      return new PageIndexMcpClient(oauthProvider);
    } else {
      return new PageIndexMcpClient();
    }
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
   * Create transport instance with authProvider
   */
  private async createTransport(): Promise<
    StreamableHTTPClientTransport | SSEClientTransport
  > {
    const streamableHttpUrl = new URL(`${CONFIG.apiUrl}/mcp`);
    streamableHttpUrl.searchParams.set('local_upload', '1');

    const sseUrl = new URL(`${CONFIG.apiUrl}/mcp/sse`);
    sseUrl.searchParams.set('local_upload', '1');

    // Try StreamableHTTP first, fallback to SSE for compatibility
    try {
      return new StreamableHTTPClientTransport(streamableHttpUrl, {
        authProvider: this.oauthProvider,
        requestInit: {
          headers: {
            ...this.getClientHeaders(),
            'Content-Type': 'application/json',
          },
        },
      });
    } catch {
      return new SSEClientTransport(sseUrl, {
        authProvider: this.oauthProvider,
      });
    }
  }

  /**
   * Attempt connection with OAuth authentication and recursive retry
   */
  private async attemptConnection(): Promise<void> {
    try {
      // Create transport with authProvider
      const transport = await this.createTransport();
      this.transport = transport;

      // Create client
      this.client = new Client({
        name: 'pageindex-mcp',
        version: __VERSION__,
      });

      // Attempt connection
      await this.client.connect(transport);

      console.error('Connected to PageIndex MCP server successfully.\n');
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        console.error('Authentication required, starting OAuth flow...\n');

        if (this.oauthProvider instanceof PageIndexOAuthProvider) {
          // Wait for OAuth callback
          const authCode = await this.oauthProvider.waitForOAuthCallback();

          // Use finishAuth to complete authentication
          if (this.transport) {
            await this.transport.finishAuth(authCode);
          }

          console.error(
            'OAuth authentication completed, retrying connection...\n',
          );

          // Recursive retry
          await this.attemptConnection();
        } else {
          throw new Error('OAuth provider does not support callback waiting');
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  }

  /**
   * Call a tool on the remote MCP server
   */
  async callTool(name: string, params: any): Promise<CallToolResult> {
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
          console.error(
            `Tool call "${name}" attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.\n`,
          );
        },
      },
    );
  }

  /**
   * Connect using OAuth authentication with finishAuth pattern
   */
  public async connect(): Promise<void> {
    await this.attemptConnection();
  }

  /**
   * List available tools on the remote server
   */
  async listTools() {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }

    const tools = await this.client.listTools();
    return tools;
  }

  /**
   * List available resources on the remote server
   */
  async listResources(): Promise<ListResourcesResult> {
    return pRetry(
      async () => {
        if (!this.client) {
          throw new Error('Client not available');
        }
        const result = await this.client.listResources();
        return result as ListResourcesResult;
      },
      {
        retries: 2,
        factor: 1.5,
        minTimeout: 500,
        maxTimeout: 3000,
        onFailedAttempt: (error) => {
          console.error(
            `List resources attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.\n`,
          );
        },
      },
    );
  }

  /**
   * Read a specific resource from the remote server
   */
  async readResource(uri: string): Promise<ReadResourceResult> {
    return pRetry(
      async () => {
        if (!this.client) {
          throw new Error('Client not available');
        }
        const result = await this.client.readResource({ uri });
        return result as ReadResourceResult;
      },
      {
        retries: 2,
        factor: 1.5,
        minTimeout: 500,
        maxTimeout: 3000,
        onFailedAttempt: (error) => {
          console.error(
            `Read resource "${uri}" attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.\n`,
          );
        },
      },
    );
  }

  /**
   * List resource templates from the remote server
   */
  async listResourceTemplates(): Promise<ListResourceTemplatesResult> {
    return pRetry(
      async () => {
        if (!this.client) {
          throw new Error('Client not available');
        }
        const result = await this.client.listResourceTemplates();
        return result as ListResourceTemplatesResult;
      },
      {
        retries: 2,
        factor: 1.5,
        minTimeout: 500,
        maxTimeout: 3000,
        onFailedAttempt: (error) => {
          console.error(
            `List resource templates attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.\n`,
          );
        },
      },
    );
  }

  /**
   * Reconnect to the server
   */
  async reconnect(): Promise<void> {
    await this.close();
    await this.connect();
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
  }
}
