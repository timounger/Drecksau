/**
 * One hand card of the human player.
 *
 * @module
 */
"use client";

import Image from "next/image";
import type { ReactElement } from "react";
import { CARD_ASPECT, CARD_IMAGES } from "@/assets/cards/card-images";
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
  isPlayable,
  isSelected,
  isDisabled,
  onSelect,
  onDiscard,
}: HandCardViewProps): ReactElement {
  const hint = isPlayable
    ? CARD_DESCRIPTIONS[card.type]
    : CARD_BLOCKED_HINTS[card.type];

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
        isPlayable && !isDisabled ? "" : "opacity-60",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={!isPlayable || isDisabled}
        onClick={() => onSelect(card.id)}
        className="flex flex-1 flex-col items-center gap-1 rounded-lg p-1 enabled:cursor-pointer enabled:hover:bg-zinc-50 dark:enabled:hover:bg-zinc-800"
      >
        {/* Sized by width so the picture shrinks with the card; the height
            follows from the ratio. At full size that lands just under the
            native ~190px of the artwork, which keeps it crisp. The files differ
            a little in ratio, hence the fixed box plus object-contain - it
            keeps the row even without squashing anyone's artwork. */}
        <span
          className="relative w-full overflow-hidden rounded-md"
          style={{ aspectRatio: CARD_ASPECT }}
        >
          <Image
            src={CARD_IMAGES[card.type]}
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
        className="mt-1 rounded-md py-0.5 text-[11px] text-zinc-400 enabled:cursor-pointer enabled:hover:bg-zinc-100 enabled:hover:text-zinc-700 dark:enabled:hover:bg-zinc-800"
      >
        {UI_TEXTS.discard}
      </button>
    </div>
  );
}
