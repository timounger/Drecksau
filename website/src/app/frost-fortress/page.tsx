/**
 * Frost Fortress game page.
 *
 * @module
 */
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { FrostGame } from "@/games/frost-fortress/components/frost-game";

export const metadata: Metadata = {
  title: "Frost Fortress",
  description:
    "Survival im ewigen Winter: Basis bauen, Ressourcen fördern, Türme errichten, forschen und Welle um Welle überstehen.",
};

/**
 * Renders the Frost Fortress game page.
 *
 * @returns the page element
 */
export default function FrostFortressPage(): ReactElement {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <FrostGame />
    </main>
  );
}
