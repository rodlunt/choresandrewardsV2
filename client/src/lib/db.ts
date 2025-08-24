import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Child, Chore, Payout, Settings } from '@shared/schema';

interface ChoresDB extends DBSchema {
  children: {
    key: string;
    value: Child;
  };
  chores: {
    key: string;
    value: Chore;
  };
  payouts: {
    key: string;
    value: Payout;
  };
  settings: {
    key: 'app-settings';
    value: Settings;
  };
}

let dbInstance: IDBPDatabase<ChoresDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ChoresDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ChoresDB>('chores-rewards-db', 1, {
    upgrade(db) {
      // Children store
      if (!db.objectStoreNames.contains('children')) {
        db.createObjectStore('children', { keyPath: 'id' });
      }

      // Chores store
      if (!db.objectStoreNames.contains('chores')) {
        db.createObjectStore('chores', { keyPath: 'id' });
      }

      // Payouts store
      if (!db.objectStoreNames.contains('payouts')) {
        const payoutStore = db.createObjectStore('payouts', { keyPath: 'id' });
        payoutStore.createIndex('childId', 'childId', { unique: false });
        payoutStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'sounds' });
      }
    },
  });

  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
