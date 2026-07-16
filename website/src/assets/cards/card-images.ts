/**
 * The artwork of the cards and pigs.
 *
 * @module
 * @remarks
 * Imported statically on purpose: that way the bundler rewrites the URLs with
 * the `basePath` the site runs under, a wrong file name breaks the build
 * instead of showing a broken image, and `next/image` knows the size without
 * being told. See the README next to this file.
 */
import type { StaticImageData } from "next/image";
import type { ActionCardType } from "@/game/cards";
import barnDoor from "./barn-door.png";
import barn from "./barn.png";
import farmerScrubs from "./farmer-scrubs.png";
import lightningRod from "./lightning-rod.png";
import lightning from "./lightning.png";
import mud from "./mud.png";
import pigClean from "./pig-clean.png";
import pigDirty from "./pig-dirty.png";
import rain from "./rain.png";

/** Artwork of every action card. Portrait, roughly 2:3. */
export const CARD_IMAGES: Readonly<Record<ActionCardType, StaticImageData>> = {
  mud,
  rain,
  barn,
  lightning,
  lightningRod,
  farmerScrubs,
  barnDoor,
};

/** Artwork of the two pig sides. Landscape, roughly 8:5. */
export const PIG_IMAGES: Readonly<Record<"clean" | "dirty", StaticImageData>> =
  {
    clean: pigClean,
    dirty: pigDirty,
  };

/**
 * Aspect ratio of an action card, as a CSS ratio.
 *
 * @remarks
 * The files differ slightly (0.60 to 0.65), so every card is drawn into a box
 * of this ratio with `object-contain` - that keeps the row of cards even
 * without distorting anyone's artwork.
 */
export const CARD_ASPECT = "5 / 8";

/** Aspect ratio of a pig card, as a CSS ratio. */
export const PIG_ASPECT = "8 / 5";
