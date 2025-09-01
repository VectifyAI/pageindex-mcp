import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { PageIndexMcpClient } from '../client/mcp-client.js';
import type { ToolDefinition } from './types.js';

/**
 * Remote tool proxy that dynamically fetches tool definitions from remote server
 * and creates local proxies that pass through to the remote server
 */
export class RemoteToolsProxy {
  private client: PageIndexMcpClient;
  private remoteTools: ToolDefinition[] = [];

  constructor(client: PageIndexMcpClient) {
    this.client = client;
  }

  /**
   * Fetch tool definitions from remote MCP server
   */
  async fetchRemoteTools(): Promise<ToolDefinition[]> {
    try {
      const toolsResponse = await this.client.listTools();

      // Exclude tools that are used internally by process_document
      const excludedTools = ['get_signed_upload_url', 'submit_document'];

      this.remoteTools = toolsResponse.tools
        .filter((tool: Tool) => !excludedTools.includes(tool.name))
        .map((tool: Tool) => ({
          name: tool.name,
          description: tool.description || `Remote tool: ${tool.name}`,
          inputSchema: this.convertJsonSchemaToZod(tool.inputSchema),
          handler: async (params: any, client: PageIndexMcpClient) => {
            return await client.callTool(tool.name, params);
          },
        }));

      return this.remoteTools;
    } catch (error) {
      console.error('Failed to fetch remote tools:', error);
      return [];
    }
  }

  /**
   * Get cached remote tools (call fetchRemoteTools first)
   */
  getRemoteTools(): ToolDefinition[] {
    return this.remoteTools;
  }

  /**
   * Convert JSON Schema to Zod schema (basic implementation)
   * This is a simplified converter for common schema patterns
   */
  private convertJsonSchemaToZod(jsonSchema: any): z.ZodSchema {
    if (!jsonSchema || typeof jsonSchema !== 'object') {
      return z.any();
    }

    const { type, properties, required = [], enum: enumValues } = jsonSchema;

    switch (type) {
      case 'object': {
        if (!properties) return z.object({});

        const zodObj: Record<string, z.ZodSchema> = {};

        for (const [key, prop] of Object.entries(properties)) {
          const propSchema = this.convertJsonSchemaToZod(prop);
          zodObj[key] = required.includes(key)
            ? propSchema
            : propSchema.optional();
        }

        return z.object(zodObj);
      }

      case 'string': {
        if (enumValues && Array.isArray(enumValues)) {
          let schema = z.enum(enumValues as [string, ...string[]]);
          if (jsonSchema.description) {
            schema = schema.describe(jsonSchema.description);
          }
          return schema;
        } else {
          let schema = z.string();
          if (jsonSchema.description) {
            schema = schema.describe(jsonSchema.description);
          }
          return schema;
        }
      }

      case 'number':
      case 'integer': {
        let schema: z.ZodSchema = z.number();
        if (jsonSchema.description) {
          schema = schema.describe(jsonSchema.description);
        }
        if (jsonSchema.default !== undefined) {
          schema = schema.default(jsonSchema.default);
        }
        return schema;
      }

      case 'boolean': {
        let schema: z.ZodSchema = z.boolean();
        if (jsonSchema.description) {
          schema = schema.describe(jsonSchema.description);
        }
        if (jsonSchema.default !== undefined) {
          schema = schema.default(jsonSchema.default);
        }
        return schema;
      }

      case 'array': {
        const itemSchema = this.convertJsonSchemaToZod(jsonSchema.items || {});
        let schema = z.array(itemSchema);
        if (jsonSchema.description) {
          schema = schema.describe(jsonSchema.description);
        }
        return schema;
      }

      default:
        return z.any();
    }
  }
}
