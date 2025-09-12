#!/usr/bin/env node

import { startServer } from './server.js';

async function main() {
  try {
    await startServer();
  } catch (error) {
    console.error(`Failed to start server: ${error}\n`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`Uncaught Exception: ${error}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error(`Unhandled Rejection: ${reason}\n`);
  process.exit(1);
});

main();
