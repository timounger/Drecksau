/**
 * One pig with its stall, lightning rod and nailed door.
 *
 * @module
 */
"use client";

import Image from "next/image";
import type { ReactElement } from "react";
import {
  PIG_ASPECT,
  PIG_IMAGES_BY_THEME,
} from "@/games/drecksau/assets/cards/card-images";
import type { CardTheme } from "@/games/drecksau/assets/cards/themes";
import {
  hasBarn,
  hasBarnDoor,
  hasBeauty,
  hasLightningRod,
  type Pig,
} from "@/games/drecksau/engine/state";
import { CARD_ICONS, UI_TEXTS } from "@/games/drecksau/i18n/translations";

/** Props of {@link PigView}. */
export type PigViewProps = {
  readonly pig: Pig;
  /** The card design to draw. */
  readonly theme: CardTheme;
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
 * @remarks
 * The pig artwork is landscape, unlike the portrait action cards - hence the
 * wider box here.
 */
export function PigView({
  pig,
  theme,
  isTargetable,
  onSelect,
}: PigViewProps): ReactElement {
  const label = pigLabel(pig);

  return (
    <button
      type="button"
      disabled={!isTargetable}
      onClick={() => onSelect(pig.id)}
      aria-label={`${label}${hasBarn(pig) ? `, ${UI_TEXTS.barnLabel}` : ""}`}
      className={[
        // Grows to at most 8rem, but shrinks as far as the row needs it to -
        // that keeps every player's pigs on one line on a phone as well.
        "relative flex min-w-0 flex-1 shrink flex-col items-center gap-1 p-1.5",
        "max-w-32 rounded-xl border-2 transition",
        borderOf(pig),
        hasBarn(pig) ? "ring-2 ring-amber-500/70" : "",
        isTargetable
          ? "cursor-pointer ring-4 ring-emerald-400 hover:-translate-y-1"
          : "cursor-default",
      ].join(" ")}
    >
      {/* No caption underneath: the artwork shows the state at a glance, and
          the aria-label above carries it for screen readers. A Schönsau lies
          on the pig card, so it simply replaces the picture. */}
      <span
        className="relative w-full overflow-hidden rounded-md"
        style={{ aspectRatio: PIG_ASPECT }}
      >
        <Image
          src={pigImageOf(pig, theme)}
          alt=""
          fill
          sizes="112px"
          className="object-contain"
        />
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

/** The picture on the pig card - the Schönsau covers whatever is underneath. */
function pigImageOf(pig: Pig, theme: CardTheme) {
  const images = PIG_IMAGES_BY_THEME[theme];
  let image = images.clean;

  if (hasBeauty(pig)) {
    image = images.beauty;
  } else if (pig.isDirty) {
    image = images.dirty;
  }

  return image;
}

/** What the pig is called, for screen readers. */
function pigLabel(pig: Pig): string {
  let label: string = UI_TEXTS.cleanPig;

  if (hasBeauty(pig)) {
    label = UI_TEXTS.beautyPig;
  } else if (pig.isDirty) {
    label = UI_TEXTS.dirtyPig;
  }

  return label;
}

/** Frame colour: pink clean, brown dirty, violet for a Schönsau. */
function borderOf(pig: Pig): string {
  let border = "border-pink-300 bg-pink-50 dark:bg-pink-950/40";

  if (hasBeauty(pig)) {
    border = "border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40";
  } else if (pig.isDirty) {
    border = "border-amber-800 bg-amber-100 dark:bg-amber-950/60";
  }

  return border;
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
