/**
 * Risiko settings as an external store React can subscribe to.
 *
 * @module
 * @remarks
 * Same reason as the statistics store: localStorage does not exist during the
 * prerender, so the values may only be read after hydration.
 */
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type RisikoSettings,
} from "./app-settings";

/** Everyone currently listening for changes. */
const listeners = new Set<() => void>();

/** Cached snapshot - `useSyncExternalStore` compares by identity. */
let cache: RisikoSettings | null = null;

/**
 * Subscribes to changes of the settings.
 *
 * @param onChange - called whenever the settings may have changed
 * @returns the unsubscribe function
 */
export function subscribeSettings(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab may change the same settings.
  window.addEventListener("storage", invalidateSettings);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", invalidateSettings);
  };
}

/**
 * The current settings in the browser.
 *
 * @returns a stable snapshot until the settings change
 */
export function getSettingsSnapshot(): RisikoSettings {
  if (cache === null) {
    cache = loadSettings();
  }
  return cache;
}

/**
 * The settings during prerender, where no storage exists.
 *
 * @returns the neutral defaults
 */
export function getServerSettingsSnapshot(): RisikoSettings {
  return DEFAULT_SETTINGS;
}

/**
 * Stores new settings and tells every listener.
 *
 * @param settings - the settings to apply
 */
export function updateSettings(settings: RisikoSettings): void {
  saveSettings(settings);
  invalidateSettings();
}

/** Drops the cached snapshot and notifies every listener. */
function invalidateSettings(): void {
  cache = null;
  for (const listener of listeners) {
    listener();
  }
}
