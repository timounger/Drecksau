/**
 * Where the adventure's own numbers and the saved game are kept, and how React
 * hears about changes.
 *
 * @module
 * @remarks
 * The same shape as `lib/stats/stats-store`: localStorage does not exist
 * while the page is prerendered, so the statistics card reads through
 * `useSyncExternalStore`, which renders the server snapshot first and the
 * stored numbers right after hydration.
 */
import {
  readStored,
  removeStored,
  storageKey,
  writeStored,
} from "@/lib/storage/local-store";
import {
  EMPTY_ADVENTURE,
  isAdventureStats,
  plusAdventure,
  type AdventureDelta,
  type AdventureStats,
} from "./adventure-stats";
import {
  isSaveData,
  isSaveDataV1,
  isSaveDataV2,
  migrateSave,
  migrateSaveV1,
  type SaveData,
  type SaveDataV2,
} from "@/games/zelda/engine/world";

/** Schema version of the numbers. */
const STATS_VERSION = 1;

/**
 * Schema version of the saved game: 2 added the temple, the village and the
 * root world, 3 the new tools, the bottles and free A and B buttons.
 */
const SAVE_VERSION = 3;

/** The second schema version of the saved game, still read and carried over. */
const SAVE_VERSION_V2 = 2;

/** The first schema version of the saved game, still read and carried over. */
const SAVE_VERSION_V1 = 1;

/** Schema version of the save slot written from the pause menu: 2 holds a version 3 save. */
const SLOT_VERSION = 2;

/** The first schema version of the save slot, holding a version 2 save. */
const SLOT_VERSION_V1 = 1;

/** Schema version of the sound switch. */
const MUTED_VERSION = 1;

/** Where the numbers live. */
const STATS_KEY = storageKey("zelda", "adventure-stats");

/** Where the saved game lives. */
const SAVE_KEY = storageKey("zelda", "save");

/** Where the game saved by hand from the pause menu lives. */
const SLOT_KEY = storageKey("zelda", "slot");

/** Where the sound switch lives. */
const MUTED_KEY = storageKey("zelda", "muted");

/** Schema version of the graphics switch. */
const GRAPHICS_VERSION = 1;

/** Where the graphics switch lives. */
const GRAPHICS_KEY = storageKey("zelda", "graphics");

/** Everyone listening for changed numbers. */
const listeners = new Set<() => void>();

/** The snapshot handed out until something changes. */
let cache: AdventureStats | null = null;

/**
 * Adds a stretch of play to the stored numbers.
 *
 * @param delta - what happened
 */
export function recordAdventure(delta: AdventureDelta): void {
  writeStored(STATS_KEY, STATS_VERSION, plusAdventure(loadAdventure(), delta));
  invalidate();
}

/** Throws the numbers away. */
export function resetAdventure(): void {
  removeStored(STATS_KEY);
  invalidate();
}

/**
 * Subscribes to changed numbers.
 *
 * @param onChange - called when they may have changed
 * @returns the unsubscribe function
 */
export function subscribeAdventure(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", invalidate);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", invalidate);
  };
}

/**
 * The numbers in the browser.
 *
 * @returns a stable snapshot until something changes
 */
export function getAdventureSnapshot(): AdventureStats {
  cache ??= loadAdventure();
  return cache;
}

/**
 * The numbers during prerender.
 *
 * @returns nothing counted
 */
export function getServerAdventureSnapshot(): AdventureStats {
  return EMPTY_ADVENTURE;
}

/**
 * The saved game, if there is one.
 *
 * @returns the save or null
 */
export function loadSave(): SaveData | null {
  const current = readStored(SAVE_KEY, SAVE_VERSION, isSaveData);
  const second =
    current === null
      ? readStored(SAVE_KEY, SAVE_VERSION_V2, isSaveDataV2)
      : null;
  const first =
    current === null && second === null
      ? readStored(SAVE_KEY, SAVE_VERSION_V1, isSaveDataV1)
      : null;
  let save = current;
  if (second !== null) {
    save = migrateSave(second);
  } else if (first !== null) {
    save = migrateSave(migrateSaveV1(first));
  }
  return save;
}

/**
 * Stores the running game.
 *
 * @param save - what to keep
 */
export function writeSave(save: SaveData): void {
  writeStored(SAVE_KEY, SAVE_VERSION, save);
}

/** Forgets the saved game. */
export function clearSave(): void {
  removeStored(SAVE_KEY);
}

/** A game saved by hand, and when. */
export type SavedSlot = {
  /** When it was saved, ms since 1970. */
  readonly at: number;
  readonly save: SaveData;
};

/**
 * The game saved by hand, if there is one - apart from the autosave.
 *
 * @returns the slot or null
 */
export function loadSlot(): SavedSlot | null {
  const current = readStored(SLOT_KEY, SLOT_VERSION, isSavedSlot);
  const old =
    current === null ? readStored(SLOT_KEY, SLOT_VERSION_V1, isOldSlot) : null;
  return (
    current ?? (old === null ? null : { ...old, save: migrateSave(old.save) })
  );
}

/**
 * Saves the game by hand.
 *
 * @param slot - what to keep, and when
 */
export function writeSlot(slot: SavedSlot): void {
  writeStored(SLOT_KEY, SLOT_VERSION, slot);
}

/**
 * Whether the sound was switched off last time.
 *
 * @returns true when muted
 */
export function loadMuted(): boolean {
  return readStored(MUTED_KEY, MUTED_VERSION, isBoolean) ?? false;
}

/**
 * Remembers the sound switch.
 *
 * @param muted - true when off
 */
export function saveMuted(muted: boolean): void {
  writeStored(MUTED_KEY, MUTED_VERSION, muted);
}

/**
 * Whether the plain pixel art was chosen last time instead of the finer art.
 *
 * @returns true for the plain pixels
 */
export function loadPixelGraphics(): boolean {
  return readStored(GRAPHICS_KEY, GRAPHICS_VERSION, isBoolean) ?? false;
}

/**
 * Remembers the graphics switch.
 *
 * @param pixel - true for the plain pixel art, false for the finer art
 */
export function savePixelGraphics(pixel: boolean): void {
  writeStored(GRAPHICS_KEY, GRAPHICS_VERSION, pixel);
}

/** Reads the numbers from storage. */
function loadAdventure(): AdventureStats {
  return (
    readStored(STATS_KEY, STATS_VERSION, isAdventureStats) ?? EMPTY_ADVENTURE
  );
}

/** Drops the snapshot and tells every listener. */
function invalidate(): void {
  cache = null;
  for (const listener of listeners) {
    listener();
  }
}

/** A game saved by hand. */
function isSavedSlot(value: unknown): value is SavedSlot {
  const slot = value as SavedSlot | null;
  return (
    typeof slot === "object" &&
    slot !== null &&
    typeof slot.at === "number" &&
    isSaveData(slot.save)
  );
}

/** A game saved by hand before version 3 of the save. */
type OldSlot = {
  readonly at: number;
  readonly save: SaveDataV2;
};

/** A game saved by hand before version 3 of the save. */
function isOldSlot(value: unknown): value is OldSlot {
  const slot = value as OldSlot | null;
  return (
    typeof slot === "object" &&
    slot !== null &&
    typeof slot.at === "number" &&
    isSaveDataV2(slot.save)
  );
}

/** A true or false. */
function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}
