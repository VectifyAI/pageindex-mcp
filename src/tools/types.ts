import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageIndexMcpClient } from '../client/mcp-client.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (params: any, client: PageIndexMcpClient) => Promise<CallToolResult>;
}