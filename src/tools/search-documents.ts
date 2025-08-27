import { z } from 'zod';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { ToolDefinition } from './types.js';

export const searchDocumentsSchema = z.object({
  query: z.string().describe('Search query for document names or descriptions'),
  status: z.enum(['processing', 'completed', 'failed']).optional().describe('Filter by status'),
  limit: z.number().optional().default(10).describe('Maximum results to return'),
});

export const searchDocumentsTool: ToolDefinition = {
  name: 'search_documents',
  description:
    'Search through your document library using keywords in filenames or descriptions. Supports fuzzy matching for better discovery. Filter options include: status ("processing", "completed", "failed"), date ranges, and document type. Returns ranked results with relevance scores and document metadata.',
  inputSchema: searchDocumentsSchema,
  handler: async (params: any, client: PageIndexMcpClient) =>
    await client.callTool('search_documents', params),
};
