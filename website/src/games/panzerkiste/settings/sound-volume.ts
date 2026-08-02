/**
 * How loud Panzerkiste's own sounds are, remembered between visits.
 *
 * @module
 * @remarks
 * Only the game's noises - shots, engines, blasts. The voice chat has its own
 * knob in {@link ../../../online/voice-volume}: turning the tanks down must not
 * turn your partner down too, so the two never share a store.
 *
 * localStorage does not exist during the prerender, so the value may only be
 * read after hydration - which is what the external store is for.
 */
import { storageKey } from "@/lib/storage/local-store";
import {
  createVolumeStore,
  type VolumeStore,
} from "@/lib/storage/volume-store";

/**
 * How loud it is before anybody touches it: half.
 *
 * @remarks
 * Not full: a game that comes in at full blast the first time you open it is a
 * game you turn off, not down.
 */
export const DEFAULT_VOLUME = 0.5;

/** The remembered volume of the game's own sounds. */
export const gameVolume: VolumeStore = createVolumeStore(
  storageKey("panzerkiste", "sound-volume"),
  DEFAULT_VOLUME,
);
