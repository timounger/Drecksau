/**
 * Die Auszeichnungen, alle nebeneinander - erreichte leuchten, der Rest wartet.
 *
 * @module
 * @remarks
 * **Auch das, was man noch nicht hat, steht da.** Eine Tafel, die nur zeigt,
 * was schon geschafft ist, ist eine Liste; eine, die alles zeigt, ist ein
 * Ziel. Deshalb steht unter jedem grauen Feld, wofür es die Auszeichnung
 * gibt - das ist der halbe Sinn der Seite.
 */
"use client";

import type { ReactElement } from "react";
import { AWARDS, earnedCount, isEarned } from "@/games/uboot/settings/awards";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";
import type { Profile } from "@/games/uboot/settings/profile";

/** Props of {@link AwardBoard}. */
export type AwardBoardProps = {
  readonly profile: Profile;
};

/**
 * Renders the awards.
 *
 * @param props - der Spieler
 * @returns die Tafel
 */
export function AwardBoard({ profile }: AwardBoardProps): ReactElement {
  const got = earnedCount(profile);

  return (
    <div className="flex h-full flex-col gap-3">
      <p
        data-testid="uboot-awards-count"
        className="text-sm text-zinc-600 dark:text-zinc-400"
      >
        {UBOOT_TEXTS.awardsCount(got, AWARDS.length)}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AWARDS.map((award) => {
          const lit = isEarned(profile, award);
          return (
            <div
              key={award.id}
              data-testid={`uboot-award-${award.id}`}
              data-earned={lit}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
                lit
                  ? "border-amber-400 bg-gradient-to-b from-amber-100 to-amber-300 text-amber-950 shadow"
                  : "border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
              }`}
            >
              <span
                aria-hidden="true"
                className={`text-4xl ${lit ? "" : "opacity-40 grayscale"}`}
              >
                {award.icon}
              </span>
              <span className="text-sm font-bold">{award.name}</span>
              <span className="text-xs leading-snug">{award.hint}</span>
              <span
                className={`mt-auto pt-1 text-xs font-semibold ${
                  lit ? "text-emerald-800" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {lit ? `✓ ${UBOOT_TEXTS.awardGot}` : UBOOT_TEXTS.awardOpen}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
