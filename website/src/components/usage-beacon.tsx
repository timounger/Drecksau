/**
 * Counts that a page was opened, once per tab.
 *
 * @module
 * @remarks
 * **One line in the layout rather than one in every page.** Every page of this
 * site goes through the root layout, so the count belongs there: a game that
 * forgets to add itself would be a game missing from the statistics, and the
 * one thing a usage statistic must not be is selective.
 *
 * Which game a page belongs to is read off the address - `/gta/statistik` is
 * the GTA shelf, `/` is the collection itself. Nothing else about the visit is
 * looked at, let alone stored; see ../online/usage for what is written.
 */
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GAMES } from "@/games/registry";
import { SITE_KEY, reportDevice, reportVisit } from "@/online/usage";

/**
 * Reports the page one is on.
 *
 * @returns nothing at all - it draws nothing
 */
export function UsageBeacon(): null {
  const path = usePathname();
  useEffect(() => {
    reportVisit(keyOf(path));
    // And which sort of machine this is - once per tab, whatever page it
    // started on, because that is a fact about the visit and not the page.
    reportDevice();
  }, [path]);
  return null;
}

/**
 * Which game an address belongs to.
 *
 * @param path - the address, as the router knows it
 * @returns the game's id, or {@link SITE_KEY} for everything else
 * @remarks
 * **The first segment and nothing finer.** A game's settings and statistics
 * pages are that game as far as this is concerned - somebody who opens them is
 * somebody who is there - and the alternative is a statistic with three
 * entries per game that nobody adds up.
 */
function keyOf(path: string | null): string {
  const first = (path ?? "/").split("/").filter(Boolean)[0];
  return GAMES.some((game) => game.id === first) ? first : SITE_KEY;
}
