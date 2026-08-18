import { getDB } from './db';
import { Child, Chore, Payout, Completion, Settings, InsertChild, InsertChore, InsertPayout, AppData } from '@shared/schema';
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
// Databases populated by the pre-validation import code can hold createdAt
// as ISO strings rather than Date objects (the old importData wrote whatever
// JSON.parse produced). Reads coerce defensively so legacy data cannot crash
// date arithmetic; newly written and newly imported records are always real
// Dates.
function coerceDate<T extends { createdAt: Date | string }>(record: T): T {
  return record.createdAt instanceof Date
    ? record
    : { ...record, createdAt: new Date(record.createdAt) };
}

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
    const children = await db.getAll('children');
    return children.map(coerceDate);
  }

  async getChild(id: string): Promise<Child | undefined> {
    const db = await getDB();
    const child = await db.get('children', id);
    return child && coerceDate(child);
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
    const tx = db.transaction(['children', 'payouts', 'completions'], 'readwrite');
    const childrenStore = tx.objectStore('children');
    const payoutsStore = tx.objectStore('payouts');
    const completionsStore = tx.objectStore('completions');

    await withTransaction(tx, async () => {
      await childrenStore.delete(id);

      // Also delete all payouts and completions for this child, in the same
      // transaction so the child and their history are removed together or
      // not at all.
      const allPayouts = await payoutsStore.getAll();
      const childPayouts = allPayouts.filter(p => p.childId === id);
      for (const payout of childPayouts) {
        await payoutsStore.delete(payout.id);
      }

      const allCompletions = await completionsStore.getAll();
      const childCompletions = allCompletions.filter(c => c.childId === id);
      for (const completion of childCompletions) {
        await completionsStore.delete(completion.id);
      }
    });
  }

  // Chores operations
  async getAllChores(): Promise<Chore[]> {
    const db = await getDB();
    const chores = await db.getAll('chores');
    return chores.map(coerceDate);
  }

  async getChore(id: string): Promise<Chore | undefined> {
    const db = await getDB();
    const chore = await db.get('chores', id);
    return chore && coerceDate(chore);
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
    return payouts
      .map(coerceDate)
      .sort((a: Payout, b: Payout) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPayoutsForChild(childId: string): Promise<Payout[]> {
    const db = await getDB();
    const allPayouts = await db.getAll('payouts');
    return allPayouts.filter(p => p.childId === childId).map(coerceDate);
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

  // Completion operations
  async getAllCompletions(): Promise<Completion[]> {
    const db = await getDB();
    const completions = await db.getAll('completions');
    return completions
      .map(coerceDate)
      .sort((a: Completion, b: Completion) => b.createdAt.getTime() - a.createdAt.getTime());
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
    const [children, chores, payouts, completions, settings] = await Promise.all([
      this.getAllChildren(),
      this.getAllChores(),
      this.getAllPayouts(),
      this.getAllCompletions(),
      this.getSettings(),
    ]);

    return {
      children,
      chores,
      payouts,
      completions,
      settings,
      exportedAt: new Date(),
    };
  }

  // `data` is expected to have already been validated (and its date fields
  // coerced) by appDataSchema.safeParse at the call site (see SettingsPage's
  // handleImport), so it's safe to write as-is. `data.completions` defaults
  // to [] via appDataSchema, so a legacy backup taken before completions
  // existed still imports cleanly.
  async importData(data: AppData): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['children', 'chores', 'payouts', 'completions'], 'readwrite');
    const childrenStore = tx.objectStore('children');
    const choresStore = tx.objectStore('chores');
    const payoutsStore = tx.objectStore('payouts');
    const completionsStore = tx.objectStore('completions');

    await withTransaction(tx, async () => {
      // Clear existing data and repopulate inside the same transaction, so a
      // failure partway through rolls everything back instead of leaving the
      // stores cleared with only some of the import applied.
      await childrenStore.clear();
      await choresStore.clear();
      await payoutsStore.clear();
      await completionsStore.clear();

      for (const child of data.children) {
        await childrenStore.add(child);
      }
      for (const chore of data.chores) {
        await choresStore.add(chore);
      }
      for (const payout of data.payouts) {
        await payoutsStore.add(payout);
      }
      for (const completion of data.completions) {
        await completionsStore.add(completion);
      }
    });

    // Settings live in a separate store and are written after the main
    // transaction commits, as before.
    await this.updateSettings(data.settings);
  }

  // Utility methods
  // Atomically increments the child's balance and records the completion
  // that earned it, in one transaction, so a completion can never exist
  // without the balance reflecting it (or vice versa). choreTitle is a
  // snapshot: chores are deletable, so the completion needs its own copy of
  // the title to stay meaningful after the chore itself is gone.
  async completeChore(childId: string, choreId: string, choreTitle: string, valueCents: number): Promise<{ child: Child; completion: Completion }> {
    const db = await getDB();
    const tx = db.transaction(['children', 'completions'], 'readwrite');
    const childrenStore = tx.objectStore('children');
    const completionsStore = tx.objectStore('completions');

    return withTransaction(tx, async () => {
      const child = await childrenStore.get(childId);
      if (!child) {
        throw new Error('Child not found');
      }

      const updatedChild: Child = {
        ...child,
        totalCents: child.totalCents + valueCents,
      };
      await childrenStore.put(updatedChild);

      const completion: Completion = {
        id: nanoid(),
        childId,
        choreId,
        choreTitle,
        valueCents,
        createdAt: new Date(),
      };
      await completionsStore.add(completion);

      return { child: updatedChild, completion };
    });
  }

  // Reverses a single completion: deletes the completion row and gives back
  // its value in one transaction. Refuses (without touching either store) if
  // the child's current balance is lower than the completion's value, which
  // means a payout happened since the completion and undoing it would drive
  // the balance negative.
  async undoCompletion(completionId: string): Promise<Child> {
    const db = await getDB();
    const tx = db.transaction(['children', 'completions'], 'readwrite');
    const childrenStore = tx.objectStore('children');
    const completionsStore = tx.objectStore('completions');

    return withTransaction(tx, async () => {
      const completion = await completionsStore.get(completionId);
      if (!completion) {
        throw new Error('Completion not found');
      }

      const child = await childrenStore.get(completion.childId);
      if (!child) {
        throw new Error('Child not found');
      }

      if (child.totalCents < completion.valueCents) {
        throw new Error('Cannot undo: a payout has already happened since this chore was completed');
      }

      await completionsStore.delete(completionId);

      const updatedChild: Child = {
        ...child,
        totalCents: child.totalCents - completion.valueCents,
      };
      await childrenStore.put(updatedChild);

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
