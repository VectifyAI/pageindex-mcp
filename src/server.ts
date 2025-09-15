import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PageIndexMcpClient } from './client/mcp-client.js';
import {
  executeTool,
  getTools,
  RemoteToolsProxy,
  updateToolsWithRemote,
} from './tools/index.js';

/**
 * Stdio MCP Server that wraps the remote PageIndex MCP server
 */
class PageIndexStdioServer {
  private server: Server;
  private mcpClient: PageIndexMcpClient | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'pageindex-mcp',
        version: __VERSION__,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Initialize remote connection on first list tools request
      if (!this.mcpClient) {
        await this.connectToRemoteServer();
      }

      // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
      const remoteToolsProxy = new RemoteToolsProxy(this.mcpClient!);
      const remoteTools = await remoteToolsProxy.fetchRemoteTools();
      updateToolsWithRemote(remoteTools);

      const tools = getTools();
      const toolsResponse = {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: zodToJsonSchema(tool.inputSchema, {
            strictUnions: true,
          }),
        })),
      };

      return toolsResponse;
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!this.mcpClient) {
          await this.connectToRemoteServer();
        }
        // biome-ignore lint/style/noNonNullAssertion: mcpClient is ensured to be non-null here
        const result = await executeTool(name, args, this.mcpClient!);
        return result;
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                  tool: name,
                  timestamp: new Date().toISOString(),
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    });

    this.server.onerror = (error) => {
      console.error(`MCP Server error: ${error}\n`);
    };
  }

  /**
   * Connect to remote PageIndex MCP server
   */
  private async connectToRemoteServer() {
    // If the client is already connected, return immediately.
    if (this.mcpClient) {
      return;
    }

    // If a connection is already in progress, wait for it to complete.
    if (this.connectPromise) {
      return await this.connectPromise;
    }

    // If no connection is in progress, start a new one and "lock" it.
    this.connectPromise = (async () => {
      try {
        const mcpClient = await PageIndexMcpClient.createWithStoredClientInfo();
        await mcpClient.connect();
        this.mcpClient = mcpClient;
      } catch (error) {
        // If the connection fails, clear the "lock" to allow for a retry on the next call.
        this.connectPromise = null;
        console.error(`Failed to initialize remote connection: ${error}\n`);
        // Re-throw the error so the caller knows the connection failed.
        throw error;
      }
    })();

    return await this.connectPromise;
  }

  /**
   * Start the stdio server
   */
  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      // this.connectToRemoteServer();
    } catch (error) {
      console.error(`Failed to start server: ${error}\n`);
      process.exit(1);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    try {
      if (this.mcpClient) {
        await this.mcpClient.close();
      }
    } catch (error) {
      console.error(`Error during server shutdown: ${error}\n`);
    }
  }
}

/**
 * Create and start the server
 */
export async function startServer() {
  const server = new PageIndexStdioServer();

  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });

  await server.start();
}
