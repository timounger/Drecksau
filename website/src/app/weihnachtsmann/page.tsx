/**
 * Weihnachtsmann & Co. KG - mit allen acht Figuren durch den Schnee.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { WeihnachtsmannGameScreen } from "@/games/weihnachtsmann/components/weihnachtsmann-game";

export const metadata: Metadata = {
  title: "Weihnachtsmann & Co. KG",
  description:
    "Weihnachtsmann, Elfen, Balbo und Rudolf im Schnee - wähle eine Figur, flieg mit Trixi oder verwandle Jordi in ein Tier.",
};

/**
 * Renders the game page.
 *
 * @returns the page
 */
export default function WeihnachtsmannPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <WeihnachtsmannGameScreen />
    </main>
  );
}
