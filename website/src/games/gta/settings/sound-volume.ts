/**
 * How loud this game is, remembered between visits.
 *
 * @module
 * @remarks
 * **One knob for everything the game makes**: the car radio and the noises -
 * a door shutting and whatever comes after it. Two sliders for one car would
 * be two sliders to find. Its own key, and the same shape as Panzerkiste's,
 * which is the point: somebody who has found the slider in one game on this
 * site has found it in all of them. Nought is mute, and mute is a position on
 * the slider rather than a second switch somewhere else.
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
 * How loud it is before anybody touches it.
 *
 * @remarks
 * A little over half: loud enough to notice the first time a door shuts,
 * quiet enough that the first time is not the last time.
 */
export const DEFAULT_VOLUME = 0.55;

/** The remembered volume of everything this game plays. */
export const gameVolume: VolumeStore = createVolumeStore(
  storageKey("gta", "sound-volume"),
  DEFAULT_VOLUME,
);
