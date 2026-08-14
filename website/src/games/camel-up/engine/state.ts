/**
 * The game state of Camel Up and the moves that change it.
 *
 * @module
 * @remarks
 * One plain, serialisable value: the track with its stacks of camels, the dice
 * still in the pyramid, the bets lying about and everybody's money.
 *
 * Randomness lives **in** the state ({@link CamelUpGame.rng}), not outside it.
 * Dice are rolled from the first turn to the last, and an online host has to be
 * able to hand a guest's move to the referee and get exactly one answer.
 */

/** The five racing camels, in the order they are listed. */
export type Camel = "blau" | "gruen" | "gelb" | "orange" | "weiss";

/** The two sides of a desert tile. */
export type TileKind =
  /** Oasis: a camel landing here is carried one space further. */
  | "oasis"
  /** Mirage: a camel landing here stumbles one space back. */
  | "mirage";

/** The camels, in the order they are shown. */
export const CAMELS: readonly Camel[] = [
  "blau",
  "gruen",
  "gelb",
  "orange",
  "weiss",
];

/** German label of every camel. */
export const CAMEL_LABELS: Readonly<Record<Camel, string>> = {
  blau: "Blau",
  gruen: "Grün",
  gelb: "Gelb",
  orange: "Orange",
  weiss: "Weiß",
};

/** The ink each camel is drawn with. */
export const CAMEL_INK: Readonly<Record<Camel, string>> = {
  blau: "#2563eb",
  gruen: "#16a34a",
  gelb: "#eab308",
  orange: "#ea580c",
  weiss: "#e7e5e4",
};

/** Fewest and most players a game seats. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

/** Spaces on the track. Crossing the last one ends the race. */
export const TRACK_SPACES = 16;

/**
 * Spaces kept beyond the finish line.
 *
 * @remarks
 * A camel can be thrown three spaces and then carried one more by an oasis, so
 * the array has to hold what runs off the end - the race is over the moment
 * anybody stands out there, but they still have to stand somewhere.
 */
export const RUN_OFF = 5;

/** The highest a die can show. */
export const MAX_PIPS = 3;

/** What everybody starts with, in coins. */
export const START_COINS = 3;

/** What a roll of the pyramid pays the player who took it. */
export const ROLL_REWARD = 1;

/** The three leg cards of one camel, taken best first. */
const LEG_BET_BEST = 5;
const LEG_BET_SECOND_BEST = 3;
const LEG_BET_LAST = 2;

/**
 * What a leg bet pays if the camel wins the leg, best card first.
 *
 * @remarks
 * The first player to back a camel takes the 5, the next the 3, the last the
 * 2 - so a camel that looks like a winner is worth less the longer you wait.
 */
export const LEG_BET_VALUES: readonly number[] = [
  LEG_BET_BEST,
  LEG_BET_SECOND_BEST,
  LEG_BET_LAST,
];

/** What a leg bet pays if the camel comes second. */
export const LEG_SECOND = 1;

/** What a leg bet costs if the camel does neither. */
export const LEG_WRONG = 1;

/** What the first three right overall bets pay; the rest get the tail. */
const RACE_BET_FIRST = 8;
const RACE_BET_SECOND = 5;
const RACE_BET_THIRD = 3;

/**
 * What an overall bet pays, in the order the bets were placed.
 *
 * @remarks
 * Everybody after the fifth gets the last figure. Being right early is the
 * whole game: the same correct guess is worth eight coins or one.
 */
export const RACE_BET_PAYOUTS: readonly number[] = [
  RACE_BET_FIRST,
  RACE_BET_SECOND,
  RACE_BET_THIRD,
  2,
  1,
];

/** What a wrong overall bet costs, whenever it was placed. */
export const RACE_WRONG = 1;

/** How far a desert tile throws a camel. */
export const TILE_STEP = 1;

/** What a desert tile pays its owner when a camel lands on it. */
export const TILE_REWARD = 1;

/** One desert tile lying on the track. */
export type DesertTile = {
  readonly space: number;
  /** Who owns it, and therefore who is paid when a camel lands on it. */
  readonly seat: number;
  readonly kind: TileKind;
};

/** One leg betting card somebody has taken. */
export type LegCard = {
  readonly camel: Camel;
  /** What it pays if the camel wins the leg. */
  readonly value: number;
};

/** One face-down bet on the overall winner or loser. */
export type RaceBet = {
  readonly camel: Camel;
  readonly seat: number;
};

/** One roll of the pyramid, kept so the leg can be read back. */
export type Roll = {
  readonly camel: Camel;
  readonly pips: number;
  /** The seat that took the die. */
  readonly seat: number;
};

/** One player. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  readonly coins: number;
  /** Leg betting cards taken this leg. */
  readonly legCards: readonly LegCard[];
  /** The colour cards still in hand for the overall bets. */
  readonly raceCards: readonly Camel[];
  /** Where their desert tile lies, or null while it is in front of them. */
  readonly tileAt: number | null;
};

/** How a leg came out, so the screen can show it before the next one starts. */
export type LegResult = {
  readonly leg: number;
  readonly first: Camel;
  readonly second: Camel;
  /** What each seat won or lost over the leg, in coins. */
  readonly gained: readonly number[];
};

/** How far the game has got. */
export type CamelUpPhase =
  /** The normal state: somebody takes one of the four actions. */
  | "racing"
  /** A leg has just been paid out and is on screen. */
  | "legOver"
  /** A camel has crossed the finish line and everything is counted. */
  | "gameOver";

/** One action a player may take on their turn. */
export type CamelUpMove =
  /** Take a die from the pyramid, roll it, and take a coin for it. */
  | { readonly kind: "roll" }
  /** Take the best remaining leg betting card of one camel. */
  | { readonly kind: "legBet"; readonly camel: Camel }
  /** Lay one of your colour cards on the winner or the loser pile. */
  | {
      readonly kind: "raceBet";
      readonly camel: Camel;
      readonly side: "winner" | "loser";
    }
  /** Put your desert tile down, or move it somewhere else. */
  | {
      readonly kind: "tile";
      readonly space: number;
      readonly tile: TileKind;
    }
  /** Start the next leg, once the last one has been read. */
  | { readonly kind: "nextLeg" };

/** The whole game at one instant. */
export type CamelUpGame = {
  readonly phase: CamelUpPhase;
  readonly players: readonly Player[];
  readonly turn: number;
  /** The leg being run, 1-based. */
  readonly leg: number;
  /**
   * The track: one entry per space, camels bottom of the stack first.
   *
   * @remarks
   * Longer than the board by {@link RUN_OFF}, because a camel can be thrown
   * past the finish line and still has to be put somewhere.
   */
  readonly track: readonly (readonly Camel[])[];
  /** The camels whose dice are still in the pyramid this leg. */
  readonly dice: readonly Camel[];
  /** What has been rolled this leg, oldest first. */
  readonly rolls: readonly Roll[];
  readonly tiles: readonly DesertTile[];
  /** The leg betting cards still on the table, best first, per camel. */
  readonly legBets: Readonly<Record<Camel, readonly number[]>>;
  /** Bets on the overall winner, in the order they were laid. */
  readonly winnerBets: readonly RaceBet[];
  /** Bets on the overall loser, in the order they were laid. */
  readonly loserBets: readonly RaceBet[];
  /** The leg just finished, for the screen. */
  readonly lastLeg: LegResult | null;
  readonly seed: number;
  /** The generator's cursor - see the module remarks. */
  readonly rng: number;
  readonly log: readonly string[];
};

/**
 * Where one camel stands.
 *
 * @param game - the current game
 * @param camel - the camel to find
 * @returns its space and how high it sits in that stack, or null if it is gone
 */
export function findCamel(
  game: CamelUpGame,
  camel: Camel,
): { readonly space: number; readonly height: number } | null {
  return whereIs(game.track, camel);
}

/**
 * Where one camel stands on a bare track.
 *
 * @param track - the spaces to search
 * @param camel - the camel to find
 * @returns its space and height, or null if it is not on the track at all
 * @remarks
 * Takes the track rather than the whole game, so the odds calculator can walk
 * thousands of imagined tracks without building a game state around each one.
 */
export function whereIs(
  track: readonly (readonly Camel[])[],
  camel: Camel,
): { readonly space: number; readonly height: number } | null {
  let found: { space: number; height: number } | null = null;
  for (let space = 0; space < track.length && found === null; space++) {
    const height = track[space].indexOf(camel);
    if (height >= 0) {
      found = { space, height };
    }
  }
  return found;
}

/**
 * The camels in racing order, the leader first.
 *
 * @param track - the track to read
 * @returns every camel, furthest along first, and higher in a stack ahead
 * @remarks
 * Two camels on one space are not level: the one on top is ahead, because it
 * is the one being carried. That is the whole trick of the game, and getting
 * it the wrong way round would quietly reverse every bet on the table.
 */
export function standings(
  track: readonly (readonly Camel[])[],
): readonly Camel[] {
  const order: Camel[] = [];
  for (let space = track.length - 1; space >= 0; space--) {
    // Top of the stack first: it is the one riding on the others.
    for (let height = track[space].length - 1; height >= 0; height--) {
      order.push(track[space][height]);
    }
  }
  return order;
}

/**
 * Whether a camel has crossed the finish line.
 *
 * @param game - the current game
 * @returns true once the race is decided
 */
export function isFinished(game: CamelUpGame): boolean {
  return game.track.slice(TRACK_SPACES).some((stack) => stack.length > 0);
}

/**
 * The players with the most money - the winners once it is over.
 *
 * @param game - the current game
 * @returns every seat sharing the highest purse
 */
export function leaders(game: CamelUpGame): readonly number[] {
  const best = game.players.reduce(
    (most, player) => Math.max(most, player.coins),
    0,
  );
  return game.players
    .map((player, seat) => (player.coins === best ? seat : -1))
    .filter((seat) => seat >= 0);
}

/**
 * Whether a desert tile may go on a space.
 *
 * @param game - the current game
 * @param seat - the player putting it down
 * @param space - the space they are aiming at
 * @returns true if the tile is allowed there
 * @remarks
 * Not on the first space, not where a camel stands, and never beside another
 * tile - two tiles in a row would make a single throw bounce twice, which the
 * rules do not allow for.
 */
export function canPlaceTile(
  game: CamelUpGame,
  seat: number,
  space: number,
): boolean {
  const others = game.tiles.filter((tile) => tile.seat !== seat);
  return (
    space > 0 &&
    space < TRACK_SPACES &&
    game.track[space].length === 0 &&
    others.every((tile) => Math.abs(tile.space - space) > 1)
  );
}
