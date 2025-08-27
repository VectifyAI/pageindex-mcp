import { z } from 'zod';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { ToolDefinition } from './types.js';

export const askDocumentSchema = z.object({
  doc_id: z.string().describe('Document ID to query'),
  query: z.string().describe('Natural language question to ask about the document'),
  thinking: z.boolean().optional().default(false).describe('Enable deeper analysis mode'),
  max_wait_time: z
    .number()
    .optional()
    .default(60)
    .describe('Maximum time to wait for response in seconds'),
});

export const askDocumentTool: ToolDefinition = {
  name: 'ask_document',
  description:
    'Query processed documents using natural language questions. Automatically polls for completion if document is still processing. Returns either a context with prompt (for AI generation) or a complete answer with page-level citations. Supports "thinking" mode for deeper analysis. Max wait time configurable (default: 60 seconds).',
  inputSchema: askDocumentSchema,
  handler: async (params: any, client: PageIndexMcpClient) =>
    await client.callTool('ask_document', params),
};
