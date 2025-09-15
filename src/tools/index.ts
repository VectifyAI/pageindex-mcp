import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { PageIndexMcpClient } from '../client/mcp-client.js';
import { processDocumentTool } from './process-document.js';
import type { ToolDefinition } from './types.js';

export { RemoteToolsProxy } from './remote-proxy.js';
export { ToolDefinition } from './types.js';

const localTools: ToolDefinition[] = [processDocumentTool];
let tools: ToolDefinition[] = [...localTools];

/**
 * Get all registered tools (local + remote)
 */
export function getTools(): ToolDefinition[] {
  return tools;
}

/**
 * Update tools array with remote tools from proxy
 */
export function updateToolsWithRemote(remoteTools: ToolDefinition[]) {
  // Filter out remote tools that might conflict with local tools
  const filteredRemoteTools = remoteTools.filter(
    (remoteTool) =>
      !localTools.some((localTool) => localTool.name === remoteTool.name),
  );

  tools = [...localTools, ...filteredRemoteTools];
}

/**
 * Execute a tool by name
 */
export async function executeTool(
  name: string,
  params: any,
  client: PageIndexMcpClient,
): Promise<CallToolResult> {
  const tool = tools.find((tool) => tool.name === name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }
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
