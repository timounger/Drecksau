/**
 * Hitster online - everybody hears the songs on their own device.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { HitsterOnlineScreen } from "@/games/hitster/components/hitster-online";

export const metadata: Metadata = {
  title: "Hitster online",
  description:
    "Hör den Song, schätz das Jahr - jede:r am eigenen Gerät, auf Wunsch mit Computer-Mitspielern.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function HitsterOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <HitsterOnlineScreen />
    </main>
  );
}
