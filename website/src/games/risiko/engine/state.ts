/**
 * The whole game at one instant, and who is winning it.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state goes to storage and over the wire, and the
 * referee in `moves.ts` is the only thing that changes it.
 *
 * Two shapes are worth reading before the rest. {@link RisikoGame.advance} is a
 * conquest waiting for its follow-up - the rulebook lets the attacker pull more
 * units into a territory it has just taken, and until they say how many, that
 * is the only thing anybody may do. And {@link RisikoPlayer.isNeutral} marks the
 * armies of the two-player game: they hold territories and cards, they are
 * fought over, and they never take a turn.
 */
import { CONTINENTS, TERRITORY_COUNT, continentOf, territoriesIn } from "./map";

/** Which of the box's three games is being played. */
export type Variant =
  /** "Grundspiel", 3 to 5 players: a target number of territories. */
  | "grundspiel"
  /** "Klassisches Risiko", 3 to 5 players: take the whole world. */
  | "klassisch"
  /** "Risiko für 2 Spieler": three neutral armies stand in the way. */
  | "zweispieler";

/** Where the turn is. */
export type Phase =
  /** Classic setup: territories are claimed one at a time. */
  | "claim"
  /** Classic setup: the remaining starting units go down round by round. */
  | "deploy"
  /** Two-player game: three units go onto some neutral army first. */
  | "neutral"
  /** New units are placed, and cards may be traded. */
  | "reinforce"
  /** Attacks, as many as wanted. */
  | "attack"
  /** One move, then the turn ends. */
  | "fortify"
  | "gameOver";

/** A player, or one of the two-player game's neutral armies. */
export type RisikoPlayer = {
  readonly name: string;
  readonly isBot: boolean;
  /**
   * True for an army nobody plays.
   *
   * @remarks
   * The two-player game's three spare colours. They hold ground and they hold
   * three cards each, but they never have a turn: "Die neutralen Armeen stellen
   * für die Spieler Hürden dar, die sie entweder angreifen oder umgehen
   * können."
   */
  readonly isNeutral: boolean;
  /** Their hand, secret from everybody else. */
  readonly cards: readonly string[];
  /** False once their last territory has fallen. */
  readonly alive: boolean;
};

/** What one attack rolled and cost, kept so the screen can show it. */
export type Battle = {
  readonly from: string;
  readonly to: string;
  /** The black dice, highest first. */
  readonly attack: readonly number[];
  /** The red dice, highest first. */
  readonly defence: readonly number[];
  readonly attackerLost: number;
  readonly defenderLost: number;
  readonly taken: boolean;
};

/** A conquest waiting for the attacker to say how many more units follow. */
export type Advance = {
  readonly from: string;
  readonly to: string;
  /** The most that may still come over, leaving one behind. */
  readonly max: number;
};

/** A move a seat can make. */
export type RisikoMove =
  /** Classic setup: take an empty territory. */
  | { readonly kind: "claim"; readonly to: string }
  /** Put new units on one of your territories. */
  | { readonly kind: "place"; readonly to: string; readonly count: number }
  /** Hand in cards for units. */
  | { readonly kind: "trade"; readonly cards: readonly string[] }
  /** One conquest action: one to three units against a neighbour. */
  | {
      readonly kind: "attack";
      readonly from: string;
      readonly to: string;
      readonly units: number;
    }
  /** Pull more units into a territory just taken. */
  | { readonly kind: "advance"; readonly count: number }
  /** Two-player game: reinforce a neutral army before your own turn. */
  | { readonly kind: "boost"; readonly to: string; readonly count: number }
  /** Stop attacking and go on to the one move. */
  | { readonly kind: "done" }
  /** The one move of the turn, then the turn ends. */
  | {
      readonly kind: "fortify";
      readonly from: string;
      readonly to: string;
      readonly count: number;
    }
  /** End the turn without moving anything. */
  | { readonly kind: "endTurn" };

/** The whole game. */
export type RisikoGame = {
  readonly variant: Variant;
  readonly phase: Phase;
  readonly players: readonly RisikoPlayer[];
  /** Whose turn it is. */
  readonly active: number;
  /** Which seat holds each territory, by territory id; -1 while unclaimed. */
  readonly owner: Readonly<Record<string, number>>;
  /** How many units stand on each territory. */
  readonly units: Readonly<Record<string, number>>;
  /** How many units the seat on turn still has to put down. */
  readonly toPlace: number;
  /** How many starting units each seat still holds, during setup. */
  readonly pool: readonly number[];
  /** True once the seat on turn has taken something this turn. */
  readonly conquered: boolean;
  /** A conquest waiting on its follow-up. */
  readonly advance: Advance | null;
  /**
   * Which neutral army this turn's opening three units are going to.
   *
   * @remarks
   * Two-player game only, and null the rest of the time. The three units must
   * all reinforce **one** army - "sie dürfen nicht auf den Gebieten einer
   * anderen neutralen Armee landen" - and the first unit is what decides which.
   * Without remembering it, the second unit could go anywhere.
   */
  readonly boosting: number | null;
  /** The face-down draw pile: territory ids, and the truce card. */
  readonly deck: readonly string[];
  /** Cards handed in, which the classic game reshuffles when the deck runs dry. */
  readonly discard: readonly string[];
  /** The last attack, for the screen. */
  readonly lastBattle: Battle | null;
  /** How many territories win it, or 0 where taking everything is the goal. */
  readonly target: number;
  /** Who won; more than one only where the rules allow a draw. */
  readonly winners: readonly number[];
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** Fewest seats an offline game seats - the two-player variant. */
export const MIN_PLAYERS = 2;

/**
 * Fewest seats the three- to five-player games seat.
 *
 * @remarks
 * The basic and classic games say "3-5 Spieler" on their own pages; two players
 * have their own variant with the neutral armies, which is a different game
 * rather than the same one with a seat missing.
 */
export const MIN_CREW = 3;

/** Most seats the box has armies for. */
export const MAX_PLAYERS = 5;

/** How many neutral armies stand on the board in the two-player game. */
export const NEUTRAL_ARMIES = 3;

/** Units every turn starts with, whatever else is going on. */
export const BASE_UNITS = 3;

/** Cards a neutral army has stashed under it. */
export const NEUTRAL_STASH = 3;

/** Units that go onto a neutral army before each turn of the two-player game. */
export const NEUTRAL_BOOST = 3;

/** The most units one conquest action may send. */
export const MAX_ATTACKERS = 3;

/** The most units a defender may answer with. */
export const MAX_DEFENDERS = 2;

/** Sides on a die. */
export const DIE_SIDES = 6;

/** Territories to hold to win, by how many are playing - the basic game. */
const TARGETS: Readonly<Record<number, number>> = { 3: 25, 4: 20, 5: 15 };

/** Territories to hold to win the two-player game. */
const TWO_PLAYER_TARGET = 30;

/** Starting units, by how many are playing - the classic game. */
const START_UNITS: Readonly<Record<number, number>> = { 3: 35, 4: 30, 5: 25 };

/** Cards each player is dealt to set up the two-player game. */
export const TWO_PLAYER_CARDS = 12;

/** Cards each neutral army is dealt to set up the two-player game. */
export const NEUTRAL_CARDS = 6;

/* eslint-disable @typescript-eslint/no-magic-numbers -- the reinforcement table
   is printed on the board as a row of ranges; it is data, not arithmetic. */

/**
 * Extra units for the territories held, from the board's own table.
 *
 * @remarks
 * "EINHEITEN FÜR GEBIETE": 12-14 gives +1, 15-17 gives +2, and so on to 40-42
 * for +10. Below twelve there is nothing. Note this is **not** the old
 * territories-divided-by-three: a player with eleven territories gets the bare
 * three units and no more, which makes the twelfth territory worth taking far
 * out of proportion to its size.
 */
const TERRITORY_BONUS: readonly (readonly [number, number])[] = [
  [12, 1],
  [15, 2],
  [18, 3],
  [21, 4],
  [24, 5],
  [27, 6],
  [30, 7],
  [33, 8],
  [36, 9],
  [40, 10],
];

/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * How many territories a seat has to hold to win.
 *
 * @param variant - which of the box's games this is
 * @param players - how many are playing, neutral armies included
 * @returns the target, or 0 where the goal is the whole world
 */
export function targetFor(variant: Variant, players: number): number {
  let target = 0;
  if (variant === "grundspiel") {
    target = TARGETS[players] ?? TARGETS[MAX_PLAYERS];
  } else if (variant === "zweispieler") {
    target = TWO_PLAYER_TARGET;
  }
  return target;
}

/**
 * How many units a seat starts the classic game with.
 *
 * @param players - how many are playing
 * @returns the starting units
 */
export function startUnitsFor(players: number): number {
  return START_UNITS[players] ?? START_UNITS[MAX_PLAYERS];
}

/**
 * The territories one seat holds.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns their territory ids
 */
export function heldBy(game: RisikoGame, seat: number): readonly string[] {
  return Object.keys(game.owner).filter((id) => game.owner[id] === seat);
}

/**
 * How many territories one seat holds.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns the count
 */
export function countHeld(game: RisikoGame, seat: number): number {
  return heldBy(game, seat).length;
}

/**
 * How many units one seat has on the board.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns the total
 */
export function unitsOf(game: RisikoGame, seat: number): number {
  return heldBy(game, seat).reduce((sum, id) => sum + game.units[id], 0);
}

/**
 * The continents one seat holds every territory of.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns the continent ids
 */
export function continentsHeld(
  game: RisikoGame,
  seat: number,
): readonly string[] {
  return CONTINENTS.filter((continent) =>
    territoriesIn(continent.id).every((id) => game.owner[id] === seat),
  ).map((continent) => continent.id);
}

/**
 * How many new units a seat gets at the start of its turn.
 *
 * @param game - the game
 * @param seat - the seat
 * @returns the base three, plus territories, plus continents
 * @remarks
 * Cards are not in here. They are traded during the turn and add to what is
 * still to be placed, which is a different thing from what the turn started
 * with - and keeping them out is what lets a player read this number first and
 * then decide whether the trade is worth making.
 */
export function incomeOf(game: RisikoGame, seat: number): number {
  const held = countHeld(game, seat);
  const fromLand = TERRITORY_BONUS.filter(([from]) => held >= from).length;
  const fromContinents = continentsHeld(game, seat).reduce(
    (sum, id) => sum + (continentOf(id)?.bonus ?? 0),
    0,
  );
  return BASE_UNITS + fromLand + fromContinents;
}

/**
 * The seats still in the game that somebody plays.
 *
 * @param game - the game
 * @returns the seat indexes, neutral armies left out
 */
export function livingPlayers(game: RisikoGame): readonly number[] {
  return game.players
    .map((player, seat) => (player.alive && !player.isNeutral ? seat : -1))
    .filter((seat) => seat >= 0);
}

/** How many territories there are, re-exported so callers need one import. */
export const TOTAL_TERRITORIES = TERRITORY_COUNT;
