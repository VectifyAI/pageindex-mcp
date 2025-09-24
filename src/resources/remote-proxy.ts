import type {
  ListResourceTemplatesResult,
  ReadResourceResult,
  Resource,
} from '@modelcontextprotocol/sdk/types.js';
import type { PageIndexMcpClient } from '../client/mcp-client.js';

/**
 * Proxy for managing remote PageIndex MCP resources
 */
export class RemoteResourcesProxy {
  constructor(private mcpClient: PageIndexMcpClient) {}

  /**
   * Fetch available resources from remote PageIndex server
   */
  async fetchRemoteResources(): Promise<Resource[]> {
    try {
      // List resources from remote server
      const remoteResources = await this.mcpClient.listResources();
      return remoteResources.resources;
    } catch (error) {
      console.error('Failed to fetch remote resources:', error);
      return [];
    }
  }

  /**
   * Read resource content from remote PageIndex server
   */
  async readRemoteResource(uri: string): Promise<ReadResourceResult> {
    try {
      return await this.mcpClient.readResource(uri);
    } catch (error) {
      console.error(`Failed to read remote resource ${uri}:`, error);
      throw error;
    }
  }

  /**
   * Get resource templates from remote server
   */
  async fetchRemoteResourceTemplates(): Promise<
    ListResourceTemplatesResult['resourceTemplates']
  > {
    try {
      const remoteTemplates = await this.mcpClient.listResourceTemplates();
      return remoteTemplates.resourceTemplates;
    } catch (error) {
      console.error('Failed to fetch remote resource templates:', error);
      return [];
    }
  }
}
