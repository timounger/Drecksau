/**
 * What Frost Fortress remembers between visits: the settings page.
 *
 * @module
 * @remarks
 * Kept as stored values so React reads them without breaking hydration - the
 * page is prerendered, and the first render must match the HTML that was made
 * without any storage at all.
 */
import { storageKey } from "@/lib/storage/local-store";
import {
  createStoredValue,
  type StoredValue,
} from "@/lib/storage/stored-value";

/** Schema version of these small values. */
const VERSION = 1;

/** The game speeds there are (0 is pause). */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the speeds themselves
export const SPEEDS = [1, 2, 3] as const;

/** One game speed. */
export type Speed = (typeof SPEEDS)[number];

/** The fastest speed without the cheat. */
export const NORMAL_TOP: number = SPEEDS[SPEEDS.length - 1];

/** The speeds the cheat adds. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the speeds themselves
export const CHEAT_SPEEDS = [10, 100] as const;

/** The reach factors for the towers there are; 1 is the normal reach. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the factors themselves
export const RANGES = [1, 1.5, 2, 3, 5] as const;

/** One reach factor. */
export type RangeBoost = (typeof RANGES)[number];

/** Whether a value is a boolean. */
function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Whether the game's sounds are off. */
export const mutedSetting: StoredValue<boolean> = createStoredValue(
  storageKey("frost-fortress", "muted"),
  VERSION,
  false,
  isBoolean,
);

/** The speed a game starts with. */
export const speedSetting: StoredValue<Speed> = createStoredValue(
  storageKey("frost-fortress", "speed"),
  VERSION,
  1 as Speed,
  (value): value is Speed => SPEEDS.includes(value as Speed),
);

/** Whether the map scrolls when the mouse touches the edge. */
export const edgeScrollSetting: StoredValue<boolean> = createStoredValue(
  storageKey("frost-fortress", "edge-scroll"),
  VERSION,
  true,
  isBoolean,
);

/** Whether damage numbers float over hit enemies. */
export const numbersSetting: StoredValue<boolean> = createStoredValue(
  storageKey("frost-fortress", "damage-numbers"),
  VERSION,
  true,
  isBoolean,
);

/** Whether the game saves itself now and then. */
export const autosaveSetting: StoredValue<boolean> = createStoredValue(
  storageKey("frost-fortress", "autosave"),
  VERSION,
  true,
  isBoolean,
);

/** How far the towers shoot, as a factor on their normal reach. */
export const rangeSetting: StoredValue<RangeBoost> = createStoredValue(
  storageKey("frost-fortress", "range"),
  VERSION,
  1 as RangeBoost,
  (value): value is RangeBoost => RANGES.includes(value as RangeBoost),
);

/** Whether to build freely: no wave comes by itself, enemies come when called. */
export const freeBuildSetting: StoredValue<boolean> = createStoredValue(
  storageKey("frost-fortress", "free-build"),
  VERSION,
  false,
  isBoolean,
);
