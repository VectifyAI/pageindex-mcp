import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { PageIndexMcpClient } from '../client/mcp-client.js';
import { createProcessDocumentTool } from './process-document.js';
import type { ToolDefinition } from './types.js';

export { RemoteToolsProxy } from './remote-proxy.js';
export { ToolDefinition } from './types.js';

// Remote tools process_document calls itself; they are never listed.
const internalRemoteTools = ['get_signed_upload_url', 'submit_document'];

let tools: ToolDefinition[] = [createProcessDocumentTool()];

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
  const submitDocument = remoteTools.find(
    (tool) => tool.name === 'submit_document',
  );
  const localTools = [createProcessDocumentTool(submitDocument?.inputSchema)];

  // Local tools take precedence over remote tools of the same name
  const listedRemoteTools = remoteTools.filter(
    (remoteTool) =>
      !internalRemoteTools.includes(remoteTool.name) &&
      !localTools.some((localTool) => localTool.name === remoteTool.name),
  );

  tools = [...localTools, ...listedRemoteTools];
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
