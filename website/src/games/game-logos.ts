/**
 * The cover logo shown for each game on the overview page.
 *
 * @module
 * @remarks
 * Imported statically so the bundler rewrites the URLs with the site's basePath
 * and a wrong file name breaks the build instead of showing a broken image. The
 * files here are plain placeholders (a coloured tile with the emoji and name) -
 * drop the real WebP artwork in the game's `assets/logo.webp` to replace it.
 */
import type { StaticImageData } from "next/image";
import type { GameId } from "./registry";

import drecksau from "./drecksau/assets/logo.webp";
import binokel from "./binokel/assets/logo.webp";

/** One cover logo per game. */
export const GAME_LOGOS: Readonly<Record<GameId, StaticImageData>> = {
  drecksau,
  binokel,
};
