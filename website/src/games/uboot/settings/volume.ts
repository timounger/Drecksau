/**
 * Zwei Regler: wie laut die Tiefe brummt und wie laut das Boot arbeitet.
 *
 * @module
 * @remarks
 * **Zwei Knöpfe und nicht einer**, anders als bei GTA und der Panzerkiste. Dort
 * gibt es eine Sorte Ton; hier laufen ein Dauerton und einzelne Geräusche
 * nebeneinander, und die beiden gehen einem unterschiedlich schnell auf die
 * Nerven. Wer das Brummen wegdreht, will meistens trotzdem hören, dass er
 * getroffen wurde.
 *
 * Form und Speicherort sind dieselben wie bei den anderen Spielen: Wer den
 * Regler in einem Spiel dieser Sammlung gefunden hat, hat ihn in allen
 * gefunden. Null ist stumm, und stumm ist eine Stellung des Reglers und kein
 * zweiter Schalter woanders.
 */
import { storageKey } from "@/lib/storage/local-store";
import {
  createVolumeStore,
  type VolumeStore,
} from "@/lib/storage/volume-store";

/**
 * Wie laut das Brummen der Tiefe ohne Zutun ist.
 *
 * @remarks
 * Leise: Es ist Grundierung und nicht Musik, und eine Grundierung, die man
 * bemerkt, ist zu laut.
 */
export const DEFAULT_MUSIC = 0.35;

/** Und wie laut die Geräusche sind, bevor jemand etwas verstellt. */
export const DEFAULT_SOUND = 0.55;

/** Der Dauerton der Tiefe. */
export const musicVolume: VolumeStore = createVolumeStore(
  storageKey("uboot", "music-volume"),
  DEFAULT_MUSIC,
);

/** Und alles, was das Boot und der Kurs von sich geben. */
export const soundVolume: VolumeStore = createVolumeStore(
  storageKey("uboot", "sound-volume"),
  DEFAULT_SOUND,
);
