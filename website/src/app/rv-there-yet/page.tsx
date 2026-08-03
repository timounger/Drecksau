/**
 * "RV There Yet?" game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { RvThereYetGame } from "@/games/rv-there-yet/components/rv-there-yet-game";

export const metadata: Metadata = {
  title: "RV There Yet?",
  description:
    "Bring das Wohnmobil über den Berg - notfalls mit der Seilwinde.",
};

/**
 * Renders the "RV There Yet?" game page.
 *
 * @returns the page element
 */
export default function RvThereYetPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <RvThereYetGame />
    </main>
  );
}
