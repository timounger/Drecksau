/**
 * One player's score sheet - the whole game in one picture.
 *
 * @module
 * @remarks
 * Four rows of eleven numbers and a lock at the end of each. What matters is
 * that the sheet shows the **cost** of a cross and not only its reward: the
 * places you would burn are struck through the moment you hover a cell, and
 * they stay struck through once you take it. Qwixx is lost by taking cheap
 * numbers over and over, and a sheet that only showed the crosses would hide
 * exactly that.
 */
"use client";

import type { ReactElement } from "react";
import {
  LOCK_AT,
  ROWS,
  ROW_INK,
  ROW_LENGTH,
  lastCross,
  numberAt,
  rowScore,
  sheetScore,
  type QwixxGame,
  type QwixxMove,
  type Row,
  type Sheet,
} from "@/games/qwixx/engine/state";
import { untilLock } from "@/games/qwixx/engine/moves";
import { ComputerBadge } from "@/online/computer-badge";
import { QWIXX_TEXTS as T } from "@/games/qwixx/i18n/texts";

/** Props of {@link QwixxSheet}. */
export type QwixxSheetProps = {
  readonly game: QwixxGame;
  /** Whose sheet this is. */
  readonly seat: number;
  /**
   * The move each cell would make, keyed `row-place`.
   *
   * @remarks
   * Empty for a sheet that is only being looked at. Building it outside keeps
   * this component from having to know whose turn it is or which step of it.
   */
  readonly offers?: ReadonlyMap<string, QwixxMove>;
  readonly onMove?: (move: QwixxMove) => void;
  /** True once the computer plays this seat, because its player left. */
  readonly isBotSeat?: boolean;
};

/**
 * Renders one score sheet.
 *
 * @param props - the game, the seat, and what may be clicked
 * @returns the sheet element
 */
export function QwixxSheet({
  game,
  seat,
  offers,
  onMove,
  isBotSeat = false,
}: QwixxSheetProps): ReactElement {
  const player = game.players[seat];
  return (
    <div
      data-testid={`qwixx-sheet-${seat}`}
      className="@container flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {player.name}
        </span>
        {isBotSeat && <ComputerBadge />}
        <span className="text-lg font-bold tabular-nums">
          {sheetScore(player.sheet, game.locked)}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.points}
        </span>
      </header>

      {ROWS.map((row) => (
        <RowLine
          key={row}
          game={game}
          sheet={player.sheet}
          row={row}
          offers={offers}
          onMove={onMove}
        />
      ))}

      <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{T.penalties}:</span>
        {Array.from({ length: 4 }, (unused, index) => (
          <span
            key={index}
            className={`inline-block h-4 w-4 rounded border text-center text-[0.6rem] leading-4 ${
              index < player.sheet.penalties
                ? "border-red-500 bg-red-500 text-white"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {index < player.sheet.penalties ? "×" : ""}
          </span>
        ))}
      </p>
    </div>
  );
}

/** One row of eleven numbers and its lock. */
function RowLine({
  game,
  sheet,
  row,
  offers,
  onMove,
}: {
  readonly game: QwixxGame;
  readonly sheet: Sheet;
  readonly row: Row;
  readonly offers?: ReadonlyMap<string, QwixxMove>;
  readonly onMove?: (move: QwixxMove) => void;
}): ReactElement {
  const crossed = new Set(sheet.crosses[row]);
  const last = lastCross(sheet, row);
  const shut = game.locked[row];
  const left = untilLock(sheet, row);
  return (
    <div className="flex items-center gap-1">
      <span
        aria-hidden
        className="h-4 w-2 shrink-0 rounded-sm"
        style={{ backgroundColor: ROW_INK[row] }}
      />
      <div className="flex min-w-0 flex-1 gap-0.5">
        {Array.from({ length: ROW_LENGTH }, (unused, place) => {
          const key = `${row}-${place}`;
          const offer = offers?.get(key);
          const isCrossed = crossed.has(place);
          // Burnt: to the left of the rightmost cross and never taken.
          const burnt = !isCrossed && place < last;
          return (
            <Cell
              key={key}
              row={row}
              place={place}
              crossed={isCrossed}
              burnt={burnt || (shut && !isCrossed)}
              offer={offer}
              onMove={onMove}
            />
          );
        })}
      </div>
      {/* The points a row is worth, and - only when it is actually true - that
          the lock is now within reach. Everything else is noise beside eleven
          numbers, which is also why this is the first thing to go when the
          sheet gets narrow: it can be worked out from the crosses, the row
          itself cannot. */}
      <span className="hidden w-24 shrink-0 text-right text-[0.65rem] text-zinc-400 @[27.5rem]:block">
        {shut ? (
          T.locked
        ) : (
          <>
            {T.rowPoints(rowScore(sheet.crosses[row].length))}
            {left === 0 && (
              <strong className="ml-1" style={{ color: ROW_INK[row] }}>
                {T.lockOpen}
              </strong>
            )}
          </>
        )}
      </span>
    </div>
  );
}

/** One number on the sheet. */
function Cell({
  row,
  place,
  crossed,
  burnt,
  offer,
  onMove,
}: {
  readonly row: Row;
  readonly place: number;
  readonly crossed: boolean;
  readonly burnt: boolean;
  readonly offer?: QwixxMove;
  readonly onMove?: (move: QwixxMove) => void;
}): ReactElement {
  const value = numberAt(row, place);
  const open = offer !== undefined && onMove !== undefined;
  // Eleven numbers on one line, whatever the width. They share the space
  // rather than breaking onto a second line, so the row stays a row.
  //
  // The smaller type is a last resort and deliberately kicks in late: a cell
  // narrowed to about 17px still holds a two-digit number at the normal size,
  // and eleven of those need 13.5rem inside the sheet - narrower than any real
  // phone. Shrinking the numbers any sooner would cost legibility to solve a
  // problem that is not there yet.
  const shape =
    "aspect-square min-w-0 max-w-7 flex-1 rounded text-[0.6rem] font-bold tabular-nums transition-colors @[13.5rem]:text-xs";
  let look: string;
  if (crossed) {
    look = "text-white";
  } else if (burnt) {
    look =
      "bg-zinc-100 text-zinc-300 line-through dark:bg-zinc-800 dark:text-zinc-600";
  } else if (open) {
    look =
      "cursor-pointer ring-2 ring-offset-1 hover:brightness-110 text-white";
  } else {
    look = "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400";
  }
  const ink = crossed || open ? ROW_INK[row] : undefined;
  return (
    <button
      type="button"
      data-testid={`qwixx-cell-${row}-${place}`}
      disabled={!open}
      onClick={() => (open ? onMove(offer) : undefined)}
      title={place === LOCK_AT ? `${value} - Schloss` : String(value)}
      className={`${shape} ${look} ${open ? "" : "cursor-default"}`}
      style={ink === undefined ? undefined : { backgroundColor: ink }}
    >
      {crossed ? "×" : value}
    </button>
  );
}
