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
  isStandable,
  sizeOf,
  thingAt,
  thingDef,
} from "@/games/murdoku/engine/rules";
import type { Cell, Level } from "@/games/murdoku/engine/types";
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

/** The sign with an area's name: width per letter and height, as parts of its font, and its gap to the field's edge. */
const SIGN = { letter: 0.62, tall: 1.5, gap: 6 } as const;

/** The pawn's shadow and the ring around a misplaced one, in picture units and parts of the pawn. */
const PAWN_LOOK = {
  drift: 3,
  low: 0.95,
  wide: 0.95,
  flat: 0.32,
  ring: 7,
} as const;

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
      className="block h-auto w-full touch-manipulation select-none"
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

      {/* What stands on the fields. */}
      {cells.map((cell) => {
        const thing = thingAt(level, cell);
        return thing === null ? null : (
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
      {/* Only where somebody could stand - a cross on a rock says nothing. */}
      {board.crosses
        .filter((key) => isStandable(level, cellOf(key)))
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
      {(preview ? [] : cells.filter((cell) => isStandable(level, cell))).map(
        (cell) => (
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
        ),
      )}
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
  const width = name.length * font * SIGN.letter + font;
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
      >
        {name.toUpperCase()}
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
