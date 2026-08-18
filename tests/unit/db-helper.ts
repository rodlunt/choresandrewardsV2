import { vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

// client/src/lib/db.ts caches its opened connection in module-level state
// (dbInstance / dbPromise), so re-importing client/src/lib/storage.ts inside
// the same module registry reuses whatever database the previous test left
// behind. To get a genuinely empty, isolated database per test we:
//   1. swap in a brand new IDBFactory (fake-indexeddb's in-memory store), so
//      there is no data left over from a previous test even by name, and
//   2. reset the whole Vitest module registry so the next dynamic import of
//      storage.ts (and the db.ts it pulls in) re-evaluates from scratch,
//      re-initialising dbInstance/dbPromise to their unopened state.
// vi.resetModules() only clears vitest's registry going forward, so callers
// MUST get storage back from freshStorage()'s dynamic import rather than a
// static top-of-file import - a static import would still point at the
// previous test's module instance.
export async function freshStorage() {
  globalThis.indexedDB = new IDBFactory();
  vi.resetModules();
  const { storage } = await import('@/lib/storage');
  return storage;
}
