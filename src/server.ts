import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PageIndexMcpClient } from './client/mcp-client.js';
import { tools, executeTool, updateToolsWithRemote, RemoteToolsProxy } from './tools/index.js';
import { config_ as config } from './config.js';

/**
 * Stdio MCP Server that wraps the remote PageIndex MCP server
 */
export class PageIndexStdioServer {
  private server: Server;
  private mcpClient: PageIndexMcpClient;
  private remoteToolsProxy: RemoteToolsProxy;

  constructor() {
    this.server = new Server(
      {
        name: 'pageindex-mcp',
        version: '0.4.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.mcpClient = new PageIndexMcpClient(config.apiKey);
    this.remoteToolsProxy = new RemoteToolsProxy(this.mcpClient);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
        const result = await executeTool(name, args, this.mcpClient);
        return result;
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error instanceof Error ? error.message : 'Unknown error',
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
      console.error('MCP Server error:', error);
    };
  }

  /**
   * Start the stdio server
   */
  async start() {
    try {
      // Connect to remote MCP client
      await this.mcpClient.connect();

      // Fetch remote tools and update local tools registry
      const remoteTools = await this.remoteToolsProxy.fetchRemoteTools();
      updateToolsWithRemote(remoteTools);

      // Start the stdio server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    try {
      await this.mcpClient.close();
    } catch (error) {
      console.error('Error during server shutdown:', error);
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
