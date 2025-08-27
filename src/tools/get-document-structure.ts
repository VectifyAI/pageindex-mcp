import { z } from 'zod';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { ToolDefinition } from './types.js';

// Schema for get document structure parameters
export const getDocumentStructureSchema = z.object({
  doc_id: z
    .string()
    .min(1, 'Document ID cannot be empty')
    .describe('The ID of the document to get structure from'),
  mode: z
    .enum(['summary', 'outline', 'full'])
    .default('summary')
    .describe(
      'Level of detail: summary (titles only), outline (titles + summaries), full (complete structure)',
    ),
  max_depth: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe('Maximum depth level to return (1-10)'),
});

export type McpGetDocumentStructureParams = z.infer<typeof getDocumentStructureSchema>;

export const getDocumentStructureTool: ToolDefinition = {
  name: 'get_document_structure',
  description:
    'Extract the hierarchical structure of a processed document for navigation and analysis. Returns organized structure including headers, sections, and subsections with configurable detail levels (summary, outline, full) and depth control. Useful for understanding document organization and enabling structured navigation through complex documents.',
  inputSchema: getDocumentStructureSchema,
  handler: async (params: any, client: PageIndexMcpClient) =>
    await client.callTool('get_document_structure', params),
};
