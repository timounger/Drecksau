/**
 * Reading the board: which stations a line joins, what stops where, and how
 * far apart two stations are.
 *
 * @module
 */
import { LINES, STATION_POSITIONS } from "./map-data";

/** The ways of getting about London. */
export type Transport = "taxi" | "bus" | "underground" | "ferry";

/** The transports that run on land and need a ticket of their own. */
export type LandTransport = Exclude<Transport, "ferry">;

/** The three kinds of transport the detectives may take - the ferry is Mister X's. */
export const LAND_TRANSPORTS: readonly LandTransport[] = [
  "taxi",
  "bus",
  "underground",
];

/** Every kind of transport, the ferry last. */
export const ALL_TRANSPORTS: readonly Transport[] = [
  ...LAND_TRANSPORTS,
  "ferry",
];

/** How many stations the board has, numbered from 1. */
export const STATION_COUNT = STATION_POSITIONS.length;

/** A distance for stations no line joins - never the case on this board. */
const FAR = 99;

/** For each transport: the stations reachable from each station, by station number. */
const NEIGHBOURS: Readonly<Record<Transport, readonly (readonly number[])[]>> =
  {
    taxi: adjacency("taxi"),
    bus: adjacency("bus"),
    underground: adjacency("underground"),
    ferry: adjacency("ferry"),
  };

/** The shortest number of moves between every two stations, filled on first use. */
let distances: readonly Uint8Array[] | null = null;

/**
 * The stations one ride away.
 *
 * @param station - where the ride starts
 * @param transport - the line taken
 * @returns the stations at the next stop of that line, in every direction
 */
export function neighbours(
  station: number,
  transport: Transport,
): readonly number[] {
  return NEIGHBOURS[transport][station] ?? [];
}

/**
 * The transports that stop at a station - the colours of its sign.
 *
 * @param station - the station
 * @returns taxi always, then bus and Underground where they stop
 */
export function stopsAt(station: number): readonly Transport[] {
  return LAND_TRANSPORTS.filter(
    (transport) => neighbours(station, transport).length > 0,
  );
}

/**
 * Whether a station is a pier of the Thames ferry.
 *
 * @param station - the station
 * @returns true for the four ferry piers
 */
export function isPier(station: number): boolean {
  return neighbours(station, "ferry").length > 0;
}

/**
 * Where a station lies on the board.
 *
 * @param station - the station number
 * @returns its position in board units
 */
export function positionOf(station: number): {
  readonly x: number;
  readonly y: number;
} {
  const [x, y] = STATION_POSITIONS[station - 1] ?? [0, 0];
  return { x, y };
}

/**
 * Every station number, 1 to 199.
 *
 * @returns the numbers in order
 */
export function allStations(): readonly number[] {
  return STATION_POSITIONS.map((unused, index) => index + 1);
}

/**
 * How many rides apart two stations are at the least, by any land transport.
 *
 * @param from - one station
 * @param to - the other station
 * @returns the number of moves a detective with every ticket would need
 * @remarks
 * Tickets are not counted, so this is a lower bound for a detective short of
 * one kind. Worked out once for the whole board on first use - 199 short
 * searches, a fraction of a millisecond each.
 */
export function distance(from: number, to: number): number {
  distances ??= allStations().map((station) => searchFrom(station));
  return distances[from - 1]?.[to] ?? FAR;
}

/**
 * The neighbour lists of one kind of transport.
 *
 * @param transport - the transport
 * @returns for each station number, the stations its line reaches
 */
function adjacency(transport: Transport): readonly (readonly number[])[] {
  const lists: number[][] = Array.from(
    { length: STATION_POSITIONS.length + 1 },
    () => [],
  );
  for (const [a, b] of LINES[transport]) {
    lists[a].push(b);
    lists[b].push(a);
  }
  return lists.map((list) => list.toSorted((one, other) => one - other));
}

/**
 * The distances from one station to all others over land.
 *
 * @param start - where the search begins
 * @returns the number of rides to each station, by station number
 */
function searchFrom(start: number): Uint8Array {
  const result = new Uint8Array(STATION_POSITIONS.length + 1).fill(FAR);
  result[start] = 0;
  let frontier = [start];
  let step = 0;
  while (frontier.length > 0) {
    step += 1;
    const next: number[] = [];
    for (const station of frontier) {
      for (const transport of LAND_TRANSPORTS) {
        for (const other of neighbours(station, transport)) {
          if (result[other] === FAR) {
            result[other] = step;
            next.push(other);
          }
        }
      }
    }
    frontier = next;
  }
  return result;
}
