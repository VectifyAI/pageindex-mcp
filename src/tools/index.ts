import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import { processDocumentTool, processDocumentSchema } from './process-document.js';
import { ToolDefinition } from './types.js';
import { RemoteToolsProxy } from './remote-proxy.js';

// Re-export schemas for local tools only
export {
  processDocumentSchema,
};

// Re-export ToolDefinition type
export { ToolDefinition } from './types.js';
export { RemoteToolsProxy } from './remote-proxy.js';

// Local tools that require file system access or special local processing
export const localTools: ToolDefinition[] = [
  processDocumentTool,
];

// Combined tools (local + remote)
// This will be populated by the server after fetching remote tools
export let tools: ToolDefinition[] = [...localTools];

/**
 * Update tools array with remote tools from proxy
 */
export function updateToolsWithRemote(remoteTools: ToolDefinition[]) {
  // Filter out remote tools that might conflict with local tools
  const filteredRemoteTools = remoteTools.filter(
    (remoteTool) => !localTools.some((localTool) => localTool.name === remoteTool.name)
  );
  
  tools = [...localTools, ...filteredRemoteTools];
}

/**
 * Get local tools only
 */
export function getLocalTools(): ToolDefinition[] {
  return localTools;
}

/**
 * Check if a tool is local or remote
 */
export function isLocalTool(toolName: string): boolean {
  return localTools.some((tool) => tool.name === toolName);
}

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
