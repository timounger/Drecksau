/**
 * Whether what somebody typed names a song: its title and its artist.
 *
 * @module
 * @remarks
 * At the table the others decide whether "Bohemian Rapsody by Queen" counts.
 * Here a program has to, so it is lenient the way a table is: case, accents,
 * punctuation, "the" and whatever stands in brackets do not matter, and a
 * typo or two in a longer word is forgiven. For the artist, the main name is
 * enough - "Rihanna" for "Rihanna feat. Jay-Z".
 */
import type { Song } from "./songs";

/** Words that never decide anything. */
const FILLER: ReadonlySet<string> = new Set([
  "the",
  "a",
  "an",
  "der",
  "die",
  "das",
]);

/** From this length on, one wrong letter is forgiven; from twice that, two. */
const TYPO_LENGTH = 5;

/** The share of a title's words a guess must contain. */
const TITLE_SHARE = 0.75;

/**
 * Whether a guess names the song.
 *
 * @param song - the song
 * @param title - the title typed
 * @param artist - the artist typed
 * @returns true when both are right
 */
export function namesSong(song: Song, title: string, artist: string): boolean {
  return matchesTitle(song.title, title) && matchesArtist(song.artist, artist);
}

/** Whether a typed title is the song's. */
function matchesTitle(real: string, typed: string): boolean {
  const want = words(stripBrackets(real));
  const have = words(typed);
  const hits = want.filter((word) => have.some((one) => close(word, one)));
  return want.length > 0 && hits.length / want.length >= TITLE_SHARE;
}

/** Whether a typed artist is one of the song's. */
function matchesArtist(real: string, typed: string): boolean {
  const have = words(typed);
  // "A feat. B", "A & B", "A, B": any of them will do.
  const names = real
    .split(/\s+(?:feat\.?|ft\.?|&|and|und|x)\s+|,\s*/iu)
    .map((name) => words(name))
    .filter((name) => name.length > 0);
  return (
    have.length > 0 &&
    names.some((name) =>
      name.every((word) => have.some((one) => close(word, one))),
    )
  );
}

/** The text without anything in brackets: "Blue (Da Ba Dee)" is "Blue". */
function stripBrackets(text: string): string {
  const bare = text.replace(/\([^)]*\)/gu, " ").trim();
  return bare === "" ? text : bare;
}

/** The words of a text, plain: lower case, no accents, no punctuation. */
function words(text: string): readonly string[] {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/gu, " ")
    .split(/\s+/u)
    .filter((word) => word !== "" && !FILLER.has(word));
}

/** Whether two words are the same but for a typo or two. */
function close(want: string, have: string): boolean {
  const allowed =
    want.length >= TYPO_LENGTH * 2 ? 2 : want.length >= TYPO_LENGTH ? 1 : 0;
  return distance(want, have) <= allowed;
}

/** How many letters must change to turn one word into the other. */
function distance(one: string, other: string): number {
  let previous = Array.from({ length: other.length + 1 }, (unused, at) => at);
  for (let i = 1; i <= one.length; i++) {
    const row = [i];
    for (let j = 1; j <= other.length; j++) {
      const swap = one[i - 1] === other[j - 1] ? 0 : 1;
      row.push(
        Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + swap),
      );
    }
    previous = row;
  }
  return previous[other.length];
}
