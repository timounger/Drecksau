/**
 * The board, built after the printed one.
 *
 * @module
 * @remarks
 * The DOG board is laid out like Mensch ärgere dich nicht: the track is a
 * **star**, one arm per colour. An arm goes out to the edge of the board, runs
 * across its tip and comes back in, and between two arms the track dips towards
 * the middle. Down the inside of each arm run that colour's four home fields,
 * hanging from the tip; its kennel sits outside the loop beside the tip, and
 * the four corners of the board carry the DOG badge.
 *
 * That is the whole of the geometry here, and it is built from three points per
 * colour: the tip's near corner - which is the start field - the tip's far
 * corner, and the valley halfway to the next colour. The fields are then spread
 * along that outline by **arc length**, so that counting five fields is the
 * same job along a straight as it is round a bend, and because every colour's
 * stretch is the same length the first field of each lands exactly on its own
 * tip.
 *
 * The printed board is square and has four colours on the front and six on the
 * back. Here the same star is drawn for two to six: at four it is the cross of
 * the front side, at six the snowflake of the back.
 *
 * The colours keep their own hues in both themes. A board is a printed thing;
 * the page around it carries the theme.
 */
"use client";

import type { ReactElement } from "react";
import {
  HOME_DEPTH,
  piecesPerSeat,
  ringSize,
  startField,
  type Piece,
} from "@/games/dog/engine/board";
import type { DogGame } from "@/games/dog/engine/state";
import { SEAT_COLOURS } from "@/games/dog/i18n/texts";

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: how far an arm reaches, how deep the valley between
   two of them goes, where a badge sits. They are shapes, not arithmetic. */

/** How big the picture is, in its own units. */
const SIZE = 480;

/** The middle of it. */
const MID = SIZE / 2;

/** How far out the tip of an arm reaches. */
const ARM_OUT = 182;

/** How far in the valley between two arms dips. */
const ARM_IN = 104;

/** How wide the tip of an arm is, as a share of one colour's slice. */
const TIP_WIDE = 0.28;

/** How big a field is. */
const FIELD = 8.4;

/** How big a piece is. */
const PIECE = 7.4;

/** How far apart two fields of a home are. */
const HOME_GAP = 23;

/** How far outside the loop the kennel sits. */
const KENNEL_OUT = 15;

/** How far apart two kennel spots are, as an angle. */
const KENNEL_STEP = 0.115;

/** How finely the loop is measured before it is cut into fields. */
const SAMPLES = 1200;

/** The wood the board is printed on. */
const FRAME = "#0c0f14";

/** And the blue of the board itself. */
const BOARD = "#2b5fc0";

/** The lighter blue of the plate in the middle. */
const PLATE = "#3f8ed8";

/** An empty field of the track. */
const EMPTY = "#f8fafc";

/** The line round every field, and the thread between them. */
const INK = "#111827";

/** A point in the picture. */
type Spot = { readonly x: number; readonly y: number };

/** What the board shows and what it lets the player do. */
export type DogBoardProps = {
  readonly game: DogGame;
  /** Which seat is the player, so their own colour can be marked. */
  readonly mySeat: number;
  /** The pieces that can be picked right now. */
  readonly pickable: readonly number[];
  /** The piece the player has already picked, if any. */
  readonly picked: number | null;
  /** Called when a piece is clicked. */
  readonly onPick: (piece: number) => void;
};

/**
 * Draws the board.
 *
 * @param props - the game, and what may be clicked on it
 * @returns the board
 */
export function DogBoard({
  game,
  mySeat,
  pickable,
  picked,
  onPick,
}: DogBoardProps): ReactElement {
  const seats = game.seats;
  const open = new Set(pickable);
  const loop = fieldSpots(seats);
  const ring = ringSize(seats);
  return (
    <div className="overflow-x-auto rounded-2xl">
      <svg
        viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
        className="block h-auto w-full min-w-[320px]"
        role="img"
        aria-label={`Spielbrett mit ${String(ring)} Feldern, ${String(seats)} Zielen und ${String(seats)} Zwingern`}
        data-testid="dog-board"
      >
        <defs>
          <filter id="dog-speckle">
            {/* The printed board is mottled rather than flat. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves={3}
              result="noise"
            />
            <feColorMatrix in="noise" type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.22" intercept="0" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width={SIZE} height={SIZE} rx={10} fill={FRAME} />
        <rect
          x={8}
          y={8}
          width={SIZE - 16}
          height={SIZE - 16}
          rx={4}
          fill={BOARD}
        />
        <rect
          x={8}
          y={8}
          width={SIZE - 16}
          height={SIZE - 16}
          rx={4}
          filter="url(#dog-speckle)"
          opacity={0.5}
        />
        <Badges />
        <Plate />
        <Thread points={loop} closed />
        {Array.from({ length: seats }, (unused, seat) => (
          <Quarter
            key={seat}
            seat={seat}
            seats={seats}
            name={game.players[seat]?.name ?? SEAT_COLOURS[seat]?.name ?? "?"}
            mine={seat === mySeat}
          />
        ))}
        {loop.map((at, field) => {
          const owner =
            field % (ring / seats) === 0 ? field / (ring / seats) : null;
          const colour = owner === null ? undefined : SEAT_COLOURS[owner];
          return (
            <circle
              key={field}
              cx={at.x}
              cy={at.y}
              r={FIELD}
              fill={colour?.solid ?? EMPTY}
              stroke={INK}
              strokeWidth={1.4}
            />
          );
        })}
        {game.pieces.map((piece) => (
          <PieceDot
            key={piece.id}
            piece={piece}
            seats={seats}
            mine={piece.seat === mySeat}
            open={open.has(piece.id)}
            picked={picked === piece.id}
            onPick={onPick}
          />
        ))}
      </svg>
    </div>
  );
}

/** The DOG badge in each of the four corners of the printed board. */
function Badges(): ReactElement {
  const corners: readonly { x: number; y: number; turn: number }[] = [
    { x: 52, y: 46, turn: -45 },
    { x: SIZE - 52, y: 46, turn: 45 },
    { x: SIZE - 52, y: SIZE - 46, turn: -45 },
    { x: 52, y: SIZE - 46, turn: 45 },
  ];
  return (
    <g>
      {corners.map((corner) => (
        <g
          key={`${String(corner.x)}-${String(corner.y)}`}
          transform={`translate(${String(corner.x)} ${String(corner.y)}) rotate(${String(corner.turn)})`}
        >
          <rect
            x={-34}
            y={-11}
            width={68}
            height={22}
            rx={11}
            fill="#c81f28"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14}
            fontWeight={800}
            letterSpacing={2}
            fill="#f8fafc"
          >
            DOG
          </text>
        </g>
      ))}
    </g>
  );
}

/** The card-shaped plate in the middle of the board. */
function Plate(): ReactElement {
  return (
    <g transform={`translate(${String(MID)} ${String(MID)}) rotate(45)`}>
      <rect
        x={-38}
        y={-38}
        width={76}
        height={76}
        rx={8}
        fill={PLATE}
        stroke="#9fd2f4"
        strokeWidth={1.5}
      />
      <text
        transform="rotate(-45)"
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={17}
        fontWeight={800}
        letterSpacing={2}
        fill="#1e4f97"
      >
        DOG
      </text>
    </g>
  );
}

/** The thin thread the printed board draws between two fields. */
function Thread({
  points,
  closed = false,
}: {
  readonly points: readonly Spot[];
  readonly closed?: boolean;
}): ReactElement {
  const path = points
    .map(
      (at, index) =>
        `${index === 0 ? "M" : "L"}${at.x.toFixed(1)},${at.y.toFixed(1)}`,
    )
    .join(" ");
  return (
    <path
      d={closed ? `${path} Z` : path}
      fill="none"
      stroke="#e2e8f0"
      strokeWidth={2.5}
      strokeLinecap="round"
      opacity={0.75}
    />
  );
}

/** One colour's arm: its home, its kennel and its name. */
function Quarter({
  seat,
  seats,
  name,
  mine,
}: {
  readonly seat: number;
  readonly seats: number;
  readonly name: string;
  readonly mine: boolean;
}): ReactElement {
  const colour = SEAT_COLOURS[seat];
  const homes = Array.from({ length: HOME_DEPTH }, (unused, slot) =>
    homeSpot(seat, seats, slot),
  );
  const kennels = Array.from({ length: piecesPerSeat(seats) }, (unused, at) =>
    kennelSpot(seat, seats, at),
  );
  const label = labelSpot(seat, seats);
  const first = fieldSpots(seats)[startField(seat)] ?? { x: MID, y: MID };
  return (
    <g>
      <Thread points={[first, ...homes]} />
      <Thread points={[first, ...kennels]} />
      {homes.map((at, slot) => (
        <circle
          key={`home-${String(slot)}`}
          cx={at.x}
          cy={at.y}
          r={FIELD}
          fill={colour?.solid ?? EMPTY}
          stroke={INK}
          strokeWidth={1.4}
          opacity={0.85}
        />
      ))}
      {kennels.map((at, index) => (
        <circle
          key={`kennel-${String(index)}`}
          cx={at.x}
          cy={at.y}
          r={FIELD}
          fill={colour?.solid ?? EMPTY}
          stroke={INK}
          strokeWidth={1.4}
          opacity={0.85}
        />
      ))}
      <text
        x={label.x}
        y={label.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={mine ? 800 : 600}
        fill="#f8fafc"
        stroke={FRAME}
        strokeWidth={2.5}
        paintOrder="stroke"
      >
        {name}
      </text>
    </g>
  );
}

/** One piece, wherever it is standing. */
function PieceDot({
  piece,
  seats,
  mine,
  open,
  picked,
  onPick,
}: {
  readonly piece: Piece;
  readonly seats: number;
  readonly mine: boolean;
  readonly open: boolean;
  readonly picked: boolean;
  readonly onPick: (piece: number) => void;
}): ReactElement {
  const colour = SEAT_COLOURS[piece.seat];
  const at = spotOf(piece, seats);
  return (
    <g
      onClick={open ? () => onPick(piece.id) : undefined}
      style={{ cursor: open ? "pointer" : "default" }}
      data-testid={`dog-piece-${String(piece.id)}`}
    >
      {(open || picked) && (
        <circle
          cx={at.x}
          cy={at.y}
          r={PIECE + 5}
          fill="none"
          stroke={picked ? "#fbbf24" : "#f8fafc"}
          strokeWidth={3}
          opacity={picked ? 1 : 0.85}
        />
      )}
      <circle
        cx={at.x}
        cy={at.y}
        r={PIECE}
        fill={colour?.solid ?? "#94a3b8"}
        stroke={mine ? "#f8fafc" : INK}
        strokeWidth={mine ? 2.5 : 1.5}
      />
      <circle
        cx={at.x - 2}
        cy={at.y - 2.5}
        r={2.2}
        fill="#ffffff"
        opacity={0.55}
      />
    </g>
  );
}

/** Where a piece stands, in the picture. */
function spotOf(piece: Piece, seats: number): Spot {
  const each = piecesPerSeat(seats);
  let at = kennelSpot(piece.seat, seats, piece.id % each);
  if (piece.spot.zone === "ring") {
    at = fieldSpots(seats)[piece.spot.field] ?? at;
  } else if (piece.spot.zone === "home") {
    at = homeSpot(piece.seat, seats, piece.spot.slot);
  }
  return at;
}

/* ------------------------------------------------------------- the star */

/** Every loop worked out so far, by how many sit at the table. */
const loops = new Map<number, readonly Spot[]>();

/**
 * Where every field of the loop lies.
 *
 * @param seats - how many sit at the table
 * @returns one point per field, the first of each colour on its own tip
 */
function fieldSpots(seats: number): readonly Spot[] {
  const had = loops.get(seats);
  let spots = had;
  if (spots === undefined) {
    spots = cutUp(outline(seats), ringSize(seats));
    loops.set(seats, spots);
  }
  return spots;
}

/**
 * The outline of the track: out along one side of an arm, across its tip, back
 * in, through the valley, and on to the next arm.
 *
 * @param seats - how many sit at the table
 * @returns points along the star, starting on the first colour's start field
 */
function outline(seats: number): readonly Spot[] {
  const slice = (Math.PI * 2) / seats;
  const tip = slice * TIP_WIDE;
  const corners: Spot[] = [];
  for (let seat = 0; seat < seats; seat += 1) {
    const axis = armAngle(seat, seats);
    corners.push(polar(axis - tip, ARM_OUT));
    corners.push(polar(axis + tip, ARM_OUT));
    corners.push(polar(axis + slice / 2, ARM_IN));
  }
  // Rounded only at the turns themselves: every run is cut into three first,
  // so the curve that rounds a corner has no room to bow the straight bits.
  return smooth(subdivide(corners));
}

/** Cuts every run of a closed polygon into three, so bends stay local. */
function subdivide(corners: readonly Spot[]): readonly Spot[] {
  const out: Spot[] = [];
  for (let at = 0; at < corners.length; at += 1) {
    const here = corners[at] ?? { x: MID, y: MID };
    const next = corners[(at + 1) % corners.length] ?? here;
    out.push(here);
    for (const part of [1 / 3, 2 / 3]) {
      out.push({
        x: here.x + (next.x - here.x) * part,
        y: here.y + (next.y - here.y) * part,
      });
    }
  }
  return out;
}

/** Walks a closed polygon, rounding off every corner. */
function smooth(corners: readonly Spot[]): readonly Spot[] {
  const points: Spot[] = [];
  const each = Math.max(4, Math.round(SAMPLES / corners.length));
  for (let at = 0; at < corners.length; at += 1) {
    const here = corners[at] ?? { x: MID, y: MID };
    const next = corners[(at + 1) % corners.length] ?? here;
    const after = corners[(at + 2) % corners.length] ?? next;
    // A quadratic through the middle of each run, with the corner as its
    // control point: the line leaves one side of a bend and arrives at the
    // other without a crease.
    const from = middle(here, next);
    const to = middle(next, after);
    for (let step = 0; step < each; step += 1) {
      const part = step / each;
      points.push(bend(from, next, to, part));
    }
  }
  return points;
}

/** The middle of two points. */
function middle(one: Spot, other: Spot): Spot {
  return { x: (one.x + other.x) / 2, y: (one.y + other.y) / 2 };
}

/** A point along a quadratic curve. */
function bend(from: Spot, through: Spot, to: Spot, part: number): Spot {
  const rest = 1 - part;
  return {
    x: rest * rest * from.x + 2 * rest * part * through.x + part * part * to.x,
    y: rest * rest * from.y + 2 * rest * part * through.y + part * part * to.y,
  };
}

/** Cuts a closed outline into so many evenly spaced points. */
function cutUp(points: readonly Spot[], many: number): readonly Spot[] {
  const steps: number[] = [0];
  for (let at = 1; at <= points.length; at += 1) {
    const here = points[at % points.length] ?? { x: 0, y: 0 };
    const before = points[at - 1] ?? here;
    steps.push(
      (steps[at - 1] ?? 0) + Math.hypot(here.x - before.x, here.y - before.y),
    );
  }
  const total = steps[steps.length - 1] ?? 1;
  const spots: Spot[] = [];
  let cursor = 0;
  for (let field = 0; field < many; field += 1) {
    const want = (field / many) * total;
    while (cursor < steps.length - 2 && (steps[cursor + 1] ?? 0) < want) {
      cursor += 1;
    }
    const from = steps[cursor] ?? 0;
    const to = steps[cursor + 1] ?? from + 1;
    const part = to === from ? 0 : (want - from) / (to - from);
    const here = points[cursor] ?? { x: MID, y: MID };
    const next = points[(cursor + 1) % points.length] ?? here;
    spots.push({
      x: here.x + (next.x - here.x) * part,
      y: here.y + (next.y - here.y) * part,
    });
  }
  return spots;
}

/**
 * Which way a colour's arm points.
 *
 * @param seat - the colour in question
 * @param seats - how many sit at the table
 * @returns the angle of the arm, measured the way SVG measures them
 * @remarks
 * At the middle of an edge rather than at a corner, because on the printed
 * board the corners belong to the DOG badges. The first colour gets the bottom,
 * where the player sits, and the rest follow clockwise - which is also the way
 * the pieces walk.
 */
function armAngle(seat: number, seats: number): number {
  return (seat / seats) * Math.PI * 2 + Math.PI / 2;
}

/** A point at an angle and a distance from the middle. */
function polar(angle: number, reach: number): Spot {
  return {
    x: MID + Math.cos(angle) * reach,
    y: MID + Math.sin(angle) * reach,
  };
}

/**
 * Where a field of a home lies: down the inside of the arm, from its tip.
 *
 * @param seat - whose home
 * @param seats - how many sit at the table
 * @param slot - which field of it
 * @returns the point in the picture
 */
function homeSpot(seat: number, seats: number, slot: number): Spot {
  // Measured from where the tip actually runs, not from the corners it spans:
  // the row across a tip is a chord, so its middle lies nearer the centre than
  // ARM_OUT - and a home that started from ARM_OUT sat on top of it.
  const slice = (Math.PI * 2) / seats;
  const chord = ARM_OUT * Math.cos(slice * TIP_WIDE);
  return polar(armAngle(seat, seats), chord - HOME_GAP * (slot + 1));
}

/**
 * Where one spot of a kennel lies: outside the loop, beside the tip.
 *
 * @param seat - whose kennel
 * @param seats - how many sit at the table
 * @param at - which of its spots
 * @returns the point in the picture
 * @remarks
 * Walking away from the tip round the outside, which is how the printed board
 * lays them out: a row of four beside the start field, pointing at the corner.
 */
function kennelSpot(seat: number, seats: number, at: number): Spot {
  const slice = (Math.PI * 2) / seats;
  const start = armAngle(seat, seats) - slice * TIP_WIDE;
  return polar(start - KENNEL_STEP * (at + 1), ARM_OUT + KENNEL_OUT);
}

/** Where a colour is named: past the far end of its kennel. */
function labelSpot(seat: number, seats: number): Spot {
  const slice = (Math.PI * 2) / seats;
  const start = armAngle(seat, seats) - slice * TIP_WIDE;
  return polar(start + KENNEL_STEP * 1.1, ARM_OUT + KENNEL_OUT + 6);
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
