/**
 * GTA - Los Santos von oben.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { GtaScreen } from "@/games/gta/components/gta-game";
import { splashes, stations, tunes } from "@/games/gta/media/folders";

export const metadata: Metadata = {
  title: "GTA",
  description:
    "Top-Down-Stadtspiel: fahren, liefern, ueberfallen und der Polizei entkommen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 * @remarks
 * **The folders are read here**, on the server, and handed to the screen as
 * plain lists - see ../../games/gta/media/folders. The pictures behind the
 * loading bar, the songs over it and the stations in the cars are all files
 * somebody dropped into a folder, and not one of their names is in the code.
 */
export default function GtaPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <GtaScreen splashes={splashes()} stations={stations()} tunes={tunes()} />
    </main>
  );
}
