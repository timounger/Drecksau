/**
 * What is lying in the game's folders, read when the site is built.
 *
 * @module
 * @remarks
 * **The folder is the list.** A browser cannot look inside a directory, so
 * something has to write down what is in it - and the obvious somethings are
 * both wrong: a number in the code means editing the code to add a picture,
 * and a hand-written list means editing the list. The pages that use these are
 * rendered on the server, so they can simply look, and the answer is baked
 * into the page when the site is built.
 *
 * Dropping a file into the folder is therefore the whole of adding one. What
 * it is called does not matter to the game; for music it matters to the credit,
 * which is read out of the file name.
 *
 * **With the sub-path in front of it**, and that is not a detail: on GitHub
 * Pages the site lives under `/<repo>/`, and an address that begins with `/`
 * points at the root of the domain there - which is to say at nothing. Next
 * puts the sub-path in front of what it knows about by itself: `next/link`,
 * `next/image` and imported files. An address assembled by hand inside a
 * `url(...)` is none of those, and that is exactly why the loading screen was
 * black everywhere but on one's own machine. See `basePath` in
 * ../../../../next.config.ts, which reads the same variable.
 *
 * **Server only.** This reads the disk, so it belongs to a page or a layout
 * and never to a component with `"use client"` at the top of it.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Every picture the loading screen may show.
 *
 * @returns one URL per file, in name order
 */
export function splashes(): readonly string[] {
  return folder(SPLASH_DIR, SPLASH_KINDS);
}

/**
 * Every song the car radio may play.
 *
 * @returns one URL per file, in name order
 */
export function stations(): readonly string[] {
  return folder(RADIO_DIR, MUSIC_KINDS);
}

/**
 * Every song that may play over the loading screen.
 *
 * @returns one URL per file, in name order
 * @remarks
 * Its own folder rather than the radio's, because the two are different jobs:
 * a station is something one drives to, and this is the overture. A song in
 * both folders would be both, which is allowed and nobody's business but the
 * person filling them.
 */
export function tunes(): readonly string[] {
  return folder(LOADING_DIR, MUSIC_KINDS);
}

/**
 * Every piece of music in the game, for the credit it has to carry.
 *
 * @returns the loading songs and then the stations
 * @remarks
 * **One list, because the licence asks one question.** Whether a song plays in
 * a car or over the bar is a question about the game; CC BY asks who wrote it,
 * and the answer is the same list either way.
 */
export function music(): readonly string[] {
  return [...tunes(), ...stations()];
}

/**
 * What is in one folder, as the browser would ask for it.
 *
 * @param dir - the folder under `public`
 * @param kinds - which endings count
 * @returns one URL per file, in name order
 */
function folder(dir: string, kinds: readonly string[]): readonly string[] {
  try {
    return readdirSync(join(process.cwd(), "public", dir))
      .filter((name) => kinds.some((kind) => name.endsWith(kind)))
      .sort()
      .map((name) => `${BASE_PATH}/${dir}/${encodeURIComponent(name)}`);
  } catch {
    // No folder, no files: the game is quiet or dark and nothing breaks.
    return [];
  }
}

/** The sub-path the site is served from, empty while it runs at the root. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Where the splash pictures live, under `public`. */
const SPLASH_DIR = "gta/splash";

/** And what counts as one. */
const SPLASH_KINDS = [".webp", ".avif", ".jpg", ".jpeg", ".png"];

/** Where the radio's songs live. */
const RADIO_DIR = "gta/radio";

/** And where the ones for the loading screen live. */
const LOADING_DIR = "gta/loading";

/** What counts as a song, in either folder. */
const MUSIC_KINDS = [".mp3", ".m4a", ".ogg", ".oga", ".opus", ".webm", ".wav"];
