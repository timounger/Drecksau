/**
 * Kniffel - Online page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { KniffelOnlineScreen } from "@/games/kniffel/components/kniffel-online";

export const metadata: Metadata = {
  title: "Kniffel - Online",
  description: "Kniffel online mit Freunden spielen.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function Page(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <KniffelOnlineScreen />
    </main>
  );
}
