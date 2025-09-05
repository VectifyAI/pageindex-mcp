import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

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
    __CLIENT_TYPE__: `"${process.env.CLIENT_TYPE || 'npm'}"`,
  },
  platform: 'node',
  onSuccess: async () => {
    console.log('Build completed successfully!');
  },
});
