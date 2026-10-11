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

import { useRef, useState, type ReactElement } from "react";
import { cellKey, standingOn, type Board } from "@/games/murdoku/engine/board";
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
  Cell,
  Level,
  Piece,
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
 * Whether a field is part of a table of another shape.
 *
 * @param level - the case
 * @param cell - the field
 * @returns whether a shape covers it
 */
function inShape(level: Level, cell: Cell): boolean {
  return (level.shapes ?? []).some((shape) =>
    shape.some((one) => one.row === cell.row && one.col === cell.col),
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
  return (level.pieces ?? []).some(
    (piece) =>
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
  return thing !== null && DRAWN_THINGS.has(thing) ? (
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
      fontSize={FIELD * LOOK.thing * Math.min(piece.rows, piece.cols)}
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
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}): ReactElement {
  const across = Math.min(width, height);
  // The fringe hangs off the short ends: top and bottom of a standing rug.
  const upright = height > width;
  const left = x + across * RUG.side;
  const top = y + across * RUG.side;
  const right = x + width - across * RUG.side;
  const bottom = y + height - across * RUG.side;
  const band = across * RUG.band;
  const fringe = across * RUG.fringe;
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
              stroke="#e7d7b7"
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
              stroke="#e7d7b7"
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
        fill="#1e3a5f"
      />
      <rect
        x={left + band / 2}
        y={top + band / 2}
        width={right - left - band}
        height={bottom - top - band}
        fill="none"
        stroke="#d4a017"
        strokeWidth={RUG.line}
        strokeDasharray="6 4"
      />
      <rect
        x={left + band}
        y={top + band}
        width={right - left - band * 2}
        height={bottom - top - band * 2}
        fill="#a3242b"
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
      ];
    });
  const side = FIELD * RUG.side;
  const band = FIELD * RUG.band;
  return (
    <g pointerEvents="none">
      {layer(side).map((one, at) => (
        <rect
          key={`border-${String(at)}`}
          x={one.x}
          y={one.y}
          width={one.w}
          height={one.h}
          fill="#1e3a5f"
          shapeRendering="crispEdges"
        />
      ))}
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
  "rug",
  "shelf",
  "cashRegister",
  "rubble",
  "crate",
  "box",
  "statue",
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
  const left = x + width * TABLE.side;
  const right = x + width * (1 - TABLE.side);
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
          thing={thingAt(level, piece.at)}
          emoji={(() => {
            const thing = thingAt(level, piece.at);
            return thing === null ? "" : thingDef(level, thing).emoji;
          })()}
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
        // A window drawn in the wall needs no sign on its field.
        const inWall =
          thing === "window" &&
          (level.windows ?? []).some(
            (pane) => pane.at.row === cell.row && pane.at.col === cell.col,
          );
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
          <AreaLabel key={area.key} name={area.name} at={area.label} />
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
}: {
  readonly name: string;
  readonly at: Cell;
}): ReactElement {
  const font = FIELD * LOOK.label;
  // Upper case can be longer than the name ("ß" becomes "SS") and its letters
  // are wide; the text is then fitted to the sign, so it never runs over.
  const text = name.toUpperCase();
  const width = text.length * font * SIGN.letter + font;
  const height = font * SIGN.tall;
  const x = at.col * FIELD + SIGN.gap;
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
