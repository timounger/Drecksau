/**
 * A fresh approach on Montreal.
 *
 * @module
 * @remarks
 * The first scenario from the box, set up exactly as its picture shows: the
 * plane in the cloud, nine other aircraft between it and the runway, both
 * aerodynamics markers at their printed starting points and two reroll tokens
 * waiting on the altitude track.
 */
import { deal, emptyCockpit } from "./moves";
import {
  BRAKE_VALUES,
  FLAP_VALUES,
  GEAR_VALUES,
  PILOT,
  type Seat,
} from "./spaces";
import {
  ALTITUDES,
  MONTREAL_TRAFFIC,
  REROLL_AT,
  SELF_NAME,
  type Player,
  type SkyTeamGame,
} from "./state";

/** What a seat needs before there is a game. */
export type SkyTeamSeat = {
  readonly name: string;
  readonly isBot: boolean;
};

/**
 * Sets up a landing and throws the first eight dice.
 *
 * @param seats - the two at the controls, pilot first
 * @param seed - the cursor the dice are thrown from
 * @returns the landing, ready for its first die
 */
export function createGame(
  seats: readonly SkyTeamSeat[],
  seed: number,
): SkyTeamGame {
  const players: readonly [Player, Player] = [
    {
      name: seats[0]?.name ?? SELF_NAME,
      isBot: seats[0]?.isBot ?? false,
      dice: [],
    },
    {
      name: seats[1]?.name ?? "Co-Pilot",
      isBot: seats[1]?.isBot ?? true,
      dice: [],
    },
  ];
  const opener: Seat = PILOT;
  return deal({
    stage: "placing",
    failure: null,
    players,
    active: opener,
    opener,
    round: 1,
    altitude: 0,
    position: 0,
    traffic: [...MONTREAL_TRAFFIC],
    axis: 0,
    gear: GEAR_VALUES.map(() => false),
    flaps: FLAP_VALUES.map(() => false),
    brakes: BRAKE_VALUES.map(() => false),
    coffee: 0,
    rerolls: 0,
    rerollLeft: [...REROLL_AT],
    placed: emptyCockpit(),
    speed: null,
    log: [],
    rng: seed >>> 0,
    seed: seed >>> 0,
  });
}

/**
 * The two seats for a game against the computer.
 *
 * @param name - what the human seat is called
 * @param asPilot - true to fly the left-hand seat
 * @returns the pair, pilot first
 * @remarks
 * The computer takes the other seat and is told nothing about your dice - see
 * `engine/ai.ts`. That is not politeness: a co-pilot who could read your hand
 * would have removed the only thing this game is about.
 */
export function soloSeats(
  name: string,
  asPilot: boolean,
): readonly SkyTeamSeat[] {
  const human: SkyTeamSeat = { name, isBot: false };
  const machine: SkyTeamSeat = { name: "Der Computer", isBot: true };
  return asPilot ? [human, machine] : [machine, human];
}

/** The altitude a round is flown at. */
export function altitudeOf(game: SkyTeamGame): number {
  return ALTITUDES[game.altitude];
}
