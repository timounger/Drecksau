/**
 * The Binokel settings as an external store React can subscribe to.
 *
 * @module
 * @remarks
 * localStorage does not exist during the prerender, so the values may only be
 * read after hydration; the server snapshot is the plain defaults.
 */
import {
  defaultBinokelSettings,
  loadBinokelSettings,
  saveBinokelSettings,
  type BinokelSettings,
} from "./binokel-settings";

/** Everyone currently listening for changes. */
const listeners = new Set<() => void>();

/** Cached snapshot - `useSyncExternalStore` compares by identity. */
let cache: BinokelSettings | null = null;

/** What the prerender sees: the plain defaults. */
const SERVER_SNAPSHOT: BinokelSettings = defaultBinokelSettings();

/**
 * Subscribes to changes of the Binokel settings.
 *
 * @param onChange - called whenever the settings may have changed
 * @returns the unsubscribe function
 */
export function subscribeBinokelSettings(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab may change the same settings.
  window.addEventListener("storage", invalidateBinokelSettings);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", invalidateBinokelSettings);
  };
}

/**
 * The current Binokel settings in the browser.
 *
 * @returns a stable snapshot until the settings change
 */
export function getBinokelSettingsSnapshot(): BinokelSettings {
  if (cache === null) {
    cache = loadBinokelSettings();
  }
  return cache;
}

/**
 * The Binokel settings during prerender, where no storage exists.
 *
 * @returns the neutral defaults
 */
export function getServerBinokelSettingsSnapshot(): BinokelSettings {
  return SERVER_SNAPSHOT;
}

/**
 * Stores new Binokel settings and tells every listener.
 *
 * @param settings - the settings to apply
 */
export function updateBinokelSettings(settings: BinokelSettings): void {
  saveBinokelSettings(settings);
  invalidateBinokelSettings();
}

/** Drops the cached snapshot and notifies every listener. */
function invalidateBinokelSettings(): void {
  cache = null;
  for (const listener of listeners) {
    listener();
  }
}
