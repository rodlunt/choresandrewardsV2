// Installs a fake IndexedDB implementation onto the global scope so the
// storage layer (idb-backed) has something to talk to under Node.
// tests/unit/db-helper.ts resets this between tests.
import 'fake-indexeddb/auto';
