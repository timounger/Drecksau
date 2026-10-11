/**
 * The key words of a clue, set in bold as the printed pages do: what the
 * clue is about - where, beside what, with whom - so it reads at a glance.
 *
 * @module
 */
import { GROUNDS } from "@/games/murdoku/engine/catalog";
import { thingDef } from "@/games/murdoku/engine/rules";
import type { Level } from "@/games/murdoku/engine/types";
import { TRAIT_NAMES } from "@/games/murdoku/i18n/texts";

/** A piece of a clue's text, and whether it is set in bold. */
export type TextPart = { readonly text: string; readonly strong: boolean };

/**
 * The words that say how and where - bold in every case, as on the pages.
 * Phrases come first, so "allein mit" is bold as a whole.
 */
const KEY_WORDS: readonly string[] = [
  "allein mit",
  "zusammen mit",
  "einzige Person",
  "einzigen Person",
  "neben",
  "allein",
  "nicht",
  "kein",
  "keine",
  "keinem",
  "keinen",
  "keiner",
  "nördlich",
  "südlich",
  "östlich",
  "westlich",
  "nordöstlich",
  "nordwestlich",
  "südöstlich",
  "südwestlich",
  "nördlichsten",
  "südlichsten",
  "östlichsten",
  "westlichsten",
  "obersten",
  "untersten",
  "ersten",
  "zweiten",
  "dritten",
  "vierten",
  "fünften",
  "sechsten",
  "siebten",
  "achten",
  "neunten",
  "zehnten",
  "letzten",
  "vorletzten",
  "Wand",
  "Wänden",
  "gerade",
  "gerader",
  "ungerade",
  "ungerader",
  "direkt",
  "Reihe",
  "Reihen",
  "Spalte",
  "Spalten",
  "Ecke",
  "Bereich",
  "Bereichs",
  "Bereiche",
  "Bereichen",
  "Diagonale",
  "Opfer",
  "Mann",
  "Männer",
  "Männern",
  "Frau",
  "Frauen",
  // What the clues name by its kind, whatever the case calls it.
  "Baum",
  "Bäume",
  "Bäumen",
  "Pflanze",
  "Pflanzen",
  "Tier",
  "Tiere",
  "Tieren",
  "Felsblock",
  "Felsbrocken",
  "Stühle",
  "Stühlen",
  "Fenster",
  "Insel",
  "Inseln",
  "Zeile",
  "Zeilen",
  "Raum",
  "Raumes",
  "Räume",
  "Räumen",
  "leer",
  "leere",
  "leeren",
  "Bürobesitzer",
  "Bürobesitzerin",
  "Bürobesitzern",
];

/** How a word may end beyond a thing's name and still be it: "Kisten", "Regals". */
const ENDING = "[a-zäöüß]{0,3}";

/** A ground's name may begin a longer word: "Sandkachel", "Wasserfeld". */
const COMPOUND = "[a-zäöüß]*";

/** A word joined on with a hyphen belongs to it: "Bonsai-Ausstellung". */
const JOINED = "(?:-\\p{L}+)*";

/** The words that only lead into an area's name: "im", "in der", "auf dem" ... */
const LEAD =
  /^(?:(?:im|in|am|an|auf|beim|bei|zum|zur|der|die|das|dem|den)\s+)+/iu;

/**
 * Escapes a word for use in a regular expression.
 *
 * @param word - the word
 * @returns it, safe to put into a pattern
 */
function escape(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/**
 * The words worth bold in one case: the key words, the names of its things,
 * grounds and areas, its suspects' names and their kinds.
 *
 * @param level - the case
 * @returns the patterns, longest first
 */
function patternsOf(level: Level): readonly string[] {
  const grounds = new Set<string>();
  for (const id of Object.values(level.grounds ?? {})) {
    grounds.add(GROUNDS[id]?.name ?? "");
  }
  for (const area of level.areas) {
    grounds.add(GROUNDS[area.ground]?.name ?? "");
  }
  const words = new Set<string>(KEY_WORDS.map(escape));
  for (const id of Object.values(level.things)) {
    words.add(`${escape(thingDef(level, id).name)}${ENDING}`);
  }
  for (const name of grounds) {
    if (name !== "") {
      words.add(`${escape(name)}${COMPOUND}`);
    }
  }
  for (const area of level.areas) {
    words.add(escape(area.name));
    words.add(escape(area.at.replace(LEAD, "")));
  }
  for (const suspect of level.suspects) {
    words.add(escape(suspect.name));
    for (const trait of suspect.traits ?? []) {
      // The trait's word without its picture: "Besucher", "Adlig".
      const word = (TRAIT_NAMES[trait] ?? "").split(" ").at(-1) ?? "";
      if (word !== "") {
        words.add(`${escape(word)}${ENDING}`);
      }
    }
  }
  return [...words].toSorted((one, other) => other.length - one.length);
}

/**
 * A text written with its bold parts marked: "Er war **neben** dem Tisch."
 *
 * @param text - the text with its marks
 * @returns its parts
 */
function marked(text: string): readonly TextPart[] {
  return text
    .split("**")
    .map((part, at) => ({ text: part, strong: at % 2 === 1 }))
    .filter((part) => part.text !== "");
}

/**
 * A clue's text in parts, its key words in bold. A text that marks its own
 * bold words with `**` keeps exactly those.
 *
 * @param level - the case the clue belongs to
 * @param text - the clue
 * @returns the parts, plain and bold, in order
 */
export function emphasise(level: Level, text: string): readonly TextPart[] {
  if (text.includes("**")) {
    return marked(text);
  }
  const pattern = new RegExp(
    `(?<![\\p{L}-])(?:${patternsOf(level).join("|")})${JOINED}(?![\\p{L}])`,
    "gu",
  );
  const parts: TextPart[] = [];
  let from = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index;
    if (at > from) {
      parts.push({ text: text.slice(from, at), strong: false });
    }
    parts.push({ text: match[0], strong: true });
    from = at + match[0].length;
  }
  if (from < text.length) {
    parts.push({ text: text.slice(from), strong: false });
  }
  return parts;
}

/**
 * A text without its bold marks, for where only plain words go.
 *
 * @param text - the text, maybe with marks
 * @returns the words alone
 */
export function plain(text: string): string {
  return text.replaceAll("**", "");
}
