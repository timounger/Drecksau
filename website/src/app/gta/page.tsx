/**
 * GTA - Los Santos von oben.
 *
 * @module
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { GtaScreen } from "@/games/gta/components/gta-game";

export const metadata: Metadata = {
  title: "GTA",
  description:
    "Top-Down-Stadtspiel: fahren, liefern, ueberfallen und der Polizei entkommen.",
};

/**
 * Every picture in the splash folder, as the browser would ask for it.
 *
 * @returns one URL per file, in name order
 * @remarks
 * **The folder is the list.** A browser cannot look inside a directory, so
 * something has to write down what is in it - and the obvious somethings are
 * both wrong: a number in the code means editing the code to add a picture,
 * and a hand-written list means editing the list. This page is rendered on the
 * server, so it can simply look, and the answer is baked into the page when
 * the site is built.
 *
 * Dropping a file into `public/gta/splash/` is therefore the whole of adding
 * one. What it is called does not matter; the game picks one at random each
 * time it lays out a city.
 *
 * **With the sub-path in front of it**, and that is not a detail: on GitHub
 * Pages the site lives under `/<repo>/`, and an address that begins with `/`
 * points at the root of the domain there - which is to say at nothing. Next
 * puts the sub-path in front of what it knows about by itself: `next/link`,
 * `next/image` and imported files. An address assembled by hand inside a
 * `url(...)` is none of those, and that is exactly why the loading screen was
 * black everywhere but on one's own machine. See `basePath` in
 * ../../next.config.ts, which reads the same variable.
 */
function splashes(): readonly string[] {
  try {
    return readdirSync(join(process.cwd(), "public", SPLASH_DIR))
      .filter((name) => SPLASH_KINDS.some((kind) => name.endsWith(kind)))
      .sort()
      .map((name) => `${BASE_PATH}/${SPLASH_DIR}/${name}`);
  } catch {
    // No folder, no pictures: the loading screen is dark and nothing breaks.
    return [];
  }
}

/**
 * Every song in the radio folder, as the browser would ask for it.
 *
 * @returns one URL per file, in name order
 * @remarks
 * **The same trick as the splash pictures, and for the same reason.** The
 * folder is the station list: this page is rendered on the server, so it can
 * look inside `public/gta/radio/` and bake the answer into the page. Dropping
 * an mp3 in there is the whole of adding a station - no name of a file appears
 * anywhere in the code, and nothing has to be edited to add or remove one.
 *
 * With {@link BASE_PATH} in front, because on GitHub Pages the site lives
 * under `/<repo>/` and an address that starts with a slash points at nothing
 * there.
 */
function stations(): readonly string[] {
  try {
    return readdirSync(join(process.cwd(), "public", RADIO_DIR))
      .filter((name) => RADIO_KINDS.some((kind) => name.endsWith(kind)))
      .sort()
      .map((name) => `${BASE_PATH}/${RADIO_DIR}/${encodeURIComponent(name)}`);
  } catch {
    // No folder, no radio: the car is quiet and nothing breaks.
    return [];
  }
}

/** The sub-path the site is served from, empty while it runs at the root. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Where the songs live, under `public`. */
const RADIO_DIR = "gta/radio";

/** And what counts as one. */
const RADIO_KINDS = [".mp3", ".m4a", ".ogg", ".oga", ".opus", ".webm", ".wav"];

/** Where they live, under `public`. */
const SPLASH_DIR = "gta/splash";

/** And what counts as one. */
const SPLASH_KINDS = [".webp", ".avif", ".jpg", ".jpeg", ".png"];

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function GtaPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <GtaScreen splashes={splashes()} stations={stations()} />
    </main>
  );
}
