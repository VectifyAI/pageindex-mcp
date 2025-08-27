import { z } from 'zod';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { ToolDefinition } from './types.js';

export const myDocumentsSchema = z.object({
  status: z
    .enum(['processing', 'completed', 'failed'])
    .optional()
    .describe('Filter by document status'),
  limit: z.number().optional().default(10).describe('Maximum number of documents to return'),
  offset: z.number().optional().default(0).describe('Number of documents to skip'),
});

export const listDocumentsTool: ToolDefinition = {
  name: 'list_documents',
  description:
    'List user\'s documents with comprehensive status information and intelligent suggestions. Shows processing progress, completion status, and readiness for queries. Supports filtering by status ("processing", "completed", "failed") and pagination. Returns actionable insights about document states and recommended next steps.',
  inputSchema: myDocumentsSchema,
  handler: async (params: any, client: PageIndexMcpClient) =>
    await client.callTool('list_documents', params),
};
