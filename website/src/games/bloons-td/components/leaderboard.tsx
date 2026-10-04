/**
 * Die Bestenliste von Bloons TD: wer am längsten durchgehalten hat.
 *
 * @module
 * @remarks
 * Nur, was diesem Spiel eigen ist: dass eine Partie besser ist, je weiter sie
 * kam, wie eine Runde geschrieben wird, und dass nur zählt, wer nicht
 * geschummelt hat. Die Liste selbst ist dieselbe wie in jedem anderen Spiel.
 *
 * Gewertet wird die Runde, in der die Ballons durchkamen. Ein Ende hat das
 * Spiel nicht, also ist "wie weit" die einzige Zahl, die man schlagen kann.
 */
"use client";

import { type ReactElement } from "react";
import { type Board } from "@/online/leaderboard";
import { LeaderboardView } from "@/online/leaderboard-view";
import { BLOONS_TEXTS } from "@/games/bloons-td/i18n/texts";

/** Welche Liste das ist: Runden, die höchste zuerst. */
const BOARD: Board = { gameId: "bloons-td", field: "round", less: false };

/** Was die Liste über die gerade beendete Partie wissen muss. */
export type BoardRun = {
  /** Die Runde, in der die Ballons durchkamen. */
  readonly round: number;
  /** True, solange nicht geschummelt wurde. */
  readonly fair: boolean;
};

/** Props of {@link Leaderboard}. */
export type LeaderboardProps = {
  /** Die gerade beendete Partie, oder null auf der Statistikseite. */
  readonly run?: BoardRun | null;
};

/**
 * Die Bestenliste, mit dem Namensfeld, wenn ein Platz frei ist.
 *
 * @param props - die gerade beendete Partie, falls es eine gibt
 * @returns die Liste
 */
export function Leaderboard({ run = null }: LeaderboardProps): ReactElement {
  return (
    <LeaderboardView
      board={BOARD}
      testId="btd"
      format={BLOONS_TEXTS.boardRound}
      run={run === null ? null : { value: run.round, counts: run.fair }}
      texts={{
        title: BLOONS_TEXTS.boardTitle,
        subtitle: BLOONS_TEXTS.boardSubtitle,
        loading: BLOONS_TEXTS.boardLoading,
        failed: BLOONS_TEXTS.boardFailed,
        empty: BLOONS_TEXTS.boardEmpty,
        yours: BLOONS_TEXTS.boardYours,
        partial: BLOONS_TEXTS.boardPartial,
        madeIt: BLOONS_TEXTS.boardMadeIt,
        entered: BLOONS_TEXTS.boardEntered,
        missed: BLOONS_TEXTS.boardMissed,
        kept: BLOONS_TEXTS.boardKept,
        namePlaceholder: BLOONS_TEXTS.boardNamePlaceholder,
        enter: BLOONS_TEXTS.boardEnter,
        entering: BLOONS_TEXTS.boardEntering,
      }}
    />
  );
}
