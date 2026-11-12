/**
 * Wurfduell - Online page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { WurfduellOnlineScreen } from "@/games/wurfduell/components/wurfduell-online";

export const metadata: Metadata = {
  title: "Wurfduell - Online",
  description:
    "Wurfduell online gegen einen zufälligen Gegner oder im privaten Raum.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <WurfduellOnlineScreen />
    </main>
  );
}
