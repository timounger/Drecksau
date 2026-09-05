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
import { sortHand, type Card, type Rank } from "@/games/arschloch/engine/cards";
import {
  canPass,
  canPlay,
  playableIds,
  seatOnTurn,
} from "@/games/arschloch/engine/moves";
import {
  wishableIds,
  type ArschlochGame,
  type ArschlochMove,
  type Handover,
  type HandoverKind,
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
  // The step the table is waiting for, if it is this reader's to make.
  const step =
    onTurn &&
    game.phase === "passing" &&
    owed !== undefined &&
    owed.from === seat
      ? owed
      : null;
  // Wishing means picking out of somebody else hand; everything else is your
  // own. Which hand is on screen follows from that, and so does what a tap
  // means - see setOf, which only groups cards while a pile is being answered.
  const hand =
    step?.kind === "wish"
      ? game.players[step.to].hand
      : mine
        ? game.players[seat].hand
        : [];
  // How many cards a play has to be. Zero means the table is free and the set
  // is the leader's own choice, so the cards are picked one at a time.
  const need = game.phase === "playing" ? game.pile.length : 0;
  const wanted = step === null ? 0 : step.count;

  /**
   * Picking a card up or putting it down again.
   *
   * @remarks
   * Following somebody else's set, a single card is not a choice: a pair is
   * answered with a pair or not at all. So the whole set comes along, and goes
   * again in one piece. Leading, and handing cards back after a Zwangshandel,
   * are the two moments where a card really is picked one at a time.
   */
  const pick = (id: string) => {
    if (need === 0) {
      setPicked((current) =>
        current.includes(id)
          ? current.filter((each) => each !== id)
          : [...current, id],
      );
    } else {
      setPicked((current) =>
        current.includes(id) ? [] : setOf(hand, id, need),
      );
    }
  };

  const send = (move: ArschlochMove) => {
    onMove(move);
    setPicked([]);
  };

  // Eine Auswahl gehört zu genau einer Lage. Ändert sich die - der Stapel, die
  // Phase, wer dran ist, oder die eigene Hand -, ist sie hinfällig: Wer eine
  // Karte gewählt hatte, die inzwischen weg ist (weggespielt, oder vom
  // Präsidenten weggewünscht), konnte sonst nichts mehr legen. Der Knopf blieb
  // grau, egal was man anklickte, und das Spiel sah kaputt aus.
  // Was davon wirklich auf dem Tisch liegen kann: eine Auswahl, die auf Karten
  // zeigt, die niemand mehr hält, ist keine.
  const held = picked.filter((id) => hand.some((card) => card.id === id));
  const now = situation(game, seat);
  const [was, setWas] = useState(now);
  if (was !== now) {
    setWas(now);
    setPicked([]);
  }

  return (
    <div className="flex flex-col gap-3">
      <Seats game={game} mySeat={seat} />
      <TablePile game={game} />
      {step !== null && (
        <p
          data-testid="ar-step-hint"
          className="text-center text-sm font-semibold text-amber-700 dark:text-amber-300"
        >
          {stepHint(game, step)}
        </p>
      )}
      {(mine || step !== null) && (
        <Hand
          cards={hand}
          picked={held}
          dimmed={dimmedIds(game, seat, onTurn, step, held)}
          onPick={pick}
        />
      )}
      <div className="flex flex-wrap justify-center gap-1.5">
        {step !== null ? (
          <button
            type="button"
            onClick={() => send({ kind: step.kind, cards: held })}
            disabled={held.length !== wanted}
            data-testid={`ar-${step.kind}`}
            className={STRONG}
          >
            {STEP_BUTTONS[step.kind]}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => send({ kind: "play", cards: held })}
              disabled={!onTurn || !canPlay(game, seat, held)}
              data-testid="ar-play"
              className={STRONG}
            >
              {held.length === 0 ? T.play : T.playCount(held.length)}
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

/**
 * The set a tap on one card stands for.
 *
 * @param hand - the cards held
 * @param id - the card that was tapped
 * @param need - how many the pile asks for
 * @returns that many neighbouring cards of the tapped rank
 * @remarks
 * Which of the equal cards go is not a decision - the suit never beats
 * anything - so the choice is made for looks: the set is taken as a window of
 * neighbours that contains the tapped card, and the cards that lift out of the
 * hand are the ones lying side by side.
 */
function setOf(
  hand: readonly Card[],
  id: string,
  need: number,
): readonly string[] {
  const sorted = sortHand(hand);
  const tapped = sorted.find((card) => card.id === id);
  const same =
    tapped === undefined
      ? []
      : sorted.filter((card) => card.rank === tapped.rank);
  const at = same.findIndex((card) => card.id === id);
  const from = Math.max(0, Math.min(at, same.length - need));
  return same.length < need
    ? []
    : same.slice(from, from + need).map((card) => card.id);
}

/** What the button under the hand says, per step. */
const STEP_BUTTONS: Readonly<Record<HandoverKind, string>> = {
  drop: T.dropButton,
  wish: T.wishButton,
  give: T.giveButton,
};

/** The line above the hand while a step before the round is being made. */
function stepHint(game: ArschlochGame, step: Handover): string {
  let hint: string;
  if (step.kind === "drop") {
    hint = T.dropHint(step.count);
  } else if (step.kind === "wish") {
    hint = `${T.wishHint(step.count, game.players[step.to].name)} ${T.wishProtected}`;
  } else {
    hint = T.giveHint(step.count, game.players[step.to].name);
  }
  return hint;
}

/**
 * The cards to show as unavailable.
 *
 * @param game - the game
 * @param seat - the seat the reader plays
 * @param onTurn - whether it is their turn at all
 * @param step - the step before the round, if one is theirs to make
 * @param picked - what is picked right now
 * @returns the ids to grey out
 * @remarks
 * Three different questions, and only two of them have unplayable cards in
 * them. While playing it is what cannot answer the pile; while wishing it is
 * what the loser is allowed to keep - three of a rank. Dropping and handing
 * back grey out nothing: anything may go, and it need not match.
 *
 * And nothing at all on somebody else turn: a greyed out hand would say "you
 * cannot" when the real answer is "not yet".
 */
function dimmedIds(
  game: ArschlochGame,
  seat: number,
  onTurn: boolean,
  step: Handover | null,
  picked: readonly string[],
): ReadonlySet<string> {
  const hand = game.players[seat]?.hand ?? [];
  let dimmed: readonly Card[] = [];
  if (step?.kind === "wish") {
    const may = new Set(wishableIds(game, step.to));
    dimmed = game.players[step.to].hand.filter((card) => !may.has(card.id));
  } else if (onTurn && step === null && game.phase === "playing") {
    const playable = new Set(playableIds(game, seat));
    // While leading, the first card picked settles the rank: a set is one rank,
    // and the rest of the hand is no longer part of this play.
    const rank = game.pile.length === 0 ? rankOf(hand, picked) : null;
    dimmed = hand.filter(
      (card) => !playable.has(card.id) || (rank !== null && card.rank !== rank),
    );
  }
  return new Set(dimmed.map((card) => card.id));
}

/**
 * What makes one situation different from the next.
 *
 * @param game - the game
 * @param seat - the seat the reader plays
 * @returns a key that changes whenever a selection would be stale
 * @remarks
 * The pile, the phase, whose turn it is, which step is open and how many cards
 * this seat holds. Anything that changes one of those changes what a chosen
 * card would mean - so the choice is dropped and made again.
 */
function situation(game: ArschlochGame, seat: number): string {
  const owed = game.owed[0];
  const hand = game.players[seat]?.hand ?? [];
  return [
    game.phase,
    game.round,
    game.active,
    game.pile.map((card) => card.id).join("+"),
    owed === undefined ? "" : `${owed.kind}${owed.from}${owed.to}${owed.count}`,
    hand.length,
  ].join("|");
}

/** The rank of what is picked, if anything is. */
function rankOf(hand: readonly Card[], picked: readonly string[]): Rank | null {
  const first = hand.find((card) => picked.includes(card.id));
  return first === undefined ? null : first.rank;
}
