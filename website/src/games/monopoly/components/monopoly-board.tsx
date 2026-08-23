/**
 * The board: a square ring of forty fields, laid out the way it is printed.
 *
 * @module
 * @remarks
 * LOS in the bottom right, the ring running **anti-clockwise on screen** -
 * which is clockwise for a player sitting behind it - and the four corners at
 * the four corners. That is not decoration: somebody who has played Monopoly
 * knows where Schlossallee is, and a board that puts it somewhere else makes
 * them read forty labels to find out what they already knew.
 *
 * The whole thing is one **eleven by eleven grid**, and every field's cell is
 * worked out from its position by {@link cellOf} rather than written down forty
 * times. The corners get a wider track than the sides, as the printed board
 * does - the ratio is what stops it looking like a spreadsheet.
 *
 * The colour bar of a street sits on its **inner** edge, facing the middle,
 * which means the bar is on a different side of the cell on each of the four
 * runs. That is what makes the ring read as a ring.
 *
 * Two things on it are drawn for **one** reader rather than for everybody, and
 * both answer the same question - "where am I?". Your own piece is bigger and
 * ringed, and the fields you own are tinted in your colour and outlined in it,
 * where everybody else's get only a small corner tab. On a board of forty
 * fields with six pieces on it, finding yourself should not be work.
 *
 * Neither highlight leans on the token's colour being dark or light - the
 * pieces run from near-black to yellow, and a black outline round the top hat's
 * streets was indistinguishable from the ordinary grid. So the tint sits over
 * the felt at low opacity, which reads at any hue, and the piece's ring is
 * white **and** black, one outside the other.
 *
 * The board keeps its own colours in both themes. It is printed card; a real one
 * does not get darker in the evening, and the page around it carries the theme.
 */
"use client";

import type { ReactElement } from "react";
import {
  BOARD_SIZE,
  JAIL_AT,
  PARKING_AT,
  TO_JAIL_AT,
  fieldAt,
  groupOf,
  labelOf,
  type Field,
} from "@/games/monopoly/engine/board";
import {
  HOTEL,
  estateAt,
  tokenFor,
  type MonopolyGame,
} from "@/games/monopoly/engine/state";

/** The board's own colours, which do not follow the page's theme. */
const FELT = "#cfe4d3";
const EDGE = "#1d2b22";
const INK = "#14201a";

/** How much wider a corner track is than a side one. */
const CORNER = 1.5;

/** How many fields on each side, corners aside. */
const SIDE = 9;

/** How strongly one's own fields are washed in one's own colour. */
const MINE_TINT = 0.18;

/** Props of {@link MonopolyBoard}. */
export type MonopolyBoardProps = {
  readonly game: MonopolyGame;
  /** The seat the reader plays, so their own things can be picked out. */
  readonly mySeat: number | null;
  /** The field the reader has picked, if any. */
  readonly picked: number | null;
  /** Fields worth lighting up right now. */
  readonly open: readonly number[];
  readonly onPick: (at: number) => void;
  /** What goes in the middle of the board. */
  readonly children?: React.ReactNode;
};

/**
 * Renders the whole board.
 *
 * @param props - the game, what may be tapped, and what goes in the middle
 * @returns the board element
 */
export function MonopolyBoard({
  game,
  mySeat,
  picked,
  open,
  onPick,
  children,
}: MonopolyBoardProps): ReactElement {
  const track = `${CORNER}fr repeat(${SIDE}, 1fr) ${CORNER}fr`;
  return (
    <div className="overflow-x-auto">
      <div
        data-testid="mo-board"
        className="grid aspect-square w-full min-w-[560px] gap-px rounded-lg p-px"
        style={{
          background: EDGE,
          gridTemplateColumns: track,
          gridTemplateRows: track,
        }}
      >
        {Array.from({ length: BOARD_SIZE }, (unused, at) => at).map((at) => (
          <Cell
            key={at}
            game={game}
            mySeat={mySeat}
            at={at}
            picked={at === picked}
            open={open.includes(at)}
            onPick={onPick}
          />
        ))}
        <div
          className="relative flex flex-col items-center justify-center overflow-auto p-2"
          style={{
            background: FELT,
            color: INK,
            gridColumn: `2 / span ${SIDE}`,
            gridRow: `2 / span ${SIDE}`,
          }}
        >
          <Middle game={game} />
          <div className="relative z-10 flex w-full flex-col items-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * What the middle of a Monopoly board has printed on it.
 *
 * @remarks
 * The wordmark across the middle and the two card piles on the diagonals, which
 * is where a real board puts them - and where a player's eye goes when a card is
 * drawn. It sits **behind** whatever the turn is asking for and takes no
 * clicks: decoration must never be the reason somebody misses a button.
 */
function Middle({ game }: { readonly game: MonopolyGame }): ReactElement {
  const dot = "\u{00B7}";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span
        className="absolute top-3 left-1/2 -translate-x-1/2 text-lg font-black tracking-[0.2em] whitespace-nowrap"
        style={{ color: "#c5202a" }}
      >
        MONOPOLY
      </span>
      <span
        className="absolute top-[20%] left-[8%] -rotate-45 rounded border border-black/30 px-2 py-1 text-[9px] font-bold"
        style={{ background: "#e8efe9" }}
      >
        Gemeinschaft {dot} {game.gemeinschaft.length}
      </span>
      <span
        className="absolute right-[8%] bottom-[20%] -rotate-45 rounded border border-black/30 px-2 py-1 text-[9px] font-bold"
        style={{ background: "#e8efe9" }}
      >
        Ereignis {dot} {game.ereignis.length}
      </span>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] tracking-wide opacity-60">
        Das berühmte Spiel um den großen Deal
      </span>
    </div>
  );
}

/** One field of the ring. */
function Cell({
  game,
  mySeat,
  at,
  picked,
  open,
  onPick,
}: {
  readonly game: MonopolyGame;
  readonly mySeat: number | null;
  readonly at: number;
  readonly picked: boolean;
  readonly open: boolean;
  readonly onPick: (at: number) => void;
}): ReactElement {
  const field = fieldAt(at);
  const spot = cellOf(at);
  const estate = estateAt(game, at);
  const here = game.players
    .map((player, seat) => (player.at === at && !player.bankrupt ? seat : -1))
    .filter((seat) => seat >= 0);
  const owner = estate.owner >= 0 ? tokenFor(game, estate.owner) : null;
  const isMine = estate.owner >= 0 && estate.owner === mySeat;

  return (
    <button
      type="button"
      disabled={!open}
      onClick={() => onPick(at)}
      data-testid={`mo-field-${at}`}
      data-owner={estate.owner}
      data-mine={isMine ? "1" : "0"}
      title={`${field.name}${field.price === undefined ? "" : ` - ${field.price} €`}`}
      style={{
        gridColumn: spot.col,
        gridRow: spot.row,
        background: FELT,
        color: INK,
        // Your own fields are outlined in your own colour. Everybody else's get
        // the corner tab below, which is enough to read and not enough to
        // compete with the one thing you are looking for.
        outline: picked
          ? "3px solid #111"
          : open
            ? "2px dashed #b23c17"
            : isMine && owner !== null
              ? `2px solid ${owner.colour}`
              : undefined,
        outlineOffset: "-2px",
      }}
      className={`relative flex flex-col items-center justify-center overflow-hidden p-0.5 text-center leading-none ${
        open ? "cursor-pointer" : "cursor-default"
      }`}
    >
      {isMine && owner !== null && (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: owner.colour, opacity: MINE_TINT }}
        />
      )}
      <ColourBar at={at} field={field} />
      {owner !== null && !isMine && (
        <span
          aria-hidden
          className="absolute top-0 right-0 h-2 w-2"
          style={{ background: owner.colour }}
        />
      )}
      {estate.mortgaged && (
        <span
          aria-hidden
          className="absolute inset-0 bg-black/25"
          title="Hypothek"
        />
      )}
      <span className="mt-1.5 text-[7px] font-semibold break-words">
        {labelOf(at)}
      </span>
      {field.price !== undefined && (
        <span className="text-[7px] tabular-nums opacity-70">
          {field.price}
        </span>
      )}
      <Buildings houses={estate.houses} />
      {here.length > 0 && (
        <span className="mt-0.5 flex flex-wrap justify-center gap-px">
          {here.map((seat) => (
            <Piece key={seat} game={game} seat={seat} mine={seat === mySeat} />
          ))}
        </span>
      )}
    </button>
  );
}

/**
 * One playing piece standing on a field.
 *
 * @remarks
 * The piece itself, not a coloured dot: people call each other the dog and the
 * ship, and a board that shows six dots makes you look them up in a legend.
 * The reader's own gets a ring and a size more, which is the difference between
 * finding your token and searching for it.
 */
function Piece({
  game,
  seat,
  mine,
}: {
  readonly game: MonopolyGame;
  readonly seat: number;
  readonly mine: boolean;
}): ReactElement {
  const token = tokenFor(game, seat);
  return (
    <span
      title={`${game.players[seat].name} (${token.name})`}
      data-testid={`mo-piece-${seat}`}
      className={`inline-flex items-center justify-center rounded-full ${
        mine ? "h-[17px] w-[17px] text-[11px]" : "h-[13px] w-[13px] text-[9px]"
      }`}
      style={{
        background: token.colour,
        // White then black, one outside the other: the pieces run from
        // near-black to yellow, and a single ring of either disappears against
        // half of them.
        boxShadow: mine
          ? "0 0 0 1.5px #ffffff, 0 0 0 3px #111111"
          : "0 0 0 1px rgba(0,0,0,0.45)",
      }}
    >
      <span aria-hidden>{token.emoji}</span>
      <span className="sr-only">{game.players[seat].name}</span>
    </span>
  );
}

/** The colour stripe of a street, on the edge that faces the middle. */
function ColourBar({
  at,
  field,
}: {
  readonly at: number;
  readonly field: Field;
}): ReactElement | null {
  const group = field.group === undefined ? null : groupOf(field.group);
  const side = sideOf(at);
  const thick = "14%";
  const style: React.CSSProperties = { background: group?.colour };
  if (side === "bottom") {
    Object.assign(style, { top: 0, left: 0, right: 0, height: thick });
  } else if (side === "left") {
    Object.assign(style, { top: 0, right: 0, bottom: 0, width: thick });
  } else if (side === "top") {
    Object.assign(style, { bottom: 0, left: 0, right: 0, height: thick });
  } else {
    Object.assign(style, { top: 0, left: 0, bottom: 0, width: thick });
  }
  return group === null ? null : (
    <span
      aria-hidden
      className="absolute border-black/40"
      style={{ ...style, borderWidth: 1 }}
    />
  );
}

/** The houses, or the hotel, standing on a street. */
function Buildings({
  houses,
}: {
  readonly houses: number;
}): ReactElement | null {
  return houses === 0 ? null : (
    <span className="mt-0.5 flex gap-px" aria-hidden>
      {houses === HOTEL ? (
        <span className="h-1.5 w-3 rounded-[1px] bg-red-600" title="Hotel" />
      ) : (
        Array.from({ length: houses }, (unused, index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-[1px] bg-green-700"
          />
        ))
      )}
    </span>
  );
}

/**
 * Which run of the ring a field is on.
 *
 * @param at - the position
 * @returns the side of the board it sits on
 */
function sideOf(at: number): "bottom" | "left" | "top" | "right" {
  let side: "bottom" | "left" | "top" | "right";
  if (at <= JAIL_AT) {
    side = "bottom";
  } else if (at <= PARKING_AT) {
    side = "left";
  } else if (at <= TO_JAIL_AT) {
    side = "top";
  } else {
    side = "right";
  }
  return side;
}

/**
 * Where a field sits in the grid.
 *
 * @param at - the position, 0 to 39
 * @returns its one-based row and column
 * @remarks
 * LOS is the bottom-right cell and the numbers run leftwards along the bottom,
 * up the left side, rightwards across the top and down the right - which is
 * clockwise for somebody sitting in front of the board. Written as arithmetic
 * rather than as a table of forty, because a table of forty is forty chances to
 * put Schlossallee in the wrong corner.
 */
function cellOf(at: number): { readonly row: number; readonly col: number } {
  const last = SIDE + 2;
  let spot: { row: number; col: number };
  if (at <= JAIL_AT) {
    spot = { row: last, col: last - at };
  } else if (at <= PARKING_AT) {
    spot = { row: last - (at - JAIL_AT), col: 1 };
  } else if (at <= TO_JAIL_AT) {
    spot = { row: 1, col: 1 + (at - PARKING_AT) };
  } else {
    spot = { row: 1 + (at - TO_JAIL_AT), col: last };
  }
  return spot;
}
