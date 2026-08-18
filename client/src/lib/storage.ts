import { getDB } from './db';
import { Child, Chore, Payout, Settings, InsertChild, InsertChore, InsertPayout, AppData } from '@shared/schema';
import { nanoid } from 'nanoid';

// idb creates a transaction's `tx.done` promise as soon as the transaction
// is opened, listening for the underlying IDBTransaction's
// complete/error/abort events - independent of whether calling code ever
// awaits it. If a store operation inside the transaction throws, our
// methods below return via that throw without reaching their own
// `await tx.done`, but the already-created `tx.done` promise still settles
// (and, on an aborted transaction, rejects) in the background. Left alone
// that surfaces as a second, unhandled promise rejection alongside the
// error we already threw. This drains it quietly and rethrows the
// original error, so a failed atomic write reports exactly once.
async function withTransaction<R>(tx: { done: Promise<void> }, work: () => Promise<R>): Promise<R> {
  try {
    const result = await work();
    await tx.done;
    return result;
  } catch (err) {
    await tx.done.catch(() => {});
    throw err;
  }
}

export class AppStorage {
  // Children operations
  async getAllChildren(): Promise<Child[]> {
    const db = await getDB();
    return db.getAll('children');
  }

  async getChild(id: string): Promise<Child | undefined> {
    const db = await getDB();
    return db.get('children', id);
  }

  async createChild(data: InsertChild): Promise<Child> {
    const db = await getDB();
    const tx = db.transaction('children', 'readwrite');
    const store = tx.objectStore('children');

    return withTransaction(tx, async () => {
      // Case-insensitive, trimmed duplicate-name check inside the same
      // transaction as the add, so a concurrent create can't race past it.
      const existingChildren = await store.getAll();
      const trimmedName = data.name.trim();
      const normalizedName = trimmedName.toLowerCase();
      if (existingChildren.some(c => c.name.trim().toLowerCase() === normalizedName)) {
        throw new Error(`A child named "${trimmedName}" already exists`);
      }

      const child: Child = {
        ...data,
        id: nanoid(),
        totalCents: 0,
        favoriteChoreIds: [],
        createdAt: new Date(),
      };
      await store.add(child);
      return child;
    });
  }

  async updateChild(id: string, updates: Partial<Child>): Promise<Child> {
    const db = await getDB();
    const existing = await db.get('children', id);
    if (!existing) {
      throw new Error('Child not found');
    }
    const updated = { ...existing, ...updates };
    await db.put('children', updated);
    return updated;
  }

  async deleteChild(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['children', 'payouts'], 'readwrite');
    const childrenStore = tx.objectStore('children');
    const payoutsStore = tx.objectStore('payouts');

    await withTransaction(tx, async () => {
      await childrenStore.delete(id);

      // Also delete all payouts for this child, in the same transaction so
      // the child and their payout history are removed together or not at all.
      const allPayouts = await payoutsStore.getAll();
      const childPayouts = allPayouts.filter(p => p.childId === id);
      for (const payout of childPayouts) {
        await payoutsStore.delete(payout.id);
      }
    });
  }

  // Chores operations
  async getAllChores(): Promise<Chore[]> {
    const db = await getDB();
    return db.getAll('chores');
  }

  async getChore(id: string): Promise<Chore | undefined> {
    const db = await getDB();
    return db.get('chores', id);
  }

  async createChore(data: InsertChore): Promise<Chore> {
    const db = await getDB();
    const chore: Chore = {
      ...data,
      id: nanoid(),
      createdAt: new Date(),
    };
    await db.add('chores', chore);
    return chore;
  }

  async updateChore(id: string, updates: Partial<Chore>): Promise<Chore> {
    const db = await getDB();
    const existing = await db.get('chores', id);
    if (!existing) {
      throw new Error('Chore not found');
    }
    const updated = { ...existing, ...updates };
    await db.put('chores', updated);
    return updated;
  }

  async deleteChore(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['chores', 'children'], 'readwrite');
    const choresStore = tx.objectStore('chores');
    const childrenStore = tx.objectStore('children');

    await withTransaction(tx, async () => {
      await choresStore.delete(id);

      // Strip the deleted chore id from every child's favoriteChoreIds so
      // dangling references don't accumulate, in the same transaction as the delete.
      const allChildren = await childrenStore.getAll();
      for (const child of allChildren) {
        const favoriteChoreIds = child.favoriteChoreIds || [];
        if (favoriteChoreIds.includes(id)) {
          await childrenStore.put({
            ...child,
            favoriteChoreIds: favoriteChoreIds.filter(choreId => choreId !== id),
          });
        }
      }
    });
  }

  // Payout operations
  async getAllPayouts(): Promise<Payout[]> {
    const db = await getDB();
    const payouts = await db.getAll('payouts');
    return payouts.sort((a: Payout, b: Payout) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPayoutsForChild(childId: string): Promise<Payout[]> {
    const db = await getDB();
    const allPayouts = await db.getAll('payouts');
    return allPayouts.filter(p => p.childId === childId);
  }

  async createPayout(data: InsertPayout): Promise<Payout> {
    const db = await getDB();
    const payout: Payout = {
      ...data,
      id: nanoid(),
      createdAt: new Date(),
    };
    await db.add('payouts', payout);
    return payout;
  }

  // Settings operations
  async getSettings(): Promise<Settings> {
    try {
      const db = await getDB();
      const settings = await db.get('settings', 'app-settings');
      return settings || { haptics: true, confetti: true, displayMode: 'dollars' as const };
    } catch (error) {
      console.error('Storage getSettings error:', error);
      return { haptics: true, confetti: true, displayMode: 'dollars' as const };
    }
  }

  async updateSettings(settings: Settings): Promise<Settings> {
    try {
      const db = await getDB();
      await db.put('settings', { ...settings }, 'app-settings');
      return settings;
    } catch (error) {
      console.error('Storage updateSettings error:', error);
      throw new Error('Failed to update settings in storage');
    }
  }

  // Data export/import
  async exportData(): Promise<AppData> {
    const [children, chores, payouts, settings] = await Promise.all([
      this.getAllChildren(),
      this.getAllChores(),
      this.getAllPayouts(),
      this.getSettings(),
    ]);

    return {
      children,
      chores,
      payouts,
      settings,
      exportedAt: new Date(),
    };
  }

  // `data` is expected to have already been validated (and its date fields
  // coerced) by appDataSchema.safeParse at the call site (see SettingsPage's
  // handleImport), so it's safe to write as-is.
  async importData(data: AppData): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['children', 'chores', 'payouts'], 'readwrite');
    const childrenStore = tx.objectStore('children');
    const choresStore = tx.objectStore('chores');
    const payoutsStore = tx.objectStore('payouts');

    await withTransaction(tx, async () => {
      // Clear existing data and repopulate inside the same transaction, so a
      // failure partway through rolls everything back instead of leaving the
      // stores cleared with only some of the import applied.
      await childrenStore.clear();
      await choresStore.clear();
      await payoutsStore.clear();

      for (const child of data.children) {
        await childrenStore.add(child);
      }
      for (const chore of data.chores) {
        await choresStore.add(chore);
      }
      for (const payout of data.payouts) {
        await payoutsStore.add(payout);
      }
    });

    // Settings live in a separate store and are written after the main
    // transaction commits, as before.
    await this.updateSettings(data.settings);
  }

  // Utility methods
  async completeChore(childId: string, choreValueCents: number): Promise<Child> {
    const db = await getDB();
    const tx = db.transaction('children', 'readwrite');
    const store = tx.objectStore('children');

    return withTransaction(tx, async () => {
      const child = await store.get(childId);
      if (!child) {
        throw new Error('Child not found');
      }

      const updatedChild: Child = {
        ...child,
        totalCents: child.totalCents + choreValueCents,
      };
      await store.put(updatedChild);

      return updatedChild;
    });
  }

  async payoutChild(childId: string): Promise<{ child: Child; payout: Payout }> {
    const db = await getDB();
    const tx = db.transaction(['payouts', 'children'], 'readwrite');
    const childrenStore = tx.objectStore('children');
    const payoutsStore = tx.objectStore('payouts');

    return withTransaction(tx, async () => {
      const child = await childrenStore.get(childId);
      if (!child) {
        throw new Error('Child not found');
      }

      if (child.totalCents === 0) {
        throw new Error('No amount to pay out');
      }

      const payout: Payout = {
        id: nanoid(),
        childId: child.id,
        childName: child.name,
        amountCents: child.totalCents,
        createdAt: new Date(),
      };
      await payoutsStore.add(payout);

      const updatedChild: Child = { ...child, totalCents: 0 };
      await childrenStore.put(updatedChild);

      return { child: updatedChild, payout };
    });
  }

  // Favorite chores operations (per-child)
  async toggleFavoriteChore(childId: string, choreId: string): Promise<Child> {
    const child = await this.getChild(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    const favoriteChoreIds = child.favoriteChoreIds || [];
    const isFavorite = favoriteChoreIds.includes(choreId);

    const updatedFavorites = isFavorite
      ? favoriteChoreIds.filter(id => id !== choreId)
      : [...favoriteChoreIds, choreId];

    return this.updateChild(childId, { favoriteChoreIds: updatedFavorites });
  }

  async isChoreFavorite(childId: string, choreId: string): Promise<boolean> {
    const child = await this.getChild(childId);
    if (!child) return false;
    return (child.favoriteChoreIds || []).includes(choreId);
  }

  async getFavoriteChores(childId: string): Promise<Chore[]> {
    const child = await this.getChild(childId);
    if (!child) return [];

    const allChores = await this.getAllChores();
    const favoriteIds = child.favoriteChoreIds || [];

    return allChores.filter(chore => favoriteIds.includes(chore.id));
  }
}

export const storage = new AppStorage();
