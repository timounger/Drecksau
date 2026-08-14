/**
 * Online Heckmeck page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { HeckmeckOnlineScreen } from "@/games/heckmeck/components/heckmeck-online";

export const metadata: Metadata = {
  title: "Heckmeck - Online",
  description: "Heckmeck am Bratwurmeck online mit Freunden spielen.",
};

/**
 * Renders the online page.
 *
 * @returns the page element
 */
export default function HeckmeckOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <HeckmeckOnlineScreen />
    </main>
  );
}
