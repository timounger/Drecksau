/**
 * The artwork of the cards and pigs, per design theme.
 *
 * @module
 * @remarks
 * Imported statically on purpose: that way the bundler rewrites the URLs with
 * the `basePath` the site runs under, a wrong file name breaks the build
 * instead of showing a broken image, and `next/image` knows the size without
 * being told. See the README next to this file.
 *
 * Every theme is a folder with the same file names, so a new design is a new
 * folder plus one block of imports here - nothing else changes.
 */
import type { StaticImageData } from "next/image";
import type { ActionCardType } from "@/game/cards";
import type { CardTheme } from "./themes";

import barnDoorModern from "./modern/barn-door.webp";
import barnModern from "./modern/barn.webp";
import beautyModern from "./modern/beauty.webp";
import dustOffModern from "./modern/dust-off.webp";
import extraMudModern from "./modern/extra-mud.webp";
import farmerScrubsModern from "./modern/farmer-scrubs.webp";
import lightningRodModern from "./modern/lightning-rod.webp";
import lightningModern from "./modern/lightning.webp";
import lipstickModern from "./modern/lipstick.webp";
import luckyBirdModern from "./modern/lucky-bird.webp";
import mudModern from "./modern/mud.webp";
import pigCleanModern from "./modern/pig-clean.webp";
import pigDirtyModern from "./modern/pig-dirty.webp";
import rainModern from "./modern/rain.webp";

import barnDoorKlassisch from "./klassisch/barn-door.webp";
import barnKlassisch from "./klassisch/barn.webp";
import beautyKlassisch from "./klassisch/beauty.webp";
import dustOffKlassisch from "./klassisch/dust-off.webp";
import extraMudKlassisch from "./klassisch/extra-mud.webp";
import farmerScrubsKlassisch from "./klassisch/farmer-scrubs.webp";
import lightningRodKlassisch from "./klassisch/lightning-rod.webp";
import lightningKlassisch from "./klassisch/lightning.webp";
import lipstickKlassisch from "./klassisch/lipstick.webp";
import luckyBirdKlassisch from "./klassisch/lucky-bird.webp";
import mudKlassisch from "./klassisch/mud.webp";
import pigCleanKlassisch from "./klassisch/pig-clean.webp";
import pigDirtyKlassisch from "./klassisch/pig-dirty.webp";
import rainKlassisch from "./klassisch/rain.webp";

/** Artwork of every action card in one theme. */
type CardImageSet = Readonly<Record<ActionCardType, StaticImageData>>;

/** Artwork of the pig sides in one theme. */
type PigImageSet = Readonly<
  Record<"clean" | "dirty" | "beauty", StaticImageData>
>;

const MODERN_CARDS: CardImageSet = {
  mud: mudModern,
  rain: rainModern,
  barn: barnModern,
  lightning: lightningModern,
  lightningRod: lightningRodModern,
  farmerScrubs: farmerScrubsModern,
  barnDoor: barnDoorModern,
  beauty: beautyModern,
  dustOff: dustOffModern,
  luckyBird: luckyBirdModern,
  extraMud: extraMudModern,
  lipstick: lipstickModern,
};

const KLASSISCH_CARDS: CardImageSet = {
  mud: mudKlassisch,
  rain: rainKlassisch,
  barn: barnKlassisch,
  lightning: lightningKlassisch,
  lightningRod: lightningRodKlassisch,
  farmerScrubs: farmerScrubsKlassisch,
  barnDoor: barnDoorKlassisch,
  beauty: beautyKlassisch,
  dustOff: dustOffKlassisch,
  luckyBird: luckyBirdKlassisch,
  extraMud: extraMudKlassisch,
  lipstick: lipstickKlassisch,
};

/**
 * Artwork of every action card, by theme.
 *
 * @remarks
 * The Schönsau is the very same file as the hand card: in the real game it is
 * one landscape card that does both jobs - you hold it, then you lay it on a
 * pig. So it is drawn landscape in both places.
 */
export const CARD_IMAGES_BY_THEME: Readonly<Record<CardTheme, CardImageSet>> = {
  modern: MODERN_CARDS,
  klassisch: KLASSISCH_CARDS,
};

/** Artwork of the pig sides, by theme. */
export const PIG_IMAGES_BY_THEME: Readonly<Record<CardTheme, PigImageSet>> = {
  modern: {
    clean: pigCleanModern,
    dirty: pigDirtyModern,
    beauty: beautyModern,
  },
  klassisch: {
    clean: pigCleanKlassisch,
    dirty: pigDirtyKlassisch,
    beauty: beautyKlassisch,
  },
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
 * Theme independent - both designs share the same shapes. Almost every card is
 * portrait; the Schönsau is landscape because it doubles as the card laid onto
 * a pig, and it is shown that way here too rather than letterboxed.
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
  extraMud: CARD_ASPECT,
  lipstick: CARD_ASPECT,
};
