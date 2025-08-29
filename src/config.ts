import { config } from 'dotenv';

// Load environment variables
config();

interface Config {
  apiKey: string;
  apiUrl: string;
  debug: boolean;
  connectionTimeout: number;
}

const apiKey = process.env.PAGEINDEX_API_KEY;
if (!apiKey) {
  throw new Error('PAGEINDEX_API_KEY environment variable is required');
}

export const CONFIG: Config = {
  apiKey,
  apiUrl: process.env.PAGEINDEX_API_URL || 'https://dash.pageindex.ai',
  debug: process.env.DEBUG === 'true',
  connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '30000', 10),
};
