/**
 * How loud the other players are in the voice chat, remembered between visits.
 *
 * @module
 * @remarks
 * Shared by every online game, like the voice chat itself: you set once how
 * loud people are and it holds wherever you play next.
 *
 * Separate from any game's own sound knob on purpose. Somebody who wants to
 * chat over a silent game must be able to have exactly that, and the other way
 * round.
 */
import { storageKey } from "@/lib/storage/local-store";
import {
  createVolumeStore,
  type VolumeStore,
} from "@/lib/storage/volume-store";

/**
 * How loud the others are before anybody touches it: fully.
 *
 * @remarks
 * Unlike the game's noises, which greet you at half: a voice you deliberately
 * unmuted for is one you want to hear, and a speech that arrives quiet reads as
 * a broken connection rather than as a setting.
 */
export const DEFAULT_VOICE_VOLUME = 1;

/** The remembered volume of everyone else's voice. */
export const voiceVolume: VolumeStore = createVolumeStore(
  storageKey("online", "voice-volume"),
  DEFAULT_VOICE_VOLUME,
);
