/**
 * Der kurze Hinweis oben im Bild: "Erfolg freigeschaltet".
 *
 * @module
 * @remarks
 * **Oben in der Mitte und über allem.** Links steht im Tauchgang die Luft,
 * rechts der Pausenknopf - die Mitte ist der einzige Platz, an dem er niemanden
 * verdeckt. Er fängt nichts ab: Man kann durch ihn hindurchklicken, denn er
 * geht von allein wieder, und etwas, das von allein geht, darf einem nicht im
 * Weg stehen.
 */
"use client";

import type { ReactElement } from "react";
import { AWARD_NEWS_MS } from "@/games/uboot/hooks/use-award-news";
import type { Award } from "@/games/uboot/settings/awards";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";

/** Props of {@link AwardToast}. */
export type AwardToastProps = {
  /** Was gerade gemeldet wird - leer heißt: nichts im Bild. */
  readonly news: readonly Award[];
};

/**
 * Zeigt die frisch verdienten Auszeichnungen.
 *
 * @param props - die Meldungen
 * @returns den Stapel oben im Fenster
 */
export function AwardToast({ news }: AwardToastProps): ReactElement {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-3">
      {news.map((award) => (
        <div
          key={award.id}
          data-testid={`uboot-award-news-${award.id}`}
          style={{ animation: `uboot-award ${AWARD_NEWS_MS}ms ease-out both` }}
          className="flex max-w-xs items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-100 to-amber-300 px-3 py-2 text-amber-950 shadow-lg"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {award.icon}
          </span>
          <span className="flex flex-col text-left leading-tight">
            <span className="text-[0.7rem] font-semibold tracking-wide uppercase">
              {UBOOT_TEXTS.awardNew}
            </span>
            <span className="text-sm font-bold">{award.name}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
