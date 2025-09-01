#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';

try {
  // Read package.json version
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  
  // Read and update manifest.json
  const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  manifest.version = pkg.version;
  
  // Write updated manifest.json
  writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  
  console.log(`Updated manifest.json version to ${pkg.version}`);
} catch (error) {
  console.error('Error syncing manifest version:', error.message);
  process.exit(1);
}