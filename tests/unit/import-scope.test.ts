import { describe, it, expect } from 'vitest';
import { describeImportScope, isDataEmpty } from '@/lib/import-scope';

describe('isDataEmpty', () => {
  it('is true only when children, chores and payouts are all zero', () => {
    expect(isDataEmpty({ children: 0, chores: 0, payouts: 0 })).toBe(true);
  });

  it('is false when any one count is non-zero', () => {
    expect(isDataEmpty({ children: 1, chores: 0, payouts: 0 })).toBe(false);
    expect(isDataEmpty({ children: 0, chores: 1, payouts: 0 })).toBe(false);
    expect(isDataEmpty({ children: 0, chores: 0, payouts: 1 })).toBe(false);
  });
});

describe('describeImportScope', () => {
  it('names the exact scope with correct pluralisation', () => {
    expect(describeImportScope({ children: 2, chores: 24, payouts: 15 })).toBe(
      'Replace 2 children, 24 chores and 15 payouts?',
    );
  });

  it('uses singular nouns for a count of exactly one', () => {
    expect(describeImportScope({ children: 1, chores: 1, payouts: 1 })).toBe(
      'Replace 1 child, 1 chore and 1 payout?',
    );
  });

  it('still produces a sensible sentence for an all-zero scope', () => {
    expect(describeImportScope({ children: 0, chores: 0, payouts: 0 })).toBe(
      'Replace 0 children, 0 chores and 0 payouts?',
    );
  });
});
