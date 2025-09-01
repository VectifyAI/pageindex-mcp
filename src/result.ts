import type { CallToolResult } from '@modelcontextprotocol/sdk/types';

/**
 * Helper function to create error response
 */
export function createErrorResponse(
  error: string,
  details?: { [key: string]: any },
  options?: {
    hint?: string;
    next_steps?: {
      immediate?: string;
      options?: string[];
      auto_retry?: string;
    };
  },
): CallToolResult {
  const errorData: any = {
    error,
    ...details,
  };

  if (options?.hint) {
    errorData.hint = options.hint;
  }

  if (options?.next_steps) {
    errorData.next_steps = options.next_steps;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(errorData, null, 2),
      },
    ],
    isError: true,
  };
}
