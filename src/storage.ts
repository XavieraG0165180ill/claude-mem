/**
 * Storage module for claude-mem
 * Handles reading and writing memory entries to persistent storage
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStore {
  version: string;
  entries: MemoryEntry[];
}

const STORE_VERSION = '1.0.0';
const DEFAULT_STORE_DIR = path.join(os.homedir(), '.claude-mem');
const DEFAULT_STORE_FILE = 'memories.json';

/**
 * Resolves the path to the memory store file.
 * Uses CLAUDE_MEM_DIR env var if set, otherwise falls back to ~/.claude-mem/
 */
export function getStorePath(): string {
  const storeDir = process.env.CLAUDE_MEM_DIR || DEFAULT_STORE_DIR;
  return path.join(storeDir, DEFAULT_STORE_FILE);
}

/**
 * Ensures the storage directory exists, creating it if necessary.
 */
function ensureStoreDir(storePath: string): void {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Loads the memory store from disk.
 * Returns an empty store if the file does not exist.
 */
export function loadStore(storePath?: string): MemoryStore {
  const resolvedPath = storePath || getStorePath();

  if (!fs.existsSync(resolvedPath)) {
    return { version: STORE_VERSION, entries: [] };
  }

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw) as MemoryStore;
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse memory store at ${resolvedPath}: ${(err as Error).message}`);
  }
}

/**
 * Persists the memory store to disk.
 */
export function saveStore(store: MemoryStore, storePath?: string): void {
  const resolvedPath = storePath || getStorePath();
  ensureStoreDir(resolvedPath);

  try {
    const serialized = JSON.stringify(store, null, 2);
    fs.writeFileSync(resolvedPath, serialized, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to write memory store to ${resolvedPath}: ${(err as Error).message}`);
  }
}

/**
 * Generates a simple unique ID for a memory entry.
 */
export function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Adds a new memory entry to the store.
 */
export function addEntry(
  store: MemoryStore,
  content: string,
  tags: string[] = []
): MemoryEntry {
  const now = new Date().toISOString();
  const entry: MemoryEntry = {
    id: generateId(),
    content,
    tags,
    createdAt: now,
    updatedAt: now,
  };
  store.entries.push(entry);
  return entry;
}

/**
 * Removes a memory entry by ID.
 * Returns true if an entry was removed, false if not found.
 */
export function removeEntry(store: MemoryStore, id: string): boolean {
  const initialLength = store.entries.length;
  store.entries = store.entries.filter((e) => e.id !== id);
  return store.entries.length < initialLength;
}

/**
 * Searches entries by a query string (case-insensitive match against content and tags).
 */
export function searchEntries(store: MemoryStore, query: string): MemoryEntry[] {
  const lower = query.toLowerCase();
  return store.entries.filter(
    (e) =>
      e.content.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower))
  );
}
