/**
 * One pig with its stall, lightning rod and nailed door.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { hasBarn, hasBarnDoor, hasLightningRod, type Pig } from "@/game/state";
import { CARD_ICONS, UI_TEXTS } from "@/i18n/translations";

/** Props of {@link PigView}. */
export type PigViewProps = {
  readonly pig: Pig;
  /** True while the selected card may be played at this pig. */
  readonly isTargetable: boolean;
  /** Called when the player clicks a targetable pig. */
  readonly onSelect: (pigId: string) => void;
};

/**
 * Renders a single pig card.
 *
 * @param props - the pig and its interaction state
 * @returns the pig card element
 */
export function PigView({
  pig,
  isTargetable,
  onSelect,
}: PigViewProps): ReactElement {
  const label = pig.isDirty ? UI_TEXTS.dirtyPig : UI_TEXTS.cleanPig;

  return (
    <button
      type="button"
      disabled={!isTargetable}
      onClick={() => onSelect(pig.id)}
      aria-label={`${label}${hasBarn(pig) ? `, ${UI_TEXTS.barnLabel}` : ""}`}
      className={[
        "relative flex h-24 w-20 flex-col items-center justify-center gap-1",
        "rounded-xl border-2 transition",
        pig.isDirty
          ? "border-amber-800 bg-amber-100 dark:bg-amber-950/60"
          : "border-pink-300 bg-pink-50 dark:bg-pink-950/40",
        hasBarn(pig) ? "ring-2 ring-amber-500/70" : "",
        isTargetable
          ? "cursor-pointer ring-4 ring-emerald-400 hover:-translate-y-1"
          : "cursor-default",
      ].join(" ")}
    >
      <span className="text-3xl" aria-hidden="true">
        {pig.isDirty ? "\u{1F416}" : "\u{1F437}"}
      </span>
      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>

      {/* Attachments, shown as small badges around the pig. */}
      <span className="absolute -top-2 -right-2 flex gap-0.5">
        {hasBarn(pig) && (
          <Badge title={UI_TEXTS.barnLabel}>{CARD_ICONS.barn}</Badge>
        )}
        {hasLightningRod(pig) && (
          <Badge title={UI_TEXTS.rodLabel}>{CARD_ICONS.lightningRod}</Badge>
        )}
        {hasBarnDoor(pig) && (
          <Badge title={UI_TEXTS.doorLabel}>{CARD_ICONS.barnDoor}</Badge>
        )}
      </span>
    </button>
  );
}

/** A small icon badge on the corner of a pig card. */
function Badge({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <span
      title={title}
      className="rounded-full bg-white px-1 text-xs shadow dark:bg-zinc-800"
    >
      {children}
    </span>
  );
}
