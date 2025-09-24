import type {
  ListResourcesRequest,
  ListResourcesResult,
  ListResourceTemplatesResult,
  ReadResourceRequest,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import type { PageIndexMcpClient } from '../client/mcp-client.js';
import { RemoteResourcesProxy } from './remote-proxy.js';

// Global resources proxy instance
let remoteResourcesProxy: RemoteResourcesProxy | null = null;

/**
 * Update the remote resources proxy with a connected MCP client
 */
export function updateResourcesWithRemote(mcpClient: PageIndexMcpClient): void {
  remoteResourcesProxy = new RemoteResourcesProxy(mcpClient);
}

/**
 * List available resources from the remote PageIndex server
 */
export async function listResources(
  _params?: ListResourcesRequest['params'],
): Promise<ListResourcesResult> {
  if (!remoteResourcesProxy) {
    throw new Error('Remote resources proxy not initialized');
  }

  try {
    const resources = await remoteResourcesProxy.fetchRemoteResources();
    return { resources };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to list resources';
    throw new Error(`Failed to list resources: ${errorMessage}`);
  }
}

/**
 * Read a specific resource from the remote PageIndex server
 */
export async function readResource(
  params: ReadResourceRequest['params'],
): Promise<ReadResourceResult> {
  if (!remoteResourcesProxy) {
    throw new Error('Remote resources proxy not initialized');
  }

  try {
    // Read resource from remote server (let remote server handle URI validation)
    return await remoteResourcesProxy.readRemoteResource(params.uri);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to read resource';

    // Return appropriate error codes based on error type
    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('Resource not found')
    ) {
      throw {
        code: -32002,
        message: errorMessage,
        data: { uri: params.uri },
      };
    }

    throw {
      code: -32603,
      message: errorMessage,
      data: { uri: params.uri },
    };
  }
}

/**
 * List available resource templates from remote server
 */
export async function listResourceTemplates(): Promise<ListResourceTemplatesResult> {
  if (!remoteResourcesProxy) {
    throw new Error('Remote resources proxy not initialized');
  }

  try {
    const resourceTemplates =
      await remoteResourcesProxy.fetchRemoteResourceTemplates();
    return { resourceTemplates };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to list resource templates';
    throw new Error(`Failed to list resource templates: ${errorMessage}`);
  }
}

export { RemoteResourcesProxy } from './remote-proxy.js';
