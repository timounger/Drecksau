/**
 * The suit symbols, keyed by suit - shown on the trump-choice buttons.
 *
 * @module
 * @remarks
 * Imported statically so the bundler rewrites the URLs with the site's basePath
 * and a wrong file name breaks the build instead of showing a broken image. The
 * files here are plain placeholders (a coloured tile with the suit name) - drop
 * the real WebP artwork in `./suits/` under the same names to replace them.
 */
import type { StaticImageData } from "next/image";
import type { Suit } from "@/games/binokel/engine/cards";

import eichel from "./suits/eichel.webp";
import blatt from "./suits/blatt.webp";
import herz from "./suits/herz.webp";
import schellen from "./suits/schellen.webp";

/** One symbol per suit. */
export const SUIT_IMAGES: Readonly<Record<Suit, StaticImageData>> = {
  eichel,
  blatt,
  herz,
  schellen,
};
