/**
 * One hand card of the human player.
 *
 * @module
 */
"use client";

import Image from "next/image";
import type { ReactElement } from "react";
import { CARD_ASPECTS, CARD_IMAGES_BY_THEME } from "@/assets/cards/card-images";
import type { CardTheme } from "@/assets/cards/themes";
import type { Card } from "@/game/cards";
import {
  CARD_BLOCKED_HINTS,
  CARD_DESCRIPTIONS,
  CARD_NAMES,
  UI_TEXTS,
} from "@/i18n/translations";

/** Props of {@link HandCardView}. */
export type HandCardViewProps = {
  readonly card: Card;
  /** The card design to draw. */
  readonly theme: CardTheme;
  /** False when no legal target exists for this card right now. */
  readonly isPlayable: boolean;
  /** True while this card waits for a target. */
  readonly isSelected: boolean;
  /** True while it is not the player's turn. */
  readonly isDisabled: boolean;
  readonly onSelect: (cardId: string) => void;
  readonly onDiscard: (cardId: string) => void;
};

/**
 * Renders a hand card with its artwork, effect and a discard button.
 *
 * @param props - the card and its interaction state
 * @returns the hand card element
 */
export function HandCardView({
  card,
  theme,
  isPlayable,
  isSelected,
  isDisabled,
  onSelect,
  onDiscard,
}: HandCardViewProps): ReactElement {
  const hint = isPlayable
    ? CARD_DESCRIPTIONS[card.type]
    : CARD_BLOCKED_HINTS[card.type];

  // Discarding is always an option, and on an unplayable card it is the only
  // one - so highlight it there instead of leaving it in the general dimming.
  const highlightDiscard = !isPlayable && !isDisabled;

  return (
    <div
      className={[
        // Grows to at most 8rem, but shrinks as far as the row needs it to -
        // the hand stays on one line even on a narrow phone.
        "flex min-w-0 flex-1 shrink flex-col rounded-xl border-2 bg-white",
        "max-w-32 p-2 shadow-sm transition dark:bg-zinc-900",
        isSelected
          ? "-translate-y-2 border-emerald-500 ring-2 ring-emerald-400"
          : "border-zinc-200 dark:border-zinc-700",
        // Dim the whole card only when it is not the player's turn; an
        // unplayable card is dimmed on its picture alone, below, so its
        // discard button stays bright.
        isDisabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={!isPlayable || isDisabled}
        onClick={() => onSelect(card.id)}
        // Centred, so the landscape Schönsau does not leave a gap at the
        // bottom while its portrait neighbours set the card height. Dimmed on
        // its own when the card cannot be played, so the discard button below
        // is the one thing that still stands out.
        className={[
          "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg p-1",
          "enabled:cursor-pointer enabled:hover:bg-zinc-50 dark:enabled:hover:bg-zinc-800",
          isPlayable ? "" : "opacity-50",
        ].join(" ")}
      >
        {/* Sized by width so the picture shrinks with the card; the height
            follows from the ratio. The files differ a little in ratio, hence
            the fixed box plus object-contain - it keeps the row even without
            squashing anyone's artwork. The ratio comes per card because the
            Schönsau is landscape while everything else is portrait. */}
        <span
          className="relative w-full overflow-hidden rounded-md"
          style={{ aspectRatio: CARD_ASPECTS[card.type] }}
        >
          <Image
            src={CARD_IMAGES_BY_THEME[theme][card.type]}
            alt=""
            fill
            sizes="112px"
            className="object-contain"
          />
        </span>
        <span className="text-xs font-semibold">{CARD_NAMES[card.type]}</span>
        <span className="text-center text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
          {hint}
        </span>
      </button>

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onDiscard(card.id)}
        className={[
          "mt-1 rounded-md py-0.5 text-[11px] enabled:cursor-pointer",
          highlightDiscard
            ? // The only move on this card - make it clearly clickable.
              "bg-amber-100 font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-100 dark:hover:bg-amber-900/70"
            : "text-zinc-400 enabled:hover:bg-zinc-100 enabled:hover:text-zinc-700 dark:enabled:hover:bg-zinc-800",
        ].join(" ")}
      >
        {UI_TEXTS.discard}
      </button>
    </div>
  );
}
