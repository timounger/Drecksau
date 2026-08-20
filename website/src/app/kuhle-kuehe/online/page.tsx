/**
 * Online Kuhle Kühe page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KuhleKueheOnlineScreen } from "@/games/kuhle-kuehe/components/kuhle-kuehe-online";

export const metadata: Metadata = {
  title: "Kuhle Kühe - Online",
  description: "Kuhle Kühe online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function KuhleKueheOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KuhleKueheOnlineScreen />
    </main>
  );
}
