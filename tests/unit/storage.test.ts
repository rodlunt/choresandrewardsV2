import { describe, it, expect } from 'vitest';
import { freshStorage } from './db-helper';
import { appDataSchema } from '@shared/schema';
import type { AppData } from '@shared/schema';

describe('AppStorage.createChild', () => {
  it('creates a child with zeroed totals and no favourites', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });

    expect(child.totalCents).toBe(0);
    expect(child.favoriteChoreIds).toEqual([]);
    expect(child.id).toBeTruthy();
    expect(child.createdAt).toBeInstanceOf(Date);
  });

  it('rejects a duplicate name, case-insensitively and trimmed, surfacing the name in the error', async () => {
    const storage = await freshStorage();
    await storage.createChild({ name: 'Aria' });

    await expect(storage.createChild({ name: '  aria  ' })).rejects.toThrow(
      'A child named "aria" already exists',
    );
  });
});

describe('AppStorage.completeChore', () => {
  it('adds the chore value to the child balance and records a completion, atomically, cumulatively', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });

    const first = await storage.completeChore(child.id, 'chore-1', 'Vacuum', 250);
    expect(first.child.totalCents).toBe(250);
    expect(first.completion.childId).toBe(child.id);
    expect(first.completion.choreId).toBe('chore-1');
    expect(first.completion.choreTitle).toBe('Vacuum');
    expect(first.completion.valueCents).toBe(250);
    expect(first.completion.id).toBeTruthy();

    const second = await storage.completeChore(child.id, 'chore-2', 'Mop', 100);
    expect(second.child.totalCents).toBe(350);

    const completions = await storage.getAllCompletions();
    expect(completions).toHaveLength(2);
  });

  it('throws for an unknown child, and records no completion', async () => {
    const storage = await freshStorage();
    await expect(storage.completeChore('no-such-child', 'chore-1', 'Vacuum', 100)).rejects.toThrow('Child not found');
    expect(await storage.getAllCompletions()).toEqual([]);
  });

  it('keeps the chore title as a snapshot, independent of the chore being deleted afterwards', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });
    const chore = await storage.createChore({ title: 'Vacuum', valueCents: 500 });

    const { completion } = await storage.completeChore(child.id, chore.id, chore.title, chore.valueCents);
    await storage.deleteChore(chore.id);

    const completions = await storage.getAllCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0].id).toBe(completion.id);
    expect(completions[0].choreTitle).toBe('Vacuum');
  });
});

describe('AppStorage.undoCompletion', () => {
  it('deletes the completion and gives back its value', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });
    const { completion } = await storage.completeChore(child.id, 'chore-1', 'Vacuum', 500);

    const updated = await storage.undoCompletion(completion.id);
    expect(updated.totalCents).toBe(0);

    const completions = await storage.getAllCompletions();
    expect(completions).toEqual([]);
  });

  it('leaves other completions and the rest of the balance untouched', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });
    const { completion: first } = await storage.completeChore(child.id, 'chore-1', 'Vacuum', 500);
    await storage.completeChore(child.id, 'chore-2', 'Mop', 100);

    const updated = await storage.undoCompletion(first.id);
    expect(updated.totalCents).toBe(100);

    const completions = await storage.getAllCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0].choreId).toBe('chore-2');
  });

  // Control for hardening rule 13 (a control must fail on the broken
  // version): this is the exact scenario the refusal exists to catch - a
  // payout happened after the completion, so undoing it would drive the
  // balance negative. Verified to fail against a naive implementation that
  // unconditionally subtracts valueCents; that inversion was reverted
  // immediately after and does not ship.
  it('refuses when the balance has dropped below the completion value (a payout happened since), without touching either store', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });
    const { completion } = await storage.completeChore(child.id, 'chore-1', 'Vacuum', 500);
    await storage.payoutChild(child.id); // balance now 0

    await expect(storage.undoCompletion(completion.id)).rejects.toThrow(
      'Cannot undo: a payout has already happened since this chore was completed',
    );

    const childAfter = await storage.getChild(child.id);
    expect(childAfter?.totalCents).toBe(0);

    const completions = await storage.getAllCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0].id).toBe(completion.id);
  });

  it('throws for an unknown completion', async () => {
    const storage = await freshStorage();
    await expect(storage.undoCompletion('no-such-completion')).rejects.toThrow('Completion not found');
  });
});

describe('AppStorage.payoutChild', () => {
  it('creates a payout row (with no childName field) and zeroes the balance', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });
    await storage.completeChore(child.id, 'chore-1', 'Vacuum', 500);

    const { child: paidChild, payout } = await storage.payoutChild(child.id);

    expect(paidChild.totalCents).toBe(0);
    expect(payout.amountCents).toBe(500);
    expect(payout.childId).toBe(child.id);
    expect(payout).not.toHaveProperty('childName');

    const payouts = await storage.getAllPayouts();
    expect(payouts).toHaveLength(1);
    expect(payouts[0].id).toBe(payout.id);
  });

  it('throws when the balance is zero', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });

    await expect(storage.payoutChild(child.id)).rejects.toThrow('No amount to pay out');
  });

  it('throws for an unknown child', async () => {
    const storage = await freshStorage();
    await expect(storage.payoutChild('no-such-child')).rejects.toThrow('Child not found');
  });
});

describe('AppStorage.deleteChild', () => {
  it('removes the child and all of their payouts and completions, leaving other children, payouts and completions intact', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });
    const other = await storage.createChild({ name: 'Addie' });

    await storage.completeChore(child.id, 'chore-1', 'Vacuum', 300);
    await storage.payoutChild(child.id);
    await storage.completeChore(child.id, 'chore-2', 'Mop', 200);
    await storage.payoutChild(child.id);

    await storage.completeChore(other.id, 'chore-3', 'Dishes', 100);
    await storage.payoutChild(other.id);

    await storage.deleteChild(child.id);

    const children = await storage.getAllChildren();
    expect(children.map((c) => c.id)).not.toContain(child.id);
    expect(children.map((c) => c.id)).toContain(other.id);

    const payouts = await storage.getAllPayouts();
    expect(payouts.some((p) => p.childId === child.id)).toBe(false);
    expect(payouts.some((p) => p.childId === other.id)).toBe(true);

    const completions = await storage.getAllCompletions();
    expect(completions.some((c) => c.childId === child.id)).toBe(false);
    expect(completions.some((c) => c.childId === other.id)).toBe(true);
  });
});

describe('AppStorage.deleteChore', () => {
  it('removes the chore and strips its id from every child favoriteChoreIds', async () => {
    const storage = await freshStorage();
    const chore = await storage.createChore({ title: 'Test chore', valueCents: 100 });
    const child1 = await storage.createChild({ name: 'Aria' });
    const child2 = await storage.createChild({ name: 'Addie' });

    await storage.toggleFavoriteChore(child1.id, chore.id);
    await storage.toggleFavoriteChore(child2.id, chore.id);

    await storage.deleteChore(chore.id);

    const chores = await storage.getAllChores();
    expect(chores.find((c) => c.id === chore.id)).toBeUndefined();

    const children = await storage.getAllChildren();
    for (const child of children) {
      expect(child.favoriteChoreIds).not.toContain(chore.id);
    }
  });
});

describe('AppStorage.exportData / importData round trip', () => {
  it('carries completions through an export and re-import', async () => {
    const storage = await freshStorage();
    const child = await storage.createChild({ name: 'Aria' });
    const chore = await storage.createChore({ title: 'Vacuum', valueCents: 500 });
    await storage.completeChore(child.id, chore.id, chore.title, chore.valueCents);

    const exported = await storage.exportData();
    expect(exported.completions).toHaveLength(1);
    expect(exported.completions[0].choreTitle).toBe('Vacuum');

    // Import into a second, independent database and confirm the
    // completion survived the round trip untouched.
    const storage2 = await freshStorage();
    await storage2.importData(exported);

    const completions = await storage2.getAllCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0].choreTitle).toBe('Vacuum');
    expect(completions[0].valueCents).toBe(500);
  });

  it('replaces children, chores, payouts and completions wholesale with a valid backup', async () => {
    const storage = await freshStorage();
    await storage.createChild({ name: 'Old Kid' });

    const backup: AppData = {
      children: [
        { id: 'c1', name: 'New Kid', totalCents: 500, favoriteChoreIds: [], createdAt: new Date() },
      ],
      chores: [{ id: 'ch1', title: 'New Chore', valueCents: 100, createdAt: new Date() }],
      payouts: [
        { id: 'p1', childId: 'c1', amountCents: 200, createdAt: new Date() },
      ],
      completions: [
        { id: 'comp1', childId: 'c1', choreId: 'ch1', choreTitle: 'New Chore', valueCents: 100, createdAt: new Date() },
      ],
      settings: { haptics: false, confetti: false, displayMode: 'points' },
      exportedAt: new Date(),
    };

    await storage.importData(backup);

    const children = await storage.getAllChildren();
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe('c1');

    // The default-seeded chores from DB creation are gone too: import is a
    // wholesale replace, not a merge.
    const chores = await storage.getAllChores();
    expect(chores).toHaveLength(1);
    expect(chores[0].id).toBe('ch1');

    const payouts = await storage.getAllPayouts();
    expect(payouts).toHaveLength(1);
    expect(payouts[0].id).toBe('p1');

    const completions = await storage.getAllCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0].id).toBe('comp1');

    const settings = await storage.getSettings();
    expect(settings.displayMode).toBe('points');
  });

  it('imports a legacy backup with no completions field and a payout still carrying childName, dropping the unused field', async () => {
    const storage = await freshStorage();

    // This is exactly the shape a backup taken before completions and the
    // childName removal would have: no `completions` key at all, and every
    // payout still has `childName`.
    const legacyBackupJson = {
      children: [
        { id: 'c1', name: 'Aria', totalCents: 0, favoriteChoreIds: [], createdAt: '2026-01-01T00:00:00.000Z' },
      ],
      chores: [],
      payouts: [
        { id: 'p1', childId: 'c1', childName: 'Aria', amountCents: 200, createdAt: '2026-01-01T00:00:00.000Z' },
      ],
      settings: { haptics: true, confetti: true, displayMode: 'dollars' },
      exportedAt: '2026-01-02T00:00:00.000Z',
    };

    const parsed = appDataSchema.parse(legacyBackupJson);
    expect(parsed.completions).toEqual([]);
    expect(parsed.payouts[0]).not.toHaveProperty('childName');

    await storage.importData(parsed);

    const payouts = await storage.getAllPayouts();
    expect(payouts).toHaveLength(1);
    expect(payouts[0]).not.toHaveProperty('childName');

    const completions = await storage.getAllCompletions();
    expect(completions).toEqual([]);
  });

  // This is the control for import atomicity. importData clears the
  // children/chores/payouts/completions stores and repopulates them inside
  // a single IndexedDB transaction (see AppStorage.importData / withTransaction
  // in client/src/lib/storage.ts), so a failure partway through must abort
  // the whole transaction and leave the pre-import data untouched - not
  // "cleared, with only the records that made it in before the failure".
  //
  // The backup below has two children sharing the same id, so the second
  // `store.add` rejects with a ConstraintError partway through the import.
  //
  // Per hardening rule 13 ("a control must fail on the broken version, run
  // it both ways"), this assertion was verified to fail when inverted to
  // assert the *non-atomic* outcome (store left with the first of the two
  // duplicate-id records, "dup-id"/"First") against this atomic
  // implementation - see the verification output for that run. The
  // inversion was reverted immediately after; it does not ship.
  it('leaves pre-existing data fully intact when a backup fails partway through import (atomic rollback)', async () => {
    const storage = await freshStorage();
    const preExisting = await storage.createChild({ name: 'Existing Kid' });

    const malformedBackup: AppData = {
      children: [
        { id: 'dup-id', name: 'First', totalCents: 0, favoriteChoreIds: [], createdAt: new Date() },
        { id: 'dup-id', name: 'Second', totalCents: 0, favoriteChoreIds: [], createdAt: new Date() },
      ],
      chores: [],
      payouts: [],
      completions: [],
      settings: { haptics: true, confetti: true, displayMode: 'dollars' },
      exportedAt: new Date(),
    };

    await expect(storage.importData(malformedBackup)).rejects.toThrow();

    const children = await storage.getAllChildren();
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe(preExisting.id);
    expect(children[0].name).toBe('Existing Kid');
  });
});
