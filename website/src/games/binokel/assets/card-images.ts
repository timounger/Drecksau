/**
 * The card artwork, keyed by suit and rank.
 *
 * @module
 * @remarks
 * Imported statically so the bundler rewrites the URLs with the site's basePath
 * and a wrong file name breaks the build instead of showing a broken image.
 * Both copies of a card share one picture. The files here are plain placeholders
 * - drop the real WebP artwork in `./cards/` under the same names to replace it.
 */
import type { StaticImageData } from "next/image";
import type { Rank, Suit } from "@/games/binokel/engine/cards";

import eichelDaus from "./cards/eichel-daus.webp";
import eichelZehn from "./cards/eichel-zehn.webp";
import eichelKoenig from "./cards/eichel-koenig.webp";
import eichelOber from "./cards/eichel-ober.webp";
import eichelUnter from "./cards/eichel-unter.webp";
import eichelSieben from "./cards/eichel-sieben.webp";

import blattDaus from "./cards/blatt-daus.webp";
import blattZehn from "./cards/blatt-zehn.webp";
import blattKoenig from "./cards/blatt-koenig.webp";
import blattOber from "./cards/blatt-ober.webp";
import blattUnter from "./cards/blatt-unter.webp";
import blattSieben from "./cards/blatt-sieben.webp";

import herzDaus from "./cards/herz-daus.webp";
import herzZehn from "./cards/herz-zehn.webp";
import herzKoenig from "./cards/herz-koenig.webp";
import herzOber from "./cards/herz-ober.webp";
import herzUnter from "./cards/herz-unter.webp";
import herzSieben from "./cards/herz-sieben.webp";

import schellenDaus from "./cards/schellen-daus.webp";
import schellenZehn from "./cards/schellen-zehn.webp";
import schellenKoenig from "./cards/schellen-koenig.webp";
import schellenOber from "./cards/schellen-ober.webp";
import schellenUnter from "./cards/schellen-unter.webp";
import schellenSieben from "./cards/schellen-sieben.webp";

import cardBack from "./cards/back.webp";

/** Artwork of every card, by suit and rank. */
export const CARD_IMAGES: Readonly<
  Record<Suit, Readonly<Record<Rank, StaticImageData>>>
> = {
  eichel: {
    daus: eichelDaus,
    zehn: eichelZehn,
    koenig: eichelKoenig,
    ober: eichelOber,
    unter: eichelUnter,
    sieben: eichelSieben,
  },
  blatt: {
    daus: blattDaus,
    zehn: blattZehn,
    koenig: blattKoenig,
    ober: blattOber,
    unter: blattUnter,
    sieben: blattSieben,
  },
  herz: {
    daus: herzDaus,
    zehn: herzZehn,
    koenig: herzKoenig,
    ober: herzOber,
    unter: herzUnter,
    sieben: herzSieben,
  },
  schellen: {
    daus: schellenDaus,
    zehn: schellenZehn,
    koenig: schellenKoenig,
    ober: schellenOber,
    unter: schellenUnter,
    sieben: schellenSieben,
  },
};

/** The back of a card, for face-down piles. */
export const CARD_BACK: StaticImageData = cardBack;

/**
 * Aspect ratio the cards are drawn at - matches the artwork (130 x 230).
 *
 * @remarks
 * Keep this in step with the image files, or `object-contain` letterboxes them.
 */
export const CARD_ASPECT = "13 / 23";
