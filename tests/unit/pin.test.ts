import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSalt,
  hashPin,
  verifyPin,
  markPinVerified,
  isPinGraceActive,
  resetPinGraceForTests,
} from '@/lib/pin';

describe('hashPin / verifyPin', () => {
  it('verifies a correct PIN against its own hash and salt', async () => {
    const salt = generateSalt();
    const hash = await hashPin('1234', salt);

    expect(await verifyPin('1234', salt, hash)).toBe(true);
  });

  it('rejects an incorrect PIN against the same hash and salt', async () => {
    const salt = generateSalt();
    const hash = await hashPin('1234', salt);

    expect(await verifyPin('9999', salt, hash)).toBe(false);
  });

  it('never stores the PIN itself: the hash does not contain the raw digits', async () => {
    const salt = generateSalt();
    const hash = await hashPin('1234', salt);

    expect(hash).not.toContain('1234');
  });

  it('produces different hashes for the same PIN under different salts', async () => {
    const hashA = await hashPin('1234', generateSalt());
    const hashB = await hashPin('1234', generateSalt());

    expect(hashA).not.toBe(hashB);
  });

  it('generates a fresh salt on every call', () => {
    expect(generateSalt()).not.toBe(generateSalt());
  });
});

describe('PIN grace window', () => {
  beforeEach(() => {
    resetPinGraceForTests();
    vi.useRealTimers();
  });

  it('is not active before any verification', () => {
    expect(isPinGraceActive()).toBe(false);
  });

  it('is active immediately after a successful verification', () => {
    markPinVerified();
    expect(isPinGraceActive()).toBe(true);
  });

  it('expires after the grace window elapses', () => {
    vi.useFakeTimers();
    try {
      markPinVerified();
      expect(isPinGraceActive()).toBe(true);

      vi.advanceTimersByTime(5 * 60 * 1000 + 1);
      expect(isPinGraceActive()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
