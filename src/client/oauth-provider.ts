import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { URL } from 'node:url';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import open from 'open';

interface StoredTokens {
  tokens?: OAuthTokens;
  clientInfo?: OAuthClientInformationFull;
  codeVerifier?: string;
}

/**
 * File-based OAuth client provider for PageIndex MCP client
 * Stores tokens and client information securely in user's home directory
 */
export class PageIndexOAuthProvider implements OAuthClientProvider {
  private _tokens?: OAuthTokens;
  private _clientInfo?: OAuthClientInformationFull;
  private _codeVerifier?: string;
  private tokenFilePath: string;

  /**
   * Check for existing client information in storage
   */
  static async getStoredClientInfo(
    tokenStoragePath?: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    const filePath =
      tokenStoragePath ||
      path.join(os.homedir(), '.pageindex-mcp', 'oauth-tokens.json');

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const stored: StoredTokens = JSON.parse(data);
      return stored.clientInfo;
    } catch {
      return undefined;
    }
  }

  constructor(
    private readonly _redirectUrl: string | URL,
    private readonly _clientMetadata: OAuthClientMetadata,
    tokenStoragePath?: string,
  ) {
    this.tokenFilePath =
      tokenStoragePath ||
      path.join(os.homedir(), '.pageindex-mcp', 'oauth-tokens.json');
  }

  get redirectUrl(): string | URL {
    return this._redirectUrl;
  }

  get clientMetadata(): OAuthClientMetadata {
    return this._clientMetadata;
  }

  async state(): Promise<string> {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    if (!this._clientInfo) {
      await this.loadFromStorage();
    }
    return this._clientInfo;
  }

  async saveClientInformation(
    clientInformation: OAuthClientInformationFull,
  ): Promise<void> {
    this._clientInfo = clientInformation;
    await this.saveToStorage();
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    if (!this._tokens) {
      await this.loadFromStorage();
    }
    return this._tokens;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    this._tokens = tokens;
    await this.saveToStorage();
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    try {
      await open(authorizationUrl.toString());
    } catch (error) {
      console.error(
        error instanceof Error
          ? `Failed to open browser: ${error.message}\n`
          : 'Failed to open browser\n',
      );
      process.exit(1);
    }
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    this._codeVerifier = codeVerifier;
    await this.saveToStorage();
  }

  async codeVerifier(): Promise<string> {
    if (!this._codeVerifier) {
      await this.loadFromStorage();
      if (!this._codeVerifier) {
        throw new Error(
          'No code verifier found. Please restart the OAuth flow.',
        );
      }
    }
    return this._codeVerifier;
  }

  async invalidateCredentials(
    scope: 'all' | 'client' | 'tokens' | 'verifier',
  ): Promise<void> {
    switch (scope) {
      case 'all':
        this._tokens = undefined;
        this._clientInfo = undefined;
        this._codeVerifier = undefined;
        break;
      case 'client':
        this._clientInfo = undefined;
        break;
      case 'tokens':
        this._tokens = undefined;
        break;
      case 'verifier':
        this._codeVerifier = undefined;
        break;
    }
    await this.saveToStorage();
  }

  /**
   * Waits for OAuth callback by starting a temporary HTTP server
   */
  async waitForOAuthCallback(): Promise<string> {
    return new Promise((resolve, reject) => {
      const redirectUrl = new URL(this._redirectUrl);
      const port = parseInt(redirectUrl.port, 10) || 8090;

      const server = createServer((req, res) => {
        const url = new URL(req.url || '', `http://localhost:${port}`);

        if (url.pathname === redirectUrl.pathname) {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <head>
                  <title>Authorization Failed</title>
                </head>
                <body>
                  <h1>Authorization Failed</h1>
                  <p>Error: ${error}</p>
                  <p>Please try the authorization process again.</p>
                  <p>You can close this tab and return to your terminal.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (code) {
            server.close();
            resolve(code);

            // For DXT builds, redirect directly without showing content
            if (['dxt', 'mcpb'].includes(__CLIENT_TYPE__)) {
              res.writeHead(302, { Location: 'claude://claude.ai/new' });
              res.end();
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <head>
                    <title>Authorization Successful</title>
                  </head>
                  <body>
                    <h1>Authorization Successful</h1>
                    <p>You can close this tab now.</p>
                  </body>
                </html>
              `);
            }
            return;
          }
        }
        res.writeHead(404);
        res.end('Not found');
      });

      server.listen(port, 'localhost', () => {
        console.error(`Listening for OAuth callback on port ${port}...\n`);
      });

      server.on('error', (err) => {
        reject(new Error(`Failed to start callback server: ${err.message}`));
      });

      setTimeout(
        () => {
          server.close();
          reject(new Error('OAuth callback timeout after 5 minutes'));
        },
        5 * 60 * 1000,
      );
    });
  }

  public async loadFromStorage(): Promise<void> {
    try {
      const data = await fs.readFile(this.tokenFilePath, 'utf-8');
      const stored: StoredTokens = JSON.parse(data);

      this._tokens = stored.tokens;
      this._clientInfo = stored.clientInfo;
      this._codeVerifier = stored.codeVerifier;
    } catch (_error) {
      console.error(
        'No existing OAuth tokens found, starting fresh authentication.\n',
      );
    }
  }

  private async saveToStorage(): Promise<void> {
    const stored: StoredTokens = {
      tokens: this._tokens,
      clientInfo: this._clientInfo,
      codeVerifier: this._codeVerifier,
    };

    try {
      await fs.mkdir(path.dirname(this.tokenFilePath), { recursive: true });
      // Set restrictive file permissions (Unix-like systems only; ignored on Windows)
      await fs.writeFile(this.tokenFilePath, JSON.stringify(stored, null, 2), {
        mode: 0o600,
      });
    } catch (error) {
      console.error(`Warning: Failed to save OAuth tokens: ${error}\n`);
    }
  }
}
