/**
 * Online Qwixx page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { QwixxOnlineScreen } from "@/games/qwixx/components/qwixx-online";

export const metadata: Metadata = {
  title: "Qwixx - Online",
  description: "Qwixx online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function QwixxOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <QwixxOnlineScreen />
    </main>
  );
}
