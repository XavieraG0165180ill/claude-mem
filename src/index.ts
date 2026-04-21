#!/usr/bin/env node
/**
 * claude-mem — persistent memory layer for Claude AI sessions
 * Main entry point
 */

import { MemoryStore } from './memory-store';
import { parseArgs } from './cli';
import { formatMemory } from './formatter';

const VERSION = '1.0.0';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.version) {
    console.log(`claude-mem v${VERSION}`);
    process.exit(0);
  }

  const store = new MemoryStore(args.storePath);
  await store.init();

  switch (args.command) {
    case 'add': {
      if (!args.content) {
        console.error('Error: content is required for add command');
        process.exit(1);
      }
      const entry = await store.add(args.content, args.tags);
      console.log(`✓ Memory stored [${entry.id}]`);
      break;
    }

    case 'list': {
      const entries = await store.list(args.tags);
      if (entries.length === 0) {
        console.log('No memories found.');
      } else {
        // Show newest entries first so the most recent context is at the top
        entries.reverse().forEach(e => console.log(formatMemory(e)));
        console.log(`\n(${entries.length} memor${entries.length === 1 ? 'y' : 'ies'} total)`);
      }
      break;
    }

    case 'search': {
      if (!args.query) {
        console.error('Error: query is required for search command');
        process.exit(1);
      }
      const results = await store.search(args.query);
      if (results.length === 0) {
        console.log('No matching memories found.');
      } else {
        results.forEach(e => console.log(formatMemory(e)));
        console.log(`\n(${results.length} result${results.length === 1 ? '' : 's'})`);
      }
      break;
    }

    case 'delete': {
      if (!args.id) {
        console.error('Error: id is required for delete command');
        process.exit(1);
      }
      const deleted = await store.delete(args.id);
      if (deleted) {
        console.log(`✓ Memory [${args.id}] deleted`);
      } else {
        console.error(`Memory [${args.id}] not found`);
        process.exit(1);
      }
      break;
    }

    case 'clear': {
      await store.clear();
      console.log('✓ All memories cleared');
      break;
    }

    case 'export': {
      const data = await store.export();
      console.log(JSON.stringify(data, null, 2));
      break;
    }

    default: {
      console.error(`Unknown command: ${args.command}`);
      console.error('Usage: claude-mem <add|list|search|delete|clear|export> [options]');
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
