/**
 * Die Seekarte: von Gewässer zu Gewässer, und was es dort zu holen gibt.
 *
 * @module
 * @remarks
 * The chart is the game's front door, and it lives **inside the game window** -
 * the same frame the dive is drawn in, with the same border and the same size.
 * One window, two things in it: that is what makes the three doors along its
 * foot part of the game rather than links on a web page.
 *
 * Drawn with the browser's own means rather than on a canvas: the waters are
 * buttons, and a button that a screen reader can find and a keyboard can reach
 * is worth more here than a prettier picture.
 */
"use client";

import type { ReactElement } from "react";
import { LEVELS, type Tier } from "@/games/uboot/engine/levels";
import type { PanelKind } from "@/games/uboot/components/panel";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";
import { gradeAt } from "@/games/uboot/engine/grades";
import {
  canPlay,
  free,
  bestOf,
  isDone,
  type Profile,
} from "@/games/uboot/settings/profile";

/** Props of {@link LevelMap}. */
export type LevelMapProps = {
  readonly profile: Profile;
  /** Takes a course and goes diving. */
  readonly onDive: (level: number) => void;
  /** Opens one of the three sheets over the window. */
  readonly onOpen: (panel: PanelKind) => void;
};

/**
 * Woran man die vier Sorten Wasser auf einen Blick erkennt.
 *
 * @remarks
 * Ein Zeichen am Namen und keine eigene Farbe für die Marke: Die Farben sind
 * schon vergeben - grün ist geschafft, gelb ist offen, grau ist zu. Eine
 * fünfte Bedeutung für dieselbe Farbe wäre eine zu viel.
 */
const TIER_MARK: Readonly<Record<Tier, string>> = {
  easy: "☀️",
  cave: "⛰️",
  deep: "\u{1F311}",
  final: "\u{1F991}",
};

/** How the dotted route between the waters is drawn. */
const ROUTE = { dash: "3 4", width: 0.5 } as const;

/**
 * Where the shafts of light come down, in percent across the chart.
 *
 * @remarks
 * They are only there to be different from each other; which four numbers
 * they are does not matter in the least.
 */
const SHAFT_AT = { one: 8, two: 34, three: 58, four: 82 } as const;

/**
 * The same four, and what a shaft does on the way down.
 *
 * @remarks
 * `top` is how wide one is at the surface, `lean` how far it has slid over by
 * the seabed and `wide` how broad it has opened out - one set of numbers for
 * all of them, so the light all comes from one place.
 */
const SHAFT = {
  at: [SHAFT_AT.one, SHAFT_AT.two, SHAFT_AT.three, SHAFT_AT.four],
  top: 6,
  lean: 22,
  wide: 8,
} as const;

/**
 * Renders the chart, filling the game window.
 *
 * @param props - the player, and what happens when a water or a door is picked
 * @returns the chart element
 */
export function LevelMap({
  profile,
  onDive,
  onOpen,
}: LevelMapProps): ReactElement {
  const spare = free(profile);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 via-sky-500 to-sky-950 dark:from-sky-900 dark:via-sky-950 dark:to-black">
      {/* The chart itself: surface, an island to leave and a trench to arrive
          at. Drawn in the same hundred-by-hundred frame the markers are placed
          in, so the route and the ground cannot drift apart. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        {SHAFT.at.map((shaft) => (
          <polygon
            key={shaft}
            points={`${shaft},0 ${shaft + SHAFT.top},0 ${
              shaft + SHAFT.lean
            },100 ${shaft + SHAFT.wide},100`}
            fill="rgba(255,255,255,0.07)"
          />
        ))}
        <rect x="0" y="0" width="100" height="3" fill="rgba(255,255,255,0.7)" />
        <polygon points="0,12 6,4 12,9 18,3 24,12" fill="rgba(46,60,42,0.85)" />
        <polygon points="0,12 24,12 26,16 0,16" fill="rgba(70,84,60,0.7)" />
        <polygon
          points="0,96 14,93 28,97 42,92 54,95 64,88 72,94 80,99 88,86 100,90 100,100 0,100"
          fill="rgba(4,24,42,0.85)"
        />
        <polyline
          points="0,96 14,93 28,97 42,92 54,95 64,88 72,94 80,99 88,86 100,90"
          fill="none"
          stroke="rgba(160,200,220,0.35)"
          strokeWidth="0.6"
        />
        <polyline
          points={LEVELS.map((one) => `${one.at.x},${one.at.y}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={ROUTE.width}
          strokeDasharray={ROUTE.dash}
        />
      </svg>

      {/* Oben rechts das Zahnrad - der Punktestand steht dort, wo man ihn
          ausgibt, nämlich am Hammer. Eine Zahl an zwei Stellen ist eine
          Zahl zu viel. */}
      <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <p className="rounded-lg bg-black/35 px-2 py-1 text-xs text-white">
          {UBOOT_TEXTS.mapHint}
        </p>
        <button
          type="button"
          data-testid="uboot-settings"
          onClick={() => onOpen("settings")}
          title={UBOOT_TEXTS.settings}
          aria-label={UBOOT_TEXTS.settings}
          className="cursor-pointer rounded-lg border border-white/50 bg-black/40 px-2.5 py-1 text-lg backdrop-blur-sm hover:bg-black/60"
        >
          {"\u2699\uFE0F"}
        </button>
      </div>

      {LEVELS.map((level, index) => (
        <Water
          key={level.name}
          index={index}
          name={level.name}
          hint={level.hint}
          reward={level.reward}
          tier={level.tier}
          at={level.at}
          done={isDone(profile, index)}
          best={bestOf(profile, index)}
          open={canPlay(profile, index)}
          onDive={() => onDive(index)}
        />
      ))}

      {/* The three doors, along the foot of the window. The hammer sits in the
          middle because it is the one that is finished and the one a player
          comes back to; the other two are corners they will want later. */}
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 pt-7">
        <Door
          kind="encyclopedia"
          icon={"\u{1F4D6}"}
          label={UBOOT_TEXTS.encyclopedia}
          soon
          onOpen={onOpen}
        />
        <Door
          kind="upgrades"
          icon={"\u{1F528}"}
          label={UBOOT_TEXTS.upgrades}
          badge={spare > 0 ? UBOOT_TEXTS.spendable(spare) : undefined}
          onOpen={onOpen}
        />
        <Door
          kind="trophies"
          icon={"\u{1F3C6}"}
          label={UBOOT_TEXTS.trophies}
          soon
          onOpen={onOpen}
        />
      </div>
    </div>
  );
}

/** Props of {@link Water}. */
type WaterProps = {
  readonly index: number;
  readonly name: string;
  readonly hint: string;
  readonly reward: number;
  readonly tier: Tier;
  readonly at: { readonly x: number; readonly y: number };
  readonly done: boolean;
  /** Die höchste Schwierigkeit, auf der es schon gelang. */
  readonly best: number;
  readonly open: boolean;
  readonly onDive: () => void;
};

/** One water on the chart. */
function Water({
  index,
  name,
  hint,
  reward,
  tier,
  at,
  done,
  best,
  open,
  onDive,
}: WaterProps): ReactElement {
  const look = done
    ? "border-emerald-300 bg-emerald-500 text-white"
    : open
      ? "border-white bg-amber-400 text-amber-950 animate-pulse"
      : "border-zinc-400 bg-zinc-700/80 text-zinc-300";
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${at.x}%`, top: `${at.y}%` }}
    >
      <button
        type="button"
        data-testid={`uboot-water-${index}`}
        onClick={onDive}
        disabled={!open}
        title={open ? hint : UBOOT_TEXTS.lockedHint}
        aria-label={`${UBOOT_TEXTS.course} ${index + 1} - ${name}`}
        className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 text-base font-bold shadow-lg disabled:cursor-not-allowed ${look}`}
      >
        {open ? (done ? "✓" : index + 1) : "\u{1F512}"}
      </button>
      <span className="rounded bg-black/45 px-1.5 py-0.5 text-center text-[11px] leading-tight font-medium whitespace-nowrap text-white">
        {name}
        <span className="block text-[10px] font-normal text-sky-100">
          {done
            ? `${UBOOT_TEXTS.mastered} · ${gradeAt(best).name}`
            : UBOOT_TEXTS.worth(reward)}{" "}
          <span aria-hidden="true">{TIER_MARK[tier]}</span>
        </span>
      </span>
    </div>
  );
}

/** Props of {@link Door}. */
type DoorProps = {
  readonly kind: PanelKind;
  readonly icon: string;
  readonly label: string;
  /** Whether it is one of the two that are not filled yet. */
  readonly soon?: boolean;
  /** A small note on the button, e.g. points waiting to be spent. */
  readonly badge?: string;
  readonly onOpen: (panel: PanelKind) => void;
};

/** One of the three doors along the foot of the window. */
function Door({
  kind,
  icon,
  label,
  soon,
  badge,
  onOpen,
}: DoorProps): ReactElement {
  return (
    <button
      type="button"
      data-testid={`uboot-door-${kind}`}
      onClick={() => onOpen(kind)}
      className={`flex h-[4.6rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-2 text-center text-sm backdrop-blur-sm ${
        soon === true
          ? "border-white/30 bg-black/30 text-zinc-200 hover:bg-black/45"
          : "border-white/60 bg-black/40 font-medium text-white hover:bg-black/60"
      }`}
    >
      <span aria-hidden="true" className="text-xl leading-none">
        {icon}
      </span>
      {label}
      {badge !== undefined && (
        <span className="rounded bg-amber-300 px-1.5 text-xs font-semibold text-amber-950">
          {badge}
        </span>
      )}
    </button>
  );
}
