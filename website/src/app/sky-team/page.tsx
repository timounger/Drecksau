/**
 * Sky Team - the landing against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SkyTeamGame } from "@/games/sky-team/components/sky-team-game";

export const metadata: Metadata = {
  title: "Sky Team",
  description: "Landet das Flugzeug zu zweit - hier gegen den Computer.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function SkyTeamPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <SkyTeamGame />
    </main>
  );
}
