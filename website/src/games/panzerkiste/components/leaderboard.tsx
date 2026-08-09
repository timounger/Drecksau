/**
 * The board of the furthest waves in the endless arena.
 *
 * @module
 * @remarks
 * Only what is particular to this game: that a run is better the further it
 * got, how a wave is written, and that a run counts only when nobody skipped
 * ahead with the level buttons. The board itself is the one every game uses.
 *
 * The arena is what this game has to rank by. The campaign is finished or it
 * is not, and a board of "cleared it" a hundred times over says nothing; the
 * arena never ends, so how far somebody got is a real number to beat.
 */
"use client";

import { type ReactElement } from "react";
import { TOP_COUNT, type Board } from "@/online/leaderboard";
import { LeaderboardView } from "@/online/leaderboard-view";
import { PANZERKISTE_TEXTS } from "@/games/panzerkiste/i18n/texts";

/** Which board this is: waves in the arena, the furthest first. */
const BOARD: Board = { gameId: "panzerkiste", field: "wave", less: false };

/** What the board needs to know about the run just finished, if any. */
export type BoardRun = {
  /** The furthest wave that run reached. */
  readonly wave: number;
  /** True while nobody jumped levels on the way there. */
  readonly fair: boolean;
};

/** Props of {@link Leaderboard}. */
export type LeaderboardProps = {
  /** The run just finished, or null on the statistics page. */
  readonly run?: BoardRun | null;
};

/**
 * The board of the furthest waves, with the name field when there is a place.
 *
 * @param props - the run just finished, if any
 * @returns the board element
 */
export function Leaderboard({ run = null }: LeaderboardProps): ReactElement {
  return (
    <LeaderboardView
      board={BOARD}
      testId="pk"
      format={PANZERKISTE_TEXTS.boardWave}
      run={run === null ? null : { value: run.wave, counts: run.fair }}
      texts={{
        title: PANZERKISTE_TEXTS.boardTitle,
        subtitle: PANZERKISTE_TEXTS.boardSubtitle,
        loading: PANZERKISTE_TEXTS.boardLoading,
        failed: PANZERKISTE_TEXTS.boardFailed,
        empty: PANZERKISTE_TEXTS.boardEmpty,
        yours: PANZERKISTE_TEXTS.boardYours,
        partial: PANZERKISTE_TEXTS.boardPartial,
        madeIt: PANZERKISTE_TEXTS.boardMadeIt,
        entered: PANZERKISTE_TEXTS.boardEntered,
        missed: PANZERKISTE_TEXTS.boardMissed,
        namePlaceholder: PANZERKISTE_TEXTS.boardNamePlaceholder,
        enter: PANZERKISTE_TEXTS.boardEnter,
        entering: PANZERKISTE_TEXTS.boardEntering,
      }}
    />
  );
}

/** How many places the board shows, for anybody who needs the number. */
export const BOARD_PLACES = TOP_COUNT;
