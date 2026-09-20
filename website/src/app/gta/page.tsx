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
 */
function splashes(): readonly string[] {
  try {
    return readdirSync(join(process.cwd(), "public", SPLASH_DIR))
      .filter((name) => SPLASH_KINDS.some((kind) => name.endsWith(kind)))
      .sort()
      .map((name) => `/${SPLASH_DIR}/${name}`);
  } catch {
    // No folder, no pictures: the loading screen is dark and nothing breaks.
    return [];
  }
}

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
      <GtaScreen splashes={splashes()} />
    </main>
  );
}
