/**
 * Online Dog page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DogOnlineScreen } from "@/games/dog/components/dog-online";

export const metadata: Metadata = {
  title: "Dog - Online",
  description: "Dog online zu viert spielen, zwei gegen zwei.",
};

/**
 * Renders the page.
 *
 * @returns the page element
 */
export default function DogOnlinePage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <DogOnlineScreen />
    </main>
  );
}
