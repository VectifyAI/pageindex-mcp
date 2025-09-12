import type { OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Creates an OAuth-authenticated fetch function that adds Bearer token authentication
 * using OAuth access tokens with automatic refresh capability
 */
export function createOAuthAuthenticatedFetch(
  getTokens: () => Promise<OAuthTokens | undefined>,
  additionalHeaders: Record<string, string> = {},
): FetchLike {
  return async (input: string | URL, init?: RequestInit): Promise<Response> => {
    const tokens = await getTokens();
    if (!tokens?.access_token) {
      throw new Error('No valid OAuth access token available');
    }

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${tokens.access_token}`);

    Object.entries(additionalHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const response = await fetch(input, {
      ...init,
      headers,
    });

    // If we get 401 Unauthorized, the token has expired
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }

    return response;
  };
}
