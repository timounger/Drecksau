/**
 * "U-Boot" game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { UbootGame } from "@/games/uboot/components/uboot-game";

export const metadata: Metadata = {
  title: "U-Boot",
  description:
    "Journey to the Deep - steuere das U-Boot an Fels und Minen vorbei ans andere Ende.",
};

/**
 * Renders the "U-Boot" game page.
 *
 * @returns the page element
 */
export default function UbootPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <UbootGame />
    </main>
  );
}
