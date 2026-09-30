/**
 * Die Bestenliste eines Gewässers.
 *
 * @module
 * @remarks
 * **Eine Liste je Gewässer**, nicht eine fürs ganze Spiel: Zeiten aus dem
 * Hafenbecken und aus dem Graben gegeneinanderzustellen, hieße zehn
 * verschiedene Fragen mit einer Antwort zu beantworten. Jede Liste liegt unter
 * ihrem eigenen Schlüssel (`uboot-1` bis `uboot-10`) in derselben Datenbank
 * wie alle anderen Bestenlisten der Sammlung.
 *
 * Der Rest - laden, sortieren, der Name, die Medaillen - ist für jedes Spiel
 * derselbe und steht in {@link @/online/leaderboard-view}. Hier steht nur, was
 * an diesem Spiel besonders ist: dass eine Fahrt besser ist, je kürzer sie
 * war, dass nur das Durchtauchen zählt, und wie eine Zeit geschrieben wird.
 */
"use client";

import { type ReactElement } from "react";
import { TOP_COUNT, type Board } from "@/online/leaderboard";
import { LeaderboardView } from "@/online/leaderboard-view";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";

/** Millisekunden in einer Sekunde und in einer Minute. */
const A_SECOND = 1000;
const A_MINUTE_OF = 60;
const A_MINUTE = A_MINUTE_OF * A_SECOND;

/** Wie breit Sekunden und Millisekunden geschrieben werden. */
const TWO_DIGITS = 2;
const THREE_DIGITS = 3;

/** Welche Liste zu welchem Gewässer gehört. */
export function boardFor(level: number): Board {
  return { gameId: `uboot-${level + 1}`, field: "ms", less: true };
}

/**
 * Schreibt eine Dauer aus.
 *
 * @param ms - die Dauer in Millisekunden
 * @returns `s,mmm` - und `m:ss,mmm`, sobald eine Minute voll ist
 * @remarks
 * **Auf die Millisekunde.** Ein Tauchgang dauert eine halbe Minute, und zwei
 * gute Fahrten durch dasselbe Gewässer trennt oft weniger als ein Zehntel -
 * eine Liste, in der dreimal dieselbe Zahl steht, ist keine Rangfolge.
 */
export function asClock(ms: number): string {
  const whole = Math.max(0, Math.round(ms));
  const minutes = Math.floor(whole / A_MINUTE);
  const seconds = Math.floor((whole % A_MINUTE) / A_SECOND);
  const rest = String(whole % A_SECOND).padStart(THREE_DIGITS, "0");
  return minutes === 0
    ? `${seconds},${rest} s`
    : `${minutes}:${String(seconds).padStart(TWO_DIGITS, "0")},${rest}`;
}

/** Was die Liste über den gerade beendeten Tauchgang wissen muss. */
export type BoardRun = {
  /** Wie lange er gedauert hat, in Millisekunden. */
  readonly ms: number;
  /** Und ob er durchgetaucht wurde - nur dann zählt er. */
  readonly whole: boolean;
};

/** Props of {@link Leaderboard}. */
export type LeaderboardProps = {
  /** Welches Gewässer, von null an. */
  readonly level: number;
  /** Wie es heißt, für die Überschrift. */
  readonly name: string;
  /** Der Tauchgang, der gerade zu Ende ging - oder null. */
  readonly run?: BoardRun | null;
};

/**
 * Die zehn besten Zeiten eines Gewässers.
 *
 * @param props - welches Gewässer und der Tauchgang von eben
 * @returns die Liste
 */
export function Leaderboard({
  level,
  name,
  run = null,
}: LeaderboardProps): ReactElement {
  return (
    <LeaderboardView
      board={boardFor(level)}
      testId={`uboot-${level + 1}`}
      format={asClock}
      run={run === null ? null : { value: run.ms, counts: run.whole }}
      texts={{
        title: UBOOT_TEXTS.boardTitle(name),
        subtitle: UBOOT_TEXTS.boardSubtitle,
        loading: UBOOT_TEXTS.boardLoading,
        failed: UBOOT_TEXTS.boardFailed,
        empty: UBOOT_TEXTS.boardEmpty,
        yours: UBOOT_TEXTS.boardYours,
        partial: UBOOT_TEXTS.boardPartial,
        madeIt: UBOOT_TEXTS.boardMadeIt,
        entered: UBOOT_TEXTS.boardEntered,
        missed: UBOOT_TEXTS.boardMissed,
        kept: UBOOT_TEXTS.boardKept,
        namePlaceholder: UBOOT_TEXTS.boardNamePlaceholder,
        enter: UBOOT_TEXTS.boardEnter,
        entering: UBOOT_TEXTS.boardEntering,
      }}
    />
  );
}

/** Wie viele Plätze die Liste hat, für alle, die die Zahl brauchen. */
export const BOARD_PLACES = TOP_COUNT;
