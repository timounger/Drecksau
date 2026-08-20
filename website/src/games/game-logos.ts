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
import panzerkiste from "./panzerkiste/assets/logo.webp";
import krakel from "./krakel/assets/logo.webp";
import skyjo from "./skyjo/assets/logo.webp";
import rvThereYet from "./rv-there-yet/assets/logo.webp";
import politik from "./politik/assets/logo.webp";
import camelUp from "./camel-up/assets/logo.webp";
import kuhleKuehe from "./kuhle-kuehe/assets/logo.webp";
import theMind from "./the-mind/assets/logo.webp";
import qwixx from "./qwixx/assets/logo.webp";
import heckmeck from "./heckmeck/assets/logo.webp";
import kniffel from "./kniffel/assets/logo.webp";
import jammerlappen from "./jammerlappen/assets/logo.webp";
import explodingKittens from "./exploding-kittens/assets/logo.webp";
import codenames from "./codenames/assets/logo.webp";
import flip7 from "./flip-7/assets/logo.webp";

/** One cover logo per game. */
export const GAME_LOGOS: Readonly<Record<GameId, StaticImageData>> = {
  drecksau,
  binokel,
  panzerkiste,
  krakel,
  skyjo,
  "rv-there-yet": rvThereYet,
  politik,
  "camel-up": camelUp,
  "kuhle-kuehe": kuhleKuehe,
  "the-mind": theMind,
  qwixx,
  heckmeck,
  kniffel,
  jammerlappen,
  "exploding-kittens": explodingKittens,
  codenames,
  "flip-7": flip7,
};
