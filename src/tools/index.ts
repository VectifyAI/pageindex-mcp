import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { processDocumentTool, processDocumentSchema } from './process-document.js';
import { getDocumentStructureTool, getDocumentStructureSchema } from './get-document-structure.js';
import { askDocumentTool, askDocumentSchema } from './ask-document.js';
import { getPageContentTool, getPageContentSchema } from './get-page-content.js';
import { listDocumentsTool, myDocumentsSchema } from './list-documents.js';
import { removeDocumentTool, removeDocumentSchema } from './remove-document.js';
import { searchDocumentsTool, searchDocumentsSchema } from './search-documents.js';
import { ToolDefinition } from './types.js';

// Re-export all schemas
export {
  processDocumentSchema,
  getDocumentStructureSchema,
  askDocumentSchema,
  getPageContentSchema,
  myDocumentsSchema,
  removeDocumentSchema,
  searchDocumentsSchema,
};

// Re-export ToolDefinition type
export { ToolDefinition } from './types.js';

// All available tools
export const tools: ToolDefinition[] = [
  processDocumentTool,
  askDocumentTool,
  getPageContentTool,
  getDocumentStructureTool,
  listDocumentsTool,
  removeDocumentTool,
  searchDocumentsTool,
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
