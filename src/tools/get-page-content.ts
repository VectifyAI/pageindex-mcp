import { z } from 'zod';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { ToolDefinition } from './types.js';

export const getPageContentSchema = z.object({
  doc_id: z.string().describe('Document ID'),
  pages: z
    .string()
    .describe('Page selection: single page ("5"), ranges ("3-7"), or multiple ("1,5,10")'),
});

export const getPageContentTool: ToolDefinition = {
  name: 'get_page_content',
  description:
    'Extract specific page content from processed documents. Flexible page selection: single page ("5"), ranges ("3-7"), or multiple specific pages ("1,5,10"). Returns structured text content with image metadata (excludes base64 data for token efficiency). Useful for detailed analysis of specific document sections.',
  inputSchema: getPageContentSchema,
  handler: async (params: any, client: PageIndexMcpClient) =>
    await client.callTool('get_page_content', params),
};
