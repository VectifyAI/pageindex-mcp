import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Creates an authenticated fetch function that adds Bearer token authentication
 * This is a simplified approach compared to implementing the complex OAuth interface
 */
export function createAuthenticatedFetch(apiKey: string): FetchLike {
  return async (input: string | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);

    return fetch(input, {
      ...init,
      headers,
    });
  };
}
