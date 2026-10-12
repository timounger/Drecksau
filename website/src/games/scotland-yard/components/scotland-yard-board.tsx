/**
 * The board: London's stations and lines, the pieces on them, and the
 * stations a move can go to.
 *
 * @module
 * @remarks
 * Drawn from the network, not copied from the printed board: every station
 * where the data puts it, the lines straight between them in the colours of
 * the box - yellow taxi, turquoise bus, red Underground, the black ferry - and
 * the Thames and two parks for orientation. A station's sign shows what stops
 * there: turquoise on top for a bus stop, red below for the Underground.
 */
"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { LINES } from "@/games/scotland-yard/engine/map-data";
import {
  allStations,
  positionOf,
  stopsAt,
  type Transport,
} from "@/games/scotland-yard/engine/map";
import type { ScotlandYardGame } from "@/games/scotland-yard/engine/state";
import { lastSeen, shownPosition } from "@/games/scotland-yard/engine/view";
import { TICKET_COLOURS } from "@/games/scotland-yard/i18n/texts";

/** The drawing area in board units, with a margin round the stations. */
const VIEW = { x: -40, y: -40, width: 1680, height: 1280 } as const;

/** A whole, in per cent - the board at zoom 1 fills the width. */
const PERCENT = 100;

/** Sizes on the board, in board units. */
const SIZE = {
  station: 17,
  number: 15,
  piece: 14,
  pieceLift: 20,
  target: 30,
  wave: 52,
  hit: 34,
  ticketDot: 7,
  ticketGap: 17,
  ticketDrop: 40,
  hiding: 24,
} as const;

/** How each line is drawn: colour, width, and how far it sits off the middle. */
const LINE_LOOK: Readonly<
  Record<
    Transport,
    {
      readonly colour: string;
      readonly width: number;
      readonly offset: number;
      readonly dash?: string;
    }
  >
> = {
  taxi: { colour: "#eab308", width: 4, offset: 0 },
  bus: { colour: "#0d9488", width: 5, offset: 5 },
  underground: { colour: "#dc2626", width: 7, offset: -6 },
  ferry: { colour: "#18181b", width: 4, offset: 0, dash: "12 8" },
};

/** How strongly the lines and the out-of-reach stations fade while a move is chosen. */
const DIMMED_LINES = 0.55;
const DIMMED_STATIONS = 0.4;

/** The order the lines are laid down in - the Underground on top. */
const LINE_ORDER: readonly Transport[] = [
  "taxi",
  "bus",
  "underground",
  "ferry",
];

/** The board's own colours, the same in light and dark mode like a real board. */
const BOARD_COLOURS = {
  paper: "#efe9dc",
  park: "#bfdcae",
  river: "#8ec5e8",
  sign: "#ffffff",
  ink: "#1f2937",
  target: "#ec008c",
  hiding: "#6366f1",
  misterX: "#18181b",
} as const;

/** A piece to draw on a station. */
export type BoardPiece = {
  readonly station: number;
  readonly colour: string;
  readonly label: string;
  readonly bobby: boolean;
  readonly active: boolean;
};

/**
 * Renders the board.
 *
 * @param props - the game as the viewer may see it, the stations a move can
 *   go to, the hiding places to mark and what a tap does
 * @returns the board as a scrollable SVG
 */
export function ScotlandYardBoard({
  view,
  targets,
  hiding,
  zoom,
  focus,
  onPick,
}: {
  /** The game as the viewer may see it. */
  readonly view: ScotlandYardGame;
  /** The stations a tap moves to, each with the tickets that get there. */
  readonly targets: ReadonlyMap<number, readonly string[]>;
  /** Stations to mark as possible hiding places, or none. */
  readonly hiding: readonly number[];
  /** How far the board is blown up; 1 fits the width. */
  readonly zoom: number;
  /** A station to bring into view when it changes. */
  readonly focus: number | null;
  readonly onPick: (station: number) => void;
}): ReactElement {
  const box = useRef<HTMLDivElement>(null);
  // While a move is being chosen, everything else steps back.
  const choosing = targets.size > 0;
  const misterXAt = view.misterX.position ?? shownPosition(view);
  const ghost = misterXAt === null ? (lastSeen(view)?.station ?? null) : null;
  const pieces: BoardPiece[] = view.detectives.map((piece, index) => ({
    station: piece.position,
    colour: piece.colour,
    label: piece.bobby ? "B" : piece.name.slice(0, 1),
    bobby: piece.bobby,
    active:
      view.phase === "detectives" &&
      !view.moved[index] &&
      view.moved.indexOf(false) === index,
  }));

  // Bring the station that matters into view on a zoomed board.
  useEffect(() => {
    const node = box.current;
    if (node !== null && focus !== null && zoom > 1) {
      const { x, y } = positionOf(focus);
      node.scrollTo({
        left:
          ((x - VIEW.x) / VIEW.width) * node.scrollWidth - node.clientWidth / 2,
        top:
          ((y - VIEW.y) / VIEW.height) * node.scrollHeight -
          node.clientHeight / 2,
        behavior: "smooth",
      });
    }
  }, [focus, zoom]);

  return (
    <div
      ref={box}
      className="max-h-[75vh] overflow-auto rounded-2xl border border-zinc-300 dark:border-zinc-700"
      data-testid="sy-board"
    >
      <svg
        viewBox={`${String(VIEW.x)} ${String(VIEW.y)} ${String(VIEW.width)} ${String(VIEW.height)}`}
        style={{ width: `${String(zoom * PERCENT)}%` }}
        className="block h-auto select-none"
        role="img"
        aria-label="Spielplan von London"
      >
        <Scenery />
        <g opacity={choosing ? DIMMED_LINES : 1}>
          <Lines />
        </g>
        {hiding.map((station) => (
          <Halo
            key={`hide-${String(station)}`}
            station={station}
            colour={BOARD_COLOURS.hiding}
            radius={SIZE.hiding}
          />
        ))}
        {[...targets].map(([station, tickets]) => (
          <TargetMark
            key={`target-${String(station)}`}
            station={station}
            tickets={tickets}
          />
        ))}
        {allStations().map((station) => (
          <Station
            key={station}
            station={station}
            clickable={targets.has(station)}
            dimmed={choosing && !targets.has(station)}
            onPick={onPick}
          />
        ))}
        {ghost !== null && <MisterXPiece station={ghost} ghost />}
        {misterXAt !== null && (
          <MisterXPiece station={misterXAt} ghost={false} />
        )}
        {pieces.map((piece, index) => (
          <Piece key={`piece-${String(index)}`} piece={piece} />
        ))}
      </svg>
    </div>
  );
}

/** The paper, the Thames and two parks - only for finding one's way. */
function Scenery(): ReactElement {
  return (
    <g pointerEvents="none">
      <rect
        x={VIEW.x}
        y={VIEW.y}
        width={VIEW.width}
        height={VIEW.height}
        fill={BOARD_COLOURS.paper}
      />
      {/* Regent's Park in the north, Hyde Park in the west. */}
      <ellipse cx={440} cy={140} rx={150} ry={95} fill={BOARD_COLOURS.park} />
      <path
        d="M -40 520 C 120 480, 330 500, 430 560 C 470 640, 420 760, 300 800 C 160 830, 40 800, -40 780 Z"
        fill={BOARD_COLOURS.park}
      />
      <path
        d="M 1690 600 C 1560 610, 1470 660, 1393 642 S 1060 510, 972 553 S 925 820, 949 917 S 660 1070, 534 1128 S 400 1220, 350 1300"
        fill="none"
        stroke={BOARD_COLOURS.river}
        strokeWidth={46}
        strokeLinecap="round"
      />
    </g>
  );
}

/** Every line of the network, the Underground on top. */
function Lines(): ReactElement {
  return (
    <g pointerEvents="none" strokeLinecap="round">
      {LINE_ORDER.map((transport) =>
        LINES[transport].map(([a, b]) => {
          const look = LINE_LOOK[transport];
          const from = positionOf(a);
          const to = positionOf(b);
          // Off the middle along the normal, so shared stretches stay apart.
          const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
          const nx = (-(to.y - from.y) / length) * look.offset;
          const ny = ((to.x - from.x) / length) * look.offset;
          return (
            <line
              key={`${transport}-${String(a)}-${String(b)}`}
              x1={from.x + nx}
              y1={from.y + ny}
              x2={to.x + nx}
              y2={to.y + ny}
              stroke={look.colour}
              strokeWidth={look.width}
              strokeDasharray={look.dash}
            />
          );
        }),
      )}
    </g>
  );
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- proportions of the drawn signs and pieces */
/** A station's sign: its number, with the colours of what stops there. */
function Station({
  station,
  clickable,
  dimmed,
  onPick,
}: {
  readonly station: number;
  readonly clickable: boolean;
  /** True for a station out of reach while a move is chosen. */
  readonly dimmed: boolean;
  readonly onPick: (station: number) => void;
}): ReactElement {
  const { x, y } = positionOf(station);
  const stops = stopsAt(station);
  const r = SIZE.station;
  return (
    <g
      onClick={clickable ? () => onPick(station) : undefined}
      className={clickable ? "cursor-pointer" : undefined}
      opacity={dimmed ? DIMMED_STATIONS : 1}
      data-testid={clickable ? `sy-target-${String(station)}` : undefined}
    >
      {/* A wider spot to tap than the sign itself, on a phone above all. */}
      {clickable && <circle cx={x} cy={y} r={SIZE.hit} fill="transparent" />}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={BOARD_COLOURS.sign}
        stroke={clickable ? BOARD_COLOURS.target : LINE_LOOK.taxi.colour}
        strokeWidth={clickable ? 6 : 4}
      />
      {stops.includes("bus") && (
        <path
          d={`M ${String(x - r)} ${String(y)} A ${String(r)} ${String(r)} 0 0 1 ${String(x + r)} ${String(y)} Z`}
          fill={LINE_LOOK.bus.colour}
        />
      )}
      {stops.includes("underground") && (
        <path
          d={`M ${String(x - r)} ${String(y)} A ${String(r)} ${String(r)} 0 0 0 ${String(x + r)} ${String(y)} Z`}
          fill={LINE_LOOK.underground.colour}
        />
      )}
      <rect
        x={x - r * 0.8}
        y={y - r * 0.55}
        width={r * 1.6}
        height={r * 1.1}
        rx={4}
        fill={BOARD_COLOURS.sign}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={SIZE.number}
        fontWeight={700}
        fill={BOARD_COLOURS.ink}
      >
        {station}
      </text>
    </g>
  );
}

/**
 * Marks a station a move can go to: a bold ring in a colour found nowhere
 * else on the board, a wave running out from it, and a dot for each ticket
 * that gets there.
 */
function TargetMark({
  station,
  tickets,
}: {
  readonly station: number;
  readonly tickets: readonly string[];
}): ReactElement {
  const { x, y } = positionOf(station);
  const colour = BOARD_COLOURS.target;
  const first = x - ((tickets.length - 1) * SIZE.ticketGap) / 2;
  return (
    <g pointerEvents="none">
      <circle
        cx={x}
        cy={y}
        r={SIZE.target}
        fill="none"
        stroke={colour}
        strokeWidth={4}
      >
        <animate
          attributeName="r"
          values={`${String(SIZE.target)};${String(SIZE.wave)}`}
          dur="1.4s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.9;0"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx={x}
        cy={y}
        r={SIZE.target}
        fill={colour}
        fillOpacity={0.3}
        stroke="#ffffff"
        strokeWidth={9}
      />
      <circle
        cx={x}
        cy={y}
        r={SIZE.target}
        fill="none"
        stroke={colour}
        strokeWidth={6}
      />
      {tickets.map((ticket, index) => (
        <circle
          key={ticket}
          cx={first + index * SIZE.ticketGap}
          cy={y + SIZE.ticketDrop}
          r={SIZE.ticketDot}
          fill={TICKET_COLOURS[ticket as keyof typeof TICKET_COLOURS] ?? colour}
          stroke="#ffffff"
          strokeWidth={2.5}
        />
      ))}
    </g>
  );
}

/** A ring round a station: a place Mister X can be. */
function Halo({
  station,
  colour,
  radius,
  pulse = false,
}: {
  readonly station: number;
  readonly colour: string;
  readonly radius: number;
  readonly pulse?: boolean;
}): ReactElement {
  const { x, y } = positionOf(station);
  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={colour}
      fillOpacity={0.35}
      stroke={colour}
      strokeWidth={4}
      className={pulse ? "animate-pulse" : undefined}
      pointerEvents="none"
    />
  );
}

/** A detective's or bobby's piece, standing just above its station's sign. */
function Piece({ piece }: { readonly piece: BoardPiece }): ReactElement {
  const { x, y } = positionOf(piece.station);
  const cy = y - SIZE.pieceLift;
  return (
    <g pointerEvents="none">
      {piece.active && (
        <circle
          cx={x}
          cy={cy}
          r={SIZE.piece + 8}
          fill="none"
          stroke={BOARD_COLOURS.target}
          strokeWidth={4}
          className="animate-pulse"
        />
      )}
      <circle
        cx={x}
        cy={cy}
        r={SIZE.piece}
        fill={piece.colour}
        stroke="#ffffff"
        strokeWidth={3}
      />
      {piece.bobby && (
        <circle
          cx={x}
          cy={cy}
          r={SIZE.piece - 5}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
        />
      )}
      <text
        x={x}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={800}
        fill="#ffffff"
      >
        {piece.label}
      </text>
    </g>
  );
}

/** Mister X's piece - solid where he is, dashed where he was last seen. */
function MisterXPiece({
  station,
  ghost,
}: {
  readonly station: number;
  readonly ghost: boolean;
}): ReactElement {
  const { x, y } = positionOf(station);
  const cy = y + SIZE.pieceLift;
  return (
    <g
      pointerEvents="none"
      opacity={ghost ? 0.55 : 1}
      data-testid={ghost ? "sy-x-ghost" : "sy-x"}
    >
      <circle
        cx={x}
        cy={cy}
        r={SIZE.piece + 1}
        fill={ghost ? "#ffffff" : BOARD_COLOURS.misterX}
        stroke={BOARD_COLOURS.misterX}
        strokeWidth={3}
        strokeDasharray={ghost ? "5 4" : undefined}
      />
      <text
        x={x}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={900}
        fill={ghost ? BOARD_COLOURS.misterX : "#ffffff"}
      >
        X
      </text>
    </g>
  );
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
