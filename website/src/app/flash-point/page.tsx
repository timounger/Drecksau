/**
 * Flash Point - the call-out against the computer starts right here.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { FlashPointGame } from "@/games/flash-point/components/flash-point-game";

export const metadata: Metadata = {
  title: "Flash Point",
  description: "Rettet die Opfer aus dem brennenden Haus.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function FlashPointPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <FlashPointGame />
    </main>
  );
}
