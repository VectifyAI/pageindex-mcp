import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
import type { PageIndexMcpClient } from '../client/mcp-client.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (params: any, client: PageIndexMcpClient) => Promise<CallToolResult>;
}
