/**
 * The photo points: posts with a camera at ten beautiful places. The talk
 * key takes a photo - the screen keeps a small picture of the view for the
 * album - with a flash and a click; every place counts once for the album.
 *
 * @module
 * @remarks
 * The simulation knows no canvas: it only asks for a photo
 * (`World.extras.shot`), the screen takes it after the next picture and
 * keeps it apart from the save (`storage/album-store.ts`). Which places are
 * done is saved as `progress.photos`.
 */
import { EXTRA_TEXTS } from "@/games/weihnachtsmann/i18n/texts";
import { collect } from "./achievements";
import { noteTask } from "./daily";
import { say } from "./effects";
import { PHOTO_POINTS } from "./extras-data";
import type { Character, GameState, Spot } from "./types";

/** How long the flash shows, seconds. */
export const FLASH_SECONDS = 0.35;

/**
 * The talk key at a photo post: a photo of the view.
 *
 * @param state - the game
 * @param char - who takes it
 * @param spot - the post
 */
export function takePhoto(state: GameState, char: Character, spot: Spot): void {
  const point = PHOTO_POINTS.find(
    (candidate) =>
      candidate.area === char.area &&
      candidate.tx === spot.tx &&
      candidate.ty === spot.ty,
  );
  if (point !== undefined) {
    const fresh = !state.progress.photos.has(point.id);
    state.world.extras.shot = { id: point.id };
    state.world.extras.flash = FLASH_SECONDS;
    state.sounds.push("shutter");
    collect(state, "photos", point.id);
    noteTask(state, char, "photo");
    say(
      char,
      fresh
        ? EXTRA_TEXTS.photoNew
            .replace("{n}", String(state.progress.photos.size))
            .replace("{of}", String(PHOTO_POINTS.length))
        : EXTRA_TEXTS.photoAgain,
    );
  }
}
