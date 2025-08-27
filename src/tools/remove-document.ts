import { z } from 'zod';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { ToolDefinition } from './types.js';

export const removeDocumentSchema = z.object({
  doc_ids: z.array(z.string()).describe('Array of document IDs to delete'),
});

export const removeDocumentTool: ToolDefinition = {
  name: 'remove_document',
  description:
    'Permanently delete one or more documents and all associated data. Accepts an array of doc_ids for batch deletion. Returns detailed success/failure status for each document. WARNING: This action is irreversible - deleted documents cannot be recovered.',
  inputSchema: removeDocumentSchema,
  handler: async (params: any, client: PageIndexMcpClient) =>
    await client.callTool('remove_document', params),
};
