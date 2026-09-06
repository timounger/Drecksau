/**
 * GTA settings, stored in the browser.
 *
 * @module
 * @remarks
 * Kept under this game's own key, so it does not collide with the other games'
 * settings. Anything unknown or out of range falls back to the default, which
 * keeps a hand-edited or outdated entry from breaking a game.
 */
import { readStored, storageKey, writeStored } from "@/lib/storage/local-store";

/** Schema version of the stored settings - raise it on breaking changes. */
const SETTINGS_VERSION = 1;

/** Key of the settings entry. */
const SETTINGS_KEY = storageKey("gta", "settings");

/**
 * How close the camera stands for a first-time visitor.
 *
 * @remarks
 * Three, which is near enough that a figure has a face and a car has a
 * windscreen, and far enough that a crossing fits on the screen while you drive
 * towards it.
 */
export const DEFAULT_ZOOM = 3;

/**
 * The settings the camera can be put at.
 *
 * @remarks
 * From one and a half - the old, wide look - to six, which is close enough to
 * count the windows and narrow enough that a fast car outruns its own view.
 * Both ends are somebody's game, so both are on offer.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the steps *are* the
   numbers: a list of camera factors, each one meaningful only as itself. */
export const ZOOM_STEPS: readonly number[] = [1.5, 2, 2.5, 3, 4, 5, 6];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** What the player can configure. */
export type GtaSettings = {
  /** How much closer than life size the city is drawn. */
  readonly zoom: number;
};

/** What a first-time visitor plays with. */
export const DEFAULT_SETTINGS: GtaSettings = { zoom: DEFAULT_ZOOM };

/**
 * The settings as they are stored.
 *
 * @returns what is stored, with anything missing or odd replaced
 */
export function loadSettings(): GtaSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return { zoom: clampZoom(stored?.zoom) };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: GtaSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    zoom: clampZoom(settings.zoom),
  });
}

/**
 * Holds a zoom factor inside what the game offers.
 *
 * @param zoom - the value read back from storage or a control
 * @returns one of {@link ZOOM_STEPS}, or the default
 */
export function clampZoom(zoom: unknown): number {
  const wanted =
    typeof zoom === "number" && Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM;
  return ZOOM_STEPS.reduce(
    (best, step) =>
      Math.abs(step - wanted) < Math.abs(best - wanted) ? step : best,
    DEFAULT_ZOOM,
  );
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<GtaSettings> {
  return typeof value === "object" && value !== null;
}
