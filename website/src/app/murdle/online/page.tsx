/**
 * "Murdle" online page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { MurdleOnlineScreen } from "@/games/murdle/components/murdle-online";

export const metadata: Metadata = {
  title: "Murdle online",
  description:
    "Einen Kriminalfall gemeinsam lösen - alle im selben Deduktionsraster, jede:r am eigenen Gerät.",
};

/**
 * Renders the "Murdle" online page.
 *
 * @returns the page element
 */
export default function MurdleOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <MurdleOnlineScreen />
    </main>
  );
}
