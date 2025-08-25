import { config } from 'dotenv';

// Load environment variables
config();

export interface Config {
  apiKey: string;
  apiUrl: string;
  debug: boolean;
  connectionTimeout: number;
}

export function loadConfig(): Config {
  const apiKey = process.env.PAGEINDEX_API_KEY;
  if (!apiKey) {
    throw new Error('PAGEINDEX_API_KEY environment variable is required');
  }

  return {
    apiKey,
    apiUrl: process.env.PAGEINDEX_API_URL || 'https://pageindex.vercel.app',
    debug: process.env.DEBUG === 'true',
    connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '30000', 10),
  };
}

export const config_ = loadConfig();