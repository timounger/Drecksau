/**
 * The board of best times for the drive.
 *
 * @module
 * @remarks
 * Only what is particular to this game: that a drive is better the shorter it
 * took, how a time is written, and that a drive counts for the board only when
 * it was driven from the first section through to the end. The board itself is
 * the one every game uses.
 */
"use client";

import { type ReactElement } from "react";
import { TOP_COUNT, type Board } from "@/online/leaderboard";
import { LeaderboardView } from "@/online/leaderboard-view";
import { RV_TEXTS } from "@/games/rv-there-yet/i18n/texts";

/** Which board this is: the drive's times, quickest first. */
const BOARD: Board = { gameId: "rv-there-yet", field: "ms", less: true };

/** Milliseconds in a second and in a minute, and seconds in a minute. */
const A_SECOND = 1000;
const A_MINUTE_OF = 60;
const A_MINUTE = A_MINUTE_OF * A_SECOND;

/** A tenth of a second, and how wide the seconds are written. */
const TENTHS = 10;
const A_TENTH = A_SECOND / TENTHS;
const TWO_DIGITS = 2;

/**
 * Writes a duration as minutes and seconds.
 *
 * @param ms - the duration in milliseconds
 * @returns the duration as `m:ss,t`
 * @remarks
 * Tenths, because a drive of several minutes is decided by rather more than a
 * hundredth and a board of unreadably long numbers helps nobody.
 */
export function asClock(ms: number): string {
  const minutes = Math.floor(ms / A_MINUTE);
  const seconds = Math.floor((ms % A_MINUTE) / A_SECOND);
  const tenths = Math.floor((ms % A_SECOND) / A_TENTH);
  return `${minutes}:${String(seconds).padStart(TWO_DIGITS, "0")},${tenths}`;
}

/** What the board needs to know about the drive just finished, if any. */
export type BoardRun = {
  /** How long it took, in milliseconds. */
  readonly ms: number;
  /** True while it was driven from the first section through to the end. */
  readonly whole: boolean;
};

/** Props of {@link Leaderboard}. */
export type LeaderboardProps = {
  /** The drive just finished, or null on the statistics page. */
  readonly run?: BoardRun | null;
};

/**
 * The board of best times, with the name field when there is a place to be had.
 *
 * @param props - the drive just finished, if any
 * @returns the board element
 */
export function Leaderboard({ run = null }: LeaderboardProps): ReactElement {
  return (
    <LeaderboardView
      board={BOARD}
      testId="rv"
      format={asClock}
      run={run === null ? null : { value: run.ms, counts: run.whole }}
      texts={{
        title: RV_TEXTS.boardTitle,
        subtitle: RV_TEXTS.boardSubtitle,
        loading: RV_TEXTS.boardLoading,
        failed: RV_TEXTS.boardFailed,
        empty: RV_TEXTS.boardEmpty,
        yours: RV_TEXTS.boardYours,
        partial: RV_TEXTS.boardPartial,
        madeIt: RV_TEXTS.boardMadeIt,
        entered: RV_TEXTS.boardEntered,
        missed: RV_TEXTS.boardMissed,
        namePlaceholder: RV_TEXTS.boardNamePlaceholder,
        enter: RV_TEXTS.boardEnter,
        entering: RV_TEXTS.boardEntering,
      }}
    />
  );
}

/** How many places the board shows, for anybody who needs the number. */
export const BOARD_PLACES = TOP_COUNT;
