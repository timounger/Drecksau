/**
 * Online page of "Das politische Talent".
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { PolitikOnlineScreen } from "@/games/politik/components/politik-online";

export const metadata: Metadata = {
  title: "Das politische Talent - Online",
  description: "Das politische Talent online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function PolitikOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <PolitikOnlineScreen />
    </main>
  );
}
