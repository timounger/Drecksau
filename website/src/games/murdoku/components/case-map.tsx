/**
 * The map of a case: its areas, the things on it, the player's crosses and the
 * pawns of everybody placed.
 *
 * @module
 * @remarks
 * Drawn as one SVG, a hundred units to the field. The areas are coloured by
 * their ground, with a thick line wherever one area meets the next - those
 * lines are what "in the same area" means, so they have to be impossible to
 * miss. Rows and columns of placed people are greyed out, as the printed
 * puzzle tells you to cross them off by hand.
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  cellKey,
  EMPTY_BOARD,
  standingOn,
  type Board,
} from "@/games/murdoku/engine/board";
import {
  areaAt,
  clashesOf,
  groundAt,
  groundDef,
  isInside,
  isStandableForAny,
  sizeOf,
  thingAt,
  thingDef,
} from "@/games/murdoku/engine/rules";
import type {
  Area,
  Cell,
  Level,
  Piece,
  Side,
  WallWindow,
} from "@/games/murdoku/engine/types";
import { MURDOKU_TEXTS as T } from "@/games/murdoku/i18n/texts";

/** One field, in units of the picture. */
const FIELD = 100;

/** Room around the map for the row and column numbers. */
const MARGIN = 40;

/** How thick a border between two areas is. */
const BORDER = 6;

/** Sizes inside a field, as parts of it. */
const LOOK = {
  thing: 0.6,
  // A thing over a block of fields fills it, so it plainly covers them all.
  block: 0.95,
  pawn: 0.34,
  letter: 0.38,
  cross: 0.22,
  label: 0.19,
} as const;

/** A bed drawn over its fields: frame inset and roundness, pillow and blanket as parts of the bed's length. */
const BED = {
  inset: 10,
  round: 10,
  mattress: 8,
  pillow: 0.22,
  blanket: 0.45,
} as const;

/** A table drawn over its block: edge gap, top and leg sizes as parts of the block; a leg's width in picture units and the legs' places in leg widths from the sides. */
const TABLE = {
  side: 0.14,
  top: 0.2,
  depth: 0.36,
  edge: 0.07,
  leg: 7,
  front: 0.86,
  back: 0.7,
  inBack: 2,
  outBack: 3,
  outFront: 1.5,
} as const;

/** A rug drawn over its block: gap to the edge, the border band and the fringe, as parts of the block; tassels per field. */
const RUG = {
  side: 0.12,
  band: 0.09,
  fringe: 0.07,
  tassels: 6,
  line: 3,
  centre: 0.5,
} as const;

/** The colours of a rug: its edge, the line in its border, its field and its fringe. */
type RugColours = {
  readonly edge: string;
  readonly line: string;
  readonly field: string;
  readonly fringe: string;
};

/** The red rug of the books. */
const RUG_COLOURS: RugColours = {
  edge: "#1e3a5f",
  line: "#d4a017",
  field: "#a3242b",
  fringe: "#e7d7b7",
};

/** A beach towel: drawn like a rug, in the lilac of the page. */
const TOWEL_COLOURS: RugColours = {
  edge: "#5b21b6",
  line: "#ede9fe",
  field: "#a78bfa",
  fringe: "#ddd6fe",
};

/** A door in the wall: its length along the wall and its depth across it, as parts of a field; frame in picture units. */
const DOOR = { long: 0.66, deep: 0.2, frame: 2.5 } as const;

/** A window in the wall: its length along the wall and its depth across it, as parts of a field; frame in picture units. */
const PANE = { long: 0.56, deep: 0.16, frame: 3 } as const;

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/** A bookshelf: gap to the field's edge and wood thickness as parts of a field, its boards, and the books' colours and heights. */
const SHELF = {
  side: 0.12,
  wood: 0.05,
  boards: 3,
  books: ["#b91c1c", "#1d4ed8", "#15803d", "#ca8a04", "#7c3aed", "#0f766e"],
  tall: [0.8, 0.95, 0.7, 0.88, 0.76, 0.92],
  perRow: 6,
} as const;

/* eslint-enable @typescript-eslint/no-magic-numbers */
/** A table of another shape: gap to the field's edge where it ends, room for the legs, front edge and leg width, as parts of a field. */
const SHAPED = { gap: 0.14, legs: 0.16, edge: 0.08, leg: 0.07 } as const;

/** How far the parts of a shaped table's top overlap, so no seam shows between them. */
const SEAM = 1;

/** A till: its body, drawer and screen, as parts of the field. */
const TILL = {
  left: 0.16,
  right: 0.84,
  body: 0.46,
  base: 0.84,
  drawer: 0.72,
  screen: 0.18,
  keys: 3,
} as const;

/** A chalkboard in the wall: gap at its ends, its depth across the wall and its frame, as parts of a field. */
const BOARD = { gap: 0.08, deep: 0.36, frame: 0.04 } as const;

/** The sign with an area's name: width per letter and height, as parts of its font, and its gap to the field's edge. */
const SIGN = { letter: 0.7, tall: 1.5, gap: 6 } as const;

/** The pawn's shadow and the ring around a misplaced one, in picture units and parts of the pawn. */
const PAWN_LOOK = {
  drift: 3,
  low: 0.95,
  wide: 0.95,
  flat: 0.32,
  ring: 7,
} as const;

/**
 * How wide an area's sign may be: the run of the area's fields in the sign's
 * row, from its field on to the right - or to the left for a sign that ends
 * at its field.
 *
 * @param level - the case
 * @param area - the area
 * @returns the width in picture units
 */
function labelRoom(level: Level, area: Area): number {
  const step = area.labelEnd === true ? -1 : 1;
  let fields = 0;
  let col = area.label.col;
  while (areaAt(level, { row: area.label.row, col })?.key === area.key) {
    fields += 1;
    col += step;
  }
  return Math.max(1, fields) * FIELD - SIGN.gap * 2;
}

/** How a step across each side of a field moves. */
const ACROSS: Readonly<Record<WallWindow["side"], Cell>> = {
  top: { row: -1, col: 0 },
  bottom: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

/**
 * Whether a door is drawn in a wall of a field.
 *
 * @param level - the case
 * @param cell - the field
 * @returns true when a door opens on the field, from it or into it
 */
function doorBeside(level: Level, cell: Cell): boolean {
  return (level.windows ?? []).some((pane) => {
    const step = ACROSS[pane.side];
    return (
      pane.door === true &&
      ((pane.at.row === cell.row && pane.at.col === cell.col) ||
        (pane.at.row + step.row === cell.row &&
          pane.at.col + step.col === cell.col))
    );
  });
}

/**
 * Whether a field's sign gives way to a table or rug of another shape.
 *
 * @param level - the case
 * @param cell - the field
 * @returns whether a shape covers it with the same thing
 * @remarks
 * A field with something else on it - a plant on the rug - keeps its sign,
 * drawn on top of the shape.
 */
function inShape(level: Level, cell: Cell): boolean {
  const thing = thingAt(level, cell);
  return (level.shapes ?? []).some(
    (shape) =>
      thing === thingAt(level, shape[0] ?? cell) &&
      shape.some((one) => one.row === cell.row && one.col === cell.col),
  );
}

/**
 * Whether a piece hides a field's own sign: when the field holds what the
 * piece shows (or one of its kinds - a car's back is a car).
 *
 * @param level - the case
 * @param piece - the piece
 * @param thing - what is on the field
 * @returns whether the field's sign gives way to the piece
 */
function covers(level: Level, piece: Piece, thing: string | null): boolean {
  const shown = piece.thing ?? thingAt(level, piece.at);
  return (
    thing !== null &&
    (thing === shown ||
      (thingDef(level, thing).kinds ?? []).includes(shown ?? ""))
  );
}

/**
 * Whether a field is part of a thing drawn over several fields.
 *
 * @param level - the case
 * @param cell - the field
 * @returns whether a piece covers it
 */
function inPiece(level: Level, cell: Cell): boolean {
  // A field with something else on it - a chair on the rug - keeps showing
  // that thing, drawn on top of the piece.
  return (level.pieces ?? []).some(
    (piece) =>
      covers(level, piece, thingAt(level, cell)) &&
      cell.row >= piece.at.row &&
      cell.row < piece.at.row + piece.rows &&
      cell.col >= piece.at.col &&
      cell.col < piece.at.col + piece.cols,
  );
}

/**
 * One thing over several fields: a bed as a bed, with its pillow at the head
 * and a blanket over the rest; anything else as its sign, once, in the middle.
 *
 * @param props - the piece, what it is and its sign
 * @returns the drawing
 */
function PieceShape({
  piece,
  thing,
  emoji,
}: {
  readonly piece: Piece;
  readonly thing: string | null;
  readonly emoji: string;
}): ReactElement {
  const x = piece.at.col * FIELD;
  const y = piece.at.row * FIELD;
  const width = piece.cols * FIELD;
  const height = piece.rows * FIELD;
  // The head is at the top of a standing bed, at the left of a lying one.
  const upright = piece.rows >= piece.cols;
  const length = upright ? height : width;
  const inner = BED.inset + BED.mattress;
  return thing === "rug" && piece.plain === true ? (
    <MatShape x={x} y={y} width={width} height={height} />
  ) : thing !== null && DRAWN_THINGS.has(thing) ? (
    <DrawnThing thing={thing} x={x} y={y} width={width} height={height} />
  ) : thing === "bed" ? (
    <g pointerEvents="none">
      <rect
        x={x + BED.inset}
        y={y + BED.inset}
        width={width - BED.inset * 2}
        height={height - BED.inset * 2}
        rx={BED.round}
        fill="#7c4a24"
      />
      <rect
        x={x + inner}
        y={y + inner}
        width={width - inner * 2}
        height={height - inner * 2}
        rx={BED.round / 2}
        fill="#f8fafc"
      />
      <rect
        x={x + inner + BED.mattress}
        y={y + inner + BED.mattress}
        width={
          upright ? width - (inner + BED.mattress) * 2 : length * BED.pillow
        }
        height={
          upright ? length * BED.pillow : height - (inner + BED.mattress) * 2
        }
        rx={BED.round}
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth={3}
      />
      <rect
        x={upright ? x + inner : x + width - inner - length * BED.blanket}
        y={upright ? y + height - inner - length * BED.blanket : y + inner}
        width={upright ? width - inner * 2 : length * BED.blanket}
        height={upright ? length * BED.blanket : height - inner * 2}
        rx={BED.round / 2}
        fill="#4f46e5"
      />
    </g>
  ) : (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={
        FIELD *
        (piece.rows > 1 && piece.cols > 1 ? LOOK.block : LOOK.thing) *
        Math.min(piece.rows, piece.cols)
      }
      pointerEvents="none"
    >
      {emoji}
    </text>
  );
}

/**
 * A rug: a red field with a patterned border and a fringe at both short ends - over one field or a block of them.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function RugShape({
  x,
  y,
  width,
  height,
  colours = RUG_COLOURS,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Other colours than the red rug's - a beach towel's, say. */
  readonly colours?: RugColours;
}): ReactElement {
  // The gap to the edge stays as on one field, so a big rug fills its block
  // and what stands on it clearly stands on it. The fringe hangs off the
  // short ends: top and bottom of a standing rug.
  const upright = height > width;
  const left = x + FIELD * RUG.side;
  const top = y + FIELD * RUG.side;
  const right = x + width - FIELD * RUG.side;
  const bottom = y + height - FIELD * RUG.side;
  const band = FIELD * RUG.band;
  const fringe = FIELD * RUG.fringe;
  const tassels = Math.round(
    (RUG.tassels * (upright ? width : height)) / FIELD,
  );
  const ends = upright ? [top, bottom] : [left, right];
  return (
    <g pointerEvents="none">
      {ends.flatMap((end, side) =>
        Array.from({ length: tassels }, (_, at) => {
          const along =
            ((upright ? right - left : bottom - top) * (at + RUG.centre)) /
            tassels;
          const out = side === 0 ? -fringe : fringe;
          return upright ? (
            <line
              key={`fringe-${String(side)}-${String(at)}`}
              x1={left + along}
              y1={end}
              x2={left + along}
              y2={end + out}
              stroke={colours.fringe}
              strokeWidth={RUG.line}
              strokeLinecap="round"
            />
          ) : (
            <line
              key={`fringe-${String(side)}-${String(at)}`}
              x1={end}
              y1={top + along}
              x2={end + out}
              y2={top + along}
              stroke={colours.fringe}
              strokeWidth={RUG.line}
              strokeLinecap="round"
            />
          );
        }),
      )}
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        rx={RUG.line}
        fill={colours.edge}
      />
      <rect
        x={left + band / 2}
        y={top + band / 2}
        width={right - left - band}
        height={bottom - top - band}
        fill="none"
        stroke={colours.line}
        strokeWidth={RUG.line}
      />
      <rect
        x={left + band}
        y={top + band}
        width={right - left - band * 2}
        height={bottom - top - band * 2}
        fill={colours.field}
      />
    </g>
  );
}

/**
 * A bookshelf from the front: a wooden case with boards and rows of books in
 * different colours and heights - over one field or a block of them.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function ShelfShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const left = x + FIELD * SHELF.side;
  const right = x + width - FIELD * SHELF.side;
  const top = y + FIELD * SHELF.side;
  const bottom = y + height - FIELD * SHELF.side;
  const wood = FIELD * SHELF.wood;
  const rows = SHELF.boards * Math.max(1, Math.round(height / FIELD));
  const rowHeight = (bottom - top - wood) / rows;
  const perRow = SHELF.perRow * Math.max(1, Math.round(width / FIELD));
  const bookWidth = (right - left - wood * 2) / perRow;
  return (
    <g pointerEvents="none">
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        rx={wood / 2}
        fill="#6b3f1d"
      />
      <rect
        x={left + wood}
        y={top + wood}
        width={right - left - wood * 2}
        height={bottom - top - wood * 2}
        fill="#3b2412"
      />
      {Array.from({ length: rows }, (_, row) => {
        const floor = top + wood + rowHeight * (row + 1);
        return (
          <g key={`row-${String(row)}`}>
            {Array.from({ length: perRow }, (_, at) => {
              const pick = (at + row * 2) % SHELF.books.length;
              const tall = (rowHeight - wood) * SHELF.tall[pick];
              return (
                <rect
                  key={`book-${String(at)}`}
                  x={left + wood + bookWidth * at + 1}
                  y={floor - wood - tall}
                  width={bookWidth - 2}
                  height={tall}
                  fill={SHELF.books[pick]}
                />
              );
            })}
            <rect
              x={left}
              y={floor - wood}
              width={right - left}
              height={wood}
              fill="#8b5a2b"
            />
          </g>
        );
      })}
    </g>
  );
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A till: a grey body with a drawer and keys, and a small green screen on
 * top.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function TillShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const left = cx + FIELD * (TILL.left - 1 / 2);
  const right = cx + FIELD * (TILL.right - 1 / 2);
  const bodyTop = cy + FIELD * (TILL.body - 1 / 2);
  const base = cy + FIELD * (TILL.base - 1 / 2);
  const drawer = cy + FIELD * (TILL.drawer - 1 / 2);
  const screen = cy + FIELD * (TILL.screen - 1 / 2);
  const key = (right - left) / (TILL.keys * 2 + 1);
  return (
    <g pointerEvents="none">
      {/* The screen on its stand. */}
      <rect
        x={cx - key / 2}
        y={screen + key * 2}
        width={key}
        height={bodyTop - screen - key * 2}
        fill="#475569"
      />
      <rect
        x={cx - key * 2}
        y={screen}
        width={key * 4}
        height={key * 2.2}
        rx={2}
        fill="#1e293b"
      />
      <rect
        x={cx - key * 1.6}
        y={screen + key * 0.4}
        width={key * 3.2}
        height={key * 1.4}
        fill="#4ade80"
      />
      {/* The body with its keys, and the drawer below. */}
      <polygon
        points={`${String(left + key)},${String(bodyTop)} ${String(right - key)},${String(bodyTop)} ${String(right)},${String(drawer)} ${String(left)},${String(drawer)}`}
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth={2}
      />
      {Array.from({ length: TILL.keys }, (_, at) => (
        <rect
          key={`key-${String(at)}`}
          x={left + key * (at * 2 + 1.5)}
          y={bodyTop + (drawer - bodyTop) / 3}
          width={key * 0.9}
          height={(drawer - bodyTop) / 3}
          rx={1}
          fill="#f8fafc"
        />
      ))}
      <rect
        x={left}
        y={drawer}
        width={right - left}
        height={base - drawer}
        rx={2}
        fill="#64748b"
      />
      <rect
        x={cx - key}
        y={drawer + (base - drawer) / 3}
        width={key * 2}
        height={(base - drawer) / 3}
        rx={1}
        fill="#cbd5e1"
      />
    </g>
  );
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
/**
 * A table of another shape than a block, seen a little from above like the
 * plain one: per field a top with bridges to its neighbours in the same table,
 * so the parts meet as one top with clean corners; a darker front edge and
 * short legs where it ends towards the front.
 *
 * @param props - the fields of the table
 * @returns the drawing
 */
function ShapedTable({
  cells,
}: {
  readonly cells: readonly Cell[];
}): ReactElement {
  const has = (row: number, col: number): boolean =>
    cells.some((one) => one.row === row && one.col === col);
  const gap = FIELD * SHAPED.gap;
  const legs = FIELD * SHAPED.legs;
  const edge = FIELD * SHAPED.edge;
  const leg = FIELD * SHAPED.leg;
  const parts = cells.map((cell) => {
    const left = cell.col * FIELD;
    const top = cell.row * FIELD;
    const x0 = left + gap;
    const x1 = left + FIELD - gap;
    const y0 = top + gap;
    const y1 = top + FIELD - gap - legs;
    const joins = {
      up: has(cell.row - 1, cell.col),
      down: has(cell.row + 1, cell.col),
      left: has(cell.row, cell.col - 1),
      right: has(cell.row, cell.col + 1),
    };
    const rects = [
      { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
      ...(joins.up ? [{ x: x0, y: top, w: x1 - x0, h: gap }] : []),
      ...(joins.down
        ? [{ x: x0, y: y1, w: x1 - x0, h: top + FIELD - y1 }]
        : []),
      ...(joins.left ? [{ x: left, y: y0, w: gap, h: y1 - y0 }] : []),
      ...(joins.right
        ? [{ x: x1, y: y0, w: left + FIELD - x1, h: y1 - y0 }]
        : []),
    ];
    return { cell, x0, x1, y1, joins, rects, left };
  });
  return (
    <g pointerEvents="none">
      {/* The outline first, under every part, so inner seams vanish. */}
      {parts.flatMap(({ cell, rects }) =>
        rects.map((one, at) => (
          <rect
            key={`line-${cellKey(cell)}-${String(at)}`}
            x={one.x}
            y={one.y}
            width={one.w}
            height={one.h}
            fill="#8a5a2b"
            stroke="#8a5a2b"
            strokeWidth={6}
          />
        )),
      )}
      {parts.flatMap(({ cell, x0, x1, y1, joins, left }) =>
        joins.down
          ? []
          : [
              ...[
                ...(joins.left ? [] : [x0 + leg]),
                ...(joins.right ? [] : [x1 - leg * 2]),
              ].map((at) => (
                <rect
                  key={`leg-${cellKey(cell)}-${String(at)}`}
                  x={at}
                  y={y1}
                  width={leg}
                  height={legs}
                  fill="#78481c"
                />
              )),
              <rect
                key={`front-${cellKey(cell)}`}
                x={joins.left ? left : x0}
                y={y1 - edge}
                width={
                  (joins.right ? left + FIELD : x1) - (joins.left ? left : x0)
                }
                height={edge}
                fill="#8a5a2b"
              />,
            ],
      )}
      {parts.flatMap(({ cell, rects, joins, y1 }) =>
        rects.map((one, at) => (
          <rect
            key={`top-${cellKey(cell)}-${String(at)}`}
            x={one.x - SEAM}
            y={one.y - SEAM}
            width={one.w + SEAM * 2}
            height={
              // The front edge stays visible below the top.
              (!joins.down && one.y + one.h >= y1 ? one.h - edge : one.h) +
              SEAM * 2
            }
            fill="#c08a4a"
            shapeRendering="crispEdges"
          />
        )),
      )}
    </g>
  );
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/** The chunks of a rubble heap: corners in parts of a field, and a colour - concrete grey, a broken brick, a splinter of wood. */
const RUBBLE: readonly {
  readonly points: readonly (readonly [number, number])[];
  readonly fill: string;
}[] = [
  {
    points: [
      [0.12, 0.78],
      [0.3, 0.52],
      [0.5, 0.6],
      [0.44, 0.84],
    ],
    fill: "#9ca3af",
  },
  {
    points: [
      [0.42, 0.82],
      [0.52, 0.46],
      [0.72, 0.42],
      [0.86, 0.7],
      [0.7, 0.86],
    ],
    fill: "#6b7280",
  },
  {
    points: [
      [0.3, 0.5],
      [0.4, 0.3],
      [0.58, 0.28],
      [0.62, 0.48],
      [0.46, 0.58],
    ],
    fill: "#d1d5db",
  },
  {
    points: [
      [0.6, 0.36],
      [0.76, 0.3],
      [0.8, 0.44],
      [0.66, 0.5],
    ],
    fill: "#b45309",
  },
  {
    points: [
      [0.16, 0.6],
      [0.26, 0.56],
      [0.3, 0.68],
      [0.18, 0.72],
    ],
    fill: "#b91c1c",
  },
  {
    points: [
      [0.2, 0.34],
      [0.56, 0.18],
      [0.58, 0.24],
      [0.22, 0.4],
    ],
    fill: "#a16207",
  },
  {
    points: [
      [0.66, 0.62],
      [0.78, 0.58],
      [0.8, 0.7],
      [0.68, 0.74],
    ],
    fill: "#9ca3af",
  },
];

/**
 * A heap of rubble: broken concrete, bits of brick and a splintered plank on a
 * little cloud of dust.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function RubbleShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  return (
    <g pointerEvents="none">
      <ellipse
        cx={left + size * 0.5}
        cy={top + size * 0.8}
        rx={size * 0.42}
        ry={size * 0.1}
        fill="#57534e"
        opacity={0.35}
      />
      {RUBBLE.map((chunk, at) => (
        <polygon
          key={`chunk-${String(at)}`}
          points={chunk.points
            .map(
              ([px, py]) =>
                `${String(left + size * px)},${String(top + size * py)}`,
            )
            .join(" ")}
          fill={chunk.fill}
          stroke="#44403c"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * A rug of another shape than a block - round a corner: its blue border and
 * red field run on from field to field, built like {@link ShapedTable} from a
 * part per field and bridges to its neighbours in the same rug.
 *
 * @param props - the fields of the rug
 * @returns the drawing
 */
function ShapedRug({
  cells,
}: {
  readonly cells: readonly Cell[];
}): ReactElement {
  const has = (row: number, col: number): boolean =>
    cells.some((one) => one.row === row && one.col === col);
  const layer = (inset: number): readonly Rect[] =>
    cells.flatMap((cell) => {
      const left = cell.col * FIELD;
      const top = cell.row * FIELD;
      const x0 = left + inset;
      const x1 = left + FIELD - inset;
      const y0 = top + inset;
      const y1 = top + FIELD - inset;
      return [
        { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
        ...(has(cell.row - 1, cell.col)
          ? [{ x: x0, y: top - SEAM, w: x1 - x0, h: inset + SEAM }]
          : []),
        ...(has(cell.row + 1, cell.col)
          ? [{ x: x0, y: y1, w: x1 - x0, h: inset + SEAM }]
          : []),
        ...(has(cell.row, cell.col - 1)
          ? [{ x: left - SEAM, y: y0, w: inset + SEAM, h: y1 - y0 }]
          : []),
        ...(has(cell.row, cell.col + 1)
          ? [{ x: x1, y: y0, w: inset + SEAM, h: y1 - y0 }]
          : []),
        // Where four fields of the rug meet, their corners close up too.
        ...(
          [
            [-1, -1, left - SEAM, top - SEAM],
            [-1, 1, x1, top - SEAM],
            [1, -1, left - SEAM, y1],
            [1, 1, x1, y1],
          ] as const
        )
          .filter(
            ([dr, dc]) =>
              has(cell.row + dr, cell.col) &&
              has(cell.row, cell.col + dc) &&
              has(cell.row + dr, cell.col + dc),
          )
          .map(([, , cx, cy]) => ({
            x: cx,
            y: cy,
            w: inset + SEAM,
            h: inset + SEAM,
          })),
      ];
    });
  const side = FIELD * RUG.side;
  const band = FIELD * RUG.band;
  const fringe = FIELD * RUG.fringe;
  // The same layers as a straight rug: blue border, the golden line in it,
  // and the red field - each as one piece round the corners.
  const layers: readonly (readonly [number, string])[] = [
    [side, "#1e3a5f"],
    [side + band / 2 - RUG.line / 2, "#d4a017"],
    [side + band / 2 + RUG.line / 2, "#1e3a5f"],
  ];
  // The fringe hangs off the ends: a field with only one neighbour in the rug
  // ends on the side facing away from it.
  const ends = cells.flatMap((cell) => {
    const up = has(cell.row - 1, cell.col);
    const down = has(cell.row + 1, cell.col);
    const left = has(cell.row, cell.col - 1);
    const right = has(cell.row, cell.col + 1);
    const count = [up, down, left, right].filter(Boolean).length;
    let edge: Side | null = null;
    if (count === 1) {
      edge = up ? "bottom" : down ? "top" : left ? "right" : "left";
    }
    return edge === null ? [] : [{ cell, edge }];
  });
  return (
    <g pointerEvents="none">
      {ends.flatMap(({ cell, edge }) =>
        Array.from({ length: RUG.tassels }, (_, at) => {
          const along =
            side + ((FIELD - side * 2) * (at + RUG.centre)) / RUG.tassels;
          const x = cell.col * FIELD;
          const y = cell.row * FIELD;
          let line: readonly [number, number, number, number];
          switch (edge) {
            case "top":
              line = [x + along, y + side, x + along, y + side - fringe];
              break;
            case "bottom":
              line = [
                x + along,
                y + FIELD - side,
                x + along,
                y + FIELD - side + fringe,
              ];
              break;
            case "left":
              line = [x + side, y + along, x + side - fringe, y + along];
              break;
            default:
              line = [
                x + FIELD - side,
                y + along,
                x + FIELD - side + fringe,
                y + along,
              ];
          }
          return (
            <line
              key={`fringe-${cellKey(cell)}-${String(at)}`}
              x1={line[0]}
              y1={line[1]}
              x2={line[2]}
              y2={line[3]}
              stroke="#e7d7b7"
              strokeWidth={RUG.line}
              strokeLinecap="round"
            />
          );
        }),
      )}
      {layers.flatMap(([inset, colour]) =>
        layer(inset).map((one, at) => (
          <rect
            key={`layer-${String(inset)}-${String(at)}`}
            x={one.x}
            y={one.y}
            width={one.w}
            height={one.h}
            fill={colour}
            shapeRendering="crispEdges"
          />
        )),
      )}
      {layer(side + band).map((one, at) => (
        <rect
          key={`field-${String(at)}`}
          x={one.x}
          y={one.y}
          width={one.w}
          height={one.h}
          fill="#a3242b"
          shapeRendering="crispEdges"
        />
      ))}
    </g>
  );
}

/** A rectangle in picture units, for the parts of a shaped thing. */
type Rect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A closed cardboard box, a little from above: the front, the top with its
 * two flaps meeting in the middle and a strip of tape over the seam - over
 * one field or a block of them.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function BoxShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const left = x + FIELD * 0.14;
  const right = x + width - FIELD * 0.14;
  const top = y + height / 2 - FIELD * 0.34;
  const bottom = y + height / 2 + FIELD * 0.32;
  // The top seen from above, shifted back a little, then the front below it.
  const back = FIELD * 0.08;
  const lid = top + (bottom - top) * 0.36;
  const middle = (left + right) / 2;
  const tape = FIELD * 0.08;
  return (
    <g pointerEvents="none">
      <rect
        x={left}
        y={lid}
        width={right - left}
        height={bottom - lid}
        fill="#b9844f"
        stroke="#6b4423"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <polygon
        points={`${String(left)},${String(lid)} ${String(left + back)},${String(top)} ${String(right - back)},${String(top)} ${String(right)},${String(lid)}`}
        fill="#d4a26a"
        stroke="#6b4423"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* The seam where the flaps meet, and the tape over it and down the front. */}
      <polygon
        points={`${String(middle - tape / 2)},${String(top)} ${String(middle + tape / 2)},${String(top)} ${String(middle + tape / 2)},${String(lid + (bottom - lid) * 0.4)} ${String(middle - tape / 2)},${String(lid + (bottom - lid) * 0.4)}`}
        fill="#e9d8b4"
        opacity={0.9}
      />
      <line
        x1={middle}
        y1={top}
        x2={middle}
        y2={lid}
        stroke="#8a5a2b"
        strokeWidth={1.5}
      />
      <line
        x1={left + (right - left) * 0.12}
        y1={bottom - (bottom - lid) * 0.25}
        x2={left + (right - left) * 0.38}
        y2={bottom - (bottom - lid) * 0.25}
        stroke="#8a5a2b"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A statue: a draped stone figure on a plinth.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function StatueShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const cx = x + width / 2;
  const top = y + (height - size) / 2;
  const at = (part: number): number => top + size * part;
  const side = (part: number): number => size * part;
  return (
    <g pointerEvents="none">
      {/* The plinth. */}
      <rect
        x={cx - side(0.3)}
        y={at(0.8)}
        width={side(0.6)}
        height={side(0.1)}
        rx={2}
        fill="#6b7280"
        stroke="#374151"
        strokeWidth={2}
      />
      <rect
        x={cx - side(0.22)}
        y={at(0.74)}
        width={side(0.44)}
        height={side(0.07)}
        fill="#9ca3af"
        stroke="#374151"
        strokeWidth={2}
      />
      {/* The figure in its robe. */}
      <path
        d={`M ${String(cx - side(0.08))} ${String(at(0.24))}
            Q ${String(cx - side(0.2))} ${String(at(0.36))} ${String(cx - side(0.15))} ${String(at(0.5))}
            Q ${String(cx - side(0.12))} ${String(at(0.62))} ${String(cx - side(0.18))} ${String(at(0.74))}
            L ${String(cx + side(0.17))} ${String(at(0.74))}
            Q ${String(cx + side(0.1))} ${String(at(0.6))} ${String(cx + side(0.15))} ${String(at(0.46))}
            Q ${String(cx + side(0.18))} ${String(at(0.32))} ${String(cx + side(0.08))} ${String(at(0.24))} Z`}
        fill="#d1d5db"
        stroke="#4b5563"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Folds of the robe. */}
      {[
        [0.06, 0.34, -0.06, 0.48],
        [0.1, 0.44, -0.04, 0.6],
        [0.08, 0.56, -0.08, 0.7],
      ].map(([x1, y1, x2, y2]) => (
        <path
          key={`fold-${String(y1)}`}
          d={`M ${String(cx + side(x1))} ${String(at(y1))} Q ${String(cx)} ${String(at((y1 + y2) / 2 + 0.03))} ${String(cx + side(x2))} ${String(at(y2))}`}
          fill="none"
          stroke="#6b7280"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ))}
      {/* The head. */}
      <circle
        cx={cx}
        cy={at(0.17)}
        r={side(0.075)}
        fill="#d1d5db"
        stroke="#4b5563"
        strokeWidth={2.5}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A plain mat: a red field with a darker line round it, nothing else - the
 * mat in a boxing ring.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function MatShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const side = FIELD * 0.12;
  return (
    <g pointerEvents="none">
      <rect
        x={x + side}
        y={y + side}
        width={width - side * 2}
        height={height - side * 2}
        fill="#dc3a3a"
        stroke="#9f1d1d"
        strokeWidth={4}
      />
      <rect
        x={x + side + 8}
        y={y + side + 8}
        width={width - side * 2 - 16}
        height={height - side * 2 - 16}
        fill="none"
        stroke="#b42323"
        strokeWidth={2}
      />
    </g>
  );
}

/**
 * A locker: a narrow steel cabinet from the front, with air slots at the top,
 * a handle and a name tag.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function LockerShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const w = FIELD * 0.5;
  const h = FIELD * 0.72;
  const left = cx - w / 2;
  const top = cy - h / 2;
  return (
    <g pointerEvents="none">
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        rx={4}
        fill="#3b5b8a"
        stroke="#1e3354"
        strokeWidth={3}
      />
      <rect
        x={left + 5}
        y={top + 5}
        width={w - 10}
        height={h - 10}
        rx={2}
        fill="#4a6fa5"
      />
      {[0, 1, 2].map((at) => (
        <rect
          key={`slot-${String(at)}`}
          x={left + w * 0.3}
          y={top + h * (0.12 + at * 0.07)}
          width={w * 0.4}
          height={h * 0.035}
          rx={1}
          fill="#1e3354"
        />
      ))}
      <rect
        x={left + w * 0.3}
        y={top + h * 0.42}
        width={w * 0.4}
        height={h * 0.1}
        rx={1}
        fill="#e5e7eb"
      />
      <rect
        x={left + w * 0.14}
        y={top + h * 0.55}
        width={w * 0.08}
        height={h * 0.18}
        rx={2}
        fill="#cbd5e1"
      />
    </g>
  );
}

/**
 * A punching bag hanging on its chain: a red leather cylinder with dark rims
 * and a shine down one side.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function PunchingBagShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const w = FIELD * 0.38;
  const top = cy - FIELD * 0.22;
  const bottom = cy + FIELD * 0.34;
  return (
    <g pointerEvents="none">
      <line
        x1={cx}
        y1={cy - FIELD * 0.42}
        x2={cx}
        y2={top}
        stroke="#57534e"
        strokeWidth={3}
        strokeDasharray="4 2"
      />
      <ellipse
        cx={cx}
        cy={bottom + 2}
        rx={w * 0.55}
        ry={FIELD * 0.04}
        fill="#000"
        opacity={0.15}
      />
      <rect
        x={cx - w / 2}
        y={top}
        width={w}
        height={bottom - top}
        rx={w * 0.3}
        fill="#dc2626"
        stroke="#7f1d1d"
        strokeWidth={3}
      />
      <rect
        x={cx - w / 2}
        y={top + 4}
        width={w}
        height={FIELD * 0.06}
        fill="#7f1d1d"
      />
      <rect
        x={cx - w / 2}
        y={bottom - FIELD * 0.1}
        width={w}
        height={FIELD * 0.06}
        fill="#7f1d1d"
      />
      <rect
        x={cx - w * 0.3}
        y={top + FIELD * 0.12}
        width={w * 0.14}
        height={(bottom - top) * 0.55}
        rx={3}
        fill="#fca5a5"
        opacity={0.7}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A car from the side, front to the right: body, cabin with its windows, two
 * wheels, a headlight and a tail light - over the fields it stands on.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function CarShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const left = x + FIELD * 0.08;
  const right = x + width - FIELD * 0.08;
  const length = right - left;
  const cy = y + height / 2;
  const sill = cy + FIELD * 0.18;
  const belt = cy - FIELD * 0.04;
  const roof = cy - FIELD * 0.3;
  const wheel = FIELD * 0.11;
  const at = (part: number): number => left + length * part;
  return (
    <g pointerEvents="none">
      <ellipse
        cx={(left + right) / 2}
        cy={sill + wheel * 0.9}
        rx={length * 0.48}
        ry={FIELD * 0.04}
        fill="#000"
        opacity={0.15}
      />
      {/* The cabin and its windows. */}
      <path
        d={`M ${String(at(0.18))} ${String(belt)} L ${String(at(0.3))} ${String(roof)} L ${String(at(0.62))} ${String(roof)} L ${String(at(0.76))} ${String(belt)} Z`}
        fill="#e5e7eb"
        stroke="#475569"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={`M ${String(at(0.23))} ${String(belt - 2)} L ${String(at(0.32))} ${String(roof + 6)} L ${String(at(0.45))} ${String(roof + 6)} L ${String(at(0.45))} ${String(belt - 2)} Z`}
        fill="#93c5fd"
      />
      <path
        d={`M ${String(at(0.49))} ${String(belt - 2)} L ${String(at(0.49))} ${String(roof + 6)} L ${String(at(0.6))} ${String(roof + 6)} L ${String(at(0.7))} ${String(belt - 2)} Z`}
        fill="#93c5fd"
      />
      {/* The body. */}
      <rect
        x={left}
        y={belt}
        width={length}
        height={sill - belt}
        rx={FIELD * 0.08}
        fill="#f1f5f9"
        stroke="#475569"
        strokeWidth={3}
      />
      <line
        x1={at(0.47)}
        y1={belt + 3}
        x2={at(0.47)}
        y2={sill - 3}
        stroke="#94a3b8"
        strokeWidth={2}
      />
      <rect
        x={right - FIELD * 0.07}
        y={belt + FIELD * 0.05}
        width={FIELD * 0.05}
        height={FIELD * 0.06}
        rx={2}
        fill="#fde047"
      />
      <rect
        x={left + FIELD * 0.02}
        y={belt + FIELD * 0.05}
        width={FIELD * 0.05}
        height={FIELD * 0.06}
        rx={2}
        fill="#ef4444"
      />
      {/* The wheels. */}
      {[0.22, 0.78].map((part) => (
        <g key={`wheel-${String(part)}`}>
          <circle cx={at(part)} cy={sill} r={wheel} fill="#1f2937" />
          <circle cx={at(part)} cy={sill} r={wheel * 0.45} fill="#9ca3af" />
        </g>
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A patch of spilt oil as the books draw it: a wide, flat, uneven splash in
 * dark grey-brown with a darker rim, lighter patches where the light falls,
 * two glints and a few splashes round it.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function OilShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const at = (px: number, py: number): string =>
    `${String(left + size * px)} ${String(top + size * py)}`;
  const splash = `M ${at(0.12, 0.54)}
    C ${at(0.1, 0.42)} ${at(0.22, 0.36)} ${at(0.32, 0.4)}
    C ${at(0.36, 0.3)} ${at(0.5, 0.28)} ${at(0.56, 0.36)}
    C ${at(0.64, 0.3)} ${at(0.8, 0.32)} ${at(0.82, 0.42)}
    C ${at(0.92, 0.44)} ${at(0.92, 0.58)} ${at(0.82, 0.6)}
    C ${at(0.8, 0.7)} ${at(0.64, 0.72)} ${at(0.58, 0.66)}
    C ${at(0.5, 0.74)} ${at(0.34, 0.72)} ${at(0.3, 0.64)}
    C ${at(0.2, 0.68)} ${at(0.1, 0.64)} ${at(0.12, 0.54)} Z`;
  return (
    <g pointerEvents="none">
      <path
        d={splash}
        fill="#44403c"
        stroke="#1c1917"
        strokeWidth={size * 0.025}
        strokeLinejoin="round"
      />
      {/* Lighter patches where the oil catches the light. */}
      <path
        d={`M ${at(0.3, 0.48)} C ${at(0.34, 0.42)} ${at(0.46, 0.4)} ${at(0.5, 0.46)} C ${at(0.46, 0.52)} ${at(0.36, 0.54)} ${at(0.3, 0.48)} Z`}
        fill="#78716c"
      />
      <path
        d={`M ${at(0.6, 0.5)} C ${at(0.64, 0.44)} ${at(0.76, 0.44)} ${at(0.78, 0.5)} C ${at(0.74, 0.56)} ${at(0.64, 0.56)} ${at(0.6, 0.5)} Z`}
        fill="#57534e"
      />
      <ellipse
        cx={left + size * 0.36}
        cy={top + size * 0.45}
        rx={size * 0.04}
        ry={size * 0.018}
        fill="#e7e5e4"
        opacity={0.8}
      />
      <ellipse
        cx={left + size * 0.68}
        cy={top + size * 0.48}
        rx={size * 0.025}
        ry={size * 0.012}
        fill="#e7e5e4"
        opacity={0.7}
      />
      {/* Splashes round the puddle. */}
      {[
        [0.08, 0.4, 0.03],
        [0.9, 0.36, 0.025],
        [0.92, 0.66, 0.035],
        [0.22, 0.76, 0.025],
        [0.6, 0.8, 0.02],
      ].map(([px, py, r]) => (
        <circle
          key={`drop-${String(px)}-${String(py)}`}
          cx={left + size * px}
          cy={top + size * py}
          r={size * r}
          fill="#44403c"
          stroke="#1c1917"
          strokeWidth={size * 0.01}
        />
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A chess table: a small table whose top is a chessboard, with a few pieces
 * standing on it.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function ChessTableShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2 + size * 0.16;
  const top = y + (height - size) / 2 + size * 0.12;
  const board = size * 0.68;
  const square = board / 6;
  return (
    <g pointerEvents="none">
      {/* Legs. */}
      {[0.06, 0.88].map((part) => (
        <rect
          key={`leg-${String(part)}`}
          x={left + board * part}
          y={top + board * 0.9}
          width={board * 0.07}
          height={size * 0.14}
          fill="#5b3714"
        />
      ))}
      <rect
        x={left - 3}
        y={top - 3}
        width={board + 6}
        height={board + 6}
        rx={3}
        fill="#6b3f1d"
      />
      {Array.from({ length: 36 }, (_, at) => {
        const row = Math.floor(at / 6);
        const col = at % 6;
        return (
          <rect
            key={`sq-${String(at)}`}
            x={left + col * square}
            y={top + row * square}
            width={square}
            height={square}
            fill={(row + col) % 2 === 0 ? "#f5e6c8" : "#7c5a3a"}
          />
        );
      })}
      {/* A few pieces: white and black. */}
      {[
        [1, 1, "#ffffff"],
        [4, 1, "#ffffff"],
        [2, 4, "#111827"],
        [3, 3, "#111827"],
      ].map(([col, row, colour]) => {
        const cx = left + (Number(col) + 0.5) * square;
        const cy = top + (Number(row) + 0.5) * square;
        return (
          <g key={`piece-${String(col)}-${String(row)}`}>
            <path
              d={`M ${String(cx - square * 0.32)} ${String(cy + square * 0.38)} L ${String(cx + square * 0.32)} ${String(cy + square * 0.38)} L ${String(cx + square * 0.16)} ${String(cy - square * 0.05)} L ${String(cx - square * 0.16)} ${String(cy - square * 0.05)} Z`}
              fill={String(colour)}
              stroke="#374151"
              strokeWidth={1.2}
            />
            <circle
              cx={cx}
              cy={cy - square * 0.2}
              r={square * 0.2}
              fill={String(colour)}
              stroke="#374151"
              strokeWidth={1.2}
            />
          </g>
        );
      })}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A mill's water wheel as the book draws it: the upper half of the wheel
 * standing in the river, a rim of paddles round the outside and spokes from
 * the hub at the bottom - over the fields it stands on.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function WaterWheelShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const cx = x + width / 2;
  const base = y + height - FIELD * 0.06;
  const outer = Math.min(width / 2, height) * 0.9;
  const paddles = outer * 0.8;
  const rim = outer * 0.7;
  const point = (r: number, angle: number): string =>
    `${String(cx + r * Math.cos(angle))} ${String(base - r * Math.sin(angle))}`;
  const half = (r: number): string =>
    `M ${point(r, 0)} A ${String(r)} ${String(r)} 0 0 0 ${point(r, Math.PI)} Z`;
  const steps = (count: number): readonly number[] =>
    Array.from({ length: count + 1 }, (_, at) => (Math.PI * at) / count);
  return (
    <g pointerEvents="none">
      <path d={half(outer)} fill="#d6d3d1" stroke="#44403c" strokeWidth={3} />
      {/* The paddles round the outside. */}
      {steps(10).map((angle) => (
        <line
          key={`paddle-${String(angle)}`}
          x1={cx + paddles * Math.cos(angle)}
          y1={base - paddles * Math.sin(angle)}
          x2={cx + outer * Math.cos(angle)}
          y2={base - outer * Math.sin(angle)}
          stroke="#44403c"
          strokeWidth={2.5}
        />
      ))}
      <path
        d={half(paddles)}
        fill="#a8a29e"
        stroke="#44403c"
        strokeWidth={2.5}
      />
      <path d={half(rim)} fill="#78716c" stroke="#44403c" strokeWidth={2.5} />
      {/* The spokes from the hub. */}
      {steps(6).map((angle) => (
        <line
          key={`spoke-${String(angle)}`}
          x1={cx}
          y1={base}
          x2={cx + rim * Math.cos(angle)}
          y2={base - rim * Math.sin(angle)}
          stroke="#e7e5e4"
          strokeWidth={rim * 0.12}
          strokeLinecap="round"
        />
      ))}
      <path
        d={half(rim * 0.22)}
        fill="#d6d3d1"
        stroke="#44403c"
        strokeWidth={2.5}
      />
      <line
        x1={cx - outer}
        y1={base}
        x2={cx + outer}
        y2={base}
        stroke="#44403c"
        strokeWidth={3}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/** The rings of leaves of a shrub, outside in: how many, how long and wide as parts of the field, turned how far, and their green. */
const SHRUB_RINGS: readonly (readonly [
  number,
  number,
  number,
  number,
  string,
])[] = [
  [13, 0.44, 0.26, 0, "#2f6b3a"],
  [11, 0.35, 0.25, 14, "#3f8a48"],
  [8, 0.25, 0.22, 8, "#5fae5e"],
  [6, 0.15, 0.16, 30, "#86c97f"],
];

/**
 * A shrub seen from above, as the book draws it: rings of pointed leaves
 * round the middle, dark outside and light inside, and a shadow below.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function ShrubShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const cx = x + width / 2;
  const cy = y + height / 2 - size * 0.03;
  const leaf = (length: number, wide: number): string =>
    `M 0 0 Q ${String(wide / 2)} ${String(-length / 2)} 0 ${String(-length)} Q ${String(-wide / 2)} ${String(-length / 2)} 0 0 Z`;
  return (
    <g pointerEvents="none">
      <ellipse
        cx={cx + size * 0.04}
        cy={cy + size * 0.1}
        rx={size * 0.4}
        ry={size * 0.34}
        fill="#000"
        opacity={0.18}
      />
      {SHRUB_RINGS.map(([count, length, wide, turn, colour]) =>
        Array.from({ length: count }, (_, at) => {
          const angle = turn + (360 * at) / count;
          return (
            <path
              key={`leaf-${String(length)}-${String(at)}`}
              d={leaf(size * length, size * wide)}
              transform={`translate(${String(cx)} ${String(cy)}) rotate(${String(angle)})`}
              fill={colour}
              stroke="#1d3b22"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          );
        }),
      )}
      <circle cx={cx} cy={cy} r={size * 0.04} fill="#a3d98f" />
    </g>
  );
}

/** The crumbs on the floor: where each lies, as parts of a field, how big, and turned how far. */
const CRUMBS: readonly (readonly [number, number, number, number])[] = [
  [0.32, 0.4, 0.07, 10],
  [0.55, 0.34, 0.05, 40],
  [0.68, 0.52, 0.08, -20],
  [0.42, 0.6, 0.06, 70],
  [0.26, 0.66, 0.04, 15],
  [0.6, 0.7, 0.045, -50],
  [0.48, 0.47, 0.035, 25],
  [0.76, 0.36, 0.03, 0],
  [0.2, 0.48, 0.03, 45],
  [0.72, 0.74, 0.03, 30],
];

/**
 * Crumbs of a biscuit scattered on the floor: small, uneven brown bits, a few
 * with a chocolate chip, nothing like a whole biscuit.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function CrumbsShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  return (
    <g pointerEvents="none">
      {CRUMBS.map(([px, py, part, turn], at) => {
        const cx = left + size * px;
        const cy = top + size * py;
        const r = size * part;
        return (
          <g
            key={`crumb-${String(at)}`}
            transform={`rotate(${String(turn)} ${String(cx)} ${String(cy)})`}
          >
            <polygon
              points={`${String(cx - r)},${String(cy - r * 0.3)} ${String(cx - r * 0.2)},${String(cy - r)} ${String(cx + r)},${String(cy - r * 0.4)} ${String(cx + r * 0.6)},${String(cy + r * 0.8)} ${String(cx - r * 0.7)},${String(cy + r * 0.6)}`}
              fill="#c98a4b"
              stroke="#8a5523"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            {at % 3 === 0 && (
              <circle cx={cx + r * 0.1} cy={cy} r={r * 0.32} fill="#4a2a12" />
            )}
          </g>
        );
      })}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/** The colours of a puddle of mud and of one of water: rim, pool, deep middle, shine, glint and outline. */
const PUDDLE_COLOURS = {
  mud: {
    rim: "#6b4a2f",
    pool: "#4a2f1c",
    deep: "#3a2414",
    shine: "#a0785a",
    glint: "#c4a080",
    ink: "#2b1a0e",
  },
  water: {
    rim: "#1e3a6e",
    pool: "#2f5fa8",
    deep: "#244b8a",
    shine: "#93c5fd",
    glint: "#dbeafe",
    ink: "#0f1f3d",
  },
} as const;

/** The clumps of mud splashed round a puddle: where each lies, as parts of a field, and how big. */
const MUD_SPLASHES: readonly (readonly [number, number, number])[] = [
  [0.24, 0.2, 0.045],
  [0.42, 0.17, 0.03],
  [0.66, 0.2, 0.04],
  [0.8, 0.28, 0.05],
  [0.88, 0.4, 0.03],
  [0.3, 0.84, 0.04],
  [0.5, 0.88, 0.03],
  [0.76, 0.82, 0.035],
];

/**
 * A puddle of mud as the book draws it: a wide, lumpy pool of dark brown
 * with a lighter, raised rim below it, wet shine on top and clumps of mud
 * splashed round it - or the same in blue for a puddle of rain water.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function MudShape({
  x,
  y,
  width,
  height,
  water = false,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** A puddle of rain water instead of mud: the same shape in blue. */
  readonly water?: boolean;
}): ReactElement {
  const colours = water ? PUDDLE_COLOURS.water : PUDDLE_COLOURS.mud;
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const at = (px: number, py: number): string =>
    `${String(left + size * px)} ${String(top + size * py)}`;
  const pool = (drop: number): string => `M ${at(0.1, 0.56 + drop)}
    C ${at(0.06, 0.44 + drop)} ${at(0.16, 0.34 + drop)} ${at(0.3, 0.36 + drop)}
    C ${at(0.34, 0.26 + drop)} ${at(0.5, 0.24 + drop)} ${at(0.58, 0.32 + drop)}
    C ${at(0.66, 0.26 + drop)} ${at(0.84, 0.3 + drop)} ${at(0.84, 0.42 + drop)}
    C ${at(0.95, 0.46 + drop)} ${at(0.94, 0.62 + drop)} ${at(0.82, 0.64 + drop)}
    C ${at(0.76, 0.74 + drop)} ${at(0.6, 0.74 + drop)} ${at(0.54, 0.68 + drop)}
    C ${at(0.44, 0.76 + drop)} ${at(0.26, 0.74 + drop)} ${at(0.24, 0.66 + drop)}
    C ${at(0.12, 0.7 + drop)} ${at(0.04, 0.64 + drop)} ${at(0.1, 0.56 + drop)} Z`;
  return (
    <g pointerEvents="none">
      {/* The raised rim showing below the pool. */}
      <path
        d={pool(0.06)}
        fill={colours.rim}
        stroke={colours.ink}
        strokeWidth={size * 0.025}
        strokeLinejoin="round"
      />
      <path
        d={pool(0)}
        fill={colours.pool}
        stroke={colours.ink}
        strokeWidth={size * 0.025}
        strokeLinejoin="round"
      />
      {/* Darker, deeper mud in the middle. */}
      <path
        d={`M ${at(0.28, 0.52)} C ${at(0.3, 0.42)} ${at(0.5, 0.38)} ${at(0.62, 0.44)} C ${at(0.76, 0.46)} ${at(0.78, 0.58)} ${at(0.64, 0.6)} C ${at(0.5, 0.66)} ${at(0.32, 0.62)} ${at(0.28, 0.52)} Z`}
        fill={colours.deep}
      />
      {/* Wet shine. */}
      <path
        d={`M ${at(0.3, 0.42)} C ${at(0.36, 0.36)} ${at(0.46, 0.34)} ${at(0.52, 0.37)}`}
        stroke={colours.shine}
        strokeWidth={size * 0.03}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      <ellipse
        cx={left + size * 0.7}
        cy={top + size * 0.42}
        rx={size * 0.04}
        ry={size * 0.018}
        fill={colours.glint}
        opacity={0.7}
      />
      {MUD_SPLASHES.map(([px, py, part]) => (
        <g key={`mud-${String(px)}-${String(py)}`}>
          <ellipse
            cx={left + size * px}
            cy={top + size * py + size * part * 0.45}
            rx={size * part * 1.1}
            ry={size * part * 0.8}
            fill={colours.rim}
            stroke={colours.ink}
            strokeWidth={size * 0.015}
          />
          <ellipse
            cx={left + size * px}
            cy={top + size * py}
            rx={size * part * 1.1}
            ry={size * part * 0.8}
            fill={colours.pool}
            stroke={colours.ink}
            strokeWidth={size * 0.015}
          />
        </g>
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A painter's easel: three wooden legs, a ledge across them, and a canvas
 * on the ledge with a small landscape begun on it, held by a clamp on top.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function EaselShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const px = (part: number): number => left + size * part;
  const py = (part: number): number => top + size * part;
  const wood = "#a0642d";
  const edge = "#4a2c12";
  const line = size * 0.022;
  return (
    <g pointerEvents="none">
      <ellipse
        cx={px(0.5)}
        cy={py(0.9)}
        rx={size * 0.3}
        ry={size * 0.05}
        fill="#000"
        opacity={0.18}
      />
      {/* The back leg, then the two front legs spread apart. */}
      <line
        x1={px(0.5)}
        y1={py(0.14)}
        x2={px(0.5)}
        y2={py(0.86)}
        stroke={edge}
        strokeWidth={size * 0.06}
        strokeLinecap="round"
      />
      <line
        x1={px(0.5)}
        y1={py(0.14)}
        x2={px(0.5)}
        y2={py(0.86)}
        stroke="#7c4a1e"
        strokeWidth={size * 0.035}
        strokeLinecap="round"
      />
      {[
        [0.47, 0.28],
        [0.53, 0.72],
      ].map(([from, to]) => (
        <g key={`leg-${String(to)}`}>
          <line
            x1={px(from)}
            y1={py(0.1)}
            x2={px(to)}
            y2={py(0.9)}
            stroke={edge}
            strokeWidth={size * 0.065}
            strokeLinecap="round"
          />
          <line
            x1={px(from)}
            y1={py(0.1)}
            x2={px(to)}
            y2={py(0.9)}
            stroke={wood}
            strokeWidth={size * 0.04}
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* The canvas, with a landscape begun on it. */}
      <rect
        x={px(0.25)}
        y={py(0.16)}
        width={size * 0.5}
        height={size * 0.44}
        fill="#fffdf5"
        stroke={edge}
        strokeWidth={line}
      />
      <rect
        x={px(0.29)}
        y={py(0.2)}
        width={size * 0.42}
        height={size * 0.2}
        fill="#bae6fd"
      />
      <circle cx={px(0.62)} cy={py(0.26)} r={size * 0.035} fill="#facc15" />
      <path
        d={`M ${String(px(0.29))} ${String(py(0.46))} Q ${String(px(0.4))} ${String(py(0.32))} ${String(px(0.52))} ${String(py(0.4))} Q ${String(px(0.62))} ${String(py(0.34))} ${String(px(0.71))} ${String(py(0.4))} L ${String(px(0.71))} ${String(py(0.56))} L ${String(px(0.29))} ${String(py(0.56))} Z`}
        fill="#4ade80"
      />
      <rect
        x={px(0.25)}
        y={py(0.16)}
        width={size * 0.5}
        height={size * 0.44}
        fill="none"
        stroke={edge}
        strokeWidth={line}
      />
      {/* The clamp on top and the ledge the canvas stands on. */}
      <rect
        x={px(0.44)}
        y={py(0.1)}
        width={size * 0.12}
        height={size * 0.08}
        rx={size * 0.015}
        fill={wood}
        stroke={edge}
        strokeWidth={line}
      />
      <rect
        x={px(0.2)}
        y={py(0.59)}
        width={size * 0.6}
        height={size * 0.07}
        rx={size * 0.015}
        fill={wood}
        stroke={edge}
        strokeWidth={line}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A lily pad floating on the water, without a flower: a round green leaf
 * with the narrow notch cut to its middle, veins from the middle out, and
 * a faint shadow on the water.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function LilyPadShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const r = size * 0.36;
  // The notch: a narrow wedge from the middle out to the rim.
  const notch = 0.22;
  const turn = -Math.PI / 3;
  const point = (radius: number, angle: number): string =>
    `${String(cx + radius * Math.cos(angle))} ${String(cy + radius * Math.sin(angle))}`;
  const leaf = `M ${String(cx)} ${String(cy)} L ${point(r, turn + notch)} A ${String(r)} ${String(r)} 0 1 1 ${point(r, turn - notch)} Z`;
  const veins = Array.from(
    { length: 7 },
    (_, at) => turn + notch + ((Math.PI * 2 - notch * 2) * (at + 0.5)) / 7,
  );
  return (
    <g pointerEvents="none">
      <ellipse
        cx={cx + size * 0.03}
        cy={cy + size * 0.04}
        rx={r}
        ry={r * 0.92}
        fill="#0c4a6e"
        opacity={0.18}
      />
      <path
        d={leaf}
        fill="#4d9a3f"
        stroke="#1f4d1a"
        strokeWidth={size * 0.025}
        strokeLinejoin="round"
      />
      <path
        d={`M ${String(cx)} ${String(cy)} L ${point(r * 0.82, turn + notch)} A ${String(r * 0.82)} ${String(r * 0.82)} 0 1 1 ${point(r * 0.82, turn - notch)} Z`}
        fill="#6cbf55"
      />
      {veins.map((angle) => (
        <line
          key={`vein-${String(angle)}`}
          x1={cx}
          y1={cy}
          x2={cx + r * 0.78 * Math.cos(angle)}
          y2={cy + r * 0.78 * Math.sin(angle)}
          stroke="#3f7f33"
          strokeWidth={size * 0.015}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A city bus from the side, front to the right, drawn like the cars: a long
 * box body with a row of windows, the door at the front, a blue stripe
 * along the bottom and two wheels - over the fields it stands on.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function BusShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const left = x + FIELD * 0.06;
  const right = x + width - FIELD * 0.06;
  const length = right - left;
  const cy = y + height / 2;
  const roof = cy - FIELD * 0.3;
  const sill = cy + FIELD * 0.2;
  const wheel = FIELD * 0.12;
  const at = (part: number): number => left + length * part;
  const panes = 7;
  const paneTop = roof + FIELD * 0.08;
  const paneBottom = cy + FIELD * 0.02;
  const door = { from: 0.84, to: 0.93 };
  return (
    <g pointerEvents="none">
      <ellipse
        cx={(left + right) / 2}
        cy={sill + wheel * 0.9}
        rx={length * 0.5}
        ry={FIELD * 0.05}
        fill="#000"
        opacity={0.15}
      />
      {/* The body. */}
      <rect
        x={left}
        y={roof}
        width={length}
        height={sill - roof}
        rx={FIELD * 0.07}
        fill="#f1f5f9"
        stroke="#475569"
        strokeWidth={3}
      />
      {/* The stripe along the bottom. */}
      <rect
        x={left + 1.5}
        y={cy + FIELD * 0.08}
        width={length - 3}
        height={FIELD * 0.08}
        fill="#93c5fd"
      />
      {/* The windows, then the door with its two glass panels. */}
      {Array.from({ length: panes }, (_, at2) => {
        const from = 0.04 + ((door.from - 0.06) * at2) / panes;
        const to = 0.04 + ((door.from - 0.06) * (at2 + 1)) / panes - 0.012;
        return (
          <rect
            key={`pane-${String(at2)}`}
            x={at(from)}
            y={paneTop}
            width={at(to) - at(from)}
            height={paneBottom - paneTop}
            rx={2}
            fill="#bfdbfe"
            stroke="#64748b"
            strokeWidth={1.5}
          />
        );
      })}
      <rect
        x={at(door.from)}
        y={paneTop}
        width={at(door.to) - at(door.from)}
        height={sill - paneTop - 2}
        fill="#e2e8f0"
        stroke="#64748b"
        strokeWidth={2}
      />
      <line
        x1={(at(door.from) + at(door.to)) / 2}
        y1={paneTop}
        x2={(at(door.from) + at(door.to)) / 2}
        y2={sill - 2}
        stroke="#64748b"
        strokeWidth={1.5}
      />
      {/* The windscreen at the front and the destination sign on top. */}
      <rect
        x={at(0.95)}
        y={paneTop}
        width={right - at(0.95) - 2}
        height={paneBottom - paneTop}
        rx={2}
        fill="#93c5fd"
      />
      <rect
        x={at(0.35)}
        y={roof - FIELD * 0.05}
        width={length * 0.3}
        height={FIELD * 0.05}
        rx={1.5}
        fill="#e2e8f0"
        stroke="#475569"
        strokeWidth={2}
      />
      <rect
        x={right - FIELD * 0.06}
        y={cy + FIELD * 0.1}
        width={FIELD * 0.045}
        height={FIELD * 0.05}
        rx={2}
        fill="#fde047"
      />
      <rect
        x={left + FIELD * 0.015}
        y={cy + FIELD * 0.1}
        width={FIELD * 0.045}
        height={FIELD * 0.05}
        rx={2}
        fill="#ef4444"
      />
      {/* The wheels. */}
      {[0.15, 0.72].map((part) => (
        <g key={`wheel-${String(part)}`}>
          <circle cx={at(part)} cy={sill} r={wheel} fill="#1f2937" />
          <circle cx={at(part)} cy={sill} r={wheel * 0.45} fill="#9ca3af" />
        </g>
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A loudspeaker box standing on the floor: a tall black cabinet with a big
 * woofer below and a small tweeter above.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function SpeakerShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const cx = left + size / 2;
  const box = {
    x: left + size * 0.26,
    y: top + size * 0.1,
    w: size * 0.48,
    h: size * 0.78,
  };
  return (
    <g pointerEvents="none">
      <ellipse
        cx={cx}
        cy={box.y + box.h}
        rx={box.w * 0.6}
        ry={size * 0.04}
        fill="#000"
        opacity={0.18}
      />
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={size * 0.04}
        fill="#3f3f46"
        stroke="#09090b"
        strokeWidth={size * 0.03}
      />
      <rect
        x={box.x + size * 0.03}
        y={box.y + size * 0.03}
        width={box.w - size * 0.06}
        height={box.h - size * 0.06}
        rx={size * 0.025}
        fill="#27272a"
      />
      {/* The tweeter above, the woofer below. */}
      <circle
        cx={cx}
        cy={box.y + box.h * 0.2}
        r={size * 0.065}
        fill="#18181b"
        stroke="#52525b"
        strokeWidth={size * 0.02}
      />
      <circle
        cx={cx}
        cy={box.y + box.h * 0.2}
        r={size * 0.025}
        fill="#71717a"
      />
      <circle
        cx={cx}
        cy={box.y + box.h * 0.62}
        r={size * 0.17}
        fill="#18181b"
        stroke="#52525b"
        strokeWidth={size * 0.025}
      />
      <circle
        cx={cx}
        cy={box.y + box.h * 0.62}
        r={size * 0.11}
        fill="#27272a"
        stroke="#3f3f46"
        strokeWidth={size * 0.015}
      />
      <circle
        cx={cx}
        cy={box.y + box.h * 0.62}
        r={size * 0.045}
        fill="#71717a"
      />
    </g>
  );
}

/** The drums of a kit seen from above: where each lies, as parts of a field, how big, and its shell colour. */
const DRUMS: readonly (readonly [number, number, number, string])[] = [
  [0.5, 0.64, 0.25, "#dc2626"],
  [0.36, 0.36, 0.14, "#dc2626"],
  [0.64, 0.36, 0.14, "#dc2626"],
  [0.17, 0.6, 0.14, "#e5e7eb"],
  [0.84, 0.62, 0.15, "#dc2626"],
];

/** The cymbals of a kit: where each lies, as parts of a field, and how big. */
const CYMBALS: readonly (readonly [number, number, number])[] = [
  [0.17, 0.24, 0.16],
  [0.84, 0.24, 0.16],
];

/**
 * A whole drum kit seen from above: the bass drum at the front, two toms on
 * it, the snare and the floor tom at the sides, and two golden cymbals on
 * their stands behind.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function DrumsShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const line = size * 0.022;
  return (
    <g pointerEvents="none">
      <ellipse
        cx={left + size * 0.52}
        cy={top + size * 0.86}
        rx={size * 0.36}
        ry={size * 0.06}
        fill="#000"
        opacity={0.15}
      />
      {/* The cymbals and their stands. */}
      {CYMBALS.map(([px, py, part]) => (
        <g key={`cymbal-${String(px)}`}>
          <line
            x1={left + size * px}
            y1={top + size * py}
            x2={left + size * px}
            y2={top + size * (py + 0.42)}
            stroke="#4b5563"
            strokeWidth={line}
          />
          <line
            x1={left + size * (px - 0.07)}
            y1={top + size * (py + 0.46)}
            x2={left + size * px}
            y2={top + size * (py + 0.38)}
            stroke="#4b5563"
            strokeWidth={line}
          />
          <line
            x1={left + size * (px + 0.07)}
            y1={top + size * (py + 0.46)}
            x2={left + size * px}
            y2={top + size * (py + 0.38)}
            stroke="#4b5563"
            strokeWidth={line}
          />
          <ellipse
            cx={left + size * px}
            cy={top + size * py}
            rx={size * part}
            ry={size * part * 0.7}
            fill="#facc15"
            stroke="#854d0e"
            strokeWidth={line}
          />
          <ellipse
            cx={left + size * px}
            cy={top + size * py}
            rx={size * part * 0.55}
            ry={size * part * 0.38}
            fill="none"
            stroke="#ca8a04"
            strokeWidth={line * 0.6}
          />
          <circle
            cx={left + size * px}
            cy={top + size * py}
            r={size * 0.018}
            fill="#854d0e"
          />
        </g>
      ))}
      {/* The drums: a coloured shell with a pale head on top. */}
      {DRUMS.map(([px, py, part, shell]) => (
        <g key={`drum-${String(px)}-${String(py)}`}>
          <ellipse
            cx={left + size * px}
            cy={top + size * py + size * part * 0.3}
            rx={size * part}
            ry={size * part * 0.8}
            fill={shell}
            stroke="#1f2937"
            strokeWidth={line}
          />
          <ellipse
            cx={left + size * px}
            cy={top + size * py}
            rx={size * part}
            ry={size * part * 0.8}
            fill="#fef9c3"
            stroke="#1f2937"
            strokeWidth={line}
          />
          <ellipse
            cx={left + size * px}
            cy={top + size * py}
            rx={size * part * 0.75}
            ry={size * part * 0.58}
            fill="none"
            stroke="#e5e0b8"
            strokeWidth={line * 0.6}
          />
        </g>
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A black grand piano seen from the front and a little above: the curved
 * body with its lid propped open, and the keyboard below with white and
 * black keys, standing on its legs.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function PianoShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const at = (px: number, py: number): string =>
    `${String(left + size * px)} ${String(top + size * py)}`;
  const line = size * 0.025;
  const ink = "#0f0f14";
  // The keyboard: a strip of white keys with the black ones in twos and threes.
  const keys = { x: 0.16, y: 0.6, w: 0.68, h: 0.17 };
  const whites = 10;
  const step = keys.w / whites;
  const blacks = [1, 2, 4, 5, 6, 8, 9];
  return (
    <g pointerEvents="none">
      <ellipse
        cx={left + size * 0.5}
        cy={top + size * 0.9}
        rx={size * 0.36}
        ry={size * 0.05}
        fill="#000"
        opacity={0.18}
      />
      {/* The legs. */}
      {[0.2, 0.8].map((px) => (
        <rect
          key={`leg-${String(px)}`}
          x={left + size * (px - 0.03)}
          y={top + size * 0.74}
          width={size * 0.06}
          height={size * 0.14}
          rx={size * 0.01}
          fill="#27272a"
          stroke={ink}
          strokeWidth={line}
        />
      ))}
      {/* The body: straight on the left, curving round on the right. */}
      <path
        d={`M ${at(0.14, 0.62)} L ${at(0.14, 0.2)} C ${at(0.14, 0.1)} ${at(0.3, 0.08)} ${at(0.42, 0.12)} C ${at(0.58, 0.18)} ${at(0.62, 0.3)} ${at(0.76, 0.34)} C ${at(0.86, 0.37)} ${at(0.86, 0.5)} ${at(0.86, 0.62)} Z`}
        fill="#3f3f46"
        stroke={ink}
        strokeWidth={line}
        strokeLinejoin="round"
      />
      {/* The open lid and its prop. */}
      <path
        d={`M ${at(0.14, 0.2)} C ${at(0.2, 0.06)} ${at(0.42, 0.02)} ${at(0.62, 0.08)} C ${at(0.78, 0.12)} ${at(0.86, 0.2)} ${at(0.88, 0.3)} L ${at(0.76, 0.34)} C ${at(0.62, 0.3)} ${at(0.58, 0.18)} ${at(0.42, 0.12)} C ${at(0.3, 0.08)} ${at(0.14, 0.1)} ${at(0.14, 0.2)} Z`}
        fill="#52525b"
        stroke={ink}
        strokeWidth={line}
        strokeLinejoin="round"
      />
      <line
        x1={left + size * 0.62}
        y1={top + size * 0.24}
        x2={left + size * 0.7}
        y2={top + size * 0.1}
        stroke="#18181b"
        strokeWidth={line}
      />
      {/* The case front under the keyboard. */}
      <rect
        x={left + size * 0.12}
        y={top + size * 0.56}
        width={size * 0.76}
        height={size * 0.24}
        rx={size * 0.02}
        fill="#27272a"
        stroke={ink}
        strokeWidth={line}
      />
      <rect
        x={left + size * keys.x}
        y={top + size * keys.y}
        width={size * keys.w}
        height={size * keys.h}
        fill="#fafafa"
        stroke={ink}
        strokeWidth={line * 0.6}
      />
      {Array.from({ length: whites - 1 }, (_, at2) => (
        <line
          key={`white-${String(at2)}`}
          x1={left + size * (keys.x + step * (at2 + 1))}
          y1={top + size * keys.y}
          x2={left + size * (keys.x + step * (at2 + 1))}
          y2={top + size * (keys.y + keys.h)}
          stroke="#a1a1aa"
          strokeWidth={size * 0.008}
        />
      ))}
      {blacks.map((key) => (
        <rect
          key={`black-${String(key)}`}
          x={left + size * (keys.x + step * key - step * 0.3)}
          y={top + size * keys.y}
          width={size * step * 0.6}
          height={size * keys.h * 0.6}
          fill={ink}
        />
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/** The heads of a street lamp: where each hangs, as parts of a field. */
const LAMP_HEADS: readonly (readonly [number, number])[] = [
  [0.3, 0.3],
  [0.7, 0.3],
  [0.5, 0.2],
];

/**
 * An old street lamp as the book draws it: a dark green post on a round
 * foot with three lanterns on top, their glass lit pale, and a soft glow on
 * the ground.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function StreetLampShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  // A little taller than the field, as the book draws it.
  const size = Math.min(width, height) * 1.25;
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const px = (part: number): number => left + size * part;
  const py = (part: number): number => top + size * part;
  const ink = "#1a2e22";
  const metal = "#3f5f4a";
  const line = size * 0.022;
  const lantern = (cx: number, cy: number): ReactElement => (
    <g key={`head-${String(cx)}-${String(cy)}`}>
      <path
        d={`M ${String(px(cx - 0.07))} ${String(py(cy))} L ${String(px(cx + 0.07))} ${String(py(cy))} L ${String(px(cx + 0.05))} ${String(py(cy + 0.14))} L ${String(px(cx - 0.05))} ${String(py(cy + 0.14))} Z`}
        fill="#e0f2e9"
        stroke={ink}
        strokeWidth={line}
        strokeLinejoin="round"
      />
      <path
        d={`M ${String(px(cx - 0.09))} ${String(py(cy))} L ${String(px(cx))} ${String(py(cy - 0.07))} L ${String(px(cx + 0.09))} ${String(py(cy))} Z`}
        fill={metal}
        stroke={ink}
        strokeWidth={line}
        strokeLinejoin="round"
      />
      <rect
        x={px(cx - 0.05)}
        y={py(cy + 0.14)}
        width={size * 0.1}
        height={size * 0.03}
        fill={metal}
        stroke={ink}
        strokeWidth={line * 0.8}
      />
    </g>
  );
  return (
    <g pointerEvents="none">
      <ellipse
        cx={px(0.5)}
        cy={py(0.86)}
        rx={size * 0.3}
        ry={size * 0.09}
        fill="#fef9c3"
        opacity={0.25}
      />
      <ellipse
        cx={px(0.5)}
        cy={py(0.86)}
        rx={size * 0.12}
        ry={size * 0.04}
        fill="#000"
        opacity={0.25}
      />
      {/* The foot and the post. */}
      <path
        d={`M ${String(px(0.4))} ${String(py(0.88))} L ${String(px(0.43))} ${String(py(0.74))} L ${String(px(0.57))} ${String(py(0.74))} L ${String(px(0.6))} ${String(py(0.88))} Z`}
        fill={metal}
        stroke={ink}
        strokeWidth={line}
        strokeLinejoin="round"
      />
      <rect
        x={px(0.47)}
        y={py(0.3)}
        width={size * 0.06}
        height={size * 0.45}
        fill={metal}
        stroke={ink}
        strokeWidth={line}
      />
      {/* The arms holding the side lanterns. */}
      <path
        d={`M ${String(px(0.3))} ${String(py(0.47))} Q ${String(px(0.32))} ${String(py(0.56))} ${String(px(0.5))} ${String(py(0.5))} Q ${String(px(0.68))} ${String(py(0.56))} ${String(px(0.7))} ${String(py(0.47))}`}
        fill="none"
        stroke={ink}
        strokeWidth={line * 1.6}
        strokeLinecap="round"
      />
      {LAMP_HEADS.map(([cx, cy]) => lantern(cx, cy))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A framed painting hanging on the wall at the top of its field, as the
 * book draws it: a wide dark frame just under the wall line with a small
 * landscape in it.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function PaintingShape({
  x,
  y,
  width,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
}): ReactElement {
  const w = width * 0.6;
  const h = width * 0.34;
  const left = x + (width - w) / 2;
  // Just below the wall line, so it stays in its own room.
  const top = y + width * 0.05;
  const frame = width * 0.045;
  const inner = {
    x: left + frame,
    y: top + frame,
    w: w - frame * 2,
    h: h - frame * 2,
  };
  return (
    <g pointerEvents="none">
      <rect
        x={left + 2}
        y={top + 3}
        width={w}
        height={h}
        rx={2}
        fill="#000"
        opacity={0.2}
      />
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        rx={2}
        fill="#5b3a1e"
        stroke="#2a1a0c"
        strokeWidth={2}
      />
      <rect
        x={inner.x}
        y={inner.y}
        width={inner.w}
        height={inner.h}
        fill="#bae6fd"
      />
      <circle
        cx={inner.x + inner.w * 0.75}
        cy={inner.y + inner.h * 0.3}
        r={inner.h * 0.16}
        fill="#facc15"
      />
      <path
        d={`M ${String(inner.x)} ${String(inner.y + inner.h)} L ${String(inner.x)} ${String(inner.y + inner.h * 0.7)} Q ${String(inner.x + inner.w * 0.3)} ${String(inner.y + inner.h * 0.35)} ${String(inner.x + inner.w * 0.55)} ${String(inner.y + inner.h * 0.65)} Q ${String(inner.x + inner.w * 0.78)} ${String(inner.y + inner.h * 0.45)} ${String(inner.x + inner.w)} ${String(inner.y + inner.h * 0.62)} L ${String(inner.x + inner.w)} ${String(inner.y + inner.h)} Z`}
        fill="#4ade80"
      />
      <rect
        x={inner.x}
        y={inner.y}
        width={inner.w}
        height={inner.h}
        fill="none"
        stroke="#2a1a0c"
        strokeWidth={1}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A covered wagon from the side, front to the right, as the book draws it:
 * a white canvas cover over wooden hoops, the wooden bed below, two spoked
 * wheels and the shaft reaching forward - over the fields it stands on.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function WagonShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const left = x + FIELD * 0.06;
  const right = x + width - FIELD * 0.06;
  const length = right - left;
  const at = (part: number): number => left + length * part;
  const cy = y + height / 2;
  const roof = cy - FIELD * 0.42;
  const belt = cy + FIELD * 0.04;
  const bed = cy + FIELD * 0.18;
  const axle = cy + FIELD * 0.24;
  const wheel = FIELD * 0.2;
  const ink = "#3b2a1a";
  const wood = "#a87b4f";
  const spokes = 8;
  const hoops = [0.2, 0.38, 0.56, 0.74];
  return (
    <g pointerEvents="none">
      <ellipse
        cx={at(0.48)}
        cy={axle + wheel * 0.95}
        rx={length * 0.46}
        ry={FIELD * 0.05}
        fill="#000"
        opacity={0.15}
      />
      {/* The shaft reaching forward to the horses. */}
      <line
        x1={at(0.84)}
        y1={bed - FIELD * 0.02}
        x2={at(1)}
        y2={bed - FIELD * 0.1}
        stroke={ink}
        strokeWidth={FIELD * 0.06}
        strokeLinecap="round"
      />
      <line
        x1={at(0.84)}
        y1={bed - FIELD * 0.02}
        x2={at(1)}
        y2={bed - FIELD * 0.1}
        stroke={wood}
        strokeWidth={FIELD * 0.035}
        strokeLinecap="round"
      />
      {/* The canvas cover, bulging over its hoops. */}
      <path
        d={`M ${String(at(0.06))} ${String(belt)} C ${String(at(0.02))} ${String(roof + FIELD * 0.1)} ${String(at(0.06))} ${String(roof)} ${String(at(0.16))} ${String(roof)} L ${String(at(0.76))} ${String(roof)} C ${String(at(0.86))} ${String(roof)} ${String(at(0.9))} ${String(roof + FIELD * 0.1)} ${String(at(0.84))} ${String(belt)} Z`}
        fill="#f8fafc"
        stroke={ink}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {hoops.map((part) => (
        <path
          key={`hoop-${String(part)}`}
          d={`M ${String(at(part))} ${String(roof + 1)} Q ${String(at(part + 0.03))} ${String((roof + belt) / 2)} ${String(at(part))} ${String(belt)}`}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={3}
        />
      ))}
      {/* The wooden bed. */}
      <rect
        x={at(0.04)}
        y={belt}
        width={length * 0.84}
        height={bed - belt}
        rx={3}
        fill={wood}
        stroke={ink}
        strokeWidth={3}
      />
      <line
        x1={at(0.06)}
        y1={(belt + bed) / 2}
        x2={at(0.86)}
        y2={(belt + bed) / 2}
        stroke="#7c5a36"
        strokeWidth={1.5}
      />
      {/* The wheels with their spokes. */}
      {[0.2, 0.72].map((part) => (
        <g key={`wheel-${String(part)}`}>
          <circle
            cx={at(part)}
            cy={axle}
            r={wheel}
            fill="none"
            stroke={ink}
            strokeWidth={FIELD * 0.045}
          />
          <circle
            cx={at(part)}
            cy={axle}
            r={wheel}
            fill="none"
            stroke={wood}
            strokeWidth={FIELD * 0.022}
          />
          {Array.from({ length: spokes }, (_, spoke) => {
            const angle = (Math.PI * spoke) / spokes;
            return (
              <line
                key={`spoke-${String(spoke)}`}
                x1={at(part) - wheel * Math.cos(angle)}
                y1={axle - wheel * Math.sin(angle)}
                x2={at(part) + wheel * Math.cos(angle)}
                y2={axle + wheel * Math.sin(angle)}
                stroke={ink}
                strokeWidth={2}
              />
            );
          })}
          <circle
            cx={at(part)}
            cy={axle}
            r={wheel * 0.22}
            fill={wood}
            stroke={ink}
            strokeWidth={2}
          />
        </g>
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A bank safe as the book draws it: a heavy dark steel box on short feet,
 * its thick door swung open to the right, bundles of green notes on the
 * shelf inside, and the dial and handle on the door.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function SafeShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const px = (part: number): number => left + size * part;
  const py = (part: number): number => top + size * part;
  const ink = "#111827";
  const line = size * 0.025;
  const box = { x: 0.16, y: 0.16, w: 0.52, h: 0.66 };
  return (
    <g pointerEvents="none">
      <ellipse
        cx={px(0.5)}
        cy={py(0.88)}
        rx={size * 0.36}
        ry={size * 0.05}
        fill="#000"
        opacity={0.2}
      />
      {/* The feet and the body. */}
      {[0.22, 0.6].map((part) => (
        <rect
          key={`foot-${String(part)}`}
          x={px(part)}
          y={py(0.8)}
          width={size * 0.06}
          height={size * 0.06}
          fill="#1f2937"
          stroke={ink}
          strokeWidth={line * 0.6}
        />
      ))}
      <rect
        x={px(box.x)}
        y={py(box.y)}
        width={size * box.w}
        height={size * box.h}
        rx={size * 0.03}
        fill="#4b5563"
        stroke={ink}
        strokeWidth={line}
      />
      {/* The open inside with its shelf and the money. */}
      <rect
        x={px(box.x + 0.05)}
        y={py(box.y + 0.05)}
        width={size * (box.w - 0.1)}
        height={size * (box.h - 0.1)}
        fill="#1f2937"
        stroke={ink}
        strokeWidth={line * 0.6}
      />
      <line
        x1={px(box.x + 0.05)}
        y1={py(0.5)}
        x2={px(box.x + box.w - 0.05)}
        y2={py(0.5)}
        stroke="#6b7280"
        strokeWidth={line}
      />
      {[
        [0.26, 0.4],
        [0.4, 0.42],
        [0.32, 0.64],
      ].map(([bx, by]) => (
        <g key={`notes-${String(bx)}-${String(by)}`}>
          <rect
            x={px(bx)}
            y={py(by)}
            width={size * 0.16}
            height={size * 0.08}
            rx={size * 0.01}
            fill="#4ade80"
            stroke="#14532d"
            strokeWidth={line * 0.6}
          />
          <rect
            x={px(bx + 0.065)}
            y={py(by)}
            width={size * 0.03}
            height={size * 0.08}
            fill="#fef3c7"
          />
        </g>
      ))}
      {/* The thick door swung open, seen at a slant. */}
      <path
        d={`M ${String(px(box.x + box.w))} ${String(py(box.y))} L ${String(px(0.86))} ${String(py(box.y + 0.08))} L ${String(px(0.86))} ${String(py(box.y + box.h + 0.04))} L ${String(px(box.x + box.w))} ${String(py(box.y + box.h))} Z`}
        fill="#6b7280"
        stroke={ink}
        strokeWidth={line}
        strokeLinejoin="round"
      />
      <ellipse
        cx={px(0.77)}
        cy={py(0.42)}
        rx={size * 0.045}
        ry={size * 0.07}
        fill="#9ca3af"
        stroke={ink}
        strokeWidth={line * 0.7}
      />
      <ellipse
        cx={px(0.77)}
        cy={py(0.42)}
        rx={size * 0.015}
        ry={size * 0.025}
        fill={ink}
      />
      <line
        x1={px(0.77)}
        y1={py(0.55)}
        x2={px(0.77)}
        y2={py(0.66)}
        stroke="#d1d5db"
        strokeWidth={line * 1.2}
        strokeLinecap="round"
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A wooden crate as the book draws it: a frame of thick planks round the
 * edge, boards across the middle and a diagonal brace over them.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function WoodCrateShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const side = size * 0.62;
  const left = x + (width - side) / 2;
  const top = y + (height - side) / 2 - size * 0.02;
  const plank = side * 0.16;
  const ink = "#3b2412";
  const line = size * 0.025;
  return (
    <g pointerEvents="none">
      <ellipse
        cx={left + side / 2}
        cy={top + side + size * 0.04}
        rx={side * 0.6}
        ry={size * 0.05}
        fill="#000"
        opacity={0.18}
      />
      <rect
        x={left}
        y={top}
        width={side}
        height={side}
        rx={size * 0.015}
        fill="#b07a45"
        stroke={ink}
        strokeWidth={line}
      />
      {/* The boards behind the brace. */}
      {[1, 2].map((board) => (
        <line
          key={`board-${String(board)}`}
          x1={left + plank}
          y1={top + plank + ((side - plank * 2) * board) / 3}
          x2={left + side - plank}
          y2={top + plank + ((side - plank * 2) * board) / 3}
          stroke="#8a5a2e"
          strokeWidth={line * 0.6}
        />
      ))}
      <line
        x1={left + plank}
        y1={top + side - plank}
        x2={left + side - plank}
        y2={top + plank}
        stroke={ink}
        strokeWidth={plank * 0.95}
        strokeLinecap="butt"
      />
      <line
        x1={left + plank}
        y1={top + side - plank}
        x2={left + side - plank}
        y2={top + plank}
        stroke="#c8925a"
        strokeWidth={plank * 0.65}
        strokeLinecap="butt"
      />
      {/* The frame of planks round the edge. */}
      <rect
        x={left + plank / 2}
        y={top + plank / 2}
        width={side - plank}
        height={side - plank}
        fill="none"
        stroke="#c8925a"
        strokeWidth={plank}
      />
      <rect
        x={left + plank}
        y={top + plank}
        width={side - plank * 2}
        height={side - plank * 2}
        fill="none"
        stroke={ink}
        strokeWidth={line * 0.7}
      />
      <rect
        x={left}
        y={top}
        width={side}
        height={side}
        rx={size * 0.015}
        fill="none"
        stroke={ink}
        strokeWidth={line}
      />
      {[
        [left + plank / 2, top + plank / 2],
        [left + side - plank / 2, top + plank / 2],
        [left + plank / 2, top + side - plank / 2],
        [left + side - plank / 2, top + side - plank / 2],
      ].map(([nx, ny]) => (
        <circle
          key={`nail-${String(nx)}-${String(ny)}`}
          cx={nx}
          cy={ny}
          r={size * 0.012}
          fill={ink}
        />
      ))}
    </g>
  );
}

/**
 * A rowing boat seen from above, as the book draws it: the hull pointed at
 * the bow on the right and round at the stern, the lighter inside, two
 * benches across and the gunwale round the edge - over the fields it lies
 * on.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function BoatShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const sideways = height > width;
  const long = sideways ? height : width;
  const across = Math.min(width, height);
  const half = across * 0.3;
  const length = long - FIELD * 0.1;
  const hull = (inset: number): string => {
    const s = FIELD * 0.05 + inset;
    const e = FIELD * 0.05 + length - inset;
    const h = half - inset;
    return `M ${String(s)} 0 C ${String(s)} ${String(-h)} ${String(s + length * 0.12)} ${String(-h)} ${String(s + length * 0.3)} ${String(-h)} L ${String(e - length * 0.28)} ${String(-h)} C ${String(e - length * 0.1)} ${String(-h)} ${String(e)} ${String(-h * 0.3)} ${String(e)} 0 C ${String(e)} ${String(h * 0.3)} ${String(e - length * 0.1)} ${String(h)} ${String(e - length * 0.28)} ${String(h)} L ${String(s + length * 0.3)} ${String(h)} C ${String(s + length * 0.12)} ${String(h)} ${String(s)} ${String(h)} ${String(s)} 0 Z`;
  };
  const ink = "#3b3355";
  const transform = sideways
    ? `translate(${String(x + width / 2)} ${String(y)}) rotate(90)`
    : `translate(${String(x)} ${String(y + height / 2)})`;
  return (
    <g pointerEvents="none" transform={transform}>
      <ellipse
        cx={FIELD * 0.05 + length / 2 + 3}
        cy={half * 0.25}
        rx={length / 2}
        ry={half}
        fill="#000"
        opacity={0.18}
      />
      <path
        d={hull(0)}
        fill="#b7aee0"
        stroke={ink}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={hull(across * 0.06)}
        fill="#e4dff7"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* The benches. */}
      {[0.32, 0.6].map((part) => (
        <rect
          key={`bench-${String(part)}`}
          x={FIELD * 0.05 + length * part}
          y={-half + across * 0.06}
          width={length * 0.07}
          height={(half - across * 0.06) * 2}
          fill="#9d93cf"
          stroke={ink}
          strokeWidth={1.5}
        />
      ))}
      {/* The planks along the bottom. */}
      <line
        x1={FIELD * 0.05 + length * 0.12}
        y1={0}
        x2={FIELD * 0.05 + length * 0.86}
        y2={0}
        stroke="#b7aee0"
        strokeWidth={1.5}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A wooden catapult from the side: a frame on two wheels, a crossbar on two
 * posts, and the throwing arm leaning back with a stone in its cup.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function CatapultShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const top = y + (height - size) / 2;
  const px = (part: number): number => left + size * part;
  const py = (part: number): number => top + size * part;
  const ink = "#3b2412";
  const wood = "#a8743f";
  const dark = "#7c5228";
  const line = size * 0.025;
  const beam = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w: number,
    colour: string,
  ) => (
    <g>
      <line
        x1={px(x1)}
        y1={py(y1)}
        x2={px(x2)}
        y2={py(y2)}
        stroke={ink}
        strokeWidth={size * (w + 0.03)}
        strokeLinecap="round"
      />
      <line
        x1={px(x1)}
        y1={py(y1)}
        x2={px(x2)}
        y2={py(y2)}
        stroke={colour}
        strokeWidth={size * w}
        strokeLinecap="round"
      />
    </g>
  );
  return (
    <g pointerEvents="none">
      <ellipse
        cx={px(0.5)}
        cy={py(0.84)}
        rx={size * 0.38}
        ry={size * 0.05}
        fill="#000"
        opacity={0.18}
      />
      {/* The throwing arm, leaning back, with its cup and stone. */}
      {beam(0.62, 0.66, 0.22, 0.2, 0.05, wood)}
      <path
        d={`M ${String(px(0.11))} ${String(py(0.2))} Q ${String(px(0.2))} ${String(py(0.32))} ${String(px(0.31))} ${String(py(0.2))} Z`}
        fill={dark}
        stroke={ink}
        strokeWidth={line}
        strokeLinejoin="round"
      />
      <circle
        cx={px(0.2)}
        cy={py(0.17)}
        r={size * 0.075}
        fill="#9ca3af"
        stroke="#374151"
        strokeWidth={line}
      />
      {/* The posts and the crossbar the arm swings against. */}
      {beam(0.42, 0.7, 0.46, 0.34, 0.045, dark)}
      {beam(0.66, 0.7, 0.5, 0.34, 0.045, dark)}
      {beam(0.38, 0.33, 0.56, 0.33, 0.05, wood)}
      {/* The frame and the wheels. */}
      {beam(0.14, 0.7, 0.86, 0.7, 0.07, wood)}
      {[0.27, 0.73].map((part) => (
        <g key={`wheel-${String(part)}`}>
          <circle
            cx={px(part)}
            cy={py(0.74)}
            r={size * 0.11}
            fill={wood}
            stroke={ink}
            strokeWidth={line * 1.4}
          />
          <line
            x1={px(part - 0.1)}
            y1={py(0.74)}
            x2={px(part + 0.1)}
            y2={py(0.74)}
            stroke={ink}
            strokeWidth={line}
          />
          <line
            x1={px(part)}
            y1={py(0.64)}
            x2={px(part)}
            y2={py(0.84)}
            stroke={ink}
            strokeWidth={line}
          />
          <circle cx={px(part)} cy={py(0.74)} r={size * 0.025} fill={ink} />
        </g>
      ))}
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * The things the map draws itself rather than showing an emoji for.
 *
 * @param props - what it is, and where the field or block is and how big
 * @returns the drawing, or nothing for any other thing
 */
export function DrawnThing({
  thing,
  x,
  y,
  width,
  height,
}: {
  readonly thing: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement | null {
  let drawn: ReactElement | null;
  switch (thing) {
    case "table":
      drawn = <TableShape x={x} y={y} width={width} height={height} />;
      break;
    case "rug":
      drawn = <RugShape x={x} y={y} width={width} height={height} />;
      break;
    case "desk":
      drawn = <TableShape x={x} y={y} width={width} height={height} />;
      break;
    case "shelf":
      drawn = <ShelfShape x={x} y={y} width={width} height={height} />;
      break;
    case "cashRegister":
      drawn = <TillShape x={x} y={y} width={width} height={height} />;
      break;
    case "crate":
    case "box":
      drawn = <BoxShape x={x} y={y} width={width} height={height} />;
      break;
    case "statue":
      drawn = <StatueShape x={x} y={y} width={width} height={height} />;
      break;
    case "locker":
      drawn = <LockerShape x={x} y={y} width={width} height={height} />;
      break;
    case "punchingBag":
      drawn = <PunchingBagShape x={x} y={y} width={width} height={height} />;
      break;
    case "car":
      drawn = <CarShape x={x} y={y} width={width} height={height} />;
      break;
    case "oilSlick":
    case "oilPuddle":
      drawn = <OilShape x={x} y={y} width={width} height={height} />;
      break;
    case "chessTable":
      drawn = <ChessTableShape x={x} y={y} width={width} height={height} />;
      break;
    case "waterWheel":
      drawn = <WaterWheelShape x={x} y={y} width={width} height={height} />;
      break;
    case "shrub":
    case "bush":
      drawn = <ShrubShape x={x} y={y} width={width} height={height} />;
      break;
    case "mud":
      drawn = <MudShape x={x} y={y} width={width} height={height} />;
      break;
    case "easel":
      drawn = <EaselShape x={x} y={y} width={width} height={height} />;
      break;
    case "lilyPad":
      drawn = <LilyPadShape x={x} y={y} width={width} height={height} />;
      break;
    case "bus":
      drawn = <BusShape x={x} y={y} width={width} height={height} />;
      break;
    case "speaker":
      drawn = <SpeakerShape x={x} y={y} width={width} height={height} />;
      break;
    case "drums":
      drawn = <DrumsShape x={x} y={y} width={width} height={height} />;
      break;
    case "piano":
      drawn = <PianoShape x={x} y={y} width={width} height={height} />;
      break;
    case "puddle":
      drawn = <MudShape x={x} y={y} width={width} height={height} water />;
      break;
    case "streetLamp":
      drawn = <StreetLampShape x={x} y={y} width={width} height={height} />;
      break;
    case "painting":
      drawn = <PaintingShape x={x} y={y} width={width} />;
      break;
    case "wagon":
      drawn = <WagonShape x={x} y={y} width={width} height={height} />;
      break;
    case "safe":
      drawn = <SafeShape x={x} y={y} width={width} height={height} />;
      break;
    case "woodCrate":
      drawn = <WoodCrateShape x={x} y={y} width={width} height={height} />;
      break;
    case "boat":
      drawn = <BoatShape x={x} y={y} width={width} height={height} />;
      break;
    case "catapult":
      drawn = <CatapultShape x={x} y={y} width={width} height={height} />;
      break;
    case "towel":
      drawn = (
        <RugShape
          x={x}
          y={y}
          width={width}
          height={height}
          colours={TOWEL_COLOURS}
        />
      );
      break;
    case "door":
      drawn = <DoorSignShape x={x} y={y} width={width} height={height} />;
      break;
    case "crumbs":
      drawn = <CrumbsShape x={x} y={y} width={width} height={height} />;
      break;
    case "rubble":
      drawn = <RubbleShape x={x} y={y} width={width} height={height} />;
      break;
    default:
      drawn = null;
  }
  return drawn;
}

/** The things {@link DrawnThing} draws. */
export const DRAWN_THINGS: ReadonlySet<string> = new Set([
  "table",
  "desk",
  "rug",
  "shelf",
  "cashRegister",
  "rubble",
  "crate",
  "box",
  "statue",
  "locker",
  "punchingBag",
  "car",
  "oilSlick",
  "oilPuddle",
  "chessTable",
  "waterWheel",
  "crumbs",
  "door",
  "towel",
  "catapult",
  "woodCrate",
  "boat",
  "safe",
  "wagon",
  "painting",
  "puddle",
  "streetLamp",
  "piano",
  "speaker",
  "drums",
  "bus",
  "lilyPad",
  "easel",
  "mud",
  "shrub",
  "bush",
]);

/**
 * A table seen a little from above: its top with a darker front edge, two legs
 * at the front and two shorter ones behind - over one field or a block of them.
 *
 * @param props - where the block is and how big
 * @returns the drawing
 */
export function TableShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  // The gap at the ends stays as on one field, so a long table fills its fields.
  const left = x + FIELD * TABLE.side;
  const right = x + width - FIELD * TABLE.side;
  // The top takes the block's length; the legs stay as short as on one
  // field, so a long table does not stand on stilts.
  const top = y + FIELD * TABLE.top;
  const front = y + height - FIELD * (1 - TABLE.top - TABLE.depth);
  const edge = FIELD * TABLE.edge;
  const below = front - FIELD * (TABLE.top + TABLE.depth);
  const leg = TABLE.leg;
  return (
    <g pointerEvents="none">
      {/* The back legs, behind and shorter. */}
      {[left + leg * TABLE.inBack, right - leg * TABLE.outBack].map((at) => (
        <rect
          key={`back-${String(at)}`}
          x={at}
          y={front}
          width={leg}
          height={below + FIELD * TABLE.back - front}
          fill="#5b3714"
        />
      ))}
      {/* The front legs, down to the floor. */}
      {[left + leg / 2, right - leg * TABLE.outFront].map((at) => (
        <rect
          key={`front-${String(at)}`}
          x={at}
          y={front}
          width={leg}
          height={below + FIELD * TABLE.front - front}
          fill="#78481c"
        />
      ))}
      <rect
        x={left}
        y={front - edge}
        width={right - left}
        height={edge * 2}
        rx={edge / 2}
        fill="#8a5a2b"
      />
      <rect
        x={left}
        y={top}
        width={right - left}
        height={front - top}
        rx={edge}
        fill="#c08a4a"
        stroke="#8a5a2b"
        strokeWidth={3}
      />
    </g>
  );
}

/**
 * A window set into the wall beside its field: a pane across the wall line,
 * with a frame and a bar down the middle.
 *
 * @param props - the window
 * @returns the drawing
 */
function WindowShape({
  window: pane,
}: {
  readonly window: WallWindow;
}): ReactElement {
  let drawn: ReactElement;
  if (pane.board === true) {
    drawn = <BoardShape board={pane} />;
  } else if (pane.door === true) {
    drawn = <DoorShape door={pane} />;
  } else {
    drawn = <PaneShape window={pane} />;
  }
  return drawn;
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A chalkboard set into the wall beside its fields: dark green, a wooden
 * frame and a few chalk lines on it.
 *
 * @param props - the board
 * @returns the drawing
 */
function BoardShape({ board }: { readonly board: WallWindow }): ReactElement {
  const length = (board.length ?? 1) * FIELD - FIELD * BOARD.gap * 2;
  const deep = FIELD * BOARD.deep;
  const sideways = board.side === "left" || board.side === "right";
  const width = sideways ? deep : length;
  const height = sideways ? length : deep;
  const left = board.at.col * FIELD;
  const top = board.at.row * FIELD;
  let x: number;
  let y: number;
  switch (board.side) {
    case "top":
      x = left + FIELD * BOARD.gap;
      y = top - deep / 4;
      break;
    case "bottom":
      x = left + FIELD * BOARD.gap;
      y = top + FIELD - (deep * 3) / 4;
      break;
    case "left":
      x = left - deep / 4;
      y = top + FIELD * BOARD.gap;
      break;
    default:
      x = left + FIELD - (deep * 3) / 4;
      y = top + FIELD * BOARD.gap;
  }
  const frame = FIELD * BOARD.frame;
  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={frame}
        fill="#7c4a24"
      />
      <rect
        x={x + frame}
        y={y + frame}
        width={width - frame * 2}
        height={height - frame * 2}
        fill="#2f4f3a"
      />
      {board.text !== undefined ? (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          transform={
            sideways
              ? `rotate(-90 ${String(x + width / 2)} ${String(y + height / 2)})`
              : undefined
          }
          fontSize={Math.min(width, height) * 0.55}
          fontFamily="'Comic Sans MS', 'Segoe Print', cursive"
          fontWeight={700}
          letterSpacing={1}
          fill="#f3f4f6"
          opacity={0.92}
        >
          {board.text}
        </text>
      ) : (
        [0.3, 0.55, 0.75].map((part) =>
          sideways ? (
            <line
              key={`chalk-${String(part)}`}
              x1={x + width * part}
              y1={y + height * 0.15}
              x2={x + width * part}
              y2={y + height * 0.6}
              stroke="#e5e7eb"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.8}
            />
          ) : (
            <line
              key={`chalk-${String(part)}`}
              x1={x + width * (part - 0.15)}
              y1={y + height * 0.5}
              x2={x + width * part}
              y2={y + height * 0.5}
              stroke="#e5e7eb"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.8}
            />
          ),
        )
      )}
    </g>
  );
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of a drawing, read off the picture */
/**
 * A door set into the wall between two fields, like a window but of wood:
 * a brown panel with a darker frame and a brass handle.
 *
 * @param props - the door
 * @returns the drawing
 */
function DoorShape({ door }: { readonly door: WallWindow }): ReactElement {
  const along = FIELD * DOOR.long;
  const deep = FIELD * DOOR.deep;
  const sideways = door.side === "left" || door.side === "right";
  const width = sideways ? deep : along;
  const height = sideways ? along : deep;
  const left = door.at.col * FIELD;
  const top = door.at.row * FIELD;
  let x: number;
  let y: number;
  switch (door.side) {
    case "top":
      x = left + (FIELD - along) / 2;
      y = top - deep / 2;
      break;
    case "bottom":
      x = left + (FIELD - along) / 2;
      y = top + FIELD - deep / 2;
      break;
    case "left":
      x = left - deep / 2;
      y = top + (FIELD - along) / 2;
      break;
    default:
      x = left + FIELD - deep / 2;
      y = top + (FIELD - along) / 2;
  }
  return (
    <g pointerEvents="none">
      <DoorPanel x={x} y={y} width={width} height={height} />
    </g>
  );
}

/**
 * The wooden panel of a door, in a box - on the wall, or on its own in the
 * legend.
 *
 * @param props - where the panel lies and how big
 * @returns the drawing
 */
function DoorPanel({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const sideways = height > width;
  const thin = Math.min(width, height);
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={thin * 0.35}
        fill="#c2410c"
        stroke="#431407"
        strokeWidth={DOOR.frame}
      />
      <rect
        x={x + thin * 0.22}
        y={y + thin * 0.22}
        width={width - thin * 0.44}
        height={height - thin * 0.44}
        rx={thin * 0.2}
        fill="#ea7c3c"
      />
      <circle
        cx={sideways ? x + width / 2 : x + width - thin * 0.75}
        cy={sideways ? y + height - thin * 0.75 : y + height / 2}
        r={thin * 0.18}
        fill="#fbbf24"
        stroke="#431407"
        strokeWidth={1}
      />
    </>
  );
}

/**
 * A door on its own, for the legend: the panel lying across the field.
 *
 * @param props - where the field is and how big
 * @returns the drawing
 */
export function DoorSignShape({
  x,
  y,
  width,
  height,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const along = width * DOOR.long;
  const deep = width * DOOR.deep;
  return (
    <g pointerEvents="none">
      <DoorPanel
        x={x + (width - along) / 2}
        y={y + (height - deep) / 2}
        width={along}
        height={deep}
      />
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * A window pane set into the wall beside its field.
 *
 * @param props - the window
 * @returns the drawing
 */
function PaneShape({
  window: pane,
}: {
  readonly window: WallWindow;
}): ReactElement {
  const along = FIELD * PANE.long;
  const deep = FIELD * PANE.deep;
  const sideways = pane.side === "left" || pane.side === "right";
  const width = sideways ? deep : along;
  const height = sideways ? along : deep;
  const left = pane.at.col * FIELD;
  const top = pane.at.row * FIELD;
  let x: number;
  let y: number;
  switch (pane.side) {
    case "top":
      x = left + (FIELD - along) / 2;
      y = top - deep / 2;
      break;
    case "bottom":
      x = left + (FIELD - along) / 2;
      y = top + FIELD - deep / 2;
      break;
    case "left":
      x = left - deep / 2;
      y = top + (FIELD - along) / 2;
      break;
    default:
      x = left + FIELD - deep / 2;
      y = top + (FIELD - along) / 2;
  }
  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#bae6fd"
        stroke="#f8fafc"
        strokeWidth={PANE.frame * 2}
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#64748b"
        strokeWidth={PANE.frame / 2}
      />
      {sideways ? (
        <line
          x1={x}
          y1={y + height / 2}
          x2={x + width}
          y2={y + height / 2}
          stroke="#f8fafc"
          strokeWidth={PANE.frame}
        />
      ) : (
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke="#f8fafc"
          strokeWidth={PANE.frame}
        />
      )}
    </g>
  );
}

/** Props of {@link CaseMap}. */
type CaseMapProps = {
  readonly level: Level;
  readonly board: Board;
  /** Called with the field that was tapped. */
  readonly onTap?: (cell: Cell) => void;
  /** Called with the field that was held down. */
  readonly onHold?: (cell: Cell) => void;
  /** Called with the field that was right-clicked: wipe the marks in it. */
  readonly onClear?: (cell: Cell) => void;
  /**
   * Whether holding a field can place anybody - only with a suspect picked.
   * Without one there is no ring, because nothing would come of it.
   */
  readonly canHold?: boolean;
  /**
   * The answer to "Bestätigen", as far as it has been shown: per suspect
   * whether they stand right - a green ring, or a red one.
   */
  readonly verdicts?: Readonly<Record<string, boolean>>;
  /**
   * Small, for the list of cases: only the ground, the borders and the
   * things - no numbers, no names, nothing to tap.
   */
  readonly preview?: boolean;
  /** The fields that light up - what the chosen suspect's clue points at. */
  readonly glow?: readonly Cell[];
};

/** How a glowing field is drawn: inset from its edges, corner and line, in picture units. */
const GLOW = { inset: 5, round: 14, line: 5 } as const;

/** How long a field has to be held to place somebody for certain, in milliseconds. */
export const HOLD_MS = 300;

/**
 * How long a press has to last before the ring appears at all, in
 * milliseconds - an ordinary click never shows it.
 */
export const HOLD_DELAY_MS = 200;

/** The ring that fills while a field is held: its size as part of a field, and its line. */
const RING = { radius: 0.4, line: 10 } as const;

/**
 * The ring's filling, as a CSS animation.
 *
 * @remarks
 * Not an SVG `<animate>`: those count from when the page loaded, so on a page
 * open for longer than the animation the ring arrived already full. A CSS
 * animation starts when its element appears - with every press anew.
 */
const RING_KEYFRAMES =
  "@keyframes murdoku-ring { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } } @keyframes murdoku-verdict { from { transform: scale(1.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }";

/** How thick the ring of a checked pawn is. */
const VERDICT_LINE = 8;

/**
 * Where the pencil marks sit in a field: a square grid with a spot per
 * suspect - three by three for nine, four by four for sixteen. How far apart
 * and how big, as parts of a field divided by the grid's width.
 */
const MARKS = { spread: 0.87, font: 0.66 } as const;

/** How far outside the screen a preview is already drawn, so it is there when scrolled to. */
const PREVIEW_AHEAD = "400px";

/**
 * A case's map in a list of cases, drawn only once its card comes near the
 * screen: a list of fifty maps is many thousand shapes, and most of them are
 * never looked at. Until then an empty square holds its place.
 *
 * @param props - the case
 * @returns the square with the map, or still empty
 */
export function CasePreview({
  level,
}: {
  readonly level: Level;
}): ReactElement {
  const box = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = box.current;
    if (node === null || near) {
      return undefined;
    }
    const watch = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          watch.disconnect();
        }
      },
      { rootMargin: PREVIEW_AHEAD },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [near]);
  return (
    <span
      ref={box}
      className="block aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
    >
      {near && <CaseMap level={level} board={EMPTY_BOARD} preview />}
    </span>
  );
}

/**
 * The map.
 *
 * @param props - the case, the notes on it and what a tap does
 * @returns the map as an SVG
 */
export function CaseMap({
  level,
  board,
  onTap,
  onHold,
  onClear,
  canHold = true,
  verdicts = {},
  preview = false,
  glow = [],
}: CaseMapProps): ReactElement {
  // **Tap or hold.** A short press pencils in, a long one places for certain.
  // The ring only shows after a fifth of a second - a click never flashes it -
  // and then fills in under a third; full means placed. Let go before the ring
  // shows and it was a tap; let go while it fills and nothing happens at all.
  // Without a suspect picked there is no hold: every press is a tap.
  const timer = useRef<number | null>(null);
  const filling = useRef(false);
  const plain = useRef(false);
  const [holding, setHolding] = useState<Cell | null>(null);
  // Which kind of pointer pressed last. A right click wipes a field - but a
  // phone sends the same "context menu" on a long press, and there the long
  // press means "place", so only a mouse's right click counts.
  const pointer = useRef("mouse");
  const press = (cell: Cell, button: number, kind: string) => {
    pointer.current = kind;
    stop();
    plain.current = button === 0 && !canHold;
    // Only the main button holds; the right one never places anybody.
    if (button === 0 && canHold) {
      timer.current = window.setTimeout(() => {
        filling.current = true;
        setHolding(cell);
        timer.current = window.setTimeout(() => {
          timer.current = null;
          filling.current = false;
          setHolding(null);
          onHold?.(cell);
        }, HOLD_MS);
      }, HOLD_DELAY_MS);
    }
  };
  const release = (cell: Cell) => {
    const tapped =
      plain.current || (timer.current !== null && !filling.current);
    stop();
    if (tapped) {
      onTap?.(cell);
    }
  };
  const stop = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    filling.current = false;
    plain.current = false;
    setHolding(null);
  };

  const { rows, cols } = sizeOf(level);
  const width = cols * FIELD;
  const height = rows * FIELD;
  // Only the fields of the map - a case need not be square.
  const cells: Cell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (isInside(level, { row, col })) {
        cells.push({ row, col });
      }
    }
  }
  const across = Math.ceil(Math.sqrt(level.suspects.length));
  const placed = Object.values(board.placement);
  const blocked = (cell: Cell) =>
    placed.some(
      (there) =>
        (there.row === cell.row || there.col === cell.col) &&
        !(there.row === cell.row && there.col === cell.col),
    );
  const clashing = clashesOf(level, board.placement);

  return (
    <svg
      viewBox={`${String(-MARGIN)} ${String(-MARGIN)} ${String(width + MARGIN * 2)} ${String(height + MARGIN * 2)}`}
      className={`block w-full touch-manipulation select-none ${
        // A preview fills its square frame, so every card is the same size
        // whatever the map's shape.
        preview ? "h-full" : "h-auto"
      }`}
      role="img"
      aria-label={T.boardLabel(level.name)}
      data-testid={preview ? "murdoku-preview" : "murdoku-map"}
    >
      <defs>
        <pattern
          id="murdoku-waves"
          width="50"
          height="34"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M4 12 q8 -7 16 0 t16 0 M14 28 q8 -7 16 0 t16 0"
            fill="none"
            stroke="#ffffff"
            strokeOpacity={0.55}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </pattern>
        <pattern
          id="murdoku-grass"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M8 30 l3 -8 M12 30 l-1 -9 M28 14 l3 -7 M32 14 l-1 -8"
            stroke="#3f7d20"
            strokeOpacity={0.22}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </pattern>
        <pattern
          id="murdoku-sand"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="7" cy="9" r="1.6" fill="#b08d3c" fillOpacity={0.3} />
          <circle cx="21" cy="22" r="1.4" fill="#b08d3c" fillOpacity={0.3} />
        </pattern>
        <pattern
          id="murdoku-floor"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 25 H50 M25 0 V25 M0 0 V0"
            stroke="#78716c"
            strokeOpacity={0.18}
            strokeWidth={2}
          />
        </pattern>
      </defs>

      <rect
        x={-MARGIN}
        y={-MARGIN}
        width={width + MARGIN * 2}
        height={height + MARGIN * 2}
        rx={18}
        className="fill-white dark:fill-zinc-900"
      />

      {/* The ground. */}
      {cells.map((cell) => {
        const area = areaAt(level, cell);
        const ground = groundDef(groundAt(level, cell));
        // The area's own colour, unless the case paints its ground field by
        // field - then the ground shows, water in a habitat included.
        const fill =
          level.groundMap === undefined
            ? (area?.tint ?? ground.colour)
            : ground.colour;
        return (
          <g key={`ground-${cellKey(cell)}`}>
            <rect
              x={cell.col * FIELD}
              y={cell.row * FIELD}
              width={FIELD}
              height={FIELD}
              fill={fill}
              stroke="#1f2937"
              strokeOpacity={0.22}
              strokeWidth={1.5}
            />
            {ground.pattern !== "none" && (
              <rect
                x={cell.col * FIELD}
                y={cell.row * FIELD}
                width={FIELD}
                height={FIELD}
                fill={`url(#murdoku-${ground.pattern})`}
              />
            )}
          </g>
        );
      })}

      {/* The thick lines between areas and round the edge of the map. */}
      {cells.flatMap((cell) => borders(level, cell))}

      {/* What the chosen suspect's clue points at, glowing under the things. */}
      {glow.map((cell) => (
        <rect
          key={`glow-${cellKey(cell)}`}
          data-testid={`murdoku-glow-${String(cell.row)}-${String(cell.col)}`}
          x={cell.col * FIELD + GLOW.inset}
          y={cell.row * FIELD + GLOW.inset}
          width={FIELD - GLOW.inset * 2}
          height={FIELD - GLOW.inset * 2}
          rx={GLOW.round}
          fill="#fde047"
          fillOpacity={0.45}
          stroke="#f59e0b"
          strokeWidth={GLOW.line}
          className="animate-pulse"
          pointerEvents="none"
        />
      ))}

      {/* What stands on the fields - a thing over several of them once. */}
      {(level.pieces ?? []).map((piece) => (
        <PieceShape
          key={`piece-${cellKey(piece.at)}`}
          piece={piece}
          thing={piece.thing ?? thingAt(level, piece.at)}
          emoji={(() => {
            const thing = thingAt(level, piece.at);
            return thing === null ? "" : thingDef(level, thing).emoji;
          })()}
        />
      ))}
      {(level.carpets ?? []).map((carpet) => (
        <ShapedRug
          key={`carpet-${cellKey(carpet[0] ?? { row: 0, col: 0 })}`}
          cells={carpet}
        />
      ))}
      {(level.shapes ?? []).map((shape) => {
        const first = shape[0] ?? { row: 0, col: 0 };
        return thingAt(level, first) === "rug" ? (
          <ShapedRug key={`shape-${cellKey(first)}`} cells={shape} />
        ) : (
          <ShapedTable key={`shape-${cellKey(first)}`} cells={shape} />
        );
      })}
      {cells.map((cell) => {
        const thing = thingAt(level, cell);
        // A window or door drawn in the wall needs no sign on its field -
        // a door none on either side of it.
        const inWall =
          (thing === "window" &&
            (level.windows ?? []).some(
              (pane) => pane.at.row === cell.row && pane.at.col === cell.col,
            )) ||
          (thing === "door" && doorBeside(level, cell));
        return thing === null ||
          inWall ||
          inPiece(level, cell) ||
          inShape(level, cell) ? null : DRAWN_THINGS.has(thing) ? (
          <DrawnThing
            key={`thing-${cellKey(cell)}`}
            thing={thing}
            x={cell.col * FIELD}
            y={cell.row * FIELD}
            width={FIELD}
            height={FIELD}
          />
        ) : (
          <text
            key={`thing-${cellKey(cell)}`}
            x={cell.col * FIELD + FIELD / 2}
            y={cell.row * FIELD + FIELD / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={FIELD * LOOK.thing}
          >
            {thingDef(level, thing).emoji}
          </text>
        );
      })}

      {/* Windows in the walls, over the wall line. */}
      {(level.windows ?? []).map((pane) => (
        <WindowShape
          key={`window-${cellKey(pane.at)}-${pane.side}`}
          window={pane}
        />
      ))}

      {/* The names of the areas. */}
      {!preview &&
        level.areas.map((area) => (
          <AreaLabel
            key={area.key}
            name={area.name}
            at={area.label}
            end={area.labelEnd === true}
            crown={(level.rules ?? []).some((rule) =>
              (rule.crowned ?? []).includes(area.key),
            )}
            room={
              area.labelOverhang === true ? undefined : labelRoom(level, area)
            }
          />
        ))}

      {/* Greyed out: rows and columns somebody already stands in. */}
      {cells.map((cell) =>
        blocked(cell) && standingOn(board, cell) === null ? (
          <rect
            key={`blocked-${cellKey(cell)}`}
            x={cell.col * FIELD}
            y={cell.row * FIELD}
            width={FIELD}
            height={FIELD}
            fill="#0f172a"
            fillOpacity={0.12}
            pointerEvents="none"
          />
        ) : null,
      )}

      {/* The player's crosses. */}
      {/* Only where some piece could be - a cross on a rock says nothing,
          unless a treasure could be buried beneath it. */}
      {board.crosses
        .filter((key) => isStandableForAny(level, cellOf(key)))
        .map((key) => {
          const { row, col } = cellOf(key);
          const x = col * FIELD + FIELD / 2;
          const y = row * FIELD + FIELD / 2;
          const arm = FIELD * LOOK.cross;
          return (
            <path
              key={`cross-${key}`}
              d={`M${String(x - arm)} ${String(y - arm)} L${String(x + arm)} ${String(y + arm)} M${String(x + arm)} ${String(y - arm)} L${String(x - arm)} ${String(y + arm)}`}
              stroke="#7f1d1d"
              strokeWidth={9}
              strokeLinecap="round"
              opacity={0.8}
              pointerEvents="none"
            />
          );
        })}

      {/* The pencil marks: small letters, each suspect on its own spot. */}
      {Object.entries(board.notes).flatMap(([key, marks]) => {
        const [row = 0, col = 0] = key.split(":").map(Number);
        return marks.map((id) => {
          const at = level.suspects.findIndex((one) => one.id === id);
          const suspect = level.suspects[at];
          const step = (FIELD * MARKS.spread) / across;
          const middle = (across - 1) / 2;
          const x = col * FIELD + FIELD / 2 + ((at % across) - middle) * step;
          const y =
            row * FIELD + FIELD / 2 + (Math.floor(at / across) - middle) * step;
          return (
            <text
              key={`mark-${key}-${id}`}
              data-testid={`murdoku-mark-${id}-${key.replace(":", "-")}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={(FIELD * MARKS.font) / across}
              fontWeight={800}
              fill={suspect?.colour ?? "#111827"}
              stroke="#ffffff"
              strokeWidth={4}
              paintOrder="stroke"
              pointerEvents="none"
            >
              {id}
            </text>
          );
        });
      })}

      {/* The pawns. */}
      {level.suspects.map((suspect) => {
        const cell = board.placement[suspect.id];
        return cell === undefined ? null : (
          <Pawn
            key={`pawn-${suspect.id}`}
            cell={cell}
            letter={suspect.id}
            colour={suspect.colour}
            clash={clashing.has(suspect.id)}
            verdict={verdicts[suspect.id]}
          />
        );
      })}

      {/* Row and column numbers. */}
      {Array.from({ length: preview ? 0 : cols }, (unused, at) => (
        <text
          key={`column-${String(at)}`}
          x={at * FIELD + FIELD / 2}
          y={-MARGIN / 2}
          fontSize={19}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-zinc-500 dark:fill-zinc-400"
        >
          {`C${String(at + 1)}`}
        </text>
      ))}
      {Array.from({ length: preview ? 0 : rows }, (unused, at) => (
        <text
          key={`row-${String(at)}`}
          x={-MARGIN / 2}
          y={at * FIELD + FIELD / 2}
          fontSize={19}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-zinc-500 dark:fill-zinc-400"
        >
          {`R${String(at + 1)}`}
        </text>
      ))}

      {/* The ring that fills while a field is held - full means placed. */}
      <style>{RING_KEYFRAMES}</style>
      {holding !== null && (
        <g key={`hold-${cellKey(holding)}`} pointerEvents="none">
          <circle
            cx={holding.col * FIELD + FIELD / 2}
            cy={holding.row * FIELD + FIELD / 2}
            r={FIELD * RING.radius}
            fill="#ffffff"
            fillOpacity={0.35}
            stroke="#ffffff"
            strokeOpacity={0.7}
            strokeWidth={RING.line}
          />
          <circle
            cx={holding.col * FIELD + FIELD / 2}
            cy={holding.row * FIELD + FIELD / 2}
            r={FIELD * RING.radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={RING.line}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset="1"
            transform={`rotate(-90 ${String(holding.col * FIELD + FIELD / 2)} ${String(holding.row * FIELD + FIELD / 2)})`}
            style={{
              animation: `murdoku-ring ${String(HOLD_MS)}ms linear forwards`,
            }}
          />
        </g>
      )}

      {/* On top of everything, one invisible target per field. */}
      {(preview
        ? []
        : cells.filter((cell) => isStandableForAny(level, cell))
      ).map((cell) => (
        <rect
          key={`tap-${cellKey(cell)}`}
          data-testid={`murdoku-cell-${String(cell.row)}-${String(cell.col)}`}
          x={cell.col * FIELD}
          y={cell.row * FIELD}
          width={FIELD}
          height={FIELD}
          fill="transparent"
          className="cursor-pointer hover:fill-white/25"
          onPointerDown={(event) =>
            press(cell, event.button, event.pointerType)
          }
          onPointerUp={() => release(cell)}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onContextMenu={(event) => {
            event.preventDefault();
            if (pointer.current === "mouse") {
              onClear?.(cell);
            }
          }}
        />
      ))}
    </svg>
  );
}

/** A field back from its key. */
function cellOf(key: string): Cell {
  const [row = 0, col = 0] = key.split(":").map(Number);
  return { row, col };
}

/**
 * The thick lines on a field's edges: where it meets another area, and where
 * the map ends - at its edge or at a field that is not part of it.
 */
function borders(level: Level, cell: Cell): ReactElement[] {
  const home = areaAt(level, cell)?.key;
  const x = cell.col * FIELD;
  const y = cell.row * FIELD;
  const sides = [
    {
      side: "r",
      next: { row: cell.row, col: cell.col + 1 },
      x1: x + FIELD,
      y1: y,
      x2: x + FIELD,
      y2: y + FIELD,
    },
    {
      side: "b",
      next: { row: cell.row + 1, col: cell.col },
      x1: x,
      y1: y + FIELD,
      x2: x + FIELD,
      y2: y + FIELD,
    },
    {
      side: "l",
      next: { row: cell.row, col: cell.col - 1 },
      x1: x,
      y1: y,
      x2: x,
      y2: y + FIELD,
    },
    {
      side: "t",
      next: { row: cell.row - 1, col: cell.col },
      x1: x,
      y1: y,
      x2: x + FIELD,
      y2: y,
    },
  ];
  return sides.flatMap((one) => {
    const edge = !isInside(level, one.next);
    // Between two areas the line is drawn once, from the left or upper field.
    const between =
      !edge &&
      (one.side === "r" || one.side === "b") &&
      areaAt(level, one.next)?.key !== home;
    return edge || between
      ? [
          <line
            key={`border-${one.side}-${cellKey(cell)}`}
            x1={one.x1}
            y1={one.y1}
            x2={one.x2}
            y2={one.y2}
            stroke="#111827"
            strokeWidth={edge ? BORDER * 2 : BORDER}
            strokeLinecap="square"
          />,
        ]
      : [];
  });
}

/** An area's name, on a little sign at the bottom left of its field. */
function AreaLabel({
  name,
  at,
  end = false,
  crown = false,
  room,
}: {
  readonly name: string;
  readonly at: Cell;
  readonly end?: boolean;
  /** A crown before the name - an area only nobles may be in. */
  readonly crown?: boolean;
  /** How wide the sign may be, so it stays within its area. */
  readonly room?: number;
}): ReactElement {
  // Upper case can be longer than the name ("ß" becomes "SS") and its letters
  // are wide; the text is then fitted to the sign, so it never runs over.
  const text = `${crown ? "\u{1F451} " : ""}${name.toUpperCase()}`;
  const natural = FIELD * LOOK.label;
  const wide = (size: number): number =>
    text.length * size * SIGN.letter + size;
  // A sign that would reach past its area gets a smaller font instead.
  const font =
    room !== undefined && wide(natural) > room
      ? natural * (room / wide(natural))
      : natural;
  const width = wide(font);
  const height = font * SIGN.tall;
  const x = end
    ? (at.col + 1) * FIELD - width - SIGN.gap
    : at.col * FIELD + SIGN.gap;
  const y = (at.row + 1) * FIELD - height - SIGN.gap;
  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
        fill="#ffffff"
        stroke="#111827"
        strokeWidth={2}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={font}
        fontWeight={700}
        fill="#111827"
        textLength={width - font}
        lengthAdjust="spacingAndGlyphs"
      >
        {text}
      </text>
    </g>
  );
}

/** A suspect's pawn on its field. */
function Pawn({
  cell,
  letter,
  colour,
  clash,
  verdict,
}: {
  readonly cell: Cell;
  readonly letter: string;
  readonly colour: string;
  readonly clash: boolean;
  /** Right or wrong after "Bestätigen", or nothing before. */
  readonly verdict: boolean | undefined;
}): ReactElement {
  const x = cell.col * FIELD + FIELD / 2;
  const y = cell.row * FIELD + FIELD / 2;
  const r = FIELD * LOOK.pawn;
  return (
    <g pointerEvents="none" data-testid={`murdoku-pawn-${letter}`}>
      <ellipse
        cx={x + PAWN_LOOK.drift}
        cy={y + r * PAWN_LOOK.low}
        rx={r * PAWN_LOOK.wide}
        ry={r * PAWN_LOOK.flat}
        fill="#000000"
        opacity={0.25}
      />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={colour}
        stroke="#ffffff"
        strokeWidth={5}
      />
      {verdict !== undefined && (
        <circle
          data-testid={`murdoku-verdict-${letter}-${verdict ? "right" : "wrong"}`}
          cx={x}
          cy={y}
          r={r + PAWN_LOOK.ring}
          fill="none"
          stroke={verdict ? "#16a34a" : "#dc2626"}
          strokeWidth={VERDICT_LINE}
          style={{
            transformOrigin: `${String(x)}px ${String(y)}px`,
            animation: "murdoku-verdict 220ms ease-out",
          }}
        />
      )}
      {clash && verdict === undefined && (
        <circle
          cx={x}
          cy={y}
          r={r + PAWN_LOOK.ring}
          fill="none"
          stroke="#dc2626"
          strokeWidth={5}
          strokeDasharray="10 7"
        />
      )}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={FIELD * LOOK.letter}
        fontWeight={800}
        fill="#ffffff"
      >
        {letter}
      </text>
    </g>
  );
}
