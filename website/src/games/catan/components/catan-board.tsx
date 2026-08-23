/**
 * The island, drawn and tapped.
 *
 * @module
 * @remarks
 * **The board is the controller.** There is no "build a road" mode to switch
 * into first: whatever you are allowed to build right now is lit up, and what
 * you tap says which it is. A path can only ever be a road, an empty crossing
 * can only ever be a settlement, one of your own settlements can only ever
 * become a city, and a landscape is only ever tappable while the robber is in
 * your hand. The four never overlap, so there is nothing to disambiguate and
 * nothing to choose beforehand.
 *
 * Everything lit is asked of the referee - the same {@link roadSpots},
 * {@link townSpots} and {@link citySpots} the computer plays off - rather than
 * worked out again here, so the board can never offer what the rules refuse.
 *
 * Your own colour is marked twice over: a white-then-dark double ring around
 * your pieces, and a ring in your colour around every landscape you touch. Both
 * are outlines rather than fills, on purpose - a wash over a landscape would
 * take its colour with it, and on this board the colour of a landscape *is*
 * what it produces. The double ring is belt and braces for the white figures,
 * which are nearly the colour of the board and would lose a single outline.
 */
"use client";

import type { ReactElement } from "react";
import { islandOf, pointOf, type Island, type Point } from "@/games/catan/engine/board";
import { EVENT_ASK } from "@/games/catan/engine/events";
import { citySpots, roadSpots, townSpots } from "@/games/catan/engine/moves";
import { robberSpots } from "@/games/catan/engine/variants";
import { COLOUR_INK } from "@/games/catan/engine/setup";
import {
  CITY_COST,
  ROAD_COST,
  TOWN_COST,
  actingSeat,
  covers,
  type CatanGame,
  type CatanMove,
  type Land,
} from "@/games/catan/engine/state";
import { LAND_NAMES, SORT_NAMES } from "@/games/catan/i18n/texts";

/* eslint-disable @typescript-eslint/no-magic-numbers */

/** Radius of one landscape, in drawing units. */
const SIZE = 40;

/**
 * Room around the island for the harbours.
 *
 * @remarks
 * Wider than tall, because a harbour label reads sideways: "2:1 Getreide" is
 * over sixty units long and only sixteen high, and the widest one sticks
 * straight out of the east coast.
 */
const SIDE_MARGIN = 66;

/** Room above and below the island. */
const TOP_MARGIN = 46;

/** What each landscape is painted. */
const LAND_INK: Readonly<Record<Land, string>> = {
  lehm: "#c2703f",
  holz: "#2f6b39",
  wolle: "#86c14b",
  getreide: "#e6c34a",
  erz: "#8d97a3",
  wueste: "#e2d3a6",
};

/** The two numbers the rulebook prints in red, because they come up most. */
const HOT_CHIPS: readonly number[] = [6, 8];

/** How far out of the coast a harbour's jetty reaches. */
const JETTY = 30;

/** Room either side of a harbour's label. */
const LABEL_PAD = 10;

/** About how wide one letter of a harbour label is. */
const LETTER_WIDTH = 4.4;

/** How thick the ring around a landscape you build on is. */
const MINE_RING = 5;

/** How strongly that ring takes your colour. */
const MINE_INK = 0.85;

/** A place on the board that can be tapped. */
type Spot = {
  readonly kind: "town" | "road" | "city" | "robber" | "breakRoad";
  readonly at: number;
};

/** Where a lattice point lands on the drawing. */
function at(x: number, y: number): Point {
  return pointOf(x, y, SIZE);
}

/** The middle of a landscape. */
function hexPoint(board: Island, hex: number): Point {
  return at(board.hexes[hex].x, board.hexes[hex].y);
}

/** The middle of a crossing. */
function crossPoint(board: Island, id: number): Point {
  return at(board.crossings[id].x, board.crossings[id].y);
}

/** The six corners of a landscape, as an SVG points list. */
function hexOutline(board: Island, hex: number): string {
  return board.hexes[hex].corners
    .map((corner) => {
      const { px, py } = crossPoint(board, corner);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
}

/** How often a chip comes up, as pips under the number. */
function pips(chip: number): number {
  return chip === 0 ? 0 : 6 - Math.abs(7 - chip);
}

/**
 * Everything this seat may tap right now.
 *
 * @remarks
 * Asked of the referee rather than reasoned about: the same three predicates
 * the rules run on decide what the board lights.
 */
export function tappable(game: CatanGame, seat: number | null): readonly Spot[] {
  const board = islandOf(game.land.length);
  const spots: Spot[] = [];
  const mine = seat !== null && seat === actingSeat(game);
  const hand = seat === null ? null : game.players[seat].hand;
  if (mine && game.phase === "founding" && game.founding?.placing === "town") {
    townSpots(game, seat, true).forEach((id) => spots.push({ kind: "town", at: id }));
  } else if (mine && game.phase === "founding" && game.founding !== null) {
    const from = game.founding.lastTown;
    board.paths.forEach((path) => {
      if (from !== null && path.ends.includes(from) && game.roads[path.id] === null) {
        spots.push({ kind: "road", at: path.id });
      }
    });
  } else if (seat !== null && game.phase === "event" && asksForRoad(game, seat)) {
    // An Erdbeben: the tap picks one of your own roads to lie down, so what
    // lights up is your network rather than the empty paths.
    game.roads.forEach((owner, path) => {
      if (owner === seat) {
        spots.push({ kind: "breakRoad", at: path });
      }
    });
  } else if (mine && game.phase === "robber") {
    // Not simply "any other landscape": the friendly robber rules out the ones
    // beside a player who is still being spared, and the referee is the one
    // that knows which those are.
    robberSpots(game, game.robber).forEach((hex) => spots.push({ kind: "robber", at: hex }));
  } else if (mine && game.phase === "trade" && hand !== null) {
    if (covers(hand, CITY_COST)) {
      citySpots(game, seat).forEach((id) => spots.push({ kind: "city", at: id }));
    }
    if (covers(hand, TOWN_COST)) {
      townSpots(game, seat).forEach((id) => spots.push({ kind: "town", at: id }));
    }
    if (game.freeRoads > 0 || covers(hand, ROAD_COST)) {
      roadSpots(game, seat).forEach((id) => spots.push({ kind: "road", at: id }));
    }
  }
  return spots;
}

/** Whether the card on the table is asking this seat for one of their roads. */
function asksForRoad(game: CatanGame, seat: number): boolean {
  const kind = game.drawn?.kind;
  return (
    kind !== undefined && EVENT_ASK[kind] === "road" && game.owed[0] === seat
  );
}

/** What one tap turns into. */
function moveFor(spot: Spot): CatanMove {
  const moves: Readonly<Record<Spot["kind"], CatanMove>> = {
    town: { kind: "town", at: spot.at },
    road: { kind: "road", at: spot.at },
    city: { kind: "city", at: spot.at },
    robber: { kind: "robber", at: spot.at },
    breakRoad: { kind: "event", at: spot.at },
  };
  return moves[spot.kind];
}

/** Which landscapes this seat has a building on. */
function myLands(game: CatanGame, seat: number | null): ReadonlySet<number> {
  const lands = new Set<number>();
  if (seat !== null) {
    islandOf(game.land.length).crossings.forEach((crossing) => {
      if (game.towns[crossing.id]?.owner === seat) {
        crossing.hexes.forEach((hex: number) => lands.add(hex));
      }
    });
  }
  return lands;
}

/** One landscape, with its chip and whatever stands on it. */
function Landscape({
  game,
  hex,
  lit,
  onTap,
}: {
  readonly game: CatanGame;
  readonly hex: number;
  readonly lit: boolean;
  readonly onTap: (() => void) | null;
}): ReactElement {
  const board = islandOf(game.land.length);
  const { px, py } = hexPoint(board, hex);
  const chip = game.chips[hex];
  const hot = HOT_CHIPS.includes(chip);
  const name = `${LAND_NAMES[game.land[hex]]}${chip === 0 ? "" : ` ${chip}`}`;
  return (
    <g
      data-testid={`ct-hex-${hex}`}
      onClick={onTap ?? undefined}
      className={onTap === null ? undefined : "cursor-pointer"}
    >
      <title>{name}</title>
      <polygon
        points={hexOutline(board, hex)}
        fill={LAND_INK[game.land[hex]]}
        stroke="#f4ecd6"
        strokeWidth={2}
      />
      {chip > 0 && (
        <g>
          <circle cx={px} cy={py} r={13} fill="#f6eed6" stroke="#00000033" />
          <text
            x={px}
            y={py + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={13}
            fontWeight={700}
            fill={hot ? "#b3261e" : "#3d3325"}
          >
            {chip}
          </text>
          <g fill={hot ? "#b3261e" : "#3d3325"}>
            {Array.from({ length: pips(chip) }, (unused, i) => (
              <circle
                key={i}
                cx={px + (i - (pips(chip) - 1) / 2) * 3}
                cy={py + 9}
                r={0.9}
              />
            ))}
          </g>
        </g>
      )}
      {lit && (
        <polygon
          points={hexOutline(board, hex)}
          fill="#ffffff"
          opacity={0.35}
          stroke="#111827"
          strokeWidth={2.5}
          strokeDasharray="5 4"
        />
      )}
      {game.robber === hex && <Robber x={px} y={py - (chip > 0 ? 22 : 0)} />}
    </g>
  );
}

/** The robber. */
function Robber({ x, y }: { readonly x: number; readonly y: number }): ReactElement {
  return (
    <g data-testid="ct-robber" pointerEvents="none">
      <ellipse cx={x} cy={y + 6} rx={7} ry={3} fill="#00000055" />
      <path
        d={`M ${x - 6} ${y + 6} L ${x - 4} ${y - 4} A 4 4 0 0 1 ${x + 4} ${y - 4} L ${x + 6} ${y + 6} Z`}
        fill="#2b2b2b"
        stroke="#f4ecd6"
        strokeWidth={1.2}
      />
    </g>
  );
}

/** A harbour, drawn out on the water. */
function Dock({
  game,
  harbour,
}: {
  readonly game: CatanGame;
  readonly harbour: number;
}): ReactElement {
  const board = islandOf(game.land.length);
  const dock = game.harbours[harbour];
  const path = board.paths[dock.path];
  const a = crossPoint(board, path.ends[0]);
  const b = crossPoint(board, path.ends[1]);
  const mid = { px: (a.px + b.px) / 2, py: (a.py + b.py) / 2 };
  const from = hexPoint(board, path.hexes[0]);
  const away = Math.hypot(mid.px - from.px, mid.py - from.py) || 1;
  const out = {
    px: mid.px + ((mid.px - from.px) / away) * JETTY,
    py: mid.py + ((mid.py - from.py) / away) * JETTY,
  };
  const label = dock.want === null ? "3:1" : `2:1 ${SORT_NAMES[dock.want]}`;
  // The box grows with its text: "2:1 Getreide" is three times "3:1", and a
  // fixed box would either crop that or leave the short one swimming.
  const wide = LABEL_PAD + label.length * LETTER_WIDTH;
  return (
    <g data-testid={`ct-harbour-${harbour}`} pointerEvents="none">
      <line x1={a.px} y1={a.py} x2={out.px} y2={out.py} stroke="#a9803f" strokeWidth={2} />
      <line x1={b.px} y1={b.py} x2={out.px} y2={out.py} stroke="#a9803f" strokeWidth={2} />
      <rect
        x={out.px - wide / 2}
        y={out.py - 8}
        width={wide}
        height={16}
        rx={5}
        fill="#f6eed6"
        stroke="#a9803f"
      />
      <text
        x={out.px}
        y={out.py + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8.5}
        fontWeight={700}
        fill="#5b4423"
      >
        {label}
      </text>
    </g>
  );
}

/** One road. */
function Road({
  game,
  path,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly path: number;
  readonly mySeat: number | null;
}): ReactElement {
  const board = islandOf(game.land.length);
  const owner = game.roads[path] as number;
  const a = crossPoint(board, board.paths[path].ends[0]);
  const b = crossPoint(board, board.paths[path].ends[1]);
  const mine = owner === mySeat;
  return (
    <g data-testid={`ct-road-${path}`} pointerEvents="none">
      {mine && (
        <line
          x1={a.px}
          y1={a.py}
          x2={b.px}
          y2={b.py}
          stroke="#ffffff"
          strokeWidth={11}
          strokeLinecap="round"
        />
      )}
      <line
        x1={a.px}
        y1={a.py}
        x2={b.px}
        y2={b.py}
        stroke={COLOUR_INK[game.players[owner].colour]}
        strokeWidth={mine ? 7 : 6.5}
        strokeLinecap="round"
      />
    </g>
  );
}

/** One settlement or city. */
function Building({
  game,
  crossing,
  mySeat,
}: {
  readonly game: CatanGame;
  readonly crossing: number;
  readonly mySeat: number | null;
}): ReactElement {
  const town = game.towns[crossing];
  const { px, py } = crossPoint(islandOf(game.land.length), crossing);
  const owner = town?.owner ?? 0;
  const mine = owner === mySeat;
  const ink = COLOUR_INK[game.players[owner].colour];
  const big = town?.city === true;
  const shape = big
    ? `M ${px - 11} ${py + 7} L ${px - 11} ${py - 2} L ${px - 4} ${py - 8} L ${px + 3} ${py - 2} L ${px + 3} ${py - 6} L ${px + 11} ${py - 6} L ${px + 11} ${py + 7} Z`
    : `M ${px - 7} ${py + 6} L ${px - 7} ${py - 1} L ${px} ${py - 8} L ${px + 7} ${py - 1} L ${px + 7} ${py + 6} Z`;
  return (
    <g data-testid={`ct-town-${crossing}`} pointerEvents="none">
      {mine && <path d={shape} fill="none" stroke="#ffffff" strokeWidth={5} strokeLinejoin="round" />}
      {mine && <path d={shape} fill="none" stroke="#111827" strokeWidth={2} strokeLinejoin="round" />}
      <path d={shape} fill={ink} stroke="#1f2937" strokeWidth={1.2} strokeLinejoin="round" />
    </g>
  );
}

/**
 * The island.
 *
 * @param props - the game, which seat is looking, and where moves go
 * @returns the board
 */
export function CatanBoard({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number | null;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const spots = tappable(game, mySeat);
  const litHex = new Set(spots.filter((s) => s.kind === "robber").map((s) => s.at));
  const litPath = new Set(
    spots.filter((s) => s.kind === "road" || s.kind === "breakRoad").map((s) => s.at),
  );
  const breaking = new Set(spots.filter((s) => s.kind === "breakRoad").map((s) => s.at));
  const litCross = spots.filter((s) => s.kind === "town" || s.kind === "city");
  const tinted = myLands(game, mySeat);
  const board = islandOf(game.land.length);
  // The crossings reach five half-widths across and eight half-heights down,
  // and the harbours sit a jetty further out again.
  // Measured off the board rather than assumed, because the six-handed island
  // is two rows taller and one column wider than the printed one.
  const reachX = Math.max(...board.crossings.map((c) => Math.abs(c.x)));
  const reachY = Math.max(...board.crossings.map((c) => Math.abs(c.y)));
  const width = reachX * (Math.sqrt(3) / 2) * SIZE + SIDE_MARGIN;
  const height = (reachY * SIZE) / 2 + TOP_MARGIN;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-[#3f86bd] p-2 dark:border-zinc-800">
      <svg
        data-testid="ct-board"
        viewBox={`${-width} ${-height} ${width * 2} ${height * 2}`}
        className="h-auto w-full"
        role="img"
        aria-label="Spielfeld"
      >
        {board.hexes.map((hex) => (
          <Landscape
            key={hex.id}
            game={game}
            hex={hex.id}
            lit={litHex.has(hex.id)}
            onTap={
              litHex.has(hex.id) ? () => onMove({ kind: "robber", at: hex.id }) : null
            }
          />
        ))}
        {mySeat !== null && (
          <g pointerEvents="none" fill="none">
            {[...tinted].map((hex) => (
              <polygon
                key={hex}
                points={hexOutline(board, hex)}
                stroke={COLOUR_INK[game.players[mySeat].colour]}
                strokeWidth={MINE_RING}
                opacity={MINE_INK}
                strokeLinejoin="round"
              />
            ))}
          </g>
        )}
        {[...litPath].map((path) => {
          const a = crossPoint(board, board.paths[path].ends[0]);
          const b = crossPoint(board, board.paths[path].ends[1]);
          return (
            <line
              key={`lit-${path}`}
              data-testid={`ct-path-${path}`}
              x1={a.px}
              y1={a.py}
              x2={b.px}
              y2={b.py}
              stroke="#ffffff"
              strokeWidth={9}
              strokeLinecap="round"
              opacity={0.75}
              className="cursor-pointer"
              onClick={() =>
                onMove(breaking.has(path) ? { kind: "event", at: path } : { kind: "road", at: path })
              }
            />
          );
        })}
        {board.paths.map((path) =>
          game.roads[path.id] === null ? null : (
            <Road key={path.id} game={game} path={path.id} mySeat={mySeat} />
          ),
        )}
        {litCross.map((spot) => {
          const { px, py } = crossPoint(board, spot.at);
          return (
            <circle
              key={`lit-${spot.kind}-${spot.at}`}
              data-testid={`ct-cross-${spot.at}`}
              cx={px}
              cy={py}
              r={10}
              fill="#ffffff"
              opacity={0.8}
              stroke="#111827"
              strokeWidth={1.5}
              className="cursor-pointer"
              onClick={() => onMove(moveFor(spot))}
            />
          );
        })}
        {board.crossings.map((crossing) =>
          game.towns[crossing.id] === null ? null : (
            <Building
              key={crossing.id}
              game={game}
              crossing={crossing.id}
              mySeat={mySeat}
            />
          ),
        )}
        {/* Last, over everything. A harbour is furniture rather than a piece,
            so it would normally go underneath - but its label sits a short way
            off the coast, close enough that a settlement on the crossing beside
            it can cover a character. A piece half behind a label is still a
            piece you can read; "2:1 Getreide" with the 2 missing is not. */}
        {game.harbours.map((unused, index) => (
          <Dock key={index} game={game} harbour={index} />
        ))}
      </svg>
    </div>
  );
}
