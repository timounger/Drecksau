/**
 * The whole game at one instant, and who is losing it.
 *
 * @module
 * @remarks
 * Plain data, no methods: the state travels to storage and over the wire, and
 * the referee in `moves.ts` is the only thing that changes it.
 *
 * The shape worth explaining is a player's cards. They live in three places -
 * hand, face up, face down - and the rules walk through them strictly in that
 * order. The two table rows are **fixed-length arrays with holes** rather than
 * shrinking lists, because an open card and the covered card beneath it are a
 * pair: playing the open card at slot 1 is exactly what frees the face-down
 * card at slot 1. A pair of shrinking lists could not say which one that was.
 */
import type { Card } from "./cards";

/** How far the game has got. */
export type Phase =
  /** Everybody may trade one hand card for one of their open cards, once. */
  | "swap"
  /** Cards are going on the pot. */
  | "play"
  | "gameOver";

/** A player at the table. */
export type Player = {
  readonly name: string;
  readonly isBot: boolean;
  readonly hand: readonly Card[];
  /** Three slots, face up. A played slot stays as a hole. */
  readonly up: readonly (Card | null)[];
  /** Three slots, face down, one under each of {@link Player.up}. */
  readonly down: readonly (Card | null)[];
  /** True once this seat has swapped or waved the swap away. */
  readonly ready: boolean;
  /** Where this seat came out - 0 for the first one home, null while playing. */
  readonly place: number | null;
};

/** The whole game. */
export type JammerlappenGame = {
  readonly phase: Phase;
  readonly players: readonly Player[];
  /** Whose turn it is. */
  readonly active: number;
  /** Clockwise is 1; a Richtungswechsel makes it -1. */
  readonly direction: 1 | -1;
  /** The Aufnahmestapel, face down. */
  readonly draw: readonly Card[];
  /** The pot: what has been laid, oldest first. */
  readonly pot: readonly Card[];
  /**
   * Cards taken out of the game.
   *
   * @remarks
   * A count, not the cards. They never come back - not into a hand, not into
   * the pot, not into anybody's reckoning - so the only thing left worth
   * knowing is how much of the deck has quietly disappeared.
   */
  readonly burned: number;
  /** True while the player on turn may lay whatever they like. */
  readonly free: boolean;
  /** True while a 5 has the table playing downwards. */
  readonly descending: boolean;
  /** Cards per number in this deal - four, or three at a two-handed table. */
  readonly copies: number;
  readonly rng: number;
  readonly seed: number;
  readonly log: readonly string[];
};

/** A move a seat can make. */
export type JammerlappenMove =
  /** Before the first card: trade one hand card for one open card. */
  | { readonly kind: "swap"; readonly handId: string; readonly upId: string }
  /** Before the first card: keep what you were dealt. */
  | { readonly kind: "ready" }
  /**
   * Lay these cards - all from the hand, or all from the open row.
   *
   * @remarks
   * One move for three things that are one thing at the table: laying a card,
   * laying every copy of it you hold at once, and throwing in out of turn to
   * finish somebody else's quartet. The referee tells them apart by who is
   * asking and by what is lying on the pot, which is what a table does too.
   */
  | { readonly kind: "play"; readonly cardIds: readonly string[] }
  /** Turn over the face-down card at this slot and hope. */
  | { readonly kind: "playDown"; readonly slot: number }
  /** Take the whole pot onto your hand. */
  | { readonly kind: "takePot" };

/**
 * What the seat you play yourself is called when it has no other name.
 *
 * @remarks
 * Offline there is nobody to tell your name to, so the seat is simply "Du" -
 * and the table then knows not to label it "Du (Du)". Online every seat has a
 * real name and this never comes up.
 */
export const SELF_NAME = "Du";

/** Face-up cards, and face-down cards under them, per player. */
export const TABLE_SLOTS = 3;

/** Cards dealt to the hand, and the number it is topped back up to. */
export const HAND_SIZE = 3;

/** Action cards in a row that blow the pot up - from the rulebook. */
export const ACTION_STREAK = 4;

/** Fewest players. */
export const MIN_PLAYERS = 2;

/** Most players. */
export const MAX_PLAYERS = 6;

/** Cards one player is dealt: hand, face up and face down together. */
export const CARDS_PER_PLAYER = HAND_SIZE + TABLE_SLOTS + TABLE_SLOTS;

/**
 * Whether this seat has got rid of everything.
 *
 * @param player - the player
 * @returns true when hand, open row and covered row are all empty
 */
export function isOut(player: Player): boolean {
  return (
    player.hand.length === 0 &&
    player.up.every((card) => card === null) &&
    player.down.every((card) => card === null)
  );
}

/** The cards still lying in a row of slots, holes left out. */
export function filled(row: readonly (Card | null)[]): readonly Card[] {
  return row.filter((card) => card !== null);
}

/** How many cards this seat still has anywhere. */
export function cardsLeft(player: Player): number {
  return (
    player.hand.length + filled(player.up).length + filled(player.down).length
  );
}

/**
 * The slots whose face-down card has been freed.
 *
 * @param player - the player
 * @returns the slot numbers that may be turned over blind
 * @remarks
 * "Sobald eine der offenen Karten gespielt ist, ist die darunterliegende
 * verdeckte Karte freigegeben." So a covered card is freed by the hole above
 * it, and by nothing else.
 */
export function freedSlots(player: Player): readonly number[] {
  const slots: number[] = [];
  player.down.forEach((card, slot) => {
    if (card !== null && player.up[slot] === null) {
      slots.push(slot);
    }
  });
  return slots;
}

/** The seats still holding cards. */
export function stillIn(game: JammerlappenGame): readonly number[] {
  return game.players
    .map((player, seat) => (player.place === null ? seat : -1))
    .filter((seat) => seat >= 0);
}

/**
 * The seat left sitting on its cards.
 *
 * @param game - the game
 * @returns the loser's seat, or null while more than one is still playing
 * @remarks
 * The only result this game has. There is no winner to name - everybody else
 * simply got out, and the rulebook is blunt about it: "Es gibt keinen Gewinner,
 * sondern nur einen Jammerlappen."
 */
export function jammerlappen(game: JammerlappenGame): number | null {
  const left = stillIn(game);
  return left.length === 1 ? left[0] : null;
}

/**
 * The seats in the order they got out, the Jammerlappen last.
 *
 * @param game - the game
 * @returns the finishing order
 */
export function standings(game: JammerlappenGame): readonly number[] {
  const rank = (seat: number) =>
    game.players[seat].place ?? game.players.length;
  return game.players
    .map((unused, seat) => seat)
    .sort((left, right) => rank(left) - rank(right));
}
