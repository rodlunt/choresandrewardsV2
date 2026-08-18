import { describe, it, expect, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

// Verifies the v2 -> v3 upgrade in client/src/lib/db.ts: a database that
// already has the pre-completions schema (children/chores/payouts/settings,
// seeded with real data, no completions store) must come through the
// upgrade with that data intact and gain a usable completions store - not
// just a store that exists, but one that can actually be read from and
// written to afterwards.
describe('IndexedDB v2 -> v3 migration', () => {
  it('preserves existing children/chores/payouts/settings data and adds a working completions store', async () => {
    // Fresh, empty backing store for this test, independent of any other
    // test's database.
    globalThis.indexedDB = new IDBFactory();

    const now = new Date('2026-01-01T00:00:00.000Z');

    // Open the database directly at version 2, matching the schema this
    // app shipped before completions existed. This is built with raw
    // indexedDB calls, not via client/src/lib/db.ts, so it is a genuine
    // "existing installation" fixture rather than something that already
    // knows about v3.
    await new Promise<void>((resolve, reject) => {
      const openRequest = indexedDB.open('chores-rewards-db', 2);

      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;
        db.createObjectStore('children', { keyPath: 'id' });
        db.createObjectStore('chores', { keyPath: 'id' });
        db.createObjectStore('payouts', { keyPath: 'id' });
        db.createObjectStore('settings');
      };

      openRequest.onsuccess = () => {
        const db = openRequest.result;
        const tx = db.transaction(['children', 'chores', 'payouts', 'settings'], 'readwrite');

        tx.objectStore('children').add({
          id: 'c1', name: 'Aria', totalCents: 500, favoriteChoreIds: [], createdAt: now,
        });
        tx.objectStore('chores').add({
          id: 'ch1', title: 'Vacuum', valueCents: 500, createdAt: now,
        });
        tx.objectStore('payouts').add({
          id: 'p1', childId: 'c1', childName: 'Aria', amountCents: 200, createdAt: now,
        });
        tx.objectStore('settings').put({ haptics: true, confetti: true, displayMode: 'dollars' }, 'app-settings');

        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };

      openRequest.onerror = () => reject(openRequest.error);
    });

    // Now open it through our own module, which upgrades v2 databases to
    // v3 (see client/src/lib/db.ts). resetModules so db.ts's module-level
    // dbInstance/dbPromise caches don't carry over from another test.
    vi.resetModules();
    const { getDB } = await import('@/lib/db');
    const { storage } = await import('@/lib/storage');

    const db = await getDB();
    expect(db.objectStoreNames.contains('completions')).toBe(true);

    // Pre-existing data in every store survived the upgrade untouched.
    const children = await storage.getAllChildren();
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe('c1');
    expect(children[0].totalCents).toBe(500);

    const chores = await storage.getAllChores();
    expect(chores).toHaveLength(1);
    expect(chores[0].id).toBe('ch1');

    const payouts = await storage.getAllPayouts();
    expect(payouts).toHaveLength(1);
    expect(payouts[0].id).toBe('p1');

    const settings = await storage.getSettings();
    expect(settings.displayMode).toBe('dollars');

    // The new store exists and starts empty...
    const completionsBefore = await storage.getAllCompletions();
    expect(completionsBefore).toEqual([]);

    // ...and is actually usable, not just present: a completion recorded
    // after the upgrade is readable back, and the pre-existing balance
    // still accumulates correctly on top of it.
    const { child: updatedChild, completion } = await storage.completeChore('c1', 'ch1', 'Vacuum', 500);
    expect(updatedChild.totalCents).toBe(1000);
    expect(completion.choreTitle).toBe('Vacuum');

    const completionsAfter = await storage.getAllCompletions();
    expect(completionsAfter).toHaveLength(1);
    expect(completionsAfter[0].id).toBe(completion.id);
  });
});
