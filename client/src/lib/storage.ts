import { getDB } from './db';
import { Child, Chore, Payout, Settings, InsertChild, InsertChore, InsertPayout, AppData } from '@shared/schema';
import { nanoid } from 'nanoid';

export class AppStorage {
  // Children operations
  async getAllChildren(): Promise<Child[]> {
    const db = await getDB();
    const children = await db.getAll('children');

    // Normalize dates in case they were stored as strings (from JSON import)
    return children.map((c: Child) => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)
    }));
  }

  async getChild(id: string): Promise<Child | undefined> {
    const db = await getDB();
    return db.get('children', id);
  }

  async createChild(data: InsertChild): Promise<Child> {
    const db = await getDB();
    const child: Child = {
      ...data,
      id: nanoid(),
      totalCents: 0,
      favoriteChoreIds: [],
      createdAt: new Date(),
    };
    await db.add('children', child);
    return child;
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
    await db.delete('children', id);
    
    // Also delete all payouts for this child
    const allPayouts = await db.getAll('payouts');
    const childPayouts = allPayouts.filter(p => p.childId === id);
    for (const payout of childPayouts) {
      await db.delete('payouts', payout.id);
    }
  }

  // Chores operations
  async getAllChores(): Promise<Chore[]> {
    const db = await getDB();
    const chores = await db.getAll('chores');

    // Normalize dates in case they were stored as strings (from JSON import)
    return chores.map((c: Chore) => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt)
    }));
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
    await db.delete('chores', id);
  }

  // Payout operations
  async getAllPayouts(): Promise<Payout[]> {
    const db = await getDB();
    const payouts = await db.getAll('payouts');

    // Normalize dates in case they were stored as strings (from JSON import)
    const normalized = payouts.map((p: Payout) => ({
      ...p,
      createdAt: p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt)
    }));

    return normalized.sort((a: Payout, b: Payout) => b.createdAt.getTime() - a.createdAt.getTime());
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

  async importData(data: AppData): Promise<void> {
    const db = await getDB();

    // Clear existing data
    await db.clear('children');
    await db.clear('chores');
    await db.clear('payouts');

    // Import new data with date normalization
    // (JSON.parse converts dates to strings, we need to convert them back to Date objects)
    for (const child of data.children) {
      await db.add('children', {
        ...child,
        createdAt: child.createdAt instanceof Date ? child.createdAt : new Date(child.createdAt)
      });
    }
    for (const chore of data.chores) {
      await db.add('chores', {
        ...chore,
        createdAt: chore.createdAt instanceof Date ? chore.createdAt : new Date(chore.createdAt)
      });
    }
    for (const payout of data.payouts) {
      await db.add('payouts', {
        ...payout,
        createdAt: payout.createdAt instanceof Date ? payout.createdAt : new Date(payout.createdAt)
      });
    }

    await this.updateSettings(data.settings);
  }

  // Utility methods
  async completeChore(childId: string, choreValueCents: number): Promise<Child> {
    const child = await this.getChild(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    return this.updateChild(childId, {
      totalCents: child.totalCents + choreValueCents,
    });
  }

  async payoutChild(childId: string): Promise<{ child: Child; payout: Payout }> {
    const child = await this.getChild(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    if (child.totalCents === 0) {
      throw new Error('No amount to pay out');
    }

    const payout = await this.createPayout({
      childId: child.id,
      childName: child.name,
      amountCents: child.totalCents,
    });

    const updatedChild = await this.updateChild(childId, { totalCents: 0 });

    return { child: updatedChild, payout };
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
