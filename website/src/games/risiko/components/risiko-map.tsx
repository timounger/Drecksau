/**
 * The world, drawn.
 *
 * @module
 * @remarks
 * **This is not a picture of the printed board, and it does not pretend to be.**
 * The rulebook's own photograph of the map is unreadable, and a hand-traced
 * outline of forty-two coastlines would be a lot of work whose only product is
 * a prettier way of getting a border wrong. What a Risk player actually needs
 * from the map is one thing - **who borders whom** - and outlines are a poor way
 * of showing it: on a real board people argue about whether Ostafrika touches
 * the Mittlerer Osten precisely because a coastline does not say.
 *
 * So the world is drawn as what the rules make it: a graph. Each territory is a
 * counter at roughly its place on the globe, every border is a line you can
 * follow with a finger, and the six continents lie underneath in their printed
 * colours. Nothing about a border is ever a matter of opinion.
 *
 * The one border that cannot be a line is Alaska to Kamtschatka, which runs off
 * the edge of the world and back on at the other side. It gets two stubs, which
 * is what the printed board does too.
 *
 * **The map keeps its own colours in both themes.** It is a printed board; a
 * real one does not get darker in the evening, and the page around it carries
 * the theme instead.
 */
"use client";

import type { ReactElement } from "react";
import { armyOf } from "@/games/risiko/engine/armies";
import {
  CONTINENTS,
  TERRITORIES,
  WRAP_BORDER,
  neighboursOf,
  territoriesIn,
  type Territory,
} from "@/games/risiko/engine/map";
import type { RisikoGame } from "@/games/risiko/engine/state";

/** The sea, which is the same colour whatever the page is doing. */
const OCEAN = "#15334f";

/** How far a continent's patch reaches past the counters on it. */
const PAD = 27;

/** The counter's radius. */
const DOT = 13;

/** How far off the edge the wrap-around border's stubs reach. */
const STUB = 30;

/** The colour of a territory nobody has taken yet. */
const UNCLAIMED = "#7b8794";

/** The rounded patch drawn round one territory, making up the continent. */
const BLOB_W = 78;
const BLOB_H = 62;

/** Type sizes on the map, in its own units. */
const LABEL_SIZE = 11;
const COUNT_SIZE = 12;
const NAME_SIZE = 8;

/** How far the ring round a pickable counter stands off it. */
const RING_GAP = 5;

/** How thick the two kinds of ring are. */
const RING_PICKED = 3;
const RING_OPEN = 2;

/** How far the name sits below the counter. */
const NAME_DROP = 11;

/** Nudges the number onto the counter's optical centre. */
const COUNT_LIFT = 4;

/** How far a stub's label sits above its tip. */
const STUB_LIFT = 6;

/** How far the stub climbs, to get its label off the counter's own name. */
const STUB_RISE = 24;

/** The drawn world's size, in its own units. */
const WIDTH = 920;
const HEIGHT = 520;

/** Props of {@link RisikoMap}. */
export type RisikoMapProps = {
  readonly game: RisikoGame;
  /** The territory the reader has picked as a source, if any. */
  readonly from: string | null;
  /** Territories the reader may pick right now. */
  readonly open: readonly string[];
  /** Territories to mark as the second half of a pending choice. */
  readonly targets: readonly string[];
  readonly onPick: (id: string) => void;
};

/**
 * Renders the whole map.
 *
 * @param props - the game and what the reader may do with it
 * @returns the map element
 */
export function RisikoMap({
  game,
  from,
  open,
  targets,
  onPick,
}: RisikoMapProps): ReactElement {
  const pickable = new Set([...open, ...targets]);

  return (
    <div className="overflow-x-auto rounded-2xl" style={{ background: OCEAN }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full min-w-[820px]"
        role="img"
        aria-label="Weltkarte mit 42 Gebieten"
      >
        {CONTINENTS.map((continent) => {
          const parts = patchOf(continent.id);
          return (
            <g key={continent.id}>
              {/* One rounded patch per territory, all in one group so the
                  overlaps do not darken where they meet. A bounding box round
                  the whole continent was the obvious way and the wrong one:
                  Afrika's box and Asien's box overlap in the Mittelmeer, and
                  the map went muddy exactly where it is most contested. */}
              <g opacity={0.42} fill={continent.colour}>
                {parts.map((part) => (
                  <rect
                    key={`${part.x},${part.y}`}
                    x={part.x}
                    y={part.y}
                    width={BLOB_W}
                    height={BLOB_H}
                    rx={PAD}
                  />
                ))}
              </g>
              <text
                x={continent.labelX}
                y={continent.labelY}
                fontSize={LABEL_SIZE}
                fontWeight={700}
                textAnchor="middle"
                fill="#ffffff"
                opacity={0.8}
              >
                {continent.name} +{continent.bonus}
              </text>
            </g>
          );
        })}

        {LINKS.map((link) => (
          <line
            key={`${link.from}-${link.to}`}
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            stroke="#ffffff"
            strokeOpacity={0.3}
            strokeWidth={1.4}
          />
        ))}

        {/* The border that runs off the map. Two stubs, as the board prints. */}
        {WRAP_STUBS.map((stub) => (
          <g key={stub.id}>
            <line
              x1={stub.x1}
              y1={stub.y1}
              x2={stub.x2}
              y2={stub.y2}
              stroke="#ffffff"
              strokeOpacity={0.45}
              strokeWidth={1.6}
              strokeDasharray="5 4"
            />
            <text
              x={stub.labelX}
              y={stub.labelY}
              fontSize={8}
              fill="#ffffff"
              opacity={0.6}
              textAnchor={stub.anchor}
            >
              {stub.label}
            </text>
          </g>
        ))}

        {TERRITORIES.map((place) => (
          <Counter
            key={place.id}
            place={place}
            game={game}
            selected={place.id === from}
            open={pickable.has(place.id)}
            aimed={targets.includes(place.id)}
            onPick={onPick}
          />
        ))}
      </svg>
    </div>
  );
}

/** One territory: a counter, its garrison, and its name. */
function Counter({
  place,
  game,
  selected,
  open,
  aimed,
  onPick,
}: {
  readonly place: Territory;
  readonly game: RisikoGame;
  readonly selected: boolean;
  readonly open: boolean;
  readonly aimed: boolean;
  readonly onPick: (id: string) => void;
}): ReactElement {
  const seat = game.owner[place.id];
  const army = seat >= 0 ? armyOf(seat) : null;
  const units = game.units[place.id];

  return (
    <g
      onClick={() => open && onPick(place.id)}
      style={{ cursor: open ? "pointer" : "default" }}
      data-testid={`rk-${place.id}`}
      data-owner={seat}
      data-units={units}
      data-open={open ? "1" : "0"}
    >
      <title>{`${place.name} - ${units} Einheiten`}</title>
      {(selected || open) && (
        <circle
          cx={place.x}
          cy={place.y}
          r={DOT + RING_GAP}
          fill="none"
          stroke={selected ? "#ffffff" : aimed ? "#ff5b4a" : "#ffe27a"}
          strokeWidth={selected ? RING_PICKED : RING_OPEN}
          strokeDasharray={selected ? undefined : "4 3"}
        />
      )}
      <circle
        cx={place.x}
        cy={place.y}
        r={DOT}
        fill={army === null ? UNCLAIMED : army.colour}
        stroke="#0d2237"
        strokeWidth={1.5}
      />
      <text
        x={place.x}
        y={place.y + COUNT_LIFT}
        fontSize={COUNT_SIZE}
        fontWeight={800}
        textAnchor="middle"
        fill={army === null ? "#ffffff" : army.ink}
      >
        {units}
      </text>
      <text
        x={place.x}
        y={place.y + DOT + NAME_DROP}
        fontSize={NAME_SIZE}
        fontWeight={600}
        textAnchor="middle"
        fill="#ffffff"
        stroke="#0d2237"
        strokeWidth={2.2}
        paintOrder="stroke"
      >
        {place.name}
      </text>
    </g>
  );
}

/**
 * The rounded patches that make up one continent.
 *
 * @remarks
 * The union of a rectangle round each of its territories, which follows the
 * continent's actual shape instead of boxing in the ocean beside it. A single
 * bounding box was the obvious way and the wrong one: Afrika's box and Asien's
 * box overlap across the Mittelmeer, and the map went muddy exactly where it is
 * most contested.
 *
 * Where the **name** goes is not computed at all - see
 * {@link ./engine/map.Continent.labelX}.
 */
function patchOf(
  continent: string,
): readonly { readonly x: number; readonly y: number }[] {
  return territoriesIn(continent as never)
    .map((id) => TERRITORIES.find((each) => each.id === id) as Territory)
    .map((each) => ({ x: each.x - BLOB_W / 2, y: each.y - BLOB_H / 2 }));
}

/** Every border as a line, worked out once. */
const LINKS: readonly {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}[] = TERRITORIES.flatMap((place) =>
  neighboursOf(place.id)
    // Once per pair, and never the one that runs off the edge.
    .filter((other) => place.id < other)
    .filter(
      (other) =>
        !(WRAP_BORDER.includes(place.id) && WRAP_BORDER.includes(other)),
    )
    .map((other) => {
      const to = TERRITORIES.find((each) => each.id === other) as Territory;
      return {
        from: place.id,
        to: other,
        x1: place.x,
        y1: place.y,
        x2: to.x,
        y2: to.y,
      };
    }),
);

/**
 * The two stubs that stand for the border across the date line.
 *
 * @remarks
 * Angled up and outwards rather than straight sideways: level with the counter,
 * the stub's label ran straight through Alaska's own name. Up and out is the
 * one direction that is open water at both ends of the world.
 */
const WRAP_STUBS: readonly {
  readonly id: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly label: string;
  readonly labelX: number;
  readonly labelY: number;
  readonly anchor: "start" | "end";
}[] = WRAP_BORDER.map((id, at) => {
  const place = TERRITORIES.find((each) => each.id === id) as Territory;
  const other = TERRITORIES.find(
    (each) => each.id === WRAP_BORDER[1 - at],
  ) as Territory;
  const outwards = at === 0 ? -1 : 1;
  const tipX = place.x + outwards * STUB;
  const tipY = place.y - STUB_RISE;
  return {
    id,
    x1: place.x,
    y1: place.y,
    x2: tipX,
    y2: tipY,
    label: `${at === 0 ? "\u{2190}" : "\u{2192}"} ${other.name}`,
    labelX: tipX,
    labelY: tipY - STUB_LIFT,
    anchor: at === 0 ? ("start" as const) : ("end" as const),
  };
});
