/**
 * The table: the dice, what is being asked of you, and every sheet.
 *
 * @module
 * @remarks
 * The panel above the sheets says which of the two steps a turn is in, because
 * they are answered by different people: the white dice are everybody's, the
 * colour die belongs to whoever rolled. Getting that wrong is the one thing a
 * newcomer to Qwixx reliably does.
 */
"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";
import { legalMoves, skipped } from "@/games/qwixx/engine/moves";
import {
  ROW_INK,
  ROW_LABELS,
  placeOf,
  whiteSum,
  type QwixxGame,
  type QwixxMove,
} from "@/games/qwixx/engine/state";
import { QWIXX_TEXTS as T } from "@/games/qwixx/i18n/texts";
import { seatsFromMine } from "@/online/seat-order";
import { QwixxSheet } from "./qwixx-sheet";

/** Props of {@link QwixxTable}. */
export type QwixxTableProps = {
  readonly game: QwixxGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: QwixxMove) => void;
  /** True while a computer player is being waited for. */
  readonly busy?: boolean;
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
 * Renders the dice, the step and all the sheets.
 *
 * @param props - the game and who is reading it
 * @returns the table element
 */
export function QwixxTable({
  game,
  mySeat,
  onMove,
  busy = false,
  clock,
  botSeats = [],
}: QwixxTableProps): ReactElement {
  const mine = mySeat !== null && !busy && game.phase !== "gameOver";
  const moves = useMemo(
    () => (mine && mySeat !== null ? legalMoves(game, mySeat) : []),
    [game, mine, mySeat],
  );
  const offers = useMemo(() => cellOffers(game, moves), [game, moves]);
  const order = seatsFromMine(game.players.length, mySeat);
  const canPass = moves.some((move) => move.kind === "pass");
  const waiting = game.decided.filter((done) => !done).length;
  const penalty =
    game.phase === "colour" && mySeat === game.active && !game.activeCrossed;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Dice game={game} />
        <div>
          <h2 className="text-sm font-semibold">
            {game.phase === "white" ? T.phaseWhite : T.phaseColour}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {game.phase === "white" ? T.phaseWhiteHint : T.phaseColourHint}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm">{status(game, mySeat, waiting)}</p>
          {clock}
        </div>
        {mine && canPass && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="qwixx-pass"
              onClick={() => onMove({ kind: "pass" })}
              className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {T.pass}
            </button>
            {penalty && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {T.passWarning}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {order.map((seat) => (
          <QwixxSheet
            key={game.players[seat].name + seat}
            game={game}
            seat={seat}
            offers={seat === mySeat && mine ? offers : undefined}
            onMove={seat === mySeat && mine ? onMove : undefined}
            isBotSeat={botSeats.includes(seat)}
          />
        ))}
      </div>
    </section>
  );
}

/** What the dice show right now. */
function Dice({ game }: { readonly game: QwixxGame }): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {game.dice.white.map((die, index) => (
        <span
          key={index}
          data-testid={`qwixx-white-${index}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-zinc-300 bg-white text-lg font-bold tabular-nums text-zinc-900 dark:border-zinc-600"
        >
          {die}
        </span>
      ))}
      <span className="mr-2 text-sm font-semibold tabular-nums">
        = {whiteSum(game.dice)}
      </span>
      {(["rot", "gelb", "gruen", "blau"] as const).map((row) => {
        const die = game.dice.colours[row];
        return die === null ? null : (
          <span
            key={row}
            data-testid={`qwixx-die-${row}`}
            title={ROW_LABELS[row]}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold tabular-nums text-white"
            style={{ backgroundColor: ROW_INK[row] }}
          >
            {die}
          </span>
        );
      })}
    </div>
  );
}

/** The one line that says what is being waited for. */
function status(
  game: QwixxGame,
  mySeat: number | null,
  waiting: number,
): string {
  let line: string;
  if (game.phase === "gameOver") {
    line = T.gameOverTitle;
  } else if (
    game.phase === "white" &&
    mySeat !== null &&
    game.decided[mySeat]
  ) {
    line = `${T.alreadyDecided} ${T.waitingForOthers(waiting)}`;
  } else if (game.phase === "colour" && mySeat !== game.active) {
    line = T.waitingFor(game.players[game.active].name);
  } else {
    line =
      mySeat === game.active
        ? T.youRoll
        : T.activeIs(game.players[game.active].name);
  }
  return line;
}

/**
 * Which cell each legal move would cross.
 *
 * @remarks
 * Built here rather than in the sheet, so the sheet stays a picture of a sheet
 * and knows nothing about turns. A colour move can land in the same row as the
 * white one; the map is keyed by cell, so whichever is offered wins - and the
 * white step and the colour step never run at the same time anyway.
 */
function cellOffers(
  game: QwixxGame,
  moves: readonly QwixxMove[],
): ReadonlyMap<string, QwixxMove> {
  const offers = new Map<string, QwixxMove>();
  for (const move of moves) {
    if (move.kind === "white") {
      offers.set(`${move.row}-${placeOf(move.row, whiteSum(game.dice))}`, move);
    } else if (move.kind === "colour") {
      const die = game.dice.colours[move.row];
      const white = game.dice.white[move.white];
      if (die !== null) {
        offers.set(`${move.row}-${placeOf(move.row, die + white)}`, move);
      }
    }
  }
  return offers;
}

/** Re-exported so the game screen can warn about a costly cross. */
export { skipped };
