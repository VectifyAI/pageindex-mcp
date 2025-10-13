#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

function sha256OfFile(path) {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  // Find the .mcpb file
  const mcpbFiles = readdirSync('.').filter((f) => f.endsWith('.mcpb'));
  const mcpbFile = mcpbFiles[0] || 'pageindex-mcp.mcpb';

  // Calculate hash if file exists
  const hash = existsSync(mcpbFile) ? sha256OfFile(mcpbFile) : '';

  const server = existsSync('server.json')
    ? JSON.parse(readFileSync('server.json', 'utf8'))
    : {};

  // Update version
  server.version = pkg.version;

  // Update packages
  if (server.packages && server.packages.length > 0) {
    // Update npm package (first entry)
    if (server.packages[0].registry_type === 'npm') {
      server.packages[0].version = pkg.version;
    }

    // Update MCPB package (second entry)
    if (
      server.packages.length > 1 &&
      server.packages[1].registry_type === 'mcpb'
    ) {
      server.packages[1].version = pkg.version;
      server.packages[1].identifier = `https://github.com/VectifyAI/pageindex-mcp/releases/download/v${pkg.version}/pageindex-mcp-${pkg.version}.mcpb`;
      server.packages[1].file_sha256 = hash;
      server.packages[1].transport = {
        type: 'stdio',
      };
    }
  }

  writeFileSync('server.json', `${JSON.stringify(server, null, 2)}\n`);
  console.log('server.json updated:', {
    version: pkg.version,
    npm_package: server.packages?.[0]?.identifier,
    mcpb_package: server.packages?.[1]?.identifier,
    file_sha256: hash || '(hash will be calculated after mcpb build)',
  });
} catch (err) {
  console.error('Failed to update server.json:', err.message);
  process.exit(1);
}
