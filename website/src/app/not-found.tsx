/**
 * The page shown when an address leads nowhere.
 *
 * @module
 * @remarks
 * A dead end needs one thing above all: a way out. The default page of the
 * framework offers none - it says what happened and leaves the reader on a
 * blank page with the back button as their only idea. So this one is a
 * signpost, and the way back to the collection is the biggest thing on it.
 *
 * Rendered inside the root layout, so header, theme and font are the site's
 * own. In the static export it becomes `out/404.html`, which is the file a web
 * server reaches for when nothing matches.
 */
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  description: "Diese Adresse gibt es nicht - zurück zur Spielesammlung.",
};

/**
 * Renders the 404 page.
 *
 * @returns the page element
 */
export default function NotFound(): ReactElement {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-center dark:bg-zinc-950">
      <p
        aria-hidden
        className="text-7xl font-black text-zinc-300 tabular-nums dark:text-zinc-700"
      >
        404
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Diese Seite gibt es nicht</h1>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Vielleicht ein Tippfehler in der Adresse, vielleicht ein alter Link.
          Die Spiele stehen alle auf der Startseite.
        </p>
      </div>
      <Link
        href="/"
        data-testid="not-found-home"
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Zurück zur Spielesammlung
      </Link>
    </main>
  );
}
