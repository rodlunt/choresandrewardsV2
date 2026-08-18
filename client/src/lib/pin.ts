// Parent PIN hashing and the in-memory "recently verified" grace window.
//
// This is kid-proofing, not cryptography: it stops a child from casually
// reading the PIN out of IndexedDB, not a real access-control boundary
// against a determined adult with devtools open. SHA-256 with a per-install
// random salt is plenty for that bar and needs no dependency beyond
// WebCrypto, which every browser this PWA targets already has.

const PIN_GRACE_PERIOD_MS = 5 * 60 * 1000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(bytes);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(digest));
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  const computed = await hashPin(pin, salt);
  return computed === expectedHash;
}

// Module-level (not persisted) so a parent who has just entered the PIN
// isn't asked again for every gated action within the grace window, but a
// page reload or app restart always re-prompts.
let lastVerifiedAt: number | null = null;

export function markPinVerified(): void {
  lastVerifiedAt = Date.now();
}

export function isPinGraceActive(): boolean {
  return lastVerifiedAt !== null && Date.now() - lastVerifiedAt < PIN_GRACE_PERIOD_MS;
}

// Test-only escape hatch: resets the grace window so cases can be exercised
// independently of real wall-clock time.
export function resetPinGraceForTests(): void {
  lastVerifiedAt = null;
}
