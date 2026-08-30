/**
 * The play area: the table, your hand and the two buttons under it.
 *
 * @module
 * @remarks
 * The same component on both screens - against the computer and online. What a
 * player does in this game is the same either way, and a second copy of it
 * would be a second place for the rules of picking cards to drift.
 */
"use client";

import { useState, type ReactElement } from "react";
import { cardById, type Rank } from "@/games/arschloch/engine/cards";
import { canPass, canPlay, seatOnTurn } from "@/games/arschloch/engine/moves";
import type {
  ArschlochGame,
  ArschlochMove,
} from "@/games/arschloch/engine/state";
import { ARSCHLOCH_TEXTS as T } from "@/games/arschloch/i18n/texts";
import { Hand, Seats, TablePile } from "./arschloch-table";

/** The look of the button that makes the move. */
const STRONG =
  "cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40";

/** The look of the second button beside it. */
const PLAIN =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the table and the reader's own hand.
 *
 * @param props - the game, the seat the reader plays, and where moves go
 * @returns the play area
 */
export function PlayArea({
  game,
  mySeat,
  onMove,
}: {
  readonly game: ArschlochGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: ArschlochMove) => void;
}): ReactElement {
  const [picked, setPicked] = useState<readonly string[]>([]);
  const seat = mySeat ?? -1;
  const mine = mySeat !== null;
  const onTurn = mine && seatOnTurn(game) === seat;
  const owed = game.owed[0];
  const giving =
    onTurn &&
    game.phase === "passing" &&
    owed !== undefined &&
    owed.from === seat;
  const hand = mine ? game.players[seat].hand : [];

  const pick = (id: string) => {
    setPicked((current) =>
      current.includes(id)
        ? current.filter((each) => each !== id)
        : [...current, id],
    );
  };

  const send = (move: ArschlochMove) => {
    onMove(move);
    setPicked([]);
  };

  return (
    <div className="flex flex-col gap-3">
      <Seats game={game} mySeat={seat} />
      <TablePile game={game} />
      {giving && (
        <p
          data-testid="ar-give-hint"
          className="text-center text-sm font-semibold text-amber-700 dark:text-amber-300"
        >
          {T.giveHint(owed.count, game.players[owed.to].name)}
        </p>
      )}
      {mine && (
        <Hand
          cards={hand}
          picked={picked}
          playableRank={rankOf(picked)}
          onPick={pick}
        />
      )}
      <div className="flex flex-wrap justify-center gap-1.5">
        {giving ? (
          <button
            type="button"
            onClick={() => send({ kind: "give", cards: picked })}
            disabled={picked.length !== owed.count}
            data-testid="ar-give"
            className={STRONG}
          >
            {T.giveButton}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => send({ kind: "play", cards: picked })}
              disabled={!onTurn || !canPlay(game, seat, picked)}
              data-testid="ar-play"
              className={STRONG}
            >
              {picked.length === 0 ? T.play : T.playCount(picked.length)}
            </button>
            <button
              type="button"
              onClick={() => send({ kind: "pass" })}
              disabled={!onTurn || !canPass(game)}
              data-testid="ar-pass"
              className={PLAIN}
            >
              {T.pass}
            </button>
          </>
        )}
        {game.phase === "roundOver" && mine && (
          <button
            type="button"
            onClick={() => send({ kind: "next" })}
            data-testid="ar-next"
            className={STRONG}
          >
            {T.nextRound}
          </button>
        )}
      </div>
    </div>
  );
}

/** The rank of the picked cards, so the rest of the hand can be dimmed. */
function rankOf(picked: readonly string[]): Rank | null {
  const first = picked.length > 0 ? cardById(picked[0]) : null;
  return first === null ? null : first.rank;
}
