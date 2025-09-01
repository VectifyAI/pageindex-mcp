#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

try {
  // Read package.json version
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  // Read and update manifest.json
  const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  manifest.version = pkg.version;

  // Write updated manifest.json with proper formatting
  writeFileSync('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);

  // Format the file using Biome to ensure it matches style rules
  try {
    execSync('npx biome format --write manifest.json', { stdio: 'ignore' });
  } catch (_biomeError) {
    // If Biome formatting fails, continue with basic formatting
    console.warn('Warning: Could not format manifest.json with Biome');
  }

  console.log(`Updated manifest.json version to ${pkg.version}`);
} catch (error) {
  console.error('Error syncing manifest version:', error.message);
  process.exit(1);
}
