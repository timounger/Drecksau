/**
 * The half of the screen the player acts on: the board, the hand, the choices.
 *
 * @module
 * @remarks
 * Every move of Dog is the same three questions - which card, which piece, and
 * which of the things that card can do with it - and this asks them in that
 * order and no other. The card first, because that is what is in the hand; then
 * the piece, by clicking it on the board where it stands; and only then, and
 * only if there is more than one, what it does with it.
 *
 * Nothing is offered that the referee would refuse. The lists come out of
 * ./engine/moves, so a button that exists is a move that works - which is worth
 * more in this game than in most, because the rules about the start field, the
 * home and the seven are exactly the ones a player forgets.
 */
"use client";

import { useState, type ReactElement } from "react";
import { DogBoard } from "@/games/dog/components/dog-board";
import {
  HOME_DEPTH,
  partnerOf,
  teamOf,
  teamPlay,
} from "@/games/dog/engine/board";
import {
  CARD_FACES,
  CARD_NAMES,
  WILD_CHOICES,
  isSpecial,
  rankOrder,
  type Card,
  type Rank,
} from "@/games/dog/engine/cards";
import {
  actsFor,
  homeCount,
  playableCards,
  sevenChoices,
} from "@/games/dog/engine/moves";
import type { Act, DogGame, DogMove, Step } from "@/games/dog/engine/state";
import { DOG_TEXTS as T, SEAT_COLOURS } from "@/games/dog/i18n/texts";

/** How many points a seven has to spend. */
const SEVEN = 7;

/** What the play area needs. */
export type PlayAreaProps = {
  readonly game: DogGame;
  /** The seat the player sits in. */
  readonly mySeat: number;
  /** Plays a move. */
  readonly onMove: (move: DogMove) => void;
};

/** What the player has picked so far. */
type Pick = {
  readonly card: number | null;
  readonly as: Rank | null;
  readonly piece: number | null;
  readonly parts: readonly Step[];
};

/** Nothing picked. */
const NOTHING: Pick = { card: null, as: null, piece: null, parts: [] };

/**
 * The board, the hand and whatever has to be chosen next.
 *
 * @param props - the game, the seat and the way to play a move
 * @returns the play area
 */
export function PlayArea({
  game,
  mySeat,
  onMove,
}: PlayAreaProps): ReactElement {
  const [pick, setPick] = useState<Pick>(NOTHING);
  const mine = game.players[mySeat];
  const hand = [...(mine?.hand ?? [])].sort(
    (a, b) => rankOrder(a.rank) - rankOrder(b.rank),
  );
  const passing = game.phase === "passing";
  const myTurn = passing
    ? game.given[mySeat] === null
    : game.phase === "playing" && game.turn === mySeat;
  const playable = new Set(
    passing ? hand.map((card) => card.id) : playableCards(game, mySeat),
  );
  // Nothing to play: at a table with partners that is the end of the round for
  // this seat, and where everybody plays alone it is a card swapped for a new
  // one - so there the whole hand stays clickable.
  const stuck = myTurn && !passing && playable.size === 0 && hand.length > 0;
  const swapping = stuck && !teamPlay(game.seats);
  const seven = pick.as === "7";
  const acts = pick.as === null || seven ? [] : actsFor(game, mySeat, pick.as);
  const steps = seven ? sevenChoices(game, mySeat, pick.parts) : [];
  const pickable = myTurn
    ? seven
      ? [...new Set(steps.map((step) => step.piece))]
      : [...new Set(acts.map((act) => pieceOf(act)).filter((id) => id >= 0))]
    : [];
  const chosen =
    pick.piece === null
      ? []
      : seven
        ? steps.filter((step) => step.piece === pick.piece)
        : acts.filter((act) => pieceOf(act) === pick.piece);

  /** Lays a card, or picks it up again. */
  const choose = (card: Card) => {
    const same = pick.card === card.id;
    if (swapping) {
      onMove({ kind: "redraw", card: card.id });
      setPick(NOTHING);
      return;
    }
    setPick(
      same
        ? NOTHING
        : {
            card: card.id,
            as: card.rank === "joker" ? null : card.rank,
            piece: null,
            parts: [],
          },
    );
    if (passing && !same) {
      onMove({ kind: "give", card: card.id });
      setPick(NOTHING);
    }
  };

  /** Plays what has been picked. */
  const finish = (act: Act) => {
    const card = pick.card;
    const as = pick.as;
    if (card !== null && as !== null) {
      onMove({ kind: "play", card, as, act });
    }
    setPick(NOTHING);
  };

  /** Adds one part to a seven, and plays it once all seven are spent. */
  const addPart = (step: Step) => {
    const parts = [...pick.parts, step];
    const spent = parts.reduce((sum, part) => sum + part.steps, 0);
    if (spent >= SEVEN) {
      const card = pick.card;
      if (card !== null) {
        onMove({ kind: "play", card, as: "7", act: { kind: "seven", parts } });
      }
      setPick(NOTHING);
    } else {
      setPick({ ...pick, piece: null, parts });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <DogBoard
        game={game}
        mySeat={mySeat}
        pickable={pickable}
        picked={pick.piece}
        onPick={(piece) => setPick({ ...pick, piece })}
      />

      <Standings game={game} mySeat={mySeat} />

      {myTurn && pick.card !== null && (
        <div
          data-testid="dog-choices"
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950/40"
        >
          {pick.as === null ? (
            <>
              <span className="font-semibold">{T.jokerAs}</span>
              {WILD_CHOICES.map((rank) => (
                <Choice
                  key={rank}
                  label={CARD_NAMES[rank]}
                  onClick={() => setPick({ ...pick, as: rank })}
                />
              ))}
            </>
          ) : seven ? (
            <>
              <span className="font-semibold">
                {T.sevenLeft(
                  SEVEN - pick.parts.reduce((sum, part) => sum + part.steps, 0),
                )}
              </span>
              {(pick.piece === null ? [] : chosen).map((step) => (
                <Choice
                  key={`${String((step as Step).piece)}-${String((step as Step).steps)}-${String((step as Step).home)}`}
                  label={stepLabel(step as Step)}
                  onClick={() => addPart(step as Step)}
                />
              ))}
              {pick.piece === null && <span>{T.pickPiece}</span>}
            </>
          ) : (
            <>
              <span className="font-semibold">
                {pick.piece === null ? T.pickPiece : T.pickCard}
              </span>
              {(pick.piece === null
                ? acts.filter((act) => pieceOf(act) < 0)
                : (chosen as readonly Act[])
              ).map((act) => (
                <Choice
                  key={JSON.stringify(act)}
                  label={actLabel(game, act)}
                  onClick={() => finish(act)}
                />
              ))}
            </>
          )}
          <button
            type="button"
            onClick={() => setPick(NOTHING)}
            className="ml-auto cursor-pointer rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-white dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {T.cancel}
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-semibold">
          {passing ? T.passYours : T.yourCards}
        </h2>
        <ul data-testid="dog-hand" className="flex flex-wrap gap-2">
          {hand.map((card) => (
            <li key={card.id}>
              <CardButton
                card={card}
                held={pick.card === card.id}
                enabled={myTurn && (playable.has(card.id) || swapping)}
                onClick={() => choose(card)}
              />
            </li>
          ))}
          {hand.length === 0 && (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">
              {T.waiting}
            </li>
          )}
        </ul>
        {stuck && swapping && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            {T.redrawHint}
          </p>
        )}
        {stuck && !swapping && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.foldHint}
            </span>
            <button
              type="button"
              data-testid="dog-fold"
              onClick={() => onMove({ kind: "fold" })}
              className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {T.fold}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/** How the two teams stand. */
function Standings({
  game,
  mySeat,
}: {
  readonly game: DogGame;
  readonly mySeat: number;
}): ReactElement {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {game.players.map((player, seat) => (
        <span
          key={player.name}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: SEAT_COLOURS[seat].solid }}
          />
          <span className={seat === mySeat ? "font-semibold" : ""}>
            {player.name}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {T.home(homeCount(game, seat), HOME_DEPTH)}
          </span>
          {teamPlay(game.seats) && (
            <span className="text-zinc-400 dark:text-zinc-500">
              {T.team(teamOf(seat, game.seats) + 1)}
              {seat === partnerOf(mySeat, game.seats) ? ` - ${T.partner}` : ""}
            </span>
          )}
          <span className="tabular-nums text-zinc-400 dark:text-zinc-500">
            {player.hand.length}
          </span>
        </span>
      ))}
    </div>
  );
}

/** One card of the hand. */
function CardButton({
  card,
  held,
  enabled,
  onClick,
}: {
  readonly card: Card;
  readonly held: boolean;
  readonly enabled: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const red = isSpecial(card.rank);
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      data-testid={`dog-card-${String(card.id)}`}
      title={CARD_NAMES[card.rank]}
      className={`flex h-16 w-12 cursor-pointer flex-col items-center justify-center rounded-lg border-2 text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        held
          ? "-translate-y-1 border-amber-500 bg-amber-100 text-amber-900"
          : red
            ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-200"
            : "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200"
      }`}
    >
      <span>{CARD_FACES[card.rank]}</span>
      <span className="text-[9px] font-medium opacity-70">
        {CARD_NAMES[card.rank]}
      </span>
    </button>
  );
}

/** One thing that can be chosen. */
function Choice({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {label}
    </button>
  );
}

/** Which piece an act moves, or below zero when it moves none. */
function pieceOf(act: Act): number {
  let id = -1;
  if (act.kind === "start" || act.kind === "walk" || act.kind === "swap") {
    id = act.piece;
  }
  return id;
}

/** What an act is called on its button. */
function actLabel(game: DogGame, act: Act): string {
  let said: string = T.nothing;
  switch (act.kind) {
    case "start":
      said = T.outOfKennel;
      break;
    case "walk":
      said = act.home
        ? T.intoHome(act.steps)
        : act.backwards
          ? T.stepsBack(act.steps)
          : T.steps(act.steps);
      break;
    case "swap": {
      const other = game.pieces.find((piece) => piece.id === act.other);
      said = T.swapWith(
        other === undefined
          ? "?"
          : (game.players[other.seat]?.name ?? SEAT_COLOURS[other.seat].name),
      );
      break;
    }
    case "seven":
      said = T.steps(SEVEN);
      break;
    default:
      said = T.nothing;
  }
  return said;
}

/** What one part of a seven is called on its button. */
function stepLabel(step: Step): string {
  return step.home ? T.intoHome(step.steps) : T.steps(step.steps);
}
