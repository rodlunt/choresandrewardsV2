import { describe, it, expect, beforeEach, vi } from 'vitest';

// The module arms a window listener at import time, which is the behaviour
// under test, so each test gets a fresh module registry and a fresh fake
// window installed BEFORE the import happens.

type PromptOutcome = { outcome: 'accepted' | 'dismissed'; platform: string };

function makeFakeWindow() {
  const handlers = new Map<string, Set<(e: Event) => void>>();
  return {
    addEventListener(type: string, handler: (e: Event) => void) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)!.add(handler);
    },
    removeEventListener(type: string, handler: (e: Event) => void) {
      handlers.get(type)?.delete(handler);
    },
    dispatch(type: string, event: Event) {
      handlers.get(type)?.forEach((h) => h(event));
    },
  };
}

function makeInstallEvent(outcome: PromptOutcome['outcome'] = 'accepted') {
  const event = new Event('beforeinstallprompt') as Event & {
    platforms: string[];
    userChoice: Promise<PromptOutcome>;
    prompt: () => Promise<void>;
  };
  Object.assign(event, {
    platforms: ['web'],
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
    prompt: vi.fn().mockResolvedValue(undefined),
  });
  return event;
}

async function importFreshModule(fakeWindow: ReturnType<typeof makeFakeWindow>) {
  vi.resetModules();
  vi.stubGlobal('window', fakeWindow);
  return import('@/lib/pwa-install');
}

describe('pwa-install capture store', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('delivers an event captured BEFORE any subscriber existed (the missed-race fix)', async () => {
    const fakeWindow = makeFakeWindow();
    const mod = await importFreshModule(fakeWindow);

    // Event fires while no component is mounted, as on a real first load.
    const event = makeInstallEvent();
    fakeWindow.dispatch('beforeinstallprompt', event);

    // A component mounting later still receives it via replay.
    const seen: (Event | null)[] = [];
    mod.subscribeInstallPrompt((e) => seen.push(e));
    expect(seen).toEqual([event]);
    expect(mod.getDeferredPrompt()).toBe(event);
  });

  it('notifies an existing subscriber when the event arrives later', async () => {
    const fakeWindow = makeFakeWindow();
    const mod = await importFreshModule(fakeWindow);

    const seen: (Event | null)[] = [];
    mod.subscribeInstallPrompt((e) => seen.push(e));
    expect(seen).toEqual([null]);

    const event = makeInstallEvent();
    fakeWindow.dispatch('beforeinstallprompt', event);
    expect(seen).toEqual([null, event]);
  });

  it('promptInstall consumes the event and reports the outcome', async () => {
    const fakeWindow = makeFakeWindow();
    const mod = await importFreshModule(fakeWindow);

    fakeWindow.dispatch('beforeinstallprompt', makeInstallEvent('accepted'));
    expect(await mod.promptInstall()).toBe('accepted');
    expect(mod.getDeferredPrompt()).toBeNull();
    expect(await mod.promptInstall()).toBe('unavailable');
  });

  it('clears the stored event on appinstalled', async () => {
    const fakeWindow = makeFakeWindow();
    const mod = await importFreshModule(fakeWindow);

    fakeWindow.dispatch('beforeinstallprompt', makeInstallEvent());
    expect(mod.getDeferredPrompt()).not.toBeNull();

    fakeWindow.dispatch('appinstalled', new Event('appinstalled'));
    expect(mod.getDeferredPrompt()).toBeNull();
  });
});
