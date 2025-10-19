import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Child, Chore, Payout, Settings } from '@shared/schema';
import { nanoid } from 'nanoid';

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
    key: string;
    value: Settings;
  };
}

let dbInstance: IDBPDatabase<ChoresDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ChoresDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ChoresDB>('chores-rewards-db', 2, {
    upgrade(db, oldVersion) {
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
        db.createObjectStore('payouts', { keyPath: 'id' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }

      // Note: Migration removed - users must delete IndexedDB to upgrade
      // The favoriteChoreIds field is now added by default when creating children
    },
  });

  // Seed default chores if none exist
  await seedDefaultChores(dbInstance);

  return dbInstance;
}

async function seedDefaultChores(db: IDBPDatabase<ChoresDB>): Promise<void> {
  const existingChores = await db.getAll('chores');
  if (existingChores.length === 0) {
    const now = new Date();
    const defaultChores: Chore[] = [
      { id: nanoid(), title: "Vacuum inc edges & couch cushions", valueCents: 500, createdAt: now },
      { id: nanoid(), title: "Mop House", valueCents: 500, createdAt: now },
      { id: nanoid(), title: "Clean room", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Make dinner", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Fix couch up", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Feed Missy", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Fill Missy's water bowl", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Febreeze house", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Put washing in machine", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Take rubbish", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Put clothes away", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Wipe down bathroom", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Dusting surfaces", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Tidy play room", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Putting shopping away", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Cleaning up after self", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Filling dishwasher", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Empty dishwasher", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Cleaning kitchen", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Making bed", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Shower", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Read a book (Over 40 pages)", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Something kind for someone else", valueCents: 100, createdAt: now },
      { id: nanoid(), title: "Not spending money for a week", valueCents: 500, createdAt: now }
    ];

    const tx = db.transaction('chores', 'readwrite');
    const store = tx.objectStore('chores');
    
    for (const chore of defaultChores) {
      await store.add(chore);
    }
    
    await tx.done;
  }
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
