/**
 * Who sits in, on or at what right now: the balloon, the gondola, the train,
 * the skis, a hockey match - and any vehicle at all, so that nobody is on two
 * at once.
 *
 * @module
 * @remarks
 * Only reads the state, and imports nothing but its shapes, so every module
 * can ask without pulling in the vehicles' own modules.
 */
import type { Character, GameState, TrainRider } from "./types";

/** The vehicles and rides one can be on; one at a time. */
export type VehicleKind =
  | "jetski"
  | "balloon"
  | "gondola"
  | "train"
  | "skis"
  | "sled"
  | "carousel"
  | "sleigh";

/**
 * Whether somebody stands in the balloon's basket.
 *
 * @param state - the game
 * @param char - the character
 * @returns true while aboard
 */
export function inBalloon(state: GameState, char: Character): boolean {
  return state.world.places.balloon.rider === state.chars.indexOf(char);
}

/**
 * Whether somebody sits in the gondola - then the character is off the
 * ground and hidden in the cabin.
 *
 * @param state - the game
 * @param char - the character
 * @returns true while riding the cable
 */
export function inGondola(state: GameState, char: Character): boolean {
  const ride = state.world.places.cable.ride;
  return ride !== null && ride.who === state.chars.indexOf(char);
}

/**
 * Somebody's seat on the train.
 *
 * @param state - the game
 * @param char - the character
 * @returns the seat, or null when not on the train
 */
export function trainSeat(
  state: GameState,
  char: Character,
): TrainRider | null {
  const who = state.chars.indexOf(char);
  return (
    state.world.places.train.riders.find((rider) => rider.who === who) ?? null
  );
}

/**
 * Whether somebody is on a run down the ski slope.
 *
 * @param state - the game
 * @param char - the character
 * @returns true while skiing
 */
export function skiing(state: GameState, char: Character): boolean {
  const ski = state.world.places.cable.ski;
  return ski !== null && ski.who === state.chars.indexOf(char);
}

/**
 * Whether somebody plays in the hockey match without being steered: the
 * forward or the goalie, moved by the match.
 *
 * @param state - the game
 * @param char - the character
 * @returns true for a player of the other side
 */
export function hockeyHelper(state: GameState, char: Character): boolean {
  const match = state.world.places.hockey.match;
  const who = state.chars.indexOf(char);
  return match !== null && (match.forward === who || match.goalie === who);
}

/**
 * Whether somebody is carried along by a vehicle and not to be pushed about:
 * in the gondola or on the train.
 *
 * @param state - the game
 * @param char - the character
 * @returns true when its place is the vehicle's
 */
export function carried(state: GameState, char: Character): boolean {
  return inGondola(state, char) || trainSeat(state, char) !== null;
}

/**
 * What somebody rides right now, of everything that can be ridden.
 *
 * @param state - the game
 * @param char - the character
 * @returns the vehicle, or null on foot
 */
export function vehicleOf(
  state: GameState,
  char: Character,
): VehicleKind | null {
  const who = state.chars.indexOf(char);
  const east = state.world.east;
  let kind: VehicleKind | null = null;
  if (state.world.jetskis.some((jet) => jet.rider === who)) {
    kind = "jetski";
  } else if (inBalloon(state, char)) {
    kind = "balloon";
  } else if (inGondola(state, char)) {
    kind = "gondola";
  } else if (trainSeat(state, char) !== null) {
    kind = "train";
  } else if (skiing(state, char)) {
    kind = "skis";
  } else if (east.sled !== null && east.sled.who === who) {
    kind = "sled";
  } else if (east.riders.some((rider) => rider.who === who)) {
    kind = "carousel";
  } else if (state.sleigh !== null && state.sleigh.riders.includes(char.id)) {
    kind = "sleigh";
  }
  return kind;
}
