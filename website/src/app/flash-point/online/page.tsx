/**
 * Flash Point online - one crew, several devices, one fire.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { FlashPointOnlineScreen } from "@/games/flash-point/components/flash-point-online";

export const metadata: Metadata = {
  title: "Flash Point online",
  description: "Gemeinsam löschen - jede:r am eigenen Gerät.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function FlashPointOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <FlashPointOnlineScreen />
    </main>
  );
}
