/**
 * "Murdoku" online page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MurdokuOnlineScreen } from "@/games/murdoku/components/murdoku-online";

export const metadata: Metadata = {
  title: "Murdoku online",
  description:
    "Ein Kriminalrätsel gemeinsam lösen - alle auf derselben Karte, jede:r am eigenen Gerät.",
};

/**
 * Renders the "Murdoku" online page.
 *
 * @returns the page element
 */
export default function MurdokuOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MurdokuOnlineScreen />
    </main>
  );
}
