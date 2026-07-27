/**
 * The German terms a drawer may be asked to picture.
 *
 * @module
 * @remarks
 * Everyday, drawable nouns - concrete enough to guess from a scribble. Kept as
 * one flat list; the round picks from it with the seeded generator so every
 * client agrees on the word without it crossing the wire in the clear.
 */
import { randomInt, type Random } from "./random";

/** All terms, in no particular order. */
export const KRAKEL_WORDS: readonly string[] = [
  "Haus",
  "Baum",
  "Auto",
  "Katze",
  "Hund",
  "Sonne",
  "Mond",
  "Stern",
  "Blume",
  "Fisch",
  "Vogel",
  "Herz",
  "Krone",
  "Schlange",
  "Elefant",
  "Giraffe",
  "Pinguin",
  "Schmetterling",
  "Marienkäfer",
  "Schnecke",
  "Biene",
  "Rakete",
  "Roboter",
  "Fahrrad",
  "Zug",
  "Schiff",
  "Flugzeug",
  "Hubschrauber",
  "Regenschirm",
  "Brille",
  "Hut",
  "Schuh",
  "Gitarre",
  "Trompete",
  "Buch",
  "Schlüssel",
  "Uhr",
  "Kerze",
  "Geschenk",
  "Ballon",
  "Drachen",
  "Schneemann",
  "Leuchtturm",
  "Burg",
  "Brücke",
  "Windmühle",
  "Kaktus",
  "Pilz",
  "Apfel",
  "Banane",
  "Karotte",
  "Brezel",
  "Eis",
  "Kuchen",
  "Tasse",
  "Kanne",
  "Zahnbürste",
  "Schere",
  "Hammer",
  "Leiter",
  "Anker",
  "Vulkan",
  "Kürbis",
  "Krokodil",
  "Zebra",
  "Eule",
  "Frosch",
  "Krake",
  "Seepferdchen",
  "Dinosaurier",
];

/**
 * Picks a term not among the already used ones.
 *
 * @param random - the seeded generator to draw from
 * @param used - the terms already played this game
 * @returns a fresh term, or a repeat only once every term has been used
 * @remarks
 * Draws from the still-unused terms; if all have been used (a long game) it
 * falls back to the full list so the game never runs dry.
 */
export function pickWord(random: Random, used: readonly string[]): string {
  const pool = KRAKEL_WORDS.filter((word) => !used.includes(word));
  const source = pool.length > 0 ? pool : KRAKEL_WORDS;
  return source[randomInt(random, source.length)];
}
