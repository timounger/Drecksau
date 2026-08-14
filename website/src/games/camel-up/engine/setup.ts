/**
 * Setting a race up, and starting each new leg.
 *
 * @module
 * @remarks
 * The camels are not placed by hand: every die is rolled once and its camel put
 * on the space it shows, which is why a race can begin with a heap of four on
 * one space and one animal trailing behind. That heap is the game's first
 * lesson - the camel at the bottom of it is in last place, whatever it looks
 * like.
 */
import { createRandom, randomInt, shuffle } from "./random";
import {
  CAMELS,
  LEG_BET_VALUES,
  MAX_PIPS,
  RUN_OFF,
  START_COINS,
  TRACK_SPACES,
  type Camel,
  type CamelUpGame,
  type Player,
} from "./state";

/** A seat to deal in. */
export type CamelUpSeat = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
};

/** The computer players' names, in the order they join. */
const BOT_NAMES: readonly string[] = [
  "Basim",
  "Chalid",
  "Dalia",
  "Emir",
  "Farida",
  "Gamal",
  "Hana",
];

/**
 * Deals a fresh race.
 *
 * @param seats - the players, in turn order (two to eight)
 * @param seed - the seed the whole race's dice run from
 * @returns a race waiting for the first player's action
 */
export function createGame(
  seats: readonly CamelUpSeat[],
  seed: number,
): CamelUpGame {
  const random = createRandom(seed);
  const track: Camel[][] = Array.from(
    { length: TRACK_SPACES + RUN_OFF },
    () => [],
  );
  // Every camel's own die decides where it starts, in a random order so that
  // which of them ends up on top of a shared space is chance as well.
  for (const camel of shuffle(random, CAMELS)) {
    track[randomInt(random, MAX_PIPS)].push(camel);
  }
  const players: Player[] = seats.map((seat) => ({
    name: seat.name,
    isBot: seat.isBot,
    coins: START_COINS,
    legCards: [],
    raceCards: [...CAMELS],
    tileAt: null,
  }));
  return {
    phase: "racing",
    players,
    turn: 0,
    leg: 1,
    track,
    dice: [...CAMELS],
    rolls: [],
    tiles: [],
    legBets: freshLegBets(),
    winnerBets: [],
    loserBets: [],
    lastLeg: null,
    seed,
    rng: random.state(),
    log: ["Die Kamele stehen bereit."],
  };
}

/**
 * Clears the table for the next leg.
 *
 * @param game - the game with the leg just paid out
 * @returns the game with dice, cards and tiles back where they belong
 * @remarks
 * The track is **not** touched: a leg is a stretch of the same race, not a new
 * one. What goes back is everything that was bet or thrown during it.
 */
export function nextLeg(game: CamelUpGame): CamelUpGame {
  return {
    ...game,
    phase: "racing",
    leg: game.leg + 1,
    dice: [...CAMELS],
    rolls: [],
    tiles: [],
    legBets: freshLegBets(),
    players: game.players.map((player) => ({
      ...player,
      legCards: [],
      tileAt: null,
    })),
    log: [...game.log, `Etappe ${game.leg + 1} beginnt.`],
  };
}

/**
 * Builds the seats for a game against the computer.
 *
 * @param playerName - what the human seat is called
 * @param opponents - how many computer players join
 * @returns the seats, the human first
 */
export function soloSeats(
  playerName: string,
  opponents: number,
): readonly CamelUpSeat[] {
  const seats: CamelUpSeat[] = [{ name: playerName, isBot: false }];
  for (let index = 0; index < opponents; index++) {
    seats.push({ name: BOT_NAMES[index % BOT_NAMES.length], isBot: true });
  }
  return seats;
}

/** A full set of leg betting cards, best first. */
function freshLegBets(): Readonly<Record<Camel, readonly number[]>> {
  const bets = {} as Record<Camel, readonly number[]>;
  for (const camel of CAMELS) {
    bets[camel] = [...LEG_BET_VALUES];
  }
  return bets;
}
