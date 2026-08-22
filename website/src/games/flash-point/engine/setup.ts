/**
 * A fresh call-out.
 *
 * @module
 * @remarks
 * The board is set up the way the rulebook's beginner setup says: ten fires and
 * three points of interest on the printed coordinates, every door shut, and the
 * crew standing outside. What is **not** the rulebook's is the house those
 * coordinates land in - see `engine/board.ts` for why.
 */
import {
  AMBULANCE,
  FALSE_ALARM_COUNT,
  START_FIRE,
  START_POI,
  VICTIM_COUNT,
  DAMAGE_CUBES,
  ACTION_POINTS,
} from "./board";
import { createRandom } from "./random";
import {
  cellKey,
  freshHouse,
  type Firefighter,
  type FlashPointGame,
  type Marker,
  type Poi,
} from "./state";

/** What a seat needs before there is a game. */
export type FlashPointSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/** The crew the game starts with, at most one per ambulance corner. */
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;

/** What the seat you play yourself is called when it has no other name. */
export const SELF_NAME = "Du";

/**
 * Sets up a call-out.
 *
 * @param seats - the crew, in turn order
 * @param seed - the cursor the fire is rolled from
 * @returns the fire, ready for its first action point
 */
export function createGame(
  seats: readonly FlashPointSeat[],
  seed: number,
): FlashPointGame {
  const random = createRandom(seed >>> 0);
  const bag = shuffle(
    [
      ...Array.from({ length: VICTIM_COUNT }, () => "victim" as Poi),
      ...Array.from({ length: FALSE_ALARM_COUNT }, () => "falseAlarm" as Poi),
    ],
    random,
  );

  const pois: Record<string, Marker> = {};
  const rest = [...bag];
  for (const cell of START_POI) {
    const kind = rest.shift();
    if (kind !== undefined) {
      pois[cellKey(cell)] = { kind, revealed: false };
    }
  }

  const blaze: Record<string, "fire"> = {};
  for (const cell of START_FIRE) {
    blaze[cellKey(cell)] = "fire";
  }

  const players: Firefighter[] = seats.map((seat, index) => ({
    name: seat.name,
    isBot: seat.isBot,
    at: AMBULANCE[index % AMBULANCE.length],
    ap: index === 0 ? ACTION_POINTS : 0,
    saved: 0,
    carrying: false,
  }));

  const house = freshHouse();
  return {
    stage: "acting",
    failure: null,
    players,
    active: 0,
    turn: 1,
    blaze,
    pois,
    damage: house.damage,
    doors: house.doors,
    cubes: DAMAGE_CUBES,
    rescued: 0,
    dead: 0,
    bag: rest,
    log: ["Einsatz! Das Haus brennt."],
    rng: random.state(),
    seed: seed >>> 0,
  };
}

/**
 * The crew for a game against the computer.
 *
 * @param name - what the human seat is called
 * @param mates - how many the computer plays alongside
 * @returns the crew, the human first
 */
export function soloSeats(
  name: string,
  mates: number,
): readonly FlashPointSeat[] {
  return [
    { name, isBot: false },
    ...Array.from({ length: mates }, (unused, index) => ({
      name: `Kollege ${index + 1}`,
      isBot: true,
    })),
  ];
}

/** Fisher-Yates, from the seeded generator so a saved game deals the same. */
function shuffle(
  items: readonly Poi[],
  random: { next: () => number },
): readonly Poi[] {
  const out = [...items];
  for (let index = out.length - 1; index > 0; index--) {
    const swap = Math.floor(random.next() * (index + 1));
    [out[index], out[swap]] = [out[swap], out[index]];
  }
  return out;
}
