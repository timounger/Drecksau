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
 * Every edge of a field means something, and each means only one thing:
 *
 * - the **inner** edge, facing the middle, carries the street's colour group,
 * - the **outer** edge carries a square in its owner's colour, set into the
 *   middle of it,
 * - the houses stand **on** the colour bar, which is where a printed board puts
 *   them.
 *
 * All three therefore sit on a different side of the cell on each of the four
 * runs, worked out from {@link sideOf}. That is what makes the ring read as a
 * ring instead of as a table.
 *
 * Two things on it are drawn for **one** reader rather than for everybody, and
 * both answer the same question - "where am I?". Your own piece is bigger and
 * ringed, and the fields you own are tinted in your colour and outlined in it,
 * on top of the square everybody's fields get. On a board of forty fields with
 * six pieces on it, finding yourself should not be work.
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
  GO_AT,
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
  type Estate,
  type MonopolyGame,
} from "@/games/monopoly/engine/state";
import { MONOPOLY_TEXTS as T } from "@/games/monopoly/i18n/texts";

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

/**
 * How thick the colour bar of a street is, as a share of the field.
 *
 * @remarks
 * Named because two things measure themselves against it: the bar itself, and
 * the houses that stand on the bar's inner edge. Two copies of "14%" would come
 * apart the first time somebody adjusted one of them.
 */
const BAR_THICK = "14%";

/**
 * How big the owner's square is, against the short side of a field.
 *
 * @remarks
 * Against the **short** side, so the marker is the same size on all four runs -
 * see {@link OwnerStripe}. Big enough to pick a colour out of at arm's length,
 * small enough that it cannot be mistaken for the colour bar opposite.
 */
const OWNER_MARK = "34%";

/**
 * The lane kept clear for the houses on the left and right runs.
 *
 * @remarks
 * Only there. On the top and bottom runs a field is tall and the buildings sit
 * in the space above the name anyway; on the sides it is flat and wide, the
 * name fills the width, and a hotel drawn on the colour bar lands on the "B" of
 * Bahnhofstraße. Padding on the button moves the text and **not** the bars -
 * an absolutely positioned child measures from the padding box, so the stripes
 * still reach the edges.
 */
const BUILD_LANE = "34%";

/**
 * The lane kept clear for the owner's square, again only on the side runs.
 *
 * @remarks
 * The mirror of {@link BUILD_LANE} on the other edge. A flat wide field has a
 * marker on its outer edge and houses on its inner one, and the name sits
 * between them - without both lanes it ran under whichever it reached first,
 * and "Bahnhofstraße" came out as "Bahnhofstraß".
 */
const MARK_LANE = "24%";

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
          <Middle />
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
 *
 * The piles used to carry the count of what was left in them, and it said
 * nothing: "Danach legen Sie die Karte unter den Stapel zurück" makes each deck
 * a ring that never runs out, so the number sat at sixteen all game. The one
 * thing that ever moved it was somebody holding a Get-Out-Of-Jail card - which
 * the standings already say in words. A number that is constant except when it
 * repeats something is worse than no number: it teaches you to read it, and
 * then never rewards you for it.
 */
function Middle(): ReactElement {
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
        Gemeinschaft
      </span>
      <span
        className="absolute right-[8%] bottom-[20%] -rotate-45 rounded border border-black/30 px-2 py-1 text-[9px] font-bold"
        style={{ background: "#e8efe9" }}
      >
        Ereignis
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
        // Keeps the name clear of both edges; see BUILD_LANE and MARK_LANE.
        // Only where something is actually standing there - a lane held open
        // for nothing is a name wrapped for nothing, and most fields on these
        // runs are empty most of the game.
        ...laneStyle(at, estate),
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
      {owner !== null && <OwnerStripe at={at} colour={owner.colour} />}
      {estate.mortgaged && (
        <span
          aria-hidden
          className="absolute inset-0 bg-black/25"
          title="Hypothek"
        />
      )}
      {/* w-full and min-w-0 are what let a long name wrap instead of running
          under the markers on either edge: a flex item defaults to
          min-width:auto and so refuses to shrink below its own text, and the
          field's overflow-hidden then simply cut "Bahnhofstraße" in half. */}
      {at !== JAIL_AT && (
        <span className="mt-1.5 w-full min-w-0 text-[7px] font-semibold break-words">
          {labelOf(at)}
        </span>
      )}
      {field.price !== undefined && (
        <span className="text-[7px] tabular-nums opacity-70">
          {field.price}
        </span>
      )}
      {/* Was auf Frei Parken liegt, steht auf Frei Parken - sonst müsste man
          es sich merken, und gerade dieser Betrag ist der Grund, warum jemand
          dorthin will. */}
      {/* Und auf LOS steht, was genau zu treffen wert ist - sonst sieht man
          der Ecke nicht an, dass hier eine andere Regel gilt als gedruckt. */}
      <FieldArt at={at} />
      {at === GO_AT && game.doubleGo && (
        <span
          data-testid="mo-double-go"
          className="text-[7px] font-bold tabular-nums text-emerald-800 dark:text-emerald-700"
        >
          {T.goDouble}
        </span>
      )}
      {at === PARKING_AT && game.parkingPot && (
        <span
          data-testid="mo-parking-pot"
          className="mt-1 text-[13px] leading-none font-bold tabular-nums text-emerald-800 dark:text-emerald-700"
        >
          {T.parkingPot(game.pot)}
        </span>
      )}
      <Buildings at={at} houses={estate.houses} />
      {at === JAIL_AT ? (
        <JailPieces game={game} here={here} mySeat={mySeat} />
      ) : (
        here.length > 0 && (
          <span className="relative mt-0.5 flex flex-wrap justify-center gap-px">
            {here.map((seat) => (
              <Piece
                key={seat}
                game={game}
                seat={seat}
                mine={seat === mySeat}
              />
            ))}
          </span>
        )
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
  const thick = BAR_THICK;
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

/**
 * How much room the name gives up to the markers beside it.
 *
 * @param at - the position
 * @param estate - what is built there and who owns it
 * @returns the padding for that field, empty on the top and bottom runs
 * @remarks
 * Only the **left and right** runs need it: there a field is flat and wide, the
 * name fills the width, and a hotel on the colour bar or an owner's square on
 * the outer edge lands on top of it. On the top and bottom runs the field is
 * tall and the name has its own line already.
 *
 * And only for what is really there. Held open on every field, these lanes made
 * "Gemeinschaft" wrap on a square with nothing on it at all.
 */
function laneStyle(at: number, estate: Estate): React.CSSProperties {
  const side = sideOf(at);
  const build = estate.houses > 0 ? BUILD_LANE : undefined;
  const mark = estate.owner >= 0 ? MARK_LANE : undefined;
  let lanes: React.CSSProperties = {};
  if (side === "left") {
    lanes = { paddingRight: build, paddingLeft: mark };
  } else if (side === "right") {
    lanes = { paddingLeft: build, paddingRight: mark };
  }
  return lanes;
}

/**
 * Who owns the field, as a square set into its outer edge.
 *
 * @param props - the position and the owner's colour
 * @returns the marker
 * @remarks
 * On the **outer** edge - the one facing away from the middle - so it is never
 * on the same side as the colour group, and on the left run it sits on the
 * left, on the bottom run at the bottom, and so on.
 *
 * A **square in the middle of that edge**, and not a stripe running its whole
 * length. The stripe was the first attempt and it was a mistake for a reason
 * worth writing down: at the length of a field it looked exactly like the
 * colour bar on the opposite edge, so a board full of them asked the reader to
 * work out which of two identical bars meant a group and which meant a person.
 * A shape that differs only in position is not a different shape.
 *
 * Square rather than a rectangle scaled to the cell, which is why only one
 * dimension is set: the fields are taller than wide on the top and bottom runs
 * and wider than tall on the sides, so the side is measured against whichever
 * of the two is the short one and `aspect-ratio` supplies the other.
 */
function OwnerStripe({
  at,
  colour,
}: {
  readonly at: number;
  readonly colour: string;
}): ReactElement {
  const side = sideOf(at);
  const style: React.CSSProperties = { background: colour, aspectRatio: "1" };
  const middle = { transform: "translateX(-50%)", left: "50%" } as const;
  const centre = { transform: "translateY(-50%)", top: "50%" } as const;
  if (side === "bottom") {
    Object.assign(style, middle, { bottom: 0, width: OWNER_MARK });
  } else if (side === "left") {
    Object.assign(style, centre, { left: 0, height: OWNER_MARK });
  } else if (side === "top") {
    Object.assign(style, middle, { top: 0, width: OWNER_MARK });
  } else {
    Object.assign(style, centre, { right: 0, height: OWNER_MARK });
  }
  return (
    <span
      aria-hidden
      className="absolute border border-black/40"
      style={style}
    />
  );
}

/**
 * The houses, or the hotel, standing on a street.
 *
 * @param props - the position and how much is built
 * @returns the buildings, or null on an empty street
 * @remarks
 * On the **colour bar**, which is where they go on a printed board and the
 * opposite edge from the owner's stripe. They used to sit in the middle of the
 * field under the price, where they were three green specks in a column of text
 * - and where a street with four houses looked like a street with a typo.
 *
 * Drawn as buildings rather than as squares: a row of little green houses and
 * one long red hotel is the picture everybody already has of a Monopoly board,
 * and it says which of the two it is without anybody counting.
 */
function Buildings({
  at,
  houses,
}: {
  readonly at: number;
  readonly houses: number;
}): ReactElement | null {
  const side = sideOf(at);
  const upright = side === "bottom" || side === "top";
  const style: React.CSSProperties = {};
  if (side === "bottom") {
    Object.assign(style, { top: BAR_THICK, left: 0, right: 0 });
  } else if (side === "top") {
    Object.assign(style, { bottom: BAR_THICK, left: 0, right: 0 });
  } else if (side === "left") {
    Object.assign(style, { right: BAR_THICK, top: 0, bottom: 0 });
  } else {
    Object.assign(style, { left: BAR_THICK, top: 0, bottom: 0 });
  }
  return houses === 0 ? null : (
    <span
      aria-hidden
      title={houses === HOTEL ? "Hotel" : `${houses} Häuser`}
      style={style}
      className={`absolute flex items-center justify-center gap-px ${
        upright ? "flex-row" : "flex-col"
      }`}
    >
      {houses === HOTEL ? (
        <Hotel />
      ) : (
        Array.from({ length: houses }, (unused, index) => <House key={index} />)
      )}
    </span>
  );
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- coordinates on a small
   canvas: drawing, not arithmetic. */

/** One green house: a body with a pitched roof, the way the piece looks. */
function House(): ReactElement {
  return (
    <svg viewBox="0 0 12 11" className="h-2.5 w-2.5" aria-hidden>
      <path d="M1 5.5 6 1l5 4.5z" fill="#0b4f26" />
      <rect x="2" y="5.5" width="8" height="4.5" fill="#17843f" />
      <rect x="5" y="7" width="2" height="3" fill="#0b4f26" />
    </svg>
  );
}

/** The red hotel: longer, with a row of windows. */
function Hotel(): ReactElement {
  return (
    <svg viewBox="0 0 20 11" className="h-2.5 w-4" aria-hidden>
      <path d="M1 5 10 1l9 4z" fill="#7f1410" />
      <rect x="2" y="5" width="16" height="5" fill="#c2231b" />
      {[4.5, 8, 11.5, 15].map((x) => (
        <rect key={x} x={x} y="6.4" width="2" height="2" fill="#ffe9e6" />
      ))}
    </svg>
  );
}

/**
 * The picture a field carries, the way the printed board carries one.
 *
 * @remarks
 * Streets have none, and that is the printed board's own answer: their colour
 * bar already says everything a street says. Everything else gets the drawing
 * it has on the board, so a field can be found without being read - which is
 * how anybody who has played this game finds the station.
 *
 * @param at - the position
 * @returns the drawing, or null where the board has none
 */
function FieldArt({ at }: { readonly at: number }): ReactElement | null {
  const field = fieldAt(at);
  const corner = at % (SIDE + 1) === 0;
  const size = corner ? "h-8 w-8" : "h-5 w-5";
  let art: ReactElement | null;
  switch (field.kind) {
    case "go":
      art = <GoArrow />;
      break;
    case "jail":
      art = <JailArt />;
      break;
    case "goToJail":
      art = <PoliceArt />;
      break;
    case "parking":
      art = <ParkingCar />;
      break;
    case "chest":
      art = <ChestArt size={size} />;
      break;
    case "chance":
      art = <ChanceMark />;
      break;
    case "station":
      art = <TrainArt size={size} />;
      break;
    case "utility":
      art =
        field.name === "Wasserwerk" ? (
          <TapArt size={size} />
        ) : (
          <BulbArt size={size} />
        );
      break;
    case "tax":
      art =
        field.tax === undefined || field.tax > TAX_RING ? (
          <CoinArt size={size} />
        ) : (
          <RingArt size={size} />
        );
      break;
    default:
      art = null;
  }
  return art;
}

/** Below this the tax is the luxury one, and the board draws a ring for it. */
const TAX_RING = 100;

/** The blue chest of the Gemeinschaftsfelder, lid, band and lock. */
function ChestArt({ size }: { readonly size: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={size} aria-hidden>
      <path d="M2.5 10c0-4.2 4.3-6.5 9.5-6.5s9.5 2.3 9.5 6.5z" fill="#2f7fc1" />
      <rect x="2.5" y="10" width="19" height="9" rx="1" fill="#1f5f97" />
      <rect x="2.5" y="9.2" width="19" height="2" fill="#f2c14e" />
      <rect x="10.4" y="8" width="3.2" height="6" rx="0.8" fill="#f2c14e" />
      <circle cx="12" cy="12.6" r="1" fill="#1f5f97" />
    </svg>
  );
}

/** The question mark of the Ereignisfelder, in the board's own orange. */
function ChanceMark(): ReactElement {
  return (
    <span
      aria-hidden
      className="text-[15px] leading-none font-black text-[#e2571e]"
    >
      ?
    </span>
  );
}

/** A locomotive for the four stations. */
function TrainArt({ size }: { readonly size: string }): ReactElement {
  return (
    <svg viewBox="0 0 26 24" className={size} aria-hidden>
      {/* Kessel vorn mit Schornstein darüber, Führerhaus dahinter - so
          herum steht die Lok auf dem gedruckten Feld. */}
      <rect x="2" y="10" width="13" height="6.5" rx="0.8" fill="#1c1c1c" />
      <rect x="3.4" y="5.6" width="3" height="4.6" rx="0.5" fill="#1c1c1c" />
      <path d="M15 6.4h7.5v10H15z" fill="#1c1c1c" />
      <rect x="16.4" y="8" width="4.6" height="3.4" fill="#f3e7d8" />
      <rect x="0.8" y="16.6" width="24" height="1.8" fill="#1c1c1c" />
      <circle cx="19" cy="20.4" r="3" fill="#1c1c1c" />
      <circle cx="9.5" cy="20.6" r="2.2" fill="#1c1c1c" />
      <circle cx="4.5" cy="20.6" r="2.2" fill="#1c1c1c" />
    </svg>
  );
}

/** The bulb of the Elektrizitätswerk. */
function BulbArt({ size }: { readonly size: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={size} aria-hidden>
      <path
        d="M12 2.5a6.5 6.5 0 0 0-3.6 11.9V17h7.2v-2.6A6.5 6.5 0 0 0 12 2.5z"
        fill="#f7d046"
        stroke="#8a6d1b"
        strokeWidth="1"
      />
      <rect x="8.8" y="17.4" width="6.4" height="1.6" fill="#8a8a8a" />
      <rect x="9.4" y="19.6" width="5.2" height="1.6" rx="0.8" fill="#8a8a8a" />
    </svg>
  );
}

/** The tap of the Wasserwerk, with its drop. */
function TapArt({ size }: { readonly size: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={size} aria-hidden>
      <rect x="2.5" y="6" width="7" height="4" rx="1" fill="#8a8a8a" />
      <rect x="9.5" y="7" width="9" height="2.4" fill="#8a8a8a" />
      <rect x="15.6" y="9" width="2.8" height="5" fill="#8a8a8a" />
      <rect x="4.6" y="3" width="2.8" height="3" fill="#8a8a8a" />
      <path d="M17 16.5c1.6 2 1.6 4.5 0 4.5s-1.6-2.5 0-4.5z" fill="#3aa0d8" />
    </svg>
  );
}

/** Coins for the Einkommensteuer: what leaves the table. */
function CoinArt({ size }: { readonly size: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={size} aria-hidden>
      {/* Drei Münzen mit Rand: übereinandergelegte Ellipsen ohne Kante
          verschmelzen bei zwanzig Pixeln zu einem Klumpen. */}
      {[18, 13, 8].map((y) => (
        <g key={y}>
          <rect x="3.5" y={y - 2.4} width="17" height="2.8" fill="#d9a52f" />
          <ellipse
            cx="12"
            cy={y - 2.6}
            rx="8.5"
            ry="2.8"
            fill="#f7d046"
            stroke="#8a6d1b"
            strokeWidth="0.9"
          />
        </g>
      ))}
    </svg>
  );
}

/** The ring of the Zusatzsteuer, as the board draws the luxury. */
function RingArt({ size }: { readonly size: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={size} aria-hidden>
      <path d="M8.5 5.5h7l2.5 3-6 3-6-3z" fill="#7fd4f5" />
      <path d="M9.5 8.5 12 11.5l2.5-3z" fill="#39a9d8" />
      <circle
        cx="12"
        cy="16"
        r="5.2"
        fill="none"
        stroke="#f2c14e"
        strokeWidth="2.2"
      />
    </svg>
  );
}

/** The red car parked in the corner. */
function ParkingCar(): ReactElement {
  return (
    <svg viewBox="0 0 32 20" className="h-6 w-9" aria-hidden>
      <path d="M4 13c0-2 1.5-3 3.5-3h17c2 0 3.5 1 3.5 3v2H4z" fill="#c0392b" />
      <path d="M9 10 11.5 5.6h9L23 10z" fill="#c0392b" />
      <path d="M11 9.4 12.8 6.4h6.4L21 9.4z" fill="#f3e7d8" />
      <circle cx="10" cy="15.5" r="2.6" fill="#1c1c1c" />
      <circle cx="22" cy="15.5" r="2.6" fill="#1c1c1c" />
      <circle cx="10" cy="15.5" r="1" fill="#c9c9c9" />
      <circle cx="22" cy="15.5" r="1" fill="#c9c9c9" />
    </svg>
  );
}

/**
 * The tokens on the jail corner, each one where it belongs.
 *
 * @remarks
 * Two things happen on this field and the board keeps them apart, so the
 * tokens have to as well: whoever is serving their turns stands **in the
 * cell**, on the barred window, and whoever merely rolled onto the corner
 * stands **on the band outside**, next to "Nur zu Besuch". Everywhere else a
 * field is a field and the tokens simply queue up in the middle.
 *
 * @param game - the game
 * @param here - the seats standing on this corner
 * @param mySeat - the seat the reader plays, or null
 * @returns the two groups of tokens
 */
function JailPieces({
  game,
  here,
  mySeat,
}: {
  readonly game: MonopolyGame;
  readonly here: readonly number[];
  readonly mySeat: number | null;
}): ReactElement {
  const inside = here.filter((seat) => game.players[seat].jailTurns !== null);
  const outside = here.filter((seat) => game.players[seat].jailTurns === null);
  return (
    <>
      {inside.length > 0 && (
        <span className="absolute top-[40%] left-[64%] flex max-w-[46px] -translate-x-1/2 -translate-y-1/2 flex-wrap justify-center gap-px">
          {inside.map((seat) => (
            <Piece key={seat} game={game} seat={seat} mine={seat === mySeat} />
          ))}
        </span>
      )}
      {outside.length > 0 && (
        <span className="absolute bottom-0.5 left-0.5 flex max-w-[34px] flex-wrap justify-start gap-px">
          {outside.map((seat) => (
            <Piece key={seat} game={game} seat={seat} mine={seat === mySeat} />
          ))}
        </span>
      )}
    </>
  );
}

/**
 * The whole jail corner, drawn the way the board draws it.
 *
 * @remarks
 * Not an icon in a field but the field itself: the orange square with the
 * tilted barred window, "IM GEFÄNGNIS" around it, and the band along the two
 * outer edges that says "NUR ZU BESUCH". The printed corner says two things at
 * once - you are in the cell or you are walking past it - and only the layout
 * tells them apart. So the layout is the picture.
 *
 * It fills the cell absolutely and the tokens sit on top; the field's own name
 * is left off, because the drawing already carries it twice.
 */
function JailArt(): ReactElement {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* Das orange Innenfeld, außen bleibt die Bande frei. */}
      <rect x="24" y="0" width="76" height="76" fill="#f0932b" />
      <rect
        x="24"
        y="0"
        width="76"
        height="76"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth="1.6"
      />
      <text
        x="12"
        y="40"
        fill="#1c1c1c"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
        transform="rotate(90 12 40)"
      >
        NUR
      </text>
      <text
        x="62"
        y="92"
        fill="#1c1c1c"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
      >
        ZU BESUCH
      </text>
      {/* Die ganze Zelle steht quer: erst die Wörter, die das Gitter
          einfassen - "GEFÄNGNIS" links unten, "IM" rechts oben, beide um
          eine Achteldrehung gekippt. */}
      <text
        x="39"
        y="58"
        fill="#1c1c1c"
        fontSize="7.4"
        fontWeight="700"
        textAnchor="middle"
        transform="rotate(45 39 58)"
      >
        GEFÄNGNIS
      </text>
      <text
        x="81"
        y="21"
        fill="#1c1c1c"
        fontSize="10"
        fontWeight="700"
        textAnchor="middle"
        transform="rotate(45 81 21)"
      >
        IM
      </text>
      {/* Der Gefangene liegt in derselben Achteldrehung wie die Wörter und
          wird an den Fensterkanten beschnitten, damit nichts über den Rahmen
          läuft. */}
      <defs>
        <clipPath id="mo-jail-cell">
          <rect
            x="48"
            y="24"
            width="32"
            height="32"
            transform="rotate(45 64 40)"
          />
        </clipPath>
      </defs>
      <rect
        x="48"
        y="24"
        width="32"
        height="32"
        fill="#f7f3e8"
        transform="rotate(45 64 40)"
      />
      <g clipPath="url(#mo-jail-cell)" transform="rotate(45 64 40)">
        <path
          d="M58.4 36.4c0-3.6 2.6-5.8 5.6-5.8s5.6 2.2 5.6 5.8z"
          fill="#1c1c1c"
        />
        <circle cx="64" cy="38.8" r="6" fill="#e8b98a" />
        <rect
          x="60.4"
          y="40.2"
          width="7.2"
          height="1.6"
          rx="0.8"
          fill="#1c1c1c"
        />
        <path
          d="M56.5 52c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6z"
          fill="#2b4f8a"
        />
      </g>
      <g transform="rotate(45 64 40)">
        {[55, 64, 73].map((x) => (
          <rect key={x} x={x} y="24" width="2.2" height="32" fill="#1c1c1c" />
        ))}
        <rect
          x="48"
          y="24"
          width="32"
          height="32"
          fill="none"
          stroke="#1c1c1c"
          strokeWidth="2.8"
        />
      </g>
    </svg>
  );
}

/**
 * The policeman who sends you off: cap, whistle, and an arm that means it.
 */
function PoliceArt(): ReactElement {
  return (
    <svg viewBox="0 0 32 24" className="h-8 w-10" aria-hidden>
      {/* Mütze und Schirm, dann das Gesicht darunter, dann Schultern - in
          dieser Reihenfolge, sonst verdeckt das eine das andere. */}
      <path d="M5.6 8c0-3.3 2.4-5.4 5.4-5.4s5.4 2.1 5.4 5.4z" fill="#1f3a68" />
      <rect x="10.2" y="3.6" width="1.7" height="2.6" fill="#f2c14e" />
      <rect x="4.4" y="7.7" width="13.2" height="2" rx="1" fill="#12264a" />
      <circle cx="11" cy="12.6" r="3.6" fill="#e8b98a" />
      <path d="M4.5 24c0-4.7 2.9-7.2 6.5-7.2s6.5 2.5 6.5 7.2z" fill="#2b4f8a" />
      <circle cx="7.8" cy="21" r="1" fill="#f2c14e" />
      {/* Der ausgestreckte Arm samt Richtung. */}
      <path
        d="M15.5 18.6 24 15.4"
        stroke="#e8b98a"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="25" cy="15" r="1.9" fill="#e8b98a" />
      <path d="M27.2 12.6 31 15l-3.8 2.4z" fill="#c0392b" />
    </svg>
  );
}

/**
 * The red arrow on LOS, pointing the way the tokens travel.
 *
 * @remarks
 * Leftwards, because that is where field 1 is: the numbers run left along the
 * bottom of this board - see {@link cellOf}. An arrow pointing the other way
 * would be a drawing that lies.
 */
function GoArrow(): ReactElement {
  return (
    <svg viewBox="0 0 40 20" className="h-4 w-9" aria-hidden>
      <path d="M2 10 14 1v6h24v6H14v6z" fill="#c0392b" />
    </svg>
  );
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

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
