import { getDB } from './db';
import { Child, Chore, Payout, Settings, InsertChild, InsertChore, InsertPayout, AppData } from '@shared/schema';
import { nanoid } from 'nanoid';

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
    const child: Child = {
      ...data,
      id: nanoid(),
      totalCents: 0,
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
      isFavorite: false,
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
    return payouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    const db = await getDB();
    const settings = await db.get('settings', 'app-settings');
    return settings || { sounds: true, haptics: true, confetti: true, displayMode: 'dollars' as const };
  }

  async updateSettings(settings: Settings): Promise<Settings> {
    const db = await getDB();
    await db.put('settings', { ...settings }, 'app-settings');
    return settings;
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
    
    // Import new data
    for (const child of data.children) {
      await db.add('children', child);
    }
    for (const chore of data.chores) {
      await db.add('chores', chore);
    }
    for (const payout of data.payouts) {
      await db.add('payouts', payout);
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
}

export const storage = new AppStorage();
