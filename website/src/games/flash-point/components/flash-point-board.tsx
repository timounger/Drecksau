/**
 * The fireground, laid out the way the board is.
 *
 * @module
 * @remarks
 * Each room is painted its own colour, the grass runs round the outside, the
 * two vehicle bays and the four ambulance bays sit on it, and every square
 * carries its coordinate in the corner. None of that is decoration: at a real
 * table nobody thinks "row four, column six", they think "the blue kitchen",
 * and a grid of identical squares makes people count instead of look.
 *
 * Walls are drawn **on the borders between squares**, which is the only honest
 * way round - a wall belongs to the line between two rooms, not to either one.
 * Each square draws only its top and left edge, so a wall between two of them is
 * drawn once rather than twice; drawn twice, it looks thicker in some places
 * than others.
 *
 * Beside the board are the two places markers end up, exactly as the board
 * prints them: **Platz für Gerettete** and the **Friedhof**. They are the score,
 * and having them as spaces rather than as two numbers in a status line is what
 * makes the score feel like the people it counts.
 *
 * **You work on the picture, not on a row of buttons.** Tap a square and the
 * thing that square affords happens. An intact wall can only be chopped, a shut
 * door can only be opened, a burning square you stand on can only be hosed - in
 * all of those there is nothing to choose and so nothing to ask about.
 *
 * Only two situations are genuinely two things at once, and only those ask: a
 * **neighbour that is burning** (walk in for 2, or hose it for 1) and an **open
 * door** (step through, or pull it shut). Then a short row appears naming both
 * with their price. Guessing there would eventually guess wrong with somebody's
 * last action point, which is the one place in this game where being wrong
 * costs a life.
 */
"use client";

import { useState, type ReactElement } from "react";
import {
  AMBULANCE,
  COLS,
  ENGINE_BAYS,
  FLOORS,
  OUTSIDE_FLOOR,
  ROWS,
  edgeBetween,
  edgeKey,
  isInside,
  roomOf,
  type Cell,
} from "@/games/flash-point/engine/board";
import { legalMoves, stepCost } from "@/games/flash-point/engine/moves";
import {
  activePlayer,
  blazeAt,
  isBroken,
  playersOn,
  poiAt,
  sameCell,
  type Firefighter,
  type FlashPointGame,
  type FlashPointMove,
} from "@/games/flash-point/engine/state";
import { FLASH_POINT_TEXTS as T } from "@/games/flash-point/i18n/texts";

/** The colours the board is painted in, which do not follow the page's theme. */
const WALL = "#f2f4f5";
const WALL_BROKEN = "#b9c0c4";
const DOOR_SHUT = "#e8a33d";
const FIRE = "#d63b22";
const SMOKE = "#8e979c";

/** What each thing costs, for the labels that name a price. */
const COST_HOSE = 1;
const COST_DOOR = 1;
const COST_AXE = 2;
const COST_FREE = 0;

/** One thing a tap on a square could mean. */
type Option = {
  readonly move: FlashPointMove;
  readonly label: string;
  readonly cost: number;
};

/** Props of {@link FlashPointBoard}. */
export type FlashPointBoardProps = {
  readonly game: FlashPointGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: FlashPointMove) => void;
};

/**
 * Renders the whole fireground.
 *
 * @param props - the fire, who is reading it and where moves go
 * @returns the board element
 */
export function FlashPointBoard({
  game,
  mySeat,
  onMove,
}: FlashPointBoardProps): ReactElement {
  const [asking, setAsking] = useState<Cell | null>(null);
  const mine = mySeat !== null && game.active === mySeat;
  const moves = mine ? legalMoves(game, game.active) : [];
  const choices = asking === null ? [] : optionsAt(game, moves, asking);

  const tap = (cell: Cell) => {
    const options = optionsAt(game, moves, cell);
    if (options.length === 1) {
      setAsking(null);
      onMove(options[0].move);
    } else if (options.length > 1) {
      setAsking(cell);
    }
  };

  const take = (option: Option) => {
    setAsking(null);
    onMove(option.move);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto">
        <Tallies game={game} />
        <div
          className="grid flex-1 gap-0 rounded-lg p-0"
          style={{
            background: OUTSIDE_FLOOR,
            gridTemplateColumns: `repeat(${COLS + 2}, minmax(2.2rem, 1fr))`,
          }}
        >
          {rows().map((row) =>
            cols().map((col) => (
              <Square
                key={`${row},${col}`}
                game={game}
                cell={{ row, col }}
                options={optionsAt(game, moves, { row, col })}
                asking={asking !== null && sameCell(asking, { row, col })}
                onTap={tap}
              />
            )),
          )}
        </div>
      </div>

      {mine && (
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {choices.length > 0 ? (
            <div
              data-testid="fp-choice"
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="text-sm font-semibold">
                {T.choose(placeName(asking))}
              </span>
              {choices.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  data-testid={`fp-do-${option.move.kind}`}
                  onClick={() => take(option)}
                  className="cursor-pointer rounded-lg border border-red-500 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-900 dark:bg-red-950/50 dark:text-red-100"
                >
                  {option.label}
                  <span className="ml-1.5 font-normal opacity-70">
                    {option.cost} AP
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAsking(null)}
                className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
              >
                {T.cancel}
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.hintTap}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-testid="fp-end"
              onClick={() => onMove({ kind: "endTurn" })}
              className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {T.endTurn}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** How the square being asked about is named in the question. */
function placeName(cell: Cell | null): string {
  const dot = "\u{00B7}";
  return cell === null
    ? ""
    : `${roomOf(cell) ?? T.outside} ${cell.row}${dot}${cell.col}`;
}

/**
 * Everything a tap on one square could mean, right now.
 *
 * @param game - the fire
 * @param moves - what the firefighter on turn may legally do
 * @param cell - the square being tapped
 * @returns the meanings: none, one, or two
 * @remarks
 * Built by asking the referee rather than by reasoning about walls and fire a
 * second time. Whatever is not in {@link legalMoves} cannot be offered, and
 * whatever is in it is offered - so the picture and the rules cannot drift
 * apart, which is exactly how a destroyed door once stayed tappable.
 */
function optionsAt(
  game: FlashPointGame,
  moves: readonly FlashPointMove[],
  cell: Cell,
): readonly Option[] {
  const me = activePlayer(game);
  const found: Option[] = [];
  for (const move of moves) {
    const option = meaningOf(game, me, move, cell);
    if (option !== null) {
      found.push(option);
    }
  }
  return found;
}

/** What one legal move would mean if this square were tapped, if anything. */
function meaningOf(
  game: FlashPointGame,
  me: Firefighter,
  move: FlashPointMove,
  cell: Cell,
): Option | null {
  let found: Option | null = null;
  switch (move.kind) {
    case "move":
      if (sameCell(move.to, cell)) {
        found = {
          move,
          label: T.actMove,
          cost: stepCost(game, cell) ?? COST_HOSE,
        };
      }
      break;
    case "extinguish":
      if (sameCell(move.at, cell)) {
        found = { move, label: T.actExtinguish, cost: COST_HOSE };
      }
      break;
    case "door":
      if (sameCell(move.to, cell)) {
        found = { move, label: doorLabel(game, me, cell), cost: COST_DOOR };
      }
      break;
    case "chop":
      if (sameCell(move.to, cell)) {
        found = { move, label: T.actChop, cost: COST_AXE };
      }
      break;
    case "carry":
      if (sameCell(me.at, cell)) {
        found = {
          move,
          label: me.carrying ? T.drop : T.carry,
          cost: COST_FREE,
        };
      }
      break;
    default:
      break;
  }
  return found;
}

/** Whether tapping through this door would open it or shut it. */
function doorLabel(game: FlashPointGame, me: Firefighter, cell: Cell): string {
  const state = game.doors[edgeKey(me.at, cell)] ?? "closed";
  return state === "open" ? T.actDoorClose : T.actDoorOpen;
}

/**
 * The two places markers end up, down the left edge of the board.
 *
 * @remarks
 * The board prints them and so does this: the rescued go on one, the dead on
 * the other. Seven on the first is the win and three on the second is the loss,
 * which is easier to feel as two filling rows than as two numbers in a line of
 * status text.
 */
function Tallies({ game }: { readonly game: FlashPointGame }): ReactElement {
  return (
    <div
      className="flex w-16 shrink-0 flex-col justify-between rounded-lg p-1.5 text-center"
      style={{ background: "#5d6a70" }}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] leading-tight font-bold text-white/90">
          {T.saved}
        </span>
        <span className="text-lg" aria-hidden>
          {"\u{1F6E1}\u{FE0F}"}
        </span>
        <span
          data-testid="fp-rescued"
          className="flex flex-wrap justify-center gap-0.5"
        >
          {dots(game.rescued, "bg-amber-400")}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span
          data-testid="fp-dead"
          className="flex flex-wrap justify-center gap-0.5"
        >
          {dots(game.dead, "bg-zinc-900")}
        </span>
        <span className="text-lg" aria-hidden>
          {"\u{271D}\u{FE0F}"}
        </span>
        <span className="text-[9px] leading-tight font-bold text-white/90">
          {T.graveyard}
        </span>
      </div>
    </div>
  );
}

/** One dot per person, so the tally reads as people rather than as a number. */
function dots(count: number, colour: string): readonly ReactElement[] {
  return Array.from({ length: count }, (unused, index) => (
    <span key={index} className={`h-2.5 w-2.5 rounded-full ${colour}`} />
  ));
}

/** Rows drawn, the ring included. */
function rows(): readonly number[] {
  return Array.from({ length: ROWS + 2 }, (unused, index) => index);
}

/** Columns drawn, the ring included. */
function cols(): readonly number[] {
  return Array.from({ length: COLS + 2 }, (unused, index) => index);
}

/** Whether an ambulance stands on this square. */
function isAmbulance(cell: Cell): boolean {
  return AMBULANCE.some((bay) => sameCell(bay, cell));
}

/** Whether a fire engine stands on this square. */
function isEngineBay(cell: Cell): boolean {
  return ENGINE_BAYS.some((bay) => sameCell(bay, cell));
}

/** One square of the fireground. */
function Square({
  game,
  cell,
  options,
  asking,
  onTap,
}: {
  readonly game: FlashPointGame;
  readonly cell: Cell;
  readonly options: readonly Option[];
  readonly asking: boolean;
  readonly onTap: (cell: Cell) => void;
}): ReactElement {
  const room = roomOf(cell);
  const blaze = blazeAt(game, cell);
  const poi = poiAt(game, cell);
  const here = playersOn(game, cell);
  const open = options.length > 0;
  /* One meaning shows its price. Two show a mark instead, because printing one
     of the two prices would quietly recommend that one. */
  const badge =
    options.length === 1 ? String(options[0].cost) : open ? "\u{2026}" : null;

  const floor = isInside(cell)
    ? (FLOORS[room ?? ""] ?? "#7a5a3c")
    : isAmbulance(cell)
      ? "#2f7fb5"
      : isEngineBay(cell)
        ? "#d78a20"
        : OUTSIDE_FLOOR;
  const background =
    blaze === "fire" ? FIRE : blaze === "smoke" ? SMOKE : floor;

  return (
    <button
      type="button"
      disabled={!open}
      onClick={() => onTap(cell)}
      data-testid={`fp-cell-${cell.row}-${cell.col}`}
      title={`${room ?? T.outside} ${cell.row}/${cell.col}`}
      className={`relative flex aspect-square flex-col items-center justify-center text-base ${
        asking
          ? "cursor-pointer ring-4 ring-amber-300 ring-inset"
          : open
            ? "cursor-pointer ring-2 ring-white ring-inset"
            : ""
      } ${borders(game, cell)}`}
      style={{ background, ...borderColours(game, cell) }}
    >
      {/* Two numbers, not one: "11" printed plain reads as eleven, and the
          board prints a red die and a black one for exactly that reason. */}
      {isInside(cell) && (
        <span className="absolute right-0.5 bottom-0 text-[7px] leading-none font-bold text-white/50">
          {cell.row}
          {"\u{00B7}"}
          {cell.col}
        </span>
      )}
      {isAmbulance(cell) && (
        <span aria-hidden className="absolute top-0 left-0 text-[9px]">
          {"\u{2795}"}
        </span>
      )}
      {poi !== null && (
        <span aria-hidden className="absolute top-0 left-0 text-xs">
          {poi.revealed ? "\u{1F464}" : "\u{2753}"}
        </span>
      )}
      {here.length > 0 && (
        <span aria-hidden className="text-sm leading-none">
          {"\u{1F9D1}\u{200D}\u{1F692}".repeat(Math.min(here.length, 2))}
        </span>
      )}
      {badge !== null && (
        <span className="absolute top-0 right-0.5 rounded bg-black/60 px-0.5 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

/**
 * The look of one side of a square, by what is on that edge.
 *
 * @remarks
 * Written out in full rather than assembled from pieces. Tailwind finds its
 * classes by reading the source as text, so a name built at runtime out of
 * `border-${side}` never reaches the stylesheet - the wall would simply not be
 * drawn, and nothing would say why.
 */
const SIDE_LOOK: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  top: {
    wall: "border-t-4",
    broken: "border-t-2 border-t-dashed",
    closed: "border-t-4",
    open: "border-t-2 border-t-dotted",
  },
  left: {
    wall: "border-l-4",
    broken: "border-l-2 border-l-dashed",
    closed: "border-l-4",
    open: "border-l-2 border-l-dotted",
  },
  bottom: {
    wall: "border-b-4",
    broken: "border-b-2 border-b-dashed",
    closed: "border-b-4",
    open: "border-b-2 border-b-dotted",
  },
  right: {
    wall: "border-r-4",
    broken: "border-r-2 border-r-dashed",
    closed: "border-r-4",
    open: "border-r-2 border-r-dotted",
  },
};

/** The colour each kind of edge is drawn in. */
const EDGE_COLOUR: Readonly<Record<string, string>> = {
  wall: WALL,
  broken: WALL_BROKEN,
  closed: DOOR_SHUT,
  open: DOOR_SHUT,
};

/** Which sides a square draws, so no edge is drawn twice. */
function drawnSides(cell: Cell): readonly (readonly [Cell, string])[] {
  return [
    [{ row: cell.row - 1, col: cell.col }, "top"],
    [{ row: cell.row, col: cell.col - 1 }, "left"],
    ...(cell.row === ROWS + 1
      ? ([[{ row: cell.row + 1, col: cell.col }, "bottom"]] as [Cell, string][])
      : []),
    ...(cell.col === COLS + 1
      ? ([[{ row: cell.row, col: cell.col + 1 }, "right"]] as [Cell, string][])
      : []),
  ];
}

/** The classes that draw this square's walls and doors. */
function borders(game: FlashPointGame, cell: Cell): string {
  const parts: string[] = [];
  for (const [other, side] of drawnSides(cell)) {
    const kind = edgeBetween(cell, other);
    const edge = edgeKey(cell, other);
    let state: string | null = null;
    if (kind === "wall") {
      state = isBroken(game, edge) ? "broken" : "wall";
    } else if (kind === "door") {
      const door = game.doors[edge] ?? "closed";
      state = door === "gone" ? "broken" : door === "open" ? "open" : "closed";
    }
    if (state !== null) {
      parts.push(SIDE_LOOK[side][state]);
    }
  }
  return parts.join(" ");
}

/**
 * The colours the borders are painted in, as inline styles.
 *
 * @remarks
 * Separate from the classes above because Tailwind's per-side colour utilities
 * would have to be written out four times four, and the board's white is not
 * one of its palette anyway.
 */
function borderColours(
  game: FlashPointGame,
  cell: Cell,
): Record<string, string> {
  const style: Record<string, string> = {};
  for (const [other, side] of drawnSides(cell)) {
    const kind = edgeBetween(cell, other);
    const edge = edgeKey(cell, other);
    let state: string | null = null;
    if (kind === "wall") {
      state = isBroken(game, edge) ? "broken" : "wall";
    } else if (kind === "door") {
      const door = game.doors[edge] ?? "closed";
      state = door === "gone" ? "broken" : door === "open" ? "open" : "closed";
    }
    if (state !== null) {
      style[`border${side[0].toUpperCase()}${side.slice(1)}Color`] =
        EDGE_COLOUR[state];
    }
  }
  return style;
}
