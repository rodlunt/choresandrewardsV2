import { describe, it, expect } from 'vitest';
import { appDataSchema, bugReportSchema, payoutSchema, settingsSchema } from '@shared/schema';

describe('appDataSchema', () => {
  const validPayload = {
    children: [
      { id: 'c1', name: 'Aria', totalCents: 100, favoriteChoreIds: [], createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    chores: [{ id: 'ch1', title: 'Vacuum', valueCents: 500, createdAt: '2026-01-01T00:00:00.000Z' }],
    payouts: [
      { id: 'p1', childId: 'c1', amountCents: 100, createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    completions: [
      { id: 'comp1', childId: 'c1', choreId: 'ch1', choreTitle: 'Vacuum', valueCents: 500, createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    settings: { haptics: true, confetti: true, displayMode: 'dollars' },
    exportedAt: '2026-01-02T00:00:00.000Z',
  };

  it('coerces ISO-string dates to Date objects on every dated record', () => {
    const result = appDataSchema.parse(validPayload);

    expect(result.children[0].createdAt).toBeInstanceOf(Date);
    expect(result.chores[0].createdAt).toBeInstanceOf(Date);
    expect(result.payouts[0].createdAt).toBeInstanceOf(Date);
    expect(result.completions[0].createdAt).toBeInstanceOf(Date);
    expect(result.exportedAt).toBeInstanceOf(Date);
    expect(result.exportedAt.toISOString()).toBe('2026-01-02T00:00:00.000Z');
  });

  it('rejects a structurally invalid backup', () => {
    const invalid = {
      ...validPayload,
      // children entries must be an array of child objects, not strings
      children: ['not-a-child'],
    };

    const result = appDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects a backup missing a required top-level field', () => {
    const { settings, ...withoutSettings } = validPayload;
    const result = appDataSchema.safeParse(withoutSettings);
    expect(result.success).toBe(false);
  });

  it('defaults completions to [] when the field is absent, so a pre-completions backup still imports', () => {
    const { completions, ...withoutCompletions } = validPayload;
    const result = appDataSchema.parse(withoutCompletions);
    expect(result.completions).toEqual([]);
  });
});

describe('payoutSchema', () => {
  it('strips an unknown childName field instead of rejecting the record, so old backups still parse', () => {
    const legacyPayout = {
      id: 'p1',
      childId: 'c1',
      childName: 'Aria',
      amountCents: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const result = payoutSchema.parse(legacyPayout);
    expect(result).not.toHaveProperty('childName');
    expect(result.childId).toBe('c1');
    expect(result.amountCents).toBe(100);
  });
});

describe('settingsSchema', () => {
  it('defaults to no PIN configured', () => {
    const result = settingsSchema.parse({ haptics: true, confetti: true, displayMode: 'dollars' });
    expect(result.pinHash).toBeUndefined();
    expect(result.pinSalt).toBeUndefined();
  });

  it('accepts a settings object carrying a PIN hash and salt', () => {
    const result = settingsSchema.parse({
      haptics: true,
      confetti: true,
      displayMode: 'dollars',
      pinHash: 'abc123',
      pinSalt: 'def456',
    });
    expect(result.pinHash).toBe('abc123');
    expect(result.pinSalt).toBe('def456');
  });
});

describe('bugReportSchema', () => {
  const validPayload = {
    issueType: 'bug' as const,
    category: 'Chores Management' as const,
    description: 'The complete button does nothing on the second tap.',
    technicalInfo: {
      timestamp: '2026-01-01T00:00:00.000Z',
      userAgent: 'test-agent',
      url: 'https://example.com',
      resolution: '1920x1080',
      appVersion: '1.0.0',
      buildNumber: '1',
    },
  };

  it('accepts a valid payload', () => {
    const result = bugReportSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects a category outside the fixed enum', () => {
    const result = bugReportSchema.safeParse({
      ...validPayload,
      category: 'Not A Real Category',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a description over the 5000-character limit', () => {
    const result = bugReportSchema.safeParse({
      ...validPayload,
      description: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
