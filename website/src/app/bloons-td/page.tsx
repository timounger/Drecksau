/**
 * Die Seite von Bloons TD.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BloonsGame } from "@/games/bloons-td/components/bloons-game";

export const metadata: Metadata = {
  title: "Bloons TD",
  description: "Türme bauen, Ballons zerstechen - jede Runde wird es mehr.",
};

/**
 * Rendert die Spielseite.
 *
 * @returns die Seite
 */
export default function BloonsTdPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <BloonsGame />
    </main>
  );
}
