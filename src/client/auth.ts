import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Creates an authenticated fetch function that adds Bearer token authentication
 * This is a simplified approach compared to implementing the complex OAuth interface
 */
export function createAuthenticatedFetch(
  apiKey: string,
  additionalHeaders: Record<string, string> = {},
): FetchLike {
  return async (input: string | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);

    // Add additional headers (like client identification)
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return fetch(input, {
      ...init,
      headers,
    });
  };
}
