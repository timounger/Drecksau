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
 * One and a half. San Andreas is a large place - three islands, a desert and a
 * mountain - and the old default of three showed about one block of it. At one
 * and a half a crossing, the car coming across it and the turning after it are
 * all on the screen at once, which is what a driving game needs.
 */
export const DEFAULT_ZOOM = 1.5;

/**
 * The settings the camera can be put at.
 *
 * @remarks
 * From one - life size, the whole width of a block on the screen - to three,
 * which is close enough to see a face and narrow enough that a fast car
 * outruns its own view. Both ends are somebody's game, so both are on offer.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the steps *are* the
   numbers: a list of camera factors, each one meaningful only as itself. */
export const ZOOM_STEPS: readonly number[] = [1, 1.5, 2, 2.5, 3];
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * How the city is shown.
 *
 * @remarks
 * `3d` is the lit three.js city with real height, shadows and night; `2d` is
 * the tilted canvas picture the game was drawn in before. The same game
 * underneath either way - switching changes the picture, never the city.
 */
export type GtaView = "3d" | "2d";

/** The view a first-time visitor sees, and what an old entry without one gets. */
export const DEFAULT_VIEW: GtaView = "3d";

/** What the player can configure. */
export type GtaSettings = {
  /** How much closer than life size the city is drawn. */
  readonly zoom: number;
  /**
   * Whether the day runs at all: clock in the corner, night over the city.
   *
   * @remarks
   * Off to begin with. It changes how the whole game looks, and a first-time
   * visitor who lands in the dark thinks the page is broken rather than that
   * it is half past eleven.
   */
  readonly dayNight: boolean;
  /**
   * Which picture the city is drawn in.
   *
   * @remarks
   * Added after the first version of this entry, which is why it is read
   * with a fallback rather than with a new schema version: an entry written
   * before it simply has none, and gets the default.
   */
  readonly view: GtaView;
};

/** What a first-time visitor plays with. */
export const DEFAULT_SETTINGS: GtaSettings = {
  zoom: DEFAULT_ZOOM,
  dayNight: false,
  view: DEFAULT_VIEW,
};

/**
 * The settings as they are stored.
 *
 * @returns what is stored, with anything missing or odd replaced
 */
export function loadSettings(): GtaSettings {
  const stored = readStored(SETTINGS_KEY, SETTINGS_VERSION, isPartialSettings);
  return {
    zoom: clampZoom(stored?.zoom),
    dayNight: stored?.dayNight === true,
    view: viewOf(stored?.view),
  };
}

/**
 * Stores the settings.
 *
 * @param settings - the settings to keep for next time
 */
export function saveSettings(settings: GtaSettings): void {
  writeStored(SETTINGS_KEY, SETTINGS_VERSION, {
    zoom: clampZoom(settings.zoom),
    dayNight: settings.dayNight,
    view: viewOf(settings.view),
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

/**
 * A view read back from storage or a control.
 *
 * @param view - whatever was stored
 * @returns `2d` only where that was asked for, otherwise the default
 */
export function viewOf(view: unknown): GtaView {
  return view === "2d" ? "2d" : DEFAULT_VIEW;
}

/** Whether a stored value could be a settings object at all. */
function isPartialSettings(value: unknown): value is Partial<GtaSettings> {
  return typeof value === "object" && value !== null;
}
