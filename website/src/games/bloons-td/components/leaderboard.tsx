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
 *
 * **Eine Liste je Karte und Schwierigkeit**: Runde 50 auf dem kurzen Weg mit
 * hundert Leben ist eine andere Leistung als Runde 50 auf der langen Wiese
 * mit zweihundert.
 */
"use client";

import { useState, type ReactElement } from "react";
import { type Board } from "@/online/leaderboard";
import { LeaderboardView } from "@/online/leaderboard-view";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  type Difficulty,
} from "@/games/bloons-td/engine/difficulty";
import { MAPS, MAP_ORDER, type MapId } from "@/games/bloons-td/engine/map";
import { BLOONS_TEXTS } from "@/games/bloons-td/i18n/texts";

/**
 * Welche Liste das ist: Runden auf dieser Karte und Schwierigkeit, die höchste
 * zuerst.
 *
 * @remarks
 * Die Wiese auf Mittel behält den alten Namen: Das war die einzige Karte und
 * die einzige Schwierigkeit, die es früher gab, und wer dort schon steht, soll
 * nicht von der Liste fallen.
 */
function boardOf(map: MapId, difficulty: Difficulty): Board {
  const old = map === "meadow" && difficulty === "medium";
  return {
    gameId: old ? "bloons-td" : `bloons-td-${map}-${difficulty}`,
    field: "round",
    less: false,
  };
}

/** Was die Liste über die gerade beendete Partie wissen muss. */
export type BoardRun = {
  /** Die Runde, in der die Ballons durchkamen. */
  readonly round: number;
  /** True, solange nicht geschummelt wurde. */
  readonly fair: boolean;
};

/** Props of {@link Leaderboard}. */
export type LeaderboardProps = {
  /** Welche Karte und Schwierigkeit. */
  readonly map: MapId;
  readonly difficulty: Difficulty;
  /** Die gerade beendete Partie, oder null auf der Statistikseite. */
  readonly run?: BoardRun | null;
};

/**
 * Die Bestenliste, mit dem Namensfeld, wenn ein Platz frei ist.
 *
 * @param props - die gerade beendete Partie, falls es eine gibt
 * @returns die Liste
 */
export function Leaderboard({
  map,
  difficulty,
  run = null,
}: LeaderboardProps): ReactElement {
  return (
    <LeaderboardView
      board={boardOf(map, difficulty)}
      testId="btd"
      format={BLOONS_TEXTS.boardRound}
      run={run === null ? null : { value: run.round, counts: run.fair }}
      texts={{
        title: BLOONS_TEXTS.boardTitle,
        subtitle: `${BLOONS_TEXTS.boardSubtitle} - ${MAPS[map].name}, ${DIFFICULTIES[difficulty].name}`,
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

/**
 * Die Bestenlisten zum Durchblättern: Karte und Schwierigkeit wählen, darunter
 * die Liste dazu.
 *
 * @returns die Wahl samt Liste, für die Statistikseite
 */
export function LeaderboardPicker(): ReactElement {
  const [map, setMap] = useState<MapId>("meadow");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 text-sm">
        <select
          aria-label={BLOONS_TEXTS.boardMap}
          value={map}
          onChange={(event) => setMap(event.target.value as MapId)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {MAP_ORDER.map((one) => (
            <option key={one} value={one}>
              {MAPS[one].name}
            </option>
          ))}
        </select>
        <select
          aria-label={BLOONS_TEXTS.boardDifficulty}
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {DIFFICULTY_ORDER.map((one) => (
            <option key={one} value={one}>
              {DIFFICULTIES[one].name}
            </option>
          ))}
        </select>
      </div>
      {/* Neu aufgebaut bei jeder Wahl: Die Liste lädt einmal, wenn sie
          erscheint. */}
      <Leaderboard
        key={`${map}-${difficulty}`}
        map={map}
        difficulty={difficulty}
      />
    </div>
  );
}
