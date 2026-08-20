/**
 * The table: the grill, the dice, and what everybody has won so far.
 *
 * @module
 * @remarks
 * Three things have to be readable at a glance, and they are the three the
 * decision hangs on: what the dice show, what is already set aside (and
 * therefore out of bounds), and whether a worm is among it. Without a worm the
 * total is worth nothing at all, so that is said in words rather than left to
 * be spotted among the dice.
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import { faceName, legalMoves } from "@/games/heckmeck/engine/moves";
import {
  SELF_NAME,
  WORM,
  canStop,
  grillOffer,
  hasWorm,
  pickable,
  stealable,
  takenFaces,
  topTile,
  total,
  wormCount,
  wormsOn,
  type HeckmeckGame,
  type HeckmeckMove,
} from "@/games/heckmeck/engine/state";
import { ComputerBadge } from "@/online/computer-badge";
import { HECKMECK_TEXTS as T } from "@/games/heckmeck/i18n/texts";

/** Props of {@link HeckmeckTable}. */
export type HeckmeckTableProps = {
  readonly game: HeckmeckGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: HeckmeckMove) => void;
  /**
   * The turn clock, shown beside whose turn it is.
   *
   * @remarks
   * Passed in rather than built here, because only an online table has one:
   * offline nobody is waiting on anybody.
   */
  readonly clock?: ReactNode;
  /**
   * Seats the computer plays because their player left, by seat index.
   *
   * @remarks
   * Only online: offline every opponent is a computer anyway, and marking them
   * all would say nothing.
   */
  readonly botSeats?: readonly number[];
};

/**
 * Renders the whole table.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function HeckmeckTable({
  game,
  mySeat,
  onMove,
  clock,
  botSeats = [],
}: HeckmeckTableProps): ReactElement {
  const mine =
    mySeat !== null && mySeat === game.active && game.phase !== "gameOver";
  const moves = mine && mySeat !== null ? legalMoves(game, mySeat) : [];

  return (
    <section className="flex flex-col gap-4">
      <Grill game={game} />
      <Turn
        game={game}
        moves={moves}
        mine={mine}
        onMove={onMove}
        clock={clock}
      />
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {game.players.map((player, seat) => (
          <li key={player.name + seat}>
            <Pile
              game={game}
              seat={seat}
              isMe={seat === mySeat}
              isBotSeat={botSeats.includes(seat)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The tiles still to be had, and the ones that are gone for good. */
function Grill({ game }: { readonly game: HeckmeckGame }): ReactElement {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.grill}</h2>
      {game.grill.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {T.grillEmpty}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1">
          {game.grill.map((tile) => (
            <li key={tile}>
              <Tile tile={tile} />
            </li>
          ))}
        </ul>
      )}
      {game.burnt.length > 0 && (
        <p className="flex flex-wrap items-center gap-1 text-xs text-zinc-400">
          <span>{T.burnt}:</span>
          {game.burnt.map((tile) => (
            <span key={tile} className="tabular-nums line-through">
              {tile}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** One tile, with its worms on it. */
function Tile({ tile }: { readonly tile: number }): ReactElement {
  return (
    <span
      data-testid={`heckmeck-tile-${tile}`}
      className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-100"
    >
      <span className="text-sm leading-none font-bold tabular-nums">
        {tile}
      </span>
      <span className="text-[0.6rem] leading-none">
        {"\u{1F41B}".repeat(wormsOn(tile))}
      </span>
    </span>
  );
}

/** The dice, what is set aside, and the buttons. */
function Turn({
  game,
  moves,
  mine,
  onMove,
  clock,
}: {
  readonly game: HeckmeckGame;
  readonly moves: readonly HeckmeckMove[];
  readonly mine: boolean;
  readonly onMove: (move: HeckmeckMove) => void;
  readonly clock?: ReactNode;
}): ReactElement {
  const taken = takenFaces(game.kept);
  const sum = total(game.kept);
  const offer = grillOffer(game);
  // What the line above the buttons says. "Weiter würfeln oder aufhören?" is
  // only true when stopping is actually one of the two - and the case that
  // reads like a broken screen is having the points for a chip but no worm, so
  // that one gets said out loud.
  const hint =
    game.phase === "pick"
      ? T.pickHint
      : canStop(game)
        ? T.decidePrompt
        : offer !== null || stealable(game).length > 0
          ? T.wormMissing(offer)
          : T.nothingToTake;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">
          {mine ? T.yourTurn : T.waitingFor(game.players[game.active].name)}
        </p>
        {clock}
      </div>

      <div>
        <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
          {T.dice}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {game.dice.map((face, index) => (
            <li key={index}>
              <Die face={face} spent={taken.has(face)} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
          {T.kept} · {T.sum(sum)}
        </p>
        {game.kept.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T.keptNone}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {game.kept.map((face, index) => (
              <li key={index}>
                <Die face={face} kept />
              </li>
            ))}
          </ul>
        )}
        <p
          className={`mt-1 text-xs font-medium ${
            hasWorm(game.kept)
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {hasWorm(game.kept) ? T.hasWorm : T.noWormYet}
        </p>
      </div>

      {mine && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
          <div className="flex flex-wrap gap-2">
            {game.phase === "pick" &&
              pickable(game).map((face) => (
                <button
                  key={face}
                  type="button"
                  data-testid={`heckmeck-pick-${face}`}
                  onClick={() => onMove({ kind: "pick", face })}
                  className="cursor-pointer rounded-lg border border-indigo-400 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-100"
                >
                  {T.pickFace(
                    faceName(face),
                    game.dice.filter((die) => die === face).length,
                  )}
                </button>
              ))}
            {moves.map((move, index) => (
              <ActionButton
                key={index}
                game={game}
                move={move}
                offer={offer}
                sum={sum}
                onMove={onMove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** One of the buttons that ends or continues a turn. */
function ActionButton({
  game,
  move,
  offer,
  sum,
  onMove,
}: {
  readonly game: HeckmeckGame;
  readonly move: HeckmeckMove;
  readonly offer: number | null;
  readonly sum: number;
  readonly onMove: (move: HeckmeckMove) => void;
}): ReactElement | null {
  let button: ReactElement | null = null;
  if (move.kind === "roll") {
    button = (
      <button
        type="button"
        data-testid="heckmeck-roll"
        onClick={() => onMove(move)}
        className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {T.rollOn(game.dice.length)}
      </button>
    );
  } else if (move.kind === "take" && offer !== null) {
    button = (
      <button
        type="button"
        data-testid="heckmeck-take"
        onClick={() => onMove(move)}
        className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {T.takeTile(offer)}
      </button>
    );
  } else if (move.kind === "steal") {
    button = (
      <button
        type="button"
        data-testid={`heckmeck-steal-${move.seat}`}
        onClick={() => onMove(move)}
        className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        {T.stealFrom(sum, game.players[move.seat].name)}
      </button>
    );
  }
  return button;
}

/** One die. */
function Die({
  face,
  spent = false,
  kept = false,
}: {
  readonly face: number;
  readonly spent?: boolean;
  readonly kept?: boolean;
}): ReactElement {
  const look = kept
    ? "border-zinc-400 bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
    : spent
      ? "border-zinc-200 bg-zinc-50 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
      : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-100";
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-base font-bold tabular-nums ${look}`}
    >
      {face === WORM ? "\u{1F41B}" : face}
    </span>
  );
}

/** One player's pile of tiles. */
function Pile({
  game,
  seat,
  isMe,
  isBotSeat,
}: {
  readonly game: HeckmeckGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
}): ReactElement {
  const player = game.players[seat];
  const top = topTile(player);
  return (
    <article
      data-testid={`heckmeck-pile-${seat}`}
      className={`flex h-full flex-col gap-1 rounded-2xl border p-3 text-sm ${
        seat === game.active && game.phase !== "gameOver"
          ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {player.name}
          {/* Offline the seat is already called "Du" - saying so twice reads
              like a bug. Online it is your own name and the marker earns its
              place. */}
          {isMe && player.name !== SELF_NAME && " (Du)"}
        </span>
        {isBotSeat && <ComputerBadge />}
        <span className="text-lg font-bold tabular-nums">
          {wormCount(player)}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.worms}
        </span>
      </header>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {top === null
          ? T.stackEmpty
          : `${player.stack.length} × ${T.stack}, ${T.topTile(top)}`}
      </p>
      <ul className="flex flex-wrap gap-1">
        {player.stack.map((tile, index) => (
          <li
            key={tile}
            className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${
              index === player.stack.length - 1
                ? "bg-amber-200 font-bold text-amber-950"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {tile}
          </li>
        ))}
      </ul>
    </article>
  );
}
