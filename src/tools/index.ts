import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { processDocument, processDocumentSchema } from './process-document.js';

// Re-export all schemas
export { processDocumentSchema };

// Tool schemas
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

export const getPageContentSchema = z.object({
  doc_id: z.string().describe('Document ID'),
  pages: z
    .string()
    .describe('Page selection: single page ("5"), ranges ("3-7"), or multiple ("1,5,10")'),
});

export const myDocumentsSchema = z.object({
  status: z
    .enum(['processing', 'completed', 'failed'])
    .optional()
    .describe('Filter by document status'),
  limit: z.number().optional().default(10).describe('Maximum number of documents to return'),
  offset: z.number().optional().default(0).describe('Number of documents to skip'),
});

export const removeDocumentSchema = z.object({
  doc_ids: z.array(z.string()).describe('Array of document IDs to delete'),
});

export const searchDocumentsSchema = z.object({
  query: z.string().describe('Search query for document names or descriptions'),
  status: z.enum(['processing', 'completed', 'failed']).optional().describe('Filter by status'),
  limit: z.number().optional().default(10).describe('Maximum results to return'),
});

export const getDocumentStructureSchema = z.object({
  doc_id: z.string().describe('Document ID to get structure from'),
});

// Tool definitions for the stdio server
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (params: any, client: PageIndexMcpClient) => Promise<CallToolResult>;
}

/**
 * Proxy function that forwards calls to remote MCP server
 */
function createProxyTool(toolName: string) {
  return async (params: any, client: PageIndexMcpClient): Promise<CallToolResult> => {
    return await client.callTool(toolName, params);
  };
}

// All available tools
export const tools: ToolDefinition[] = [
  {
    name: 'process_document',
    description:
      'Upload and process PDF documents from URLs or local files. Supports OCR processing, hierarchical content extraction, and intelligent document analysis. Returns a unique doc_id for subsequent operations. Processing typically takes 0-3 minutes depending on document size (estimate: 2 seconds per page). Supports files up to 100MB.',
    inputSchema: processDocumentSchema,
    handler: processDocument,
  },
  {
    name: 'ask_document',
    description:
      'Query processed documents using natural language questions. Automatically polls for completion if document is still processing. Returns either a context with prompt (for AI generation) or a complete answer with page-level citations. Supports "thinking" mode for deeper analysis. Max wait time configurable (default: 60 seconds).',
    inputSchema: askDocumentSchema,
    handler: createProxyTool('ask_document'),
  },
  {
    name: 'get_page_content',
    description:
      'Extract specific page content from processed documents. Flexible page selection: single page ("5"), ranges ("3-7"), or multiple specific pages ("1,5,10"). Returns structured text content with image metadata (excludes base64 data for token efficiency). Useful for detailed analysis of specific document sections.',
    inputSchema: getPageContentSchema,
    handler: createProxyTool('get_page_content'),
  },
  {
    name: 'get_document_structure',
    description:
      'Extract the hierarchical structure of a processed document for navigation and analysis. Returns organized structure including headers, sections, and subsections. Useful for understanding document organization and enabling structured navigation through complex documents.',
    inputSchema: getDocumentStructureSchema,
    handler: createProxyTool('get_document_structure'),
  },
  {
    name: 'list_documents',
    description:
      'List user\'s documents with comprehensive status information and intelligent suggestions. Shows processing progress, completion status, and readiness for queries. Supports filtering by status ("processing", "completed", "failed") and pagination. Returns actionable insights about document states and recommended next steps.',
    inputSchema: myDocumentsSchema,
    handler: createProxyTool('list_documents'),
  },
  {
    name: 'remove_document',
    description:
      'Permanently delete one or more documents and all associated data. Accepts an array of doc_ids for batch deletion. Returns detailed success/failure status for each document. WARNING: This action is irreversible - deleted documents cannot be recovered.',
    inputSchema: removeDocumentSchema,
    handler: createProxyTool('remove_document'),
  },
  {
    name: 'search_documents',
    description:
      'Search through your document library using keywords in filenames or descriptions. Supports fuzzy matching for better discovery. Filter options include: status ("processing", "completed", "failed"), date ranges, and document type. Returns ranked results with relevance scores and document metadata.',
    inputSchema: searchDocumentsSchema,
    handler: createProxyTool('search_documents'),
  },
];

/**
 * Get tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return tools.map((tool) => tool.name);
}

/**
 * Execute a tool by name
 */
export async function executeTool(
  name: string,
  params: any,
  client: PageIndexMcpClient,
): Promise<CallToolResult> {
  const tool = getToolByName(name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }
  // Validate parameters
  try {
    const validatedParams = tool.inputSchema.parse(params);
    return await tool.handler(validatedParams, client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = `Invalid parameters for tool ${name}: ${error.errors.map((e) => e.message).join(', ')}`;
      throw new Error(validationError);
    }
    throw error;
  }
}
