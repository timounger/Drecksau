/**
 * The building blocks every entry of the diplomacy window shares - rivals,
 * peoples and pirates alike: the card with emblem, name, kind and status,
 * the opinion with its bar and reasons, and the gift and demand buttons.
 *
 * @module
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import type { Modifier } from "@/games/imperavis/engine/types";
import { REASON_NAMES, TEXTS as T } from "@/games/imperavis/i18n/texts";
import { FX } from "@/games/imperavis/i18n/faction-texts";
import { Bar, Btn } from "./ui";

/** Gold of a small and of a large gift or demand, the same for everyone. */
export const GIFT_SMALL = 200;
export const GIFT_LARGE = 1000;

/** Relations run from minus to plus this; the bar shows it as 0 to 1. */
const RELATION_SPAN = 100;

/** How a status reads: bad, good, a warning or plain. */
export type StatusTone = "bad" | "good" | "warn" | "plain";

/** The colour class of each tone. */
const TONE_CLASS: Readonly<Record<StatusTone, string>> = {
  bad: "text-[var(--imp-bad)]",
  good: "text-[var(--imp-good)]",
  warn: "text-amber-300",
  plain: "imp-muted",
};

/** Props of {@link PowerCard}. */
export type PowerCardProps = {
  /** Crest or portrait. */
  readonly emblem: ReactNode;
  readonly name: string;
  /** Rival, people or pirates. */
  readonly kind: string;
  /** War, peace, alliance ... */
  readonly status: string;
  readonly tone: StatusTone;
  /** A line under the name: ruler, home, character. */
  readonly sub?: ReactNode;
  /** Facts in a line: islands, strength, mood. */
  readonly facts?: ReactNode;
  /** What it thinks of the human, -100 to 100. */
  readonly opinion: number;
  /** The stage of a people's or band's relation, with its colour. */
  readonly stage?: { readonly name: string; readonly color: string };
  /** The bar's colour class. */
  readonly bar: string;
  readonly reasons: readonly Modifier[];
  /** The id of the opinion's value, for tests. */
  readonly opinionId: string;
  readonly testId: string;
  /** Which kind of power, for filters and tests. */
  readonly power: "rival" | "nation" | "pirates";
  readonly children?: ReactNode;
};

/**
 * One power of the diplomacy window: head, opinion and its reasons, then
 * whatever can be done with it.
 *
 * @param props - what to show
 * @returns the card
 */
export function PowerCard(props: PowerCardProps): ReactElement {
  const shown = props.reasons.filter((m) => Math.round(m.value) !== 0);
  return (
    <section
      className="imp-card"
      data-testid={props.testId}
      data-power={props.power}
    >
      <header className="flex items-center gap-2">
        <span className="shrink-0">{props.emblem}</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2">
            <b>{props.name}</b>
            <span className="rounded border border-[var(--imp-brass-lo)] px-1 text-[10px] uppercase imp-muted">
              {props.kind}
            </span>
          </p>
          {props.sub !== undefined && (
            <p className="text-xs imp-muted">{props.sub}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-right text-xs font-semibold ${TONE_CLASS[props.tone]}`}
          data-testid={`${props.testId}-status`}
        >
          {props.status}
        </span>
      </header>
      {props.facts !== undefined && (
        <p className="mt-0.5 text-xs imp-muted">{props.facts}</p>
      )}
      <div className="mt-1 flex items-center gap-2">
        <span className="shrink-0 text-xs">
          {T.opinion}:{" "}
          <b data-testid={props.opinionId}>{Math.round(props.opinion)}</b>
          {props.stage !== undefined && (
            <b className="ml-1" style={{ color: props.stage.color }}>
              {props.stage.name}
            </b>
          )}
        </span>
        <Bar
          value={(props.opinion + RELATION_SPAN) / (RELATION_SPAN * 2)}
          color={props.bar}
        />
      </div>
      {shown.length > 0 && (
        <p className="text-xs imp-muted">
          {shown
            .map((m) => `${REASON_NAMES[m.reason]} ${signed(m.value)}`)
            .join(", ")}
        </p>
      )}
      {props.children}
    </section>
  );
}

/**
 * The gift buttons and, where a power can be asked, the demand: the same
 * sums and the same words for rivals and peoples.
 *
 * @param props - the actions, the key for the test ids and what is closed
 * @returns the buttons
 */
export function GoldDeals({
  testKey,
  onGift,
  onDemand,
  demandClosed = false,
}: {
  readonly testKey: string;
  readonly onGift: (gold: number) => void;
  /** Missing where no gold can be demanded. */
  readonly onDemand?: (gold: number) => void;
  readonly demandClosed?: boolean;
}): ReactElement {
  return (
    <>
      {[GIFT_SMALL, GIFT_LARGE].map((gold) => (
        <Btn
          key={`gift-${gold}`}
          small
          icon={gold === GIFT_SMALL ? "coin" : "coins"}
          onClick={() => onGift(gold)}
          testId={`imp-gift-${gold}-${testKey}`}
        >
          {T.giftGold(gold)}
        </Btn>
      ))}
      {onDemand !== undefined && (
        <Btn
          small
          disabled={demandClosed}
          tip={FX.demandTip}
          onClick={() => onDemand(GIFT_LARGE)}
          testId={`imp-demand-${testKey}`}
        >
          {T.demandGold(GIFT_LARGE)}
        </Btn>
      )}
    </>
  );
}

/**
 * A number with its sign.
 *
 * @param value - the number
 * @returns e.g. "+3" or "-12"
 */
export function signed(value: number): string {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}
