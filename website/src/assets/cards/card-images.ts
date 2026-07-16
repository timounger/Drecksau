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
import beauty from "./beauty.png";
import dustOff from "./dust-off.png";
import farmerScrubs from "./farmer-scrubs.png";
import lightningRod from "./lightning-rod.png";
import lightning from "./lightning.png";
import luckyBird from "./lucky-bird.png";
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
  beauty,
  dustOff,
  luckyBird,
};

/**
 * Artwork of the pig sides. Landscape, roughly 8:5.
 *
 * @remarks
 * The Schönsau is the very same file as the hand card: in the real game it is
 * one landscape card that does both jobs - you hold it, then you lay it on a
 * pig. So it is drawn landscape in both places.
 */
export const PIG_IMAGES: Readonly<
  Record<"clean" | "dirty" | "beauty", StaticImageData>
> = {
  clean: pigClean,
  dirty: pigDirty,
  beauty,
};

/**
 * Aspect ratio of a portrait action card, as a CSS ratio.
 *
 * @remarks
 * The files differ slightly (0.60 to 0.65), so every card is drawn into a box
 * of this ratio with `object-contain` - that keeps the row of cards even
 * without distorting anyone's artwork.
 */
export const CARD_ASPECT = "5 / 8";

/** Aspect ratio of a pig card - and of the Schönsau, which covers one. */
export const PIG_ASPECT = "8 / 5";

/**
 * Aspect ratio of each card in the hand.
 *
 * @remarks
 * Almost every card is portrait. The Schönsau is the exception: it is printed
 * landscape because it doubles as the card laid onto a pig, and it is shown
 * that way here too rather than letterboxed into a portrait box.
 */
export const CARD_ASPECTS: Readonly<Record<ActionCardType, string>> = {
  mud: CARD_ASPECT,
  rain: CARD_ASPECT,
  barn: CARD_ASPECT,
  lightning: CARD_ASPECT,
  lightningRod: CARD_ASPECT,
  farmerScrubs: CARD_ASPECT,
  barnDoor: CARD_ASPECT,
  beauty: PIG_ASPECT,
  dustOff: CARD_ASPECT,
  luckyBird: CARD_ASPECT,
};
