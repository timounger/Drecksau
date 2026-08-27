/**
 * *Der Handelstross*: the voting round.
 *
 * @module
 * @remarks
 * The round is the one thing in this scenario a player cannot read off the
 * board, so it gets a panel of its own: who has laid how many cards, whose
 * answer the table is waiting for, and - when it is yours - what you may do
 * about it.
 *
 * Only the laying happens here. Choosing a position and putting the wagon down
 * both happen **on the board**, because both are a place, and a list of path
 * numbers beside the board would be a worse way of saying the same thing.
 */
"use client";

import { useState, type ReactElement } from "react";
import { Button } from "@/games/catan/components/catan-actions";
import { BALLOT, caravans, wagonSpots } from "@/games/catan/engine/karawane";
import { CATAN_TEXTS as T, SORT_NAMES } from "@/games/catan/i18n/texts";
import {
  NO_CARDS,
  handSize,
  realSeats,
  withCard,
  type CatanGame,
  type CatanMove,
  type Hand,
} from "@/games/catan/engine/state";

/**
 * The voting round.
 *
 * @param props - the game, the seat looking, and how to move
 * @returns the panel, or null when no round is running
 */
export function CatanVote({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const vote = game.vote;
  return !caravans(game) || vote === null ? null : (
    <section
      className="flex flex-col gap-2 rounded-2xl border border-indigo-300 bg-white p-3 dark:border-indigo-800 dark:bg-zinc-900"
      data-testid="ct-vote"
    >
      <h2 className="text-sm font-semibold">{T.voteTitle}</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.voteHint(wagonSpots(game).length)}
      </p>
      <ul className="flex flex-col gap-0.5 text-xs">
        {realSeats(game).map((seat) => (
          <li key={seat} className="flex items-center gap-2">
            <span className={seat === mySeat ? "font-semibold" : undefined}>
              {game.players[seat].name}
            </span>
            <span className="ml-auto opacity-70">
              {T.voteCards(vote.laid[seat])}
            </span>
          </li>
        ))}
      </ul>
      <VoteStep game={game} mySeat={mySeat} onMove={onMove} />
    </section>
  );
}

/** What this seat may do about the round right now. */
function VoteStep({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const vote = game.vote;
  const asking =
    vote === null
      ? null
      : vote.stage === "place"
        ? vote.decider
        : (vote.order[vote.step] ?? null);
  let step: ReactElement;
  if (vote === null || asking !== mySeat) {
    step = (
      <p className="text-xs opacity-60">
        {asking === null ? T.voteWaiting : T.voteWho(game.players[asking].name)}
      </p>
    );
  } else if (vote.stage === "lay") {
    step = <LayBox game={game} mySeat={mySeat} onMove={onMove} />;
  } else {
    step = (
      <p className="text-xs font-semibold" data-testid="ct-vote-board">
        {vote.stage === "assign" ? T.voteOnBoard : T.wagonOnBoard}
      </p>
    );
  }
  return step;
}

/**
 * The ballot: how many wool and grain cards to put on the table.
 *
 * @param props - the game, the seat, and how to move
 * @returns the counters and the two buttons
 * @remarks
 * Counted up rather than typed, and bounded by the hand, because "alle haben
 * nur einmal die Möglichkeit, Karten auszulegen" - a ballot that cannot be
 * taken back should be hard to get wrong.
 */
function LayBox({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const [cards, setCards] = useState<Hand>(NO_CARDS);
  const hand = game.players[mySeat].hand;
  const count = handSize(cards);
  return (
    <div className="flex flex-col gap-2">
      {BALLOT.map((sort) => (
        <div key={sort} className="flex items-center gap-2 text-xs">
          <span className="w-20">{SORT_NAMES[sort]}</span>
          <button
            type="button"
            data-testid={`ct-lay-less-${sort}`}
            disabled={cards[sort] === 0}
            onClick={() => setCards((now) => withCard(now, sort, -1))}
            className="cursor-pointer rounded-lg border border-zinc-300 px-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold">
            {cards[sort]} / {hand[sort]}
          </span>
          <button
            type="button"
            data-testid={`ct-lay-more-${sort}`}
            disabled={cards[sort] >= hand[sort]}
            onClick={() => setCards((now) => withCard(now, sort, 1))}
            className="cursor-pointer rounded-lg border border-zinc-300 px-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
          >
            +
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        <Button
          label={T.layCards(count)}
          testId="ct-lay"
          off={count === 0}
          onClick={() => {
            onMove({ kind: "lay", cards });
            setCards(NO_CARDS);
          }}
        />
        <Button
          label={T.layPass}
          testId="ct-lay-pass"
          onClick={() => {
            onMove({ kind: "lay", cards: NO_CARDS });
            setCards(NO_CARDS);
          }}
        />
      </div>
    </div>
  );
}
