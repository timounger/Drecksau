/**
 * The game state of Heckmeck am Bratwurmeck and the moves that change it.
 *
 * @module
 * @remarks
 * Eight dice, sixteen tiles and one decision made over and over: set another
 * value aside, or stop while you still can. What makes it a game is that every
 * value may be set aside **once** - so the roll that looks generous is often
 * the one that leaves you with nothing to take.
 *
 * The worm is the whole trick. It counts five like a five, but without at
 * least one of them nothing you have rolled is worth anything at all.
 */

/** The lowest and highest tile on the grill. */
export const LOWEST_TILE = 21;
export const HIGHEST_TILE = 36;

/**
 * What the seat you play yourself is called when it has no other name.
 *
 * @remarks
 * Offline there is nobody to tell your name to, so the seat is simply "Du" -
 * and the table then knows not to label it "Du (Du)". Online every seat has a
 * real name and this never comes up.
 */
export const SELF_NAME = "Du";

/** How many dice a turn starts with. */
export const DICE_COUNT = 8;

/** The face that is a worm rather than a number. */
export const WORM = 6;

/** What a worm is worth when the dice are added up. */
export const WORM_VALUE = 5;

/** How many tiles share each worm count. */
const TILES_PER_WORM = 4;

/** Fewest and most players a game seats. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 7;

/** One player. */
export type Player = {
  readonly name: string;
  /** True if the computer plays this seat. */
  readonly isBot: boolean;
  /**
   * The tiles won, bottom of the pile first.
   *
   * @remarks
   * Only the **last** one is exposed: it is the one that can be stolen and the
   * one that goes back on a bust. Everything under it is safe.
   */
  readonly stack: readonly number[];
};

/** How far the turn has got. */
export type HeckmeckPhase =
  /** Dice are on the table and a value has to be set aside. */
  | "pick"
  /** Something is set aside; roll on, or stop and take a tile. */
  | "decide"
  /** The grill is empty. */
  | "gameOver";

/** What the last turn came to, for the screen. */
export type Outcome = {
  readonly seat: number;
  /** The tile taken, or null on a bust. */
  readonly tile: number | null;
  /** The seat it was stolen from, or null. */
  readonly from: number | null;
  /** True if the turn ended in a bust. */
  readonly bust: boolean;
  /** The tile removed from the game by a bust, or null. */
  readonly burnt: number | null;
};

/** A move a seat can make. */
export type HeckmeckMove =
  /** Set every die showing this face aside. */
  | { readonly kind: "pick"; readonly face: number }
  /** Throw the dice that are left. */
  | { readonly kind: "roll" }
  /** Stop and take the best tile the grill still offers. */
  | { readonly kind: "take" }
  /** Stop and take the top tile off somebody else's pile. */
  | { readonly kind: "steal"; readonly seat: number };

/** The whole game at one instant. */
export type HeckmeckGame = {
  readonly phase: HeckmeckPhase;
  readonly players: readonly Player[];
  readonly active: number;
  /** The tiles still on the grill, ascending. */
  readonly grill: readonly number[];
  /** The tiles turned over by busts and out of the game, ascending. */
  readonly burnt: readonly number[];
  /** The dice lying on the table right now. */
  readonly dice: readonly number[];
  /** The dice already set aside this turn, in the order they were taken. */
  readonly kept: readonly number[];
  /** The turn just finished, for the screen. */
  readonly lastOutcome: Outcome | null;
  readonly seed: number;
  readonly rng: number;
  readonly log: readonly string[];
};

/**
 * What one die face is worth.
 *
 * @param face - the face, one to five or {@link WORM}
 * @returns its value in the total
 */
export function faceValue(face: number): number {
  return face === WORM ? WORM_VALUE : face;
}

/**
 * How many worms a tile is worth.
 *
 * @param tile - the tile's number
 * @returns one for 21-24, two for 25-28, and so on
 */
export function wormsOn(tile: number): number {
  return Math.floor((tile - LOWEST_TILE) / TILES_PER_WORM) + 1;
}

/** Every tile, lowest first. */
export function allTiles(): readonly number[] {
  return Array.from(
    { length: HIGHEST_TILE - LOWEST_TILE + 1 },
    (unused, index) => LOWEST_TILE + index,
  );
}

/** What the dice set aside this turn add up to. */
export function total(kept: readonly number[]): number {
  return kept.reduce((sum, face) => sum + faceValue(face), 0);
}

/** Whether a worm has been set aside - without one, nothing counts. */
export function hasWorm(kept: readonly number[]): boolean {
  return kept.includes(WORM);
}

/** The faces already set aside, and therefore out of bounds. */
export function takenFaces(kept: readonly number[]): ReadonlySet<number> {
  return new Set(kept);
}

/**
 * The faces that may still be set aside from the roll on the table.
 *
 * @param game - the current game
 * @returns the faces present in the roll and not already taken
 */
export function pickable(game: HeckmeckGame): readonly number[] {
  const taken = takenFaces(game.kept);
  return [...new Set(game.dice)].filter((face) => !taken.has(face)).sort();
}

/** The top tile of a pile, or null for an empty one. */
export function topTile(player: Player): number | null {
  return player.stack.length === 0
    ? null
    : player.stack[player.stack.length - 1];
}

/**
 * The tile the grill would hand over for a total.
 *
 * @param game - the current game
 * @returns the highest tile that is not above the total, or null
 * @remarks
 * There is no choosing here: the rules give you the number you rolled or the
 * next one down, and nothing else. Rolling far past a tile is therefore worth
 * nothing at all - which is exactly what makes stopping early tempting.
 */
export function grillOffer(game: HeckmeckGame): number | null {
  const sum = total(game.kept);
  const fits = game.grill.filter((tile) => tile <= sum);
  return fits.length === 0 ? null : fits[fits.length - 1];
}

/**
 * The seats whose top tile could be stolen right now.
 *
 * @param game - the current game
 * @returns the seats holding a tile of exactly the total
 * @remarks
 * Exactly, not "or lower". Stealing is the sharp end of the game and it only
 * happens on the nose.
 */
export function stealable(game: HeckmeckGame): readonly number[] {
  const sum = total(game.kept);
  return game.players
    .map((player, seat) =>
      seat !== game.active && topTile(player) === sum ? seat : -1,
    )
    .filter((seat) => seat >= 0);
}

/** Whether the active player could stop right now and come away with a tile. */
export function canStop(game: HeckmeckGame): boolean {
  return (
    hasWorm(game.kept) &&
    (grillOffer(game) !== null || stealable(game).length > 0)
  );
}

/** How many worms a pile is worth. */
export function wormCount(player: Player): number {
  return player.stack.reduce((sum, tile) => sum + wormsOn(tile), 0);
}

/**
 * The players with the most worms.
 *
 * @param game - the current game
 * @returns every seat sharing the biggest pile of worms
 */
export function leaders(game: HeckmeckGame): readonly number[] {
  const counts = game.players.map(wormCount);
  const best = counts.reduce((most, count) => Math.max(most, count), 0);
  return counts
    .map((count, seat) => (count === best ? seat : -1))
    .filter((seat) => seat >= 0);
}
