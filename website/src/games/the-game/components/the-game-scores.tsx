/**
 * The end of a game: how many cards never made it down.
 *
 * @module
 * @remarks
 * There is no winner to name and no table of points, because this game has
 * neither. What it has is one number - the cards left over - and the rulebook's
 * own opinion of it: "Ergebnisse unter zehn Restkarten sind super. Sollten alle
 * 98 Zahlenkarten abgelegt worden sein, habt ihr das Spiel besiegt."
 *
 * So that is what this screen is. The number, what the box would call it, and
 * where the cards were left - because "17 übrig" says nothing, while "12 auf
 * den Händen, 5 im Stapel" says the draw pile nearly ran out and the table
 * nearly did it.
 */
"use client";

import type { ReactElement } from "react";
import {
  GOOD_RESULT,
  cardsLeft,
  cardsPlaced,
  type TheGame,
} from "@/games/the-game/engine/state";
import { THE_GAME_TEXTS as T } from "@/games/the-game/i18n/texts";

/** Above this many left over, the box politely suggests another go. */
const FAIR_RESULT = 20;

/** Props of {@link TheGameScores}. */
export type TheGameScoresProps = {
  readonly game: TheGame;
  /** Deals again, or null for somebody who is not the one dealing. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the closing screen.
 *
 * @param props - the finished game and the way to start another
 * @returns the screen element
 */
export function TheGameScores({
  game,
  onNewGame,
}: TheGameScoresProps): ReactElement {
  const left = cardsLeft(game);
  const won = game.phase === "won";
  const inHands = game.players.reduce(
    (total, player) => total + player.hand.length,
    0,
  );

  return (
    <section
      data-testid="tg-over"
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${
        won
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      <h2 className="text-xl font-black">{won ? T.won : T.lost}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {won ? T.wonBody : T.lostBody(game.players[game.active].name)}
      </p>

      <div className="flex flex-wrap items-baseline gap-3">
        <span
          data-testid="tg-left"
          className="text-5xl leading-none font-black tabular-nums"
        >
          {left}
        </span>
        <span className="text-sm font-semibold">{T.leftOver(left)}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {T.placedOut(cardsPlaced(game))}
        </span>
      </div>

      {left > 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {inHands} auf den Händen, {game.draw.length} im Nachziehstapel.
        </p>
      )}

      <p className="text-sm font-semibold">{gradeOf(left, won)}</p>

      {onNewGame !== null && (
        <div>
          <button
            type="button"
            data-testid="tg-again"
            onClick={onNewGame}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {T.playAgain}
          </button>
        </div>
      )}
    </section>
  );
}

/** What the rulebook would call this result. */
function gradeOf(left: number, won: boolean): string {
  let grade: string;
  if (won) {
    grade = T.gradeBeaten;
  } else if (left < GOOD_RESULT) {
    grade = T.gradeSuper;
  } else if (left <= FAIR_RESULT) {
    grade = T.gradeGood;
  } else {
    grade = T.gradeAgain;
  }
  return grade;
}
