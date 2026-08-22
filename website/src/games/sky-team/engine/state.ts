/**
 * What a landing looks like from the outside, and the sums that read it.
 *
 * @module
 * @remarks
 * One flat, plain-JSON state, like every game here: it has to survive storage
 * and the wire unchanged.
 *
 * The dice are the exception that shapes everything. They sit in the state
 * because the referee needs them, but **nobody may see the other side's** -
 * that is not a nicety, it is the game. The online adapter blanks them; the
 * computer opponent is never handed them. See `multiplayer/adapter.ts`.
 */
import {
  AXIS_LIMIT,
  BLUE_START,
  BRAKE_VALUES,
  COFFEE_SPACES,
  FLAP_VALUES,
  GEAR_VALUES,
  ORANGE_START,
  PILOT,
  type Seat,
} from "./spaces";

/** Where a landing has got to. */
export type Stage =
  /** Dice are being placed. */
  | "placing"
  /** The round is over and the table is looking at it. */
  | "roundEnd"
  /** Down safely. */
  | "won"
  /** Not down safely. */
  | "lost";

/** Why a landing failed - each one is a rule of its own. */
export type Failure =
  "spin" | "collision" | "overshoot" | "short" | "duty" | "landing";

/* eslint-disable @typescript-eslint/no-magic-numbers -- the printed strips.
   Counted off the setup picture in the rulebook; see
   docs/games/sky-team/game-rules.md. Nothing is derived from them, they simply
   are what is on the cardboard. */

/**
 * The approach for Montreal: planes per space, from the start to the airport.
 *
 * @remarks
 * Nine aircraft in all, which is exactly what the rulebook says goes on the
 * strip - the other three stay in the box.
 */
export const MONTREAL_TRAFFIC: readonly number[] = [0, 0, 1, 2, 1, 3, 2];

/** The altitudes of the seven rounds; the last one is the landing. */
export const ALTITUDES: readonly number[] = [
  6000, 5000, 4000, 3000, 2000, 1000, 0,
];

/** The altitudes that carry a reroll token at the start. */
export const REROLL_AT: readonly number[] = [6000, 2000];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Exactly two, and that is the game - from the rulebook. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 2;

/** What the seat you play yourself is called when it has no other name. */
export const SELF_NAME = "Du";

/** One place at the controls. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  /** The dice still behind this player's screen. */
  readonly dice: readonly number[];
};

/** A whole landing. */
export type SkyTeamGame = {
  readonly stage: Stage;
  /** Why it ended, where it ended badly. */
  readonly failure: Failure | null;
  readonly players: readonly [Player, Player];
  /** The seat to place the next die. */
  readonly active: Seat;
  /** The seat that opened this round. */
  readonly opener: Seat;
  /** Which round, from 1. */
  readonly round: number;
  /** Index into {@link ALTITUDES}; the last one is the landing round. */
  readonly altitude: number;
  /** Where on the approach the plane is; the last index is the airport. */
  readonly position: number;
  /** Planes still in the way, per approach space. */
  readonly traffic: readonly number[];
  /** The attitude indicator, negative towards the pilot. */
  readonly axis: number;
  readonly gear: readonly boolean[];
  readonly flaps: readonly boolean[];
  readonly brakes: readonly boolean[];
  readonly coffee: number;
  /** Reroll tokens in hand. */
  readonly rerolls: number;
  /** Altitudes whose reroll token has not been collected yet. */
  readonly rerollLeft: readonly number[];
  /** What lies on each cockpit space, by space id. */
  readonly placed: Readonly<Record<string, number | null>>;
  /** The speed the engines were last set to, or null before they are set. */
  readonly speed: number | null;
  readonly log: readonly string[];
  readonly rng: number;
  readonly seed: number;
};

/** What a player may do. */
export type SkyTeamMove =
  /** Put one die on one space, spending `coffee` cups to shift its value. */
  | {
      readonly kind: "place";
      readonly space: string;
      /** Which of your own dice, by index. */
      readonly die: number;
      /** How far the coffee shifts it: negative down, positive up. */
      readonly shift: number;
    }
  /** Spend a reroll token; every unplaced die of both players is thrown again. */
  | { readonly kind: "reroll" }
  /** Take the round's end in and start the next. */
  | { readonly kind: "next" };

/**
 * The last index of the approach, which is the airport.
 *
 * @param game - the landing
 * @returns the index the airport sits on
 */
export function airportAt(game: SkyTeamGame): number {
  return game.traffic.length - 1;
}

/**
 * Whether this is the landing round.
 *
 * @param game - the landing
 * @returns true once the plane is over the airport with no height left
 */
export function isFinalRound(game: SkyTeamGame): boolean {
  return (
    game.altitude === ALTITUDES.length - 1 && game.position === airportAt(game)
  );
}

/**
 * The low aerodynamics marker.
 *
 * @param game - the landing
 * @returns the speed at or below which the plane does not move at all
 * @remarks
 * Every leg of landing gear is drag, and drag moves this marker right: with all
 * three out it stands at 7, exactly as the rulebook's picture shows.
 */
export function blueMarker(game: SkyTeamGame): number {
  return BLUE_START + game.gear.filter(Boolean).length;
}

/**
 * The high aerodynamics marker.
 *
 * @param game - the landing
 * @returns the speed above which the plane moves two spaces
 */
export function orangeMarker(game: SkyTeamGame): number {
  return ORANGE_START + game.flaps.filter(Boolean).length;
}

/**
 * How hard the brakes can hold.
 *
 * @param game - the landing
 * @returns the highest brake activated, or 0 with none
 * @remarks
 * Not a count: the brakes are marked 2, 4 and 6, and the marker ends up just
 * right of the last one activated. So the strength **is** that number, and the
 * landing succeeds while the speed does not exceed it - which is what the
 * rulebook's own example shows, landing at speed 4 on brakes 2 and 4.
 */
export function brakeStrength(game: SkyTeamGame): number {
  return game.brakes.reduce(
    (best, on, slot) => (on ? BRAKE_VALUES[slot] : best),
    0,
  );
}

/**
 * How far the plane would move at this speed.
 *
 * @param game - the landing
 * @param speed - the sum of the two engine dice
 * @returns 0, 1 or 2 spaces
 */
export function advanceFor(game: SkyTeamGame, speed: number): number {
  let spaces = 0;
  if (speed > orangeMarker(game)) {
    spaces = 2;
  } else if (speed > blueMarker(game)) {
    spaces = 1;
  }
  return spaces;
}

/** Planes still anywhere on the approach. */
export function planesLeft(game: SkyTeamGame): number {
  return game.traffic.reduce((total, count) => total + count, 0);
}

/** Whether every leg and every flap is out. */
export function allDeployed(game: SkyTeamGame): boolean {
  return (
    game.gear.every(Boolean) &&
    game.flaps.every(Boolean) &&
    game.gear.length === GEAR_VALUES.length &&
    game.flaps.length === FLAP_VALUES.length
  );
}

/** Whether the attitude indicator has reached a ✕. */
export function isSpinning(game: SkyTeamGame): boolean {
  return Math.abs(game.axis) >= AXIS_LIMIT;
}

/** Coffee cups that may still be brewed. */
export function coffeeRoom(game: SkyTeamGame): number {
  return COFFEE_SPACES - game.coffee;
}

/** The two mandatory pairs, and whether both are complete. */
export function dutyDone(game: SkyTeamGame): boolean {
  return (
    game.placed["axis-p"] !== null &&
    game.placed["axis-c"] !== null &&
    game.placed["engine-p"] !== null &&
    game.placed["engine-c"] !== null
  );
}

/** Dice nobody has placed yet. */
export function diceLeft(game: SkyTeamGame): number {
  return game.players[PILOT].dice.length + game.players[1].dice.length;
}

/**
 * The seat the table is waiting for.
 *
 * @param game - the landing
 * @returns the seat, or null when nobody is being waited for
 * @remarks
 * At the round's end both may read the result, so the opener answers for the
 * table - somebody has to press on, and it may as well be whoever starts next.
 */
export function seatWaiting(game: SkyTeamGame): Seat | null {
  let seat: Seat | null = null;
  if (game.stage === "placing") {
    seat = game.active;
  } else if (game.stage === "roundEnd") {
    seat = game.opener;
  }
  return seat;
}
