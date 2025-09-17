import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

const clientTypeMap = {
  dxt: 'Claude Desktop Extension',
  mcpb: 'MCPB Bundle',
  npm: 'PageIndex MCP',
};

const clientType = process.env.CLIENT_TYPE || 'npm';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  outDir: 'build',
  clean: true,
  dts: true,
  sourcemap: true,
  noExternal: [/.*/], // Bundle all dependencies
  define: {
    __VERSION__: `"${packageJson.version}"`,
    __CLIENT_TYPE__: `"${clientType}"`,
    __CLIENT_NAME__: `"${clientTypeMap[clientType] || clientTypeMap.npm}"`,
  },
  platform: 'node',
  onSuccess: async () => {
    console.log('Build completed successfully!');
  },
});
