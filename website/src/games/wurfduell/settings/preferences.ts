/**
 * What Wurfduell remembers between visits: the settings page (sound,
 * difficulty, camera, aiming dots) and the fighter last chosen.
 *
 * @module
 * @remarks
 * Kept as stored values so React reads them without breaking hydration - the
 * page is prerendered, and the first render must match the HTML that was made
 * without any storage at all.
 */
import { DIFFICULTIES, type Difficulty } from "@/games/wurfduell/engine/ai";
import { CHARACTER_IDS } from "@/games/wurfduell/engine/characters";
import type { CharacterId } from "@/games/wurfduell/engine/types";
import { storageKey } from "@/lib/storage/local-store";
import {
  createStoredValue,
  type StoredValue,
} from "@/lib/storage/stored-value";

/** Schema version of these small values. */
const VERSION = 1;

/** Whether the game's sounds are off. */
export const mutedSetting: StoredValue<boolean> = createStoredValue(
  storageKey("wurfduell", "muted"),
  VERSION,
  false,
  (value): value is boolean => typeof value === "boolean",
);

/** How good the computer is. */
export const difficultySetting: StoredValue<Difficulty> = createStoredValue(
  storageKey("wurfduell", "difficulty"),
  VERSION,
  "mittel" as Difficulty,
  (value): value is Difficulty => DIFFICULTIES.includes(value as Difficulty),
);

/** The fighter chosen last time, offered first next time. */
export const lastCharacterSetting: StoredValue<CharacterId> = createStoredValue(
  storageKey("wurfduell", "last-character"),
  VERSION,
  "koch" as CharacterId,
  (value): value is CharacterId => CHARACTER_IDS.includes(value as CharacterId),
);

/** How the camera behaves. */
export type CameraMode = "follow" | "overview";

/** Whether the camera follows the throw or shows the whole field. */
export const cameraSetting: StoredValue<CameraMode> = createStoredValue(
  storageKey("wurfduell", "camera"),
  VERSION,
  "follow" as CameraMode,
  (value): value is CameraMode => value === "follow" || value === "overview",
);

/** Whether the dotted start of the arc is shown while charging. */
export const aimDotsSetting: StoredValue<boolean> = createStoredValue(
  storageKey("wurfduell", "aim-dots"),
  VERSION,
  true,
  (value): value is boolean => typeof value === "boolean",
);
