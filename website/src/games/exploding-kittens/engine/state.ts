/**
 * The whole game at one instant, and who is still breathing.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state travels to storage and over the wire, and
 * the referee in `moves.ts` is the only thing that changes it.
 *
 * Two fields carry the whole of the Angriff rule and are worth reading
 * together. {@link ExplodingKittensGame.turnsOwed} is how many turns the player
 * on turn still has to take, and {@link ExplodingKittensGame.underAttack} says
 * whether those turns were forced on them. The second one exists because the
 * rulebook's card text and its own examples disagree about the plain case, and
 * the only reading that satisfies both needs to know the difference between
 * "one turn, because it is my turn" and "one turn, because I was attacked".
 */
import type { Card, CardKind } from "./cards";

/** How far the game has got. */
export type Phase =
  /** The player on turn is laying cards, or about to draw. */
  | "play"
  /** Something nopeable is on the table and the holders of a Nö! may answer. */
  | "nope"
  /** A Gefallen has gone through and its target must hand a card over. */
  | "favor"
  /** A kitten has been defused and its defuser is choosing where to hide it. */
  | "insert"
  | "gameOver";

/** A player at the table. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  readonly hand: readonly Card[];
  /**
   * The top of the draw pile, as this seat last saw it.
   *
   * @remarks
   * Set by a Blick in die Zukunft and cleared the moment the pile moves, by
   * whatever moved it. Keeping it on screen rather than asking the player to
   * remember is the one convenience this game grants - it stays true only for
   * as long as it really is true.
   */
  readonly peek: readonly Card[] | null;
  /** Where they blew up - 0 for the first, null while they are still alive. */
  readonly place: number | null;
};

/** What somebody played, waiting to see whether it survives. */
export type Action =
  /** One card, with a target for the ones that need one. */
  | {
      readonly kind: "card";
      readonly card: Card;
      readonly target?: number;
    }
  /**
   * Two or three cards of the same sort, played for what they take.
   *
   * @remarks
   * "Ignore the instructions on the cards when you play them as a Special
   * Combo" - so what was played does not matter here, only how many.
   */
  | {
      readonly kind: "combo";
      readonly cards: readonly Card[];
      readonly target: number;
      /** The card named, on a three of a kind. */
      readonly want?: CardKind;
    };

/** An action on the table, with however many Nö!s have landed on it. */
export type Pending = {
  readonly action: Action;
  /** Who played the action itself. */
  readonly by: number;
  /**
   * How many Nö!s are stacked on it. An odd number means it is dead.
   *
   * @remarks
   * Counted rather than resolved as they come, because a Nö! on a Nö! is a
   * "doch!" - the rulebook lets that go on as long as anybody still holds one.
   */
  readonly nopes: number;
  /** Who played the topmost card - they are not asked about their own. */
  readonly lastBy: number;
  /** Seats that have waved this round through. */
  readonly passed: readonly number[];
};

/** The whole game. */
export type ExplodingKittensGame = {
  readonly phase: Phase;
  readonly players: readonly Player[];
  /** Whose turn it is. */
  readonly active: number;
  /** Turns the seat on turn still owes, at least one. */
  readonly turnsOwed: number;
  /** True while those turns were forced on them by an Angriff. */
  readonly underAttack: boolean;
  readonly draw: readonly Card[];
  /** Face up, and never drawn from again. */
  readonly discard: readonly Card[];
  readonly pending: Pending | null;
  /** A Gefallen that got through and is waiting for its card. */
  readonly demand: { readonly by: number; readonly target: number } | null;
  /** The kitten held aside while its defuser decides where to put it. */
  readonly kitten: Card | null;
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** A move a seat can make. */
export type ExplodingKittensMove =
  /** Lay one card, and name who it hits if it needs somebody. */
  | {
      readonly kind: "play";
      readonly cardId: string;
      readonly target?: number;
    }
  /** Lay two or three of the same sort at somebody. */
  | {
      readonly kind: "combo";
      readonly cardIds: readonly string[];
      readonly target: number;
      /** On a three of a kind, the card being asked for. */
      readonly want?: CardKind;
    }
  /** End the turn by drawing, and hope. */
  | { readonly kind: "draw" }
  /** Answering the window: stop it, or wave it through. */
  | { readonly kind: "nope"; readonly cardId: string }
  | { readonly kind: "letThrough" }
  /** Answering a Gefallen: this is the card you get. */
  | { readonly kind: "give"; readonly cardId: string }
  /** Putting a defused kitten back, at this many cards from the top. */
  | { readonly kind: "insert"; readonly at: number };

/**
 * What the seat you play yourself is called when it has no other name.
 *
 * @remarks
 * Offline there is nobody to tell your name to, so the seat is simply "Du" -
 * and the table then knows not to label it "Du (Du)". Online every seat has a
 * real name and this never comes up.
 */
export const SELF_NAME = "Du";

/** Cards each player is dealt on top of their Entschärfung - from the rules. */
export const DEALT_CARDS = 7;

/** Entschärfungen in a full deck - from the rules. */
export const DEFUSE_COUNT = 6;

/** Entschärfungen shuffled back in after everybody has one - from the rules. */
export const DEFUSE_KEPT = 2;

/** Turns an Angriff adds on top of whatever its player still owed. */
export const ATTACK_TURNS = 2;

/** Cards in a combo. */
export const COMBO_STEAL = 2;
export const COMBO_NAME = 3;

/** Fewest players. */
export const MIN_PLAYERS = 2;

/** Most players. */
export const MAX_PLAYERS = 5;

/** Whether this seat is still in the game. */
export function isAlive(player: Player): boolean {
  return player.place === null;
}

/** The seats still in the game. */
export function livingSeats(game: ExplodingKittensGame): readonly number[] {
  return game.players
    .map((player, seat) => (isAlive(player) ? seat : -1))
    .filter((seat) => seat >= 0);
}

/**
 * The one who did not explode.
 *
 * @param game - the game
 * @returns the winner's seat, or null while more than one is still alive
 */
export function survivor(game: ExplodingKittensGame): number | null {
  const alive = livingSeats(game);
  return alive.length === 1 ? alive[0] : null;
}

/**
 * The seats in the order they left, the survivor first.
 *
 * @param game - the game
 * @returns the finishing order, best first
 * @remarks
 * Reverse order of explosion, because the last one to blow up got closest. The
 * survivor has no place of their own and sorts ahead of everybody.
 */
export function standings(game: ExplodingKittensGame): readonly number[] {
  const rank = (seat: number) => {
    const place = game.players[seat].place;
    return place === null ? -1 : game.players.length - place;
  };
  return game.players
    .map((unused, seat) => seat)
    .sort((left, right) => rank(left) - rank(right));
}

/**
 * How many cards of one sort a hand holds.
 *
 * @param hand - the cards
 * @param kind - the sort to count
 * @returns how many there are
 */
export function countOf(hand: readonly Card[], kind: CardKind): number {
  return hand.filter((card) => card.kind === kind).length;
}
