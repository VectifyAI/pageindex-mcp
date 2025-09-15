interface Config {
  apiUrl: string;
  debug: boolean;
  connectionTimeout: number;
}

export const CONFIG: Config = {
  apiUrl: process.env.PAGEINDEX_API_URL || 'https://mcp.pageindex.ai',
  debug: process.env.DEBUG === 'true',
  connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '30000', 10),
};
